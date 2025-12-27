import { PrismaClient, PlaylistActionHistory } from '@/lib/generated/prisma/client';
import { PlaylistAction, PlaylistActionType, QueueOperationResult, RepeatMode, QueuedSong } from '@/types/generated/graphql';

// =================== ACTION HISTORY HELPERS ===================

// Maps a prisma PlaylistActionHistory record to GraphQL PlaylistAction
export function mapActionToGraphQL(action: PlaylistActionHistory): PlaylistAction {
    return {
        actionType: action.actionType as PlaylistActionType,
        playlistId: action.playlistId,
        timeStamp: action.timeStamp,
        songId: action.songId,
        fromPosition: action.fromPosition,
        toPosition: action.toPosition,
        previousValue: action.previousValue,
        newValue: action.newValue,
    };
}

// Reverses an action in the database (for undo)
export async function reverseAction(
    prisma: PrismaClient,
    action: PlaylistActionHistory
): Promise<void> {
    switch (action.actionType) {
        case 'ADD_SONG':
            // Undo add = remove song
            if (action.songId) {
                await prisma.playlistSong.delete({
                    where: {
                        playlistId_songId: {
                            playlistId: action.playlistId,
                            songId: action.songId,
                        },
                    },
                });
            }
            break;

        case 'REMOVE_SONG':
            // Undo remove = add song back at original position
            if (action.songId && action.fromPosition !== null) {
                await prisma.playlistSong.create({
                    data: {
                        playlistId: action.playlistId,
                        songId: action.songId,
                        position: action.fromPosition,
                    },
                });
            }
            break;

        case 'MOVE_SONG':
            // Undo move = move back to original position
            if (action.songId && action.fromPosition !== null && action.toPosition !== null) {
                await moveSongInPlaylist(
                    prisma,
                    action.playlistId,
                    action.songId,
                    action.toPosition,
                    action.fromPosition
                );
            }
            break;

        case 'RENAME_PLAYLIST':
        case 'UPDATE_DESCRIPTION':
            // Undo = restor previous value
            if (action.previousValue !== null) {
                const field = action.actionType === 'RENAME_PLAYLIST' ? 'name' : 'description';
                await prisma.playlist.update({
                    where: { id: action.playlistId },
                    data: { [field]: action.previousValue },
                });
            }
            break;
    }
}

// Reapplies an action in the database (for redo)
export async function applyAction(
    prisma: PrismaClient,
    action: PlaylistActionHistory
): Promise<void> {
    switch (action.actionType) {
        case 'ADD_SONG':
            // Redo add = add song again
            if (action.songId && action.toPosition !== null) {
                await prisma.playlistSong.create({
                    data: {
                        playlistId: action.playlistId,
                        songId: action.songId,
                        position: action.toPosition,
                    },
                });
            }
            break;

        case 'REMOVE_SONG':
            // Redo remove = remove song again
            if (action.songId) {
                await prisma.playlistSong.delete({
                    where: {
                        playlistId_songId: {
                            playlistId: action.playlistId,
                            songId: action.songId,
                        },
                    },
                });
            }
            break;

        case 'MOVE_SONG':
            // Redo move = move to new position again
            if (action.songId && action.fromPosition !== null && action.toPosition !== null) {
                await moveSongInPlaylist(
                    prisma,
                    action.playlistId,
                    action.songId,
                    action.fromPosition,
                    action.toPosition
                );
            }
            break;

        case 'RENAME_PLAYLIST':
        case 'UPDATE_DESCRIPTION':
            // Redo = apply new value
            if (action.newValue !== null) {
                const field = action.actionType === 'RENAME_PLAYLIST' ? 'name' : 'description';
                await prisma.playlist.update({
                    where: { id: action.playlistId },
                    data: { [field]: action.newValue },
                });
            }
            break;
    }
}

// Helper to move a song within a playlist (handles position shifting).

async function moveSongInPlaylist(
    prisma: PrismaClient,
    playlistId: string,
    songId: string,
    fromPosition: number,
    toPosition: number
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        // Temporarily remove the song
        await tx.playlistSong.delete({
            where: { playlistId_songId: { playlistId, songId } },
        });

        // Shift positions
        if (fromPosition < toPosition) {
            await tx.playlistSong.updateMany({
                where: { playlistId, position: { gt: fromPosition, lte: toPosition } },
                data: { position: { decrement: 1 } },
            });
        } else {
            await tx.playlistSong.updateMany({
                where: { playlistId, position: { gte: toPosition, lt: fromPosition } },
                data: { position: { increment: 1 } },
            });
        }

        // Re-add at new position
        await tx.playlistSong.create({
            data: { playlistId, songId, position: toPosition },
        });
    });
}

// =================== QUEUE HELPERS ====================

// Builds a QueueOperationResult by fetching the current queue state.
export async function buildQueueOperationResult(
    prisma: PrismaClient,
    userId: string,
    success: boolean,
    message: string
): Promise<QueueOperationResult> {
    const queueState = await prisma.userQueueState.findUnique({
        where: { userId },
        include: { currentSong: true },
    });

    const upcoming = await prisma.userQueueSong.findMany({
        where: { userId },
        orderBy: { position: 'asc' },
        include: { song: true, addedBy: true },
    });

    const history = await prisma.userQueueHistory.findMany({
        where: { userId },
        orderBy: { playedAt: 'desc' },
        take: 20,
        include: { song: true },
    });

    return {
        success,
        message,
        queue: {
            currentSong: queueState?.currentSongId
                ? {
                      song: queueState.currentSong!,
                      position: -1,
                      addedAt: new Date(),
                      addedBy: null,
                  }
                : null,
            upcoming: upcoming.map((qs, idx) => ({
                song: qs.song,
                position: idx,
                addedAt: qs.addedAt,
                addedBy: qs.addedBy ?? undefined,
            } as QueuedSong)),
            history: history.map((h, idx) => ({
                song: h.song,
                position: idx,
                addedAt: h.playedAt,
                addedBy: undefined,
            } as QueuedSong)),
            queueSize: upcoming.length,
            repeatMode: RepeatMode[queueState?.repeatMode as keyof typeof RepeatMode] ?? RepeatMode.None,
        },
    };
}

// Reorders queue positions to be sequential (0, 1, 2, ...).
export async function reorderQueue(prisma: PrismaClient, userId: string): Promise<void> {
    const songs = await prisma.userQueueSong.findMany({
        where: { userId },
        orderBy: { position: 'asc' },
    });

    await prisma.$transaction(
        songs.map((song, idx) =>
            prisma.userQueueSong.update({
                where: { id: song.id },
                data: { position: idx },
            })
        )
    );
}

// Handles skip to next song logic with repeat mode support.
export async function handleSkipToNext(
    prisma: PrismaClient,
    userId: string
): Promise<QueueOperationResult> {
    const queueState = await prisma.userQueueState.findUnique({
        where: { userId },
        include: { currentSong: true },
    });

    // Add current song to history if exists
    if (queueState?.currentSongId) {
        await prisma.userQueueHistory.create({
            data: { userId, songId: queueState.currentSongId },
        });
    }

    // Get next song in queue
    const nextSong = await prisma.userQueueSong.findFirst({
        where: { userId },
        orderBy: { position: 'asc' },
    });

    if (nextSong) {
        // Set as current and remove from queue
        await prisma.userQueueState.upsert({
            where: { userId },
            update: { currentSongId: nextSong.songId },
            create: { userId, currentSongId: nextSong.songId },
        });
        await prisma.userQueueSong.delete({ where: { id: nextSong.id } });
        await reorderQueue(prisma, userId);

        return buildQueueOperationResult(prisma, userId, true, 'Skipped to next song');
    }

    // Handle repeat mode
    if (queueState?.repeatMode === 'ALL') {
        // Reload queue from history (or could loop back to playlist)
        return buildQueueOperationResult(prisma, userId, true, 'Queue ended, repeat all mode');
    }

    // No more songs
    await prisma.userQueueState.upsert({
        where: { userId },
        update: { currentSongId: null },
        create: { userId, currentSongId: null },
    });

    return buildQueueOperationResult(prisma, userId, true, 'Queue ended');
}

// Handles skip to previous song logic.
export async function handleSkipToPrevious(
    prisma: PrismaClient,
    userId: string
): Promise<QueueOperationResult> {
    // Get most recent song from history
    const previousSong = await prisma.userQueueHistory.findFirst({
        where: { userId },
        orderBy: { playedAt: 'desc' },
    });

    if (!previousSong) {
        return buildQueueOperationResult(prisma, userId, false, 'No previous song in history');
    }

    const queueState = await prisma.userQueueState.findUnique({
        where: { userId },
    });

    // Add current song back to front of queue if exists
    if (queueState?.currentSongId) {
        // Shift all queue positions up by 1
        await prisma.userQueueSong.updateMany({
            where: { userId },
            data: { position: { increment: 1 } },
        });

        // Add current song to front
        await prisma.userQueueSong.create({
            data: { userId, songId: queueState.currentSongId, position: 0 },
        });
    }

    // Set previous song as current
    await prisma.userQueueState.upsert({
        where: { userId },
        update: { currentSongId: previousSong.songId },
        create: { userId, currentSongId: previousSong.songId },
    });

    // Remove from history
    await prisma.userQueueHistory.delete({ where: { id: previousSong.id } });

    return buildQueueOperationResult(prisma, userId, true, 'Skipped to previous song');
}