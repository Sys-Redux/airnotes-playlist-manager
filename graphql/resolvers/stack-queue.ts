import { Resolvers } from '@/types/generated/graphql';
import { GraphQLContext } from '@/graphql/context';
import next from 'next';

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
                    addedBy: qs.addedBy,
                })),
                history: history.map((h, idx) => ({
                    song: h.song,
                    position: idx,
                    playedAt: h.playedAt,
                    addedBy: null,
                })),
                queueSize: upcoming.length,
                repeatMode: queueState.repeatMode as 'NONE' | 'ONE' | 'ALL',
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
            for (const ps of playlistSongs) {
                await prisma.userQueueSong.create({
                    data: { userId, songId: ps.songId, position: nextPosition++ },
                });
            }
            return buildQueueOperationResult(prisma, userId, true, 'Playlist added to queue');
        },
    }
}