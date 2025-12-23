import { Resolvers } from '@/types/generated/graphql';
import { GraphQLContext } from '@/graphql/context';
import { DijkstraGraph } from '@/lib/algorithms/dijkstra';

export const dijkstraResolvers: Resolvers<GraphQLContext> = {
    Query: {
        shortestPath: async (_parent, { startSongId, endSongId, constraints }, { prisma }) => {
            // 1. Fetch all song connections from the database
            const connections = await prisma.songConnection.findMany({
                include: {
                    sourceSong: true,
                    targetSong: true,
                },
            });

            // 2. Build the graph
            const graph = new DijkstraGraph();
            // Add all songs as nodes first
            const allSongs = await prisma.song.findMany();
            for (const song of allSongs) {
                graph.addNode(song.id);
            }

            // Add edges from connections (undirected for bidirectional traversal)
            for (const conn of connections) {
                // If genre constraints exist, filter connections accordingly
                if (constraints?.allowedGenres && constraints.allowedGenres.length > 0) {
                    const sourceGenre = conn.sourceSong.genre;
                    const targetGenre = conn.targetSong.genre;

                    // Skip if either song's genre is not in allowed genres
                    if (
                        (sourceGenre && !constraints.allowedGenres.includes(sourceGenre)) ||
                        (targetGenre && !constraints.allowedGenres.includes(targetGenre))
                    ) {
                        continue;
                    }
                }
                graph.addUndirectedEdge(conn.sourceSongId, conn.targetSongId, conn.weight);
            }

            // 3. Run Dijkstra's algorithm
            const result = graph.findShortestPath(
                startSongId,
                endSongId,
                constraints?.maxWeight ?? undefined
            );

            // 4. If maxHops constraint, check path length
            if ((constraints?.maxHops && result.path.length > constraints.maxHops) || !result.found) {
                return {
                    found: false,
                    path: [],
                    totalWeight: 0,
                    pathLength: 0,
                    startSong: null,
                    endSong: null,
                };
            }

            // 5. Fetch song details for the path
            const songsInPath = await prisma.song.findMany({
                where: { id: { in: result.path } },
            });

            // Create map for quick lookup
            const songMap = new Map(songsInPath.map(s => [s.id, s]));

            // Build path steps w/ cumulative weights
            let cumulativeWeight = 0;
            const pathSteps = result.path.map((songId, index) => {
                const song = songMap.get(songId)!;

                // Calculate cumulative weight
                if (index > 0) {
                    const prevSongId = result.path[index - 1];
                    const edge = graph.getEdges(prevSongId).find(e => e.target === songId);
                    cumulativeWeight += edge?.weight ?? 0;
                }

                return {
                    song,
                    cumulativeWeight,
                    stepNumber: index,
                };
            });

            return {
                found: true,
                path: pathSteps,
                totalWeight: result.totalWeight,
                pathLength: result.path.length,
                startSong: songMap.get(startSongId) ?? null,
                endSong: songMap.get(endSongId) ?? null,
            };
        },

        songConnections: async (_parent, { songId }, { prisma }) => {
            return prisma.songConnection.findMany({
                where: {
                    OR: [
                        { sourceSongId: songId },
                        { targetSongId: songId },
                    ],
                },
                include: {
                    sourceSong: true,
                    targetSong: true,
                },
            });
        },
    },

    Mutation: {
        createSongConnection: async (_parent, { input }, { prisma }) => {
            if (input.weight < 0 || input.weight > 1) {
                throw new Error('Weight must be between 0 and 1');
            }

            return prisma.songConnection.create({
                data: {
                    sourceSongId: input.sourceSongId,
                    targetSongId: input.targetSongId,
                    weight: input.weight,
                },
                include: {
                    sourceSong: true,
                    targetSong: true,
                },
            });
        },

        deleteSongConnection: async (_parent, { sourceSongId, targetSongId }, { prisma }) => {
            try {
                await prisma.songConnection.delete({
                    where: {
                        sourceSongId_targetSongId: { sourceSongId, targetSongId },
                    },
                });
                return true;
            } catch {
                return false;
            }
        },
    },

    // Field resolvers for SongConnection type
    SongConnection: {
        sourceSong: (parent) => parent.sourceSong,
        targetSong: (parent) => parent.targetSong,
    },
};