import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';
import { JamendoClient } from '../lib/jamendo/client';
import { transformManyTracks } from '../lib/jamendo/transformer';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const CONFIG = {
  users: 20,
  playlistsPerUser: 3,
  songsPerPlaylist: { min: 5, max: 15 },
  songsPerGenre: 25,
};

// Genres that work well with Jamendo's tagging
const GENRES = [
  'rock', 'pop', 'electronic', 'jazz', 'hiphop',
  'classical', 'ambient', 'metal', 'folk', 'blues'
];

function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log('🌱 Seeding database with REAL songs from Jamendo...\n');

  // Check for Jamendo API key
  if (!process.env.JAMENDO_CLIENT_ID) {
    console.error('❌ JAMENDO_CLIENT_ID is required in .env');
    console.log('   Get your free API key at: https://developer.jamendo.com');
    process.exit(1);
  }

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.userQueueHistory.deleteMany();
  await prisma.userQueueSong.deleteMany();
  await prisma.userQueueState.deleteMany();
  await prisma.playlistActionHistory.deleteMany();
  await prisma.playlistSong.deleteMany();
  await prisma.songConnection.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.user.deleteMany();

  // ==================== FETCH REAL SONGS FROM JAMENDO ====================
  console.log(`\n🎵 Fetching songs from Jamendo (${CONFIG.songsPerGenre} per genre)...`);
  console.log('   This may take a minute due to rate limiting...\n');

  const jamendo = new JamendoClient(process.env.JAMENDO_CLIENT_ID);
  const jamendoTracks = await jamendo.fetchTracksByGenres(GENRES, CONFIG.songsPerGenre);

  console.log(`   ✅ Fetched ${jamendoTracks.length} tracks from Jamendo`);

  // Transform to Prisma format
  const songData = transformManyTracks(jamendoTracks);

  // Insert songs
  console.log('\n💾 Inserting songs into database...');
  const songs = await Promise.all(
    songData.map(data => prisma.song.create({ data }))
  );
  console.log(`   ✅ Created ${songs.length} songs`);

  // ==================== CREATE USERS ====================
  console.log(`\n👤 Creating ${CONFIG.users} users...`);
  const users = await Promise.all(
    Array.from({ length: CONFIG.users }, async () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return prisma.user.create({
        data: {
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          name: `${firstName} ${lastName}`,
          preferences: {
            favoriteGenres: pickRandom(GENRES, faker.number.int({ min: 1, max: 4 })),
            favoriteArtists: [],
            theme: 'dark',
            autoplay: true,
          },
        },
      });
    })
  );
  console.log(`   ✅ Created ${users.length} users`);

  // ==================== CREATE PLAYLISTS ====================
  console.log(`\n📁 Creating playlists...`);
  const allPlaylists = [];
  for (const user of users) {
    const userPlaylists = await Promise.all(
      Array.from({ length: CONFIG.playlistsPerUser }, async () => {
        const genre = faker.helpers.arrayElement(GENRES);
        return prisma.playlist.create({
          data: {
            name: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Mix`,
            description: faker.lorem.sentence(),
            userId: user.id,
          },
        });
      })
    );
    allPlaylists.push(...userPlaylists);
  }
  console.log(`   ✅ Created ${allPlaylists.length} playlists`);

  // ==================== ADD SONGS TO PLAYLISTS ====================
  console.log('\n🔗 Adding songs to playlists...');
  let totalPlaylistSongs = 0;
  for (const playlist of allPlaylists) {
    const songCount = faker.number.int(CONFIG.songsPerPlaylist);
    const playlistSongs = pickRandom(songs, songCount);
    await prisma.playlistSong.createMany({
      data: playlistSongs.map((song, index) => ({
        playlistId: playlist.id,
        songId: song.id,
        position: index,
      })),
    });
    totalPlaylistSongs += playlistSongs.length;
  }
  console.log(`   ✅ Added ${totalPlaylistSongs} songs to playlists`);

  // ==================== CREATE SONG CONNECTIONS (for Dijkstra) ====================
  console.log('\n🔗 Creating song connections for Dijkstra algorithm...');
  let connectionCount = 0;

  // Group songs by genre for smarter connections
  const songsByGenre = new Map<string, typeof songs>();
  for (const song of songs) {
    const genre = song.genre ?? 'unknown';
    if (!songsByGenre.has(genre)) {
      songsByGenre.set(genre, []);
    }
    songsByGenre.get(genre)!.push(song);
  }

  // Create connections within genres (low weight = similar)
  for (const genreSongs of songsByGenre.values()) {
    for (let i = 0; i < genreSongs.length; i++) {
      // Connect to 2-3 random songs in same genre
      const targets = pickRandom(
        genreSongs.filter(s => s.id !== genreSongs[i].id),
        Math.min(3, genreSongs.length - 1)
      );
      for (const target of targets) {
        try {
          await prisma.songConnection.create({
            data: {
              sourceSongId: genreSongs[i].id,
              targetSongId: target.id,
              weight: 0.1 + Math.random() * 0.2, // 0.1 - 0.3 (similar)
            },
          });
          connectionCount++;
        } catch {
          // Ignore duplicate connections
        }
      }
    }
  }

  // Create some cross-genre connections (higher weight)
  const allGenres = Array.from(songsByGenre.keys());
  for (let i = 0; i < 50; i++) {
    const genre1 = faker.helpers.arrayElement(allGenres);
    const genre2 = faker.helpers.arrayElement(allGenres.filter(g => g !== genre1));
    const song1 = faker.helpers.arrayElement(songsByGenre.get(genre1) ?? []);
    const song2 = faker.helpers.arrayElement(songsByGenre.get(genre2) ?? []);
    if (song1 && song2) {
      try {
        await prisma.songConnection.create({
          data: {
            sourceSongId: song1.id,
            targetSongId: song2.id,
            weight: 0.5 + Math.random() * 0.4, // 0.5 - 0.9 (less similar)
          },
        });
        connectionCount++;
      } catch {
        // Ignore duplicates
      }
    }
  }
  console.log(`   ✅ Created ${connectionCount} song connections`);

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Database seeded successfully!');
  console.log('='.repeat(50));
  console.log(`   Songs:        ${songs.length} (from Jamendo)`);
  console.log(`   Users:        ${users.length}`);
  console.log(`   Playlists:    ${allPlaylists.length}`);
  console.log(`   Connections:  ${connectionCount}`);
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });