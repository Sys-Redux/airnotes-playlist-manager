import { Resolvers, RepeatMode } from '@/types/generated/graphql';
import { GraphQLContext } from '@/graphql/context';
import { fisherYatesShuffle } from '@/lib/utils/shuffle';
import {
    mapActionToGraphQL,
    reverseAction,
    applyAction,
    buildQueueOperationResult,
    reorderQueue,
    handleSkipToNext,
    handleSkipToPrevious,
} from '@/graphql/resolvers/helpers/sq-helper';

export const StackQueueResolvers: Resolvers<GraphQLContext> = {
    Query: {
        // =================== UNDO/REDO STACK ====================
        playlistUndoStatus: async (_parent, { playlistId }, { prisma }) => {
            // Count undo and redo stack sizes for the playlist
            const undoCount = await prisma.playlistActionHistory.count({
                where: { playlistId, isUndone: false },
            });
            const redoCount = await prisma.playlistActionHistory.count({
                where: { playlistId, isUndone: true },
            });
            // Most recent action on undo stack
            const lastAction = await prisma.playlistActionHistory.findFirst({
                where: { playlistId, isUndone: false },
                orderBy: { timeStamp: 'desc' },
            });
            return {
                canUndo: undoCount > 0,
                canRedo: redoCount > 0,
                undoHistoryCount: undoCount,
                redoHistoryCount: redoCount,
                lastAction: lastAction ? mapActionToGraphQL(lastAction) : null,
            };
        },

        playlistUndoHistory: async (_parent, { playlistId, limit }, { prisma }) => {
            // Fetch recent actions from undo stack
            const actions = await prisma.playlistActionHistory.findMany({
                where: { playlistId, isUndone: false },
                orderBy: { stackOrder: 'desc' },
                take: limit ?? 10,
            });
            return actions.map(mapActionToGraphQL);
        },

        // =================== PLAYBACK QUEUE ====================
        playbackQueue: async (_parent, { userId }, { prisma }) => {
            // Get or create queue state
            let queueState = await prisma.userQueueState.findUnique({
                where: { userId },
                include: {currentSong: true },
            });

            if (!queueState) {
                queueState = await prisma.userQueueState.create({
                    data: { userId },
                    include: { currentSong: true },
                });
            }

            // Get upcoming songs
            const upcoming = await prisma.userQueueSong.findMany({
                where: { userId },
                orderBy: { position: 'asc' },
                include: { song: true, addedBy: true },
            });

            // Get history (mosdt recent first)
            const history = await prisma.userQueueHistory.findMany({
                where: { userId },
                orderBy: { playedAt: 'desc' },
                take: 20,
                include: { song: true },
            });

            return {
                currentSong: queueState.currentSongId ? {
                    song: queueState.currentSong,
                    position: -1, // Current song isn't in queue
                    addedAt: new Date(),
                    addedBy: null,
                } : null,
                upcoming: upcoming.map((qs, idx) => ({
                    song: qs.song,
                    position: idx,
                    addedAt: qs.addedAt,
                    addedBy: qs.addedBy ?? undefined,
                })),
                history: history.map((h, idx) => ({
                    song: h.song,
                    position: idx,
                    addedAt: h.playedAt,
                    addedBy: undefined,
                })),
                queueSize: upcoming.length,
                repeatMode: RepeatMode[queueState.repeatMode as keyof typeof RepeatMode] ?? RepeatMode.None,
            };
        },
    },

    Mutation: {
        // =================== UNDO/REDO MUTATIONS ====================
        undoPlaylistAction: async (_parent, { playlistId }, { prisma }) => {
            // Find most recent action on undo stack
            const action = await prisma.playlistActionHistory.findFirst({
                where: { playlistId, isUndone: false },
                orderBy: { stackOrder: 'desc' },
            });

            if (!action) return null;

            // Move to redo stack
            await prisma.playlistActionHistory.update({
                where: { id: action.id },
                data: { isUndone: true },
            });

            // Reverse action in database
            await reverseAction(prisma, action);

            return mapActionToGraphQL(action);
        },

        redoPlaylistAction: async (_parent, { playlistId } , { prisma }) => {
            // Find most recent action on redo stack
            const action = await prisma.playlistActionHistory.findFirst({
                where: { playlistId, isUndone: true },
                orderBy: { stackOrder: 'desc' },
            });

            if (!action) return null;

            // Move back to undo stack
            await prisma.playlistActionHistory.update({
                where: { id: action.id },
                data: { isUndone: false },
            });

            // Re-apply action in database
            await applyAction(prisma, action);

            return mapActionToGraphQL(action);
        },

        clearPlaylistHistory: async (_parent, { playlistId }, { prisma }) => {
            await prisma.playlistActionHistory.deleteMany({
                where: { playlistId },
            });
            return true;
        },

        // =================== PLAYBACK QUEUE MUTATIONS ====================
        addToQueue: async (_parent, { userId, songId }, { prisma }) => {
            // Get highest position in queue
            const lastSong = await prisma.userQueueSong.findFirst({
                where: { userId },
                orderBy: { position: 'desc' },
            });
            const nextPosition = (lastSong?.position ?? -1) + 1;

            // Add to queue
            await prisma.userQueueSong.create({
                data: { userId, songId, position: nextPosition },
            });
            return buildQueueOperationResult(prisma, userId, true, 'Song added to queue');
        },

        addPlaylistToQueue: async (_parent, { userId, playlistId }, { prisma }) => {
            // Get all songs in playlist
            const playlistSongs = await prisma.playlistSong.findMany({
                where: { playlistId },
                orderBy: { position: 'asc' },
            });

            // Get highest position
            const lastSong = await prisma.userQueueSong.findFirst({
                where: { userId },
                orderBy: { position: 'desc' },
            });

            // Add all songs
            let nextPosition = (lastSong?.position ?? -1) + 1;
            for (const ps of playlistSongs) {
                await prisma.userQueueSong.create({
                    data: { userId, songId: ps.songId, position: nextPosition++ },
                });
            }
            return buildQueueOperationResult(prisma, userId, true, 'Playlist added to queue');
        },

        skipToNext: async (_parent, { userId }, { prisma }) => {
            return await handleSkipToNext(prisma, userId);
        },

        skipToPrevious: async (_parent, { userId }, { prisma }) => {
            return await handleSkipToPrevious(prisma, userId);
        },

        removeFromQueue: async (_parent, { userId, position }, { prisma }) => {
            // Delete song at position
            await prisma.userQueueSong.deleteMany({
                where: { userId, position },
            });

            // Reorder subsequent songs
            await reorderQueue(prisma, userId);

            return buildQueueOperationResult(prisma, userId, true, 'Song removed from queue');
        },

        moveInQueue: async (_parent, { userId, fromPosition, toPosition }, { prisma }) => {
            await prisma.$transaction(async (tx) => {
                // Get the song to move
                const songToMove = await tx.userQueueSong.findFirst({
                    where: { userId, position: fromPosition },
                });

                if (!songToMove) throw new Error('Song not found in queue at the specified position');

                // Temporarily set to -1
                await tx.userQueueSong.update({
                    where: { id: songToMove.id },
                    data: { position: -1 },
                });

                // Shift songs between positions
                if (fromPosition < toPosition) {
                    await tx.userQueueSong.updateMany({
                        where: { userId, position: { gt: fromPosition, lte: toPosition } },
                        data: { position: { decrement: 1 } },
                    });
                } else {
                    await tx.userQueueSong.updateMany({
                        where: { userId, position: { gte: toPosition, lt: fromPosition } },
                        data: { position: { increment: 1 } },
                    });
                }
                // Move song to new position
                await tx.userQueueSong.update({
                    where: { id: songToMove.id },
                    data: { position: toPosition },
                });
            });
            return buildQueueOperationResult(prisma, userId, true, 'Song moved in queue');
        },

        shuffleQueue: async (_parent, { userId }, { prisma }) => {
            const songs = await prisma.userQueueSong.findMany({
                where: { userId },
                orderBy: { position: 'asc' },
            });

            const shuffled = fisherYatesShuffle(songs);

            // Update positions
            await prisma.$transaction(
                shuffled.map((song, idx) =>
                    prisma.userQueueSong.update({
                        where: { id: song.id },
                        data: { position: idx },
                    })
                )
            );
            return buildQueueOperationResult(prisma, userId, true, 'Queue shuffled');
        },

        clearQueue: async (_parent, { userId }, { prisma }) => {
            await prisma.userQueueSong.deleteMany({
                where: { userId },
            });
            return buildQueueOperationResult(prisma, userId, true, 'Queue cleared');
        },

        setRepeatMode: async (_parent, { userId, mode }, { prisma }) => {
            await prisma.userQueueState.upsert({
                where: { userId },
                update: { repeatMode: mode },
                create: { userId, repeatMode: mode },
            });
            return buildQueueOperationResult(prisma, userId, true, 'Repeat mode updated');
        },
    },
};