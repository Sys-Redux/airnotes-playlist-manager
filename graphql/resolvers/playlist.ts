import { Resolvers } from '@/types/generated/graphql';
import { GraphQLContext } from '@/graphql/context';

export const playlistResolvers: Resolvers<GraphQLContext> = {
    Query: {
        playlist: async (_parent, { id }, { prisma }) => {
            return prisma.playlist.findUnique({
                where: { id },
            });
        },

        playlists: async (_parent, { userId }, { prisma }) => {
            return prisma.playlist.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
        },
    },

    Mutation: {
        createPlaylist: async (_parent, { input }, { prisma }) => {
            try {
                const playlist = await prisma.playlist.create({
                    data: {
                        name: input.name,
                        description: input.description,
                        userId: input.userId,
                    },
                });
                return {
                    code: 201,
                    success: true,
                    message: 'Playlist created successfully',
                    playlist,
                };
            } catch (error) {
                return {
                    code: 400,
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to create playlist',
                    playlist: null,
                };
            }
        },

        updatePlaylist: async (_parent, { id, input }, { prisma }) => {
            return prisma.playlist.update({
                where: { id },
                data: {
                    // Only update provided fields
                    ...(input.name !== null && { name: input.name }),
                    ...(input.description !== undefined && { description: input.description }),
                },
            });
        },

        deletePlaylist: async (_parent, { id }, { prisma }) => {
            try {
                await prisma.playlist.delete({
                    where: { id },
                });
                return true;
            } catch {
                return false;
            }
        },

        addSongToPlaylist: async (_parent, { playlistId, songId }, { prisma }) => {
            // Highest position in playlist
            const lastSong = await prisma.playlistSong.findFirst({
                where: { playlistId },
                orderBy: { position: 'desc' },
            });
            const nextPosition = (lastSong?.position ?? -1) + 1;

            // Playlist-song association
            await prisma.playlistSong.create({
                data: { playlistId, songId, position: nextPosition, },
            });

            return prisma.playlist.findUniqueOrThrow({
                where: { id: playlistId },
            });
        },

        addSongToPlaylistAtPosition: async (_parent, {playlistId, songId, position }, { prisma }) => {
            // Use a transaction to ensure data integrity
            return prisma.$transaction(async (tx) => {
                // Shift all songs at position >= target position up by 1
                await tx.playlistSong.updateMany({
                    where: { playlistId, position: { gte: position } },
                    data: { position: { increment: 1 } },
                });

                // Insert the new song at the desired position
                await tx.playlistSong.create({
                    data: { playlistId, songId, position },
                });

                return tx.playlist.findUniqueOrThrow({
                    where: { id: playlistId },
                });
            });
        },

        removeSongFromPlaylist: async (_parent, { playlistId, songId }, { prisma }) => {
            return prisma.$transaction(async (tx) => {
                // Find song by position
                const songToRemove = await prisma.playlistSong.findUnique({
                    where: { playlistId_songId: { playlistId, songId } },
                });

                if (!songToRemove) {
                    throw new Error('Song not found in playlist');
                }

                await tx.playlistSong.delete({
                    where: { playlistId_songId: { playlistId, songId } },
                });

                // Shift all songs after the removed song down by 1
                await tx.playlistSong.updateMany({
                    where: { playlistId, position: { gt: songToRemove.position } },
                    data: { position: { decrement: 1 } },
                });

                return tx.playlist.findUniqueOrThrow({
                    where: { id: playlistId },
                });
            });
        },
    },

    // Field Resolvers for relations on Playlist type
    Playlist: {
        // Resolve user that owns the playlist
        user: async (parent, _args, { prisma }) => {
            return prisma.user.findUniqueOrThrow({
                where: { id: parent.userId },
            });
        },

        // Resolve songs in this playlist (w/ position info)
        // GraphQL calls this "song" but it returns PlaylistSong[]
        song: async (parent, _args, { prisma }) => {
            const playlistSongs = await prisma.playlistSong.findMany({
                where: { playlistId: parent.id },
                include: { song: true },
                orderBy: { position: 'asc' },
            });

            // Transform to match GraphQL PlaylistSong type
            return playlistSongs.map((ps) => ({
                song: ps.song,
                position: ps.position,
                addedAt: ps.addedAt,
            }));
        },

        // Resolve parent playlist (binary tree hierarchy)
        parent: async (parent, _args, { prisma }) => {
            if (!parent.parentId) return null;
            return prisma.playlist.findUnique({
                where: { id: parent.parentId },
            });
        },

        // Resolve child playlists (binary tree hierarchy)
        children: async (parent, _args, { prisma }) => {
            return prisma.playlist.findMany({
                where: { parentId: parent.id },
            });
        },
    },
};