// Transform Jamendo tracks to Prisma song format
import type { Prisma } from '@/lib/generated/prisma/client';

interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    album_name: string;
    duration: number;
    releasedate: string;
    audio: string;
    audiodownload: string;
    image: string;
    musicinfo?: {
        tags?: {
            genres: string[];
            instruments: string[];
            vartags: string[];
        };
        speed?: string;
    };
}

export interface SongCreateData {
    title: string;
    artist: string;
    album: string | null;
    genre: string | null;
    duration: number;
    releaseDate: Date | null;
    metadata: Prisma.InputJsonValue;
}

export function transformJamendoTrack(track: JamendoTrack): SongCreateData {
    // Extract primary genre from tags
    const genres = track.musicinfo?.tags?.genres ?? [];
    const primaryGenre = genres.length > 0
        ? genres[0].charAt(0).toUpperCase() + genres[0].slice(1)
        : null;

    // Parse release Date
    let releaseDate: Date | null = null;
    if (track.releasedate) {
        const parsed = new Date(track.releasedate);
        if (!isNaN(parsed.getTime())) {
            releaseDate = parsed;
        }
    }

    return {
        title: track.name,
        artist: track.artist_name,
        album: track.album_name || null,
        genre: primaryGenre,
        duration: track.duration,
        releaseDate,
        metadata: {
            // Jamendo-specific data
            jamendoId: track.id,
            streamUrl: track.audio,
            downloadUrl: track.audiodownload,
            coverImage: track.image,

            // For UI display
            albumArt300: track.image.replace('width=300', 'width=300'),
            albumArt600: track.image.replace('width=300', 'width=600'),

            // Dijkstra weights // similarity
            allGenres: genres,
            instruments: track.musicinfo?.tags?.instruments ?? [],
            tags: track.musicinfo?.tags?.vartags ?? [],
            tempo: track.musicinfo?.speed ?? 'medium',

            // Source tracking
            source: 'jamendo',
            importedAt: new Date().toISOString(),
        },
    };
}

export function transformManyTracks(tracks: JamendoTrack[]): SongCreateData[] {
    return tracks.map(transformJamendoTrack);
}