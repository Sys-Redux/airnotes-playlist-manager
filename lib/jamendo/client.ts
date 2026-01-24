// Jamendo client for fetching real music

const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0';

interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    album_name: string;
    album_id: string;
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
        lang?: string;
        speed?: string;
    };
}

interface JamendoResponse {
    headers: {
        status: string;
        code: number;
        results_count: number;
    };
    results: JamendoTrack[];
}

export interface FetchTrackOptions {
    limit?: number;
    offset?: number;
    tags?: string;
    search?: string;
    order?: 'popularity_total' | 'releasedate_desc' | 'name';
    include?: string[];
}

export class JamendoClient {
    private clientId: string;

    constructor(clientId: string) {
        if (!clientId) {
            throw new Error('JAMENDO_CLIENT_ID is required');
        }
        this.clientId = clientId;
    }

    async fetchTracks(options: FetchTrackOptions = {}):
        Promise<JamendoTrack[]> {
        const params = new URLSearchParams({
            client_id: this.clientId,
            format: 'json',
            limit: String(options.limit ?? 50),
            offset: String(options.offset ?? 0),
            include: 'musicinfo',
            audioformat: 'mp32',
        });

        if (options.tags) params.set('tags', options.tags);
        if (options.search) params.set('search', options.search);
        if (options.order) params.set('order', options.order);

        const response = await fetch(`${JAMENDO_BASE_URL}/tracks?${params}`);

        if (!response.ok) {
            throw new Error(`Error fetching tracks: ${response.statusText}`);
        }

        const data: JamendoResponse = await response.json();

        if (data.headers.code !== 0) {
            throw new Error(`Jamendo API error: ${data.headers.status}`);
        }

        return data.results;
    }

    // Fetch tracks by multiple genres
    async fetchTracksByGenres(genres: string[], perGenre: number = 25):
        Promise<JamendoTrack[]> {
        const allTracks: JamendoTrack[] = [];

        for (const genre of genres) {
            const tracks = await this.fetchTracks({
                tags: genre.toLowerCase(),
                limit: perGenre,
                order: 'popularity_total',
            });
            allTracks.push(...tracks);

            // Rate limiting: 1req/second
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
        return allTracks;
    }
}

let jamendoClient: JamendoClient | null = null;

export function getJamendoClient(): JamendoClient {
    if (!jamendoClient) {
        jamendoClient = new JamendoClient(process.env.JAMENDO_CLIENT_ID!);
    }
    return jamendoClient;
}