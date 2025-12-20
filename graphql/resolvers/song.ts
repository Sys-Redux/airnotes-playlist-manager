import { Resolvers } from '@/types/generated/graphql';
import { GraphQLContext } from '@/graphql/context';

export const songResolvers: Resolvers<GraphQLContext> = {
    Query: {
        song: async (_parent, { id }, { prisma }) => {
            return prisma.song.findUnique({
                where: { id },
            });
        },

        // Get all songs w/ optional pagination
        songs: async (_parent, { limit, offset }, { prisma }) => {
            return prisma.song.findMany({
                take: limit ?? 50,
                skip: offset ?? 0,
                orderBy: { createdAt: 'desc' },
            });
        },

        // Search song by query string w/ optional criteria
        searchSongs: async (_parent, { query, criteria }, { prisma }) => {
            // Query searches the title and artist fields
            // Criteria can further filter by genre or album
            return prisma.song.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { title: { contains: query, mode: 'insensitive' } },
                                { artist: { contains: query, mode: 'insensitive' } },
                            ],
                        },
                        ...(criteria?.title ? [{ title: { contains: criteria.title, mode: 'insensitive' as const } }] : []),
                        ...(criteria?.artist ? [{ artist: { contains: criteria.artist, mode: 'insensitive' as const } }] : []),
                        ...(criteria?.album ? [{ album: { contains: criteria.album, mode: 'insensitive' as const } }] : []),
                        ...(criteria?.genre ? [{ genre: { equals: criteria.genre } }] : []),
                    ],
                },
                orderBy: { title: 'asc' },
            });
        },
    },
    Mutation: {
        createSong: async (_parent, { input }, { prisma }) => {
            try {
                const song = await prisma.song.create({
                    data: {
                        title: input.title,
                        artist: input.artist,
                        album: input.album,
                        genre: input.genre,
                        duration: input.duration,
                        releaseDate: input.releaseDate,
                        metadata: input.metadata as object | undefined,
                    },
                });
                return {
                    code: 201,
                    success: true,
                    message: 'Song created successfully',
                    song,
                };
            } catch (error) {
                return {
                    code: 400,
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to create song',
                    song: null,
                };
            }
        },

        deleteSong: async (_parent, { id }, { prisma }) => {
            try {
                await prisma.song.delete({
                    where: { id },
                });
                return true;
            } catch {
                return false;
            }
        },
    },
};