import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const CONFIG = {
    users: 20,
    songsPerGenre: 25,
    playlistsPerUser: 3,
    songsPerPlaylist: { min: 5, max: 15 },
};

const GENRES = [
    'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Electronic',
    'Classical', 'R&B', 'Country', 'Metal', 'Indie'
];

// Helper to pick random items from an array
function pickRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function main() {
    console.log('🌱 Seeding database...\n');

    // Clean existing data (in reverse order of dependencies)
    console.log('🧹 Cleaning existing data...');
    await prisma.playlistSong.deleteMany();
    await prisma.songConnection.deleteMany();
    await prisma.playlist.deleteMany();
    await prisma.song.deleteMany();
    await prisma.user.deleteMany();

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
                        favoriteArtists: Array.from(
                            { length: faker.number.int({ min: 2, max: 5 }) },
                            () => faker.music.artist()
                        ),
                        theme: faker.helpers.arrayElement(['dark', 'light', 'system']),
                        autoplay: faker.datatype.boolean(),
                    },
                },
            });
        })
    );
    console.log(`   ✅ Created ${users.length} users`);

    // ==================== CREATE SONGS ====================
    console.log(`\n🎵 Creating songs (${CONFIG.songsPerGenre} per genre)...`);

    // Type for songs returned by Prisma
    type SongRecord = Awaited<ReturnType<typeof prisma.song.create>>;
    const allSongs: SongRecord[] = [];

    for (const genre of GENRES) {
        const genreSongs = await Promise.all(
            Array.from({ length: CONFIG.songsPerGenre }, async () => {
                return prisma.song.create({
                    data: {
                        title: faker.music.songName(),
                        artist: faker.music.artist(),
                        album: faker.music.album(),
                        genre,
                        duration: faker.number.int({ min: 120, max: 420 }), // 2-7 minutes
                        releaseDate: faker.date.between({
                            from: '1960-01-01',
                            to: '2024-12-31'
                        }),
                        metadata: {
                            bpm: faker.number.int({ min: 60, max: 180 }),
                            key: faker.helpers.arrayElement([
                                'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
                            ]),
                            mood: faker.helpers.arrayElement([
                                'happy', 'sad', 'energetic', 'calm', 'aggressive', 'romantic'
                            ]),
                            explicit: faker.datatype.boolean(),
                            playCount: faker.number.int({ min: 0, max: 1000000 }),
                        },
                    },
                });
            })
        );
        allSongs.push(...genreSongs);
        console.log(`   ✅ Created ${genreSongs.length} ${genre} songs`);
    }

    console.log(`   📊 Total songs: ${allSongs.length}`);

    // ==================== CREATE PLAYLISTS ====================
    console.log(`\n📁 Creating playlists (${CONFIG.playlistsPerUser} per user)...`);

    const allPlaylists = [];

    for (const user of users) {
        const userPlaylists = await Promise.all(
            Array.from({ length: CONFIG.playlistsPerUser }, async () => {
                // Create themed playlist names
                const playlistThemes = [
                    `${faker.word.adjective()} ${faker.music.genre()} Mix`,
                    `${faker.word.adjective()} Vibes`,
                    `${faker.location.city()} Sessions`,
                    `${faker.word.adjective()} ${faker.word.noun()} Playlist`,
                    `My ${faker.music.genre()} Favorites`,
                ];

                return prisma.playlist.create({
                    data: {
                        name: faker.helpers.arrayElement(playlistThemes),
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
        // Pick random number of songs for this playlist
        const songCount = faker.number.int(CONFIG.songsPerPlaylist);
        const playlistSongs = pickRandom(allSongs, songCount);

        // Create playlist-song associations with positions
        await prisma.playlistSong.createMany({
            data: playlistSongs.map((song, index) => ({
                playlistId: playlist.id,
                songId: song.id,
                position: index,
            })),
            skipDuplicates: true,  // In case same song picked twice
        });

        totalPlaylistSongs += playlistSongs.length;
    }
    console.log(`   ✅ Added ${totalPlaylistSongs} songs to playlists`);

    // ==================== CREATE SONG CONNECTIONS (for Dijkstra) ====================
    console.log('\n🔀 Creating song connections for path-finding...');

    // Create connections between songs of the same genre (closer connection)
    // and between songs of different genres (weaker connection)
    const connections = [];

    for (let i = 0; i < allSongs.length; i++) {
        // Each song connects to 2-5 other songs
        const connectionCount = faker.number.int({ min: 2, max: 5 });
        const targetSongs = pickRandom(
            allSongs.filter((s) => s.id !== allSongs[i].id),
            connectionCount
        );

        for (const target of targetSongs) {
            // Weight based on genre similarity
            const sameGenre = allSongs[i].genre === target.genre;
            const weight = sameGenre
                ? faker.number.int({ min: 1, max: 3 })   // Same genre: low weight (close)
                : faker.number.int({ min: 5, max: 10 }); // Different: high weight (far)

            connections.push({
                sourceSongId: allSongs[i].id,
                targetSongId: target.id,
                weight,
            });
        }
    }

    // Batch insert connections (skip duplicates)
    await prisma.songConnection.createMany({
        data: connections,
        skipDuplicates: true,
    });
    console.log(`   ✅ Created ${connections.length} song connections`);

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Seeding complete! Summary:');
    console.log('='.repeat(50));
    console.log(`   👤 Users:           ${users.length}`);
    console.log(`   🎵 Songs:           ${allSongs.length}`);
    console.log(`   📁 Playlists:       ${allPlaylists.length}`);
    console.log(`   🔗 Playlist Songs:  ${totalPlaylistSongs}`);
    console.log(`   🔀 Song Connections: ${connections.length}`);
    console.log('='.repeat(50));
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });