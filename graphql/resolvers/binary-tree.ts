import { Resolvers } from '@/types/generated/graphql';
import { GraphQLContext } from '@/graphql/context';
import { buildPlaylistTree } from '@/lib/algorithms/binary-tree';
import type { PlaylistModel } from '@/lib/generated/prisma/models';

// Type for playlists with count
type PlaylistWithCount = PlaylistModel & { _count: { songs: number; children: number } };

export const binaryTreeResolvers: Resolvers<GraphQLContext> = {
    Query: {
        playlistHierarchy: async (_parent, { rootPlaylistId, order }, { prisma }) => {
            // Verify root exists
            const rootPlaylist = await prisma.playlist.findUnique({
                where: { id: rootPlaylistId },
            });

            if (!rootPlaylist) {
                throw new Error('Root playlist not found');
            }

            // Get all playlists that could be part of the tree
            const allPlaylists = await prisma.playlist.findMany({
                include: {
                    _count: { select: { songs: true, children: true } },
                },
            });

            // Build the binary tree starting from root
            const tree = buildPlaylistTree(allPlaylists, rootPlaylistId);

            // Perform traversal based on order
            const traversalOrder = order ?? 'PRE_ORDER';
            let traversedPlaylists: PlaylistWithCount[];

            switch (traversalOrder) {
                case 'PRE_ORDER':
                    traversedPlaylists = tree.preOrderTraversal();
                    break;
                case 'IN_ORDER':
                    traversedPlaylists = tree.inOrderTraversal();
                    break;
                case 'POST_ORDER':
                    traversedPlaylists = tree.postOrderTraversal();
                    break;
                case 'LEVEL_ORDER':
                    traversedPlaylists = tree.levelOrderTraversal();
                    break;
                default:
                    traversedPlaylists = tree.preOrderTraversal();
            }
            // Calculate depth for each node
            const calculateDepth = (playlistId: string, playlists: PlaylistWithCount[]): number => {
                const playlist = playlists.find(p => p.id === playlistId);
                if (!playlist || !playlist.parentId) return 0;
                return 1 + calculateDepth(playlist.parentId, playlists);
            };

            // Calculate songs recursively
            const calculateTotalSongs = (playlistId: string): number => {
                const playlist = traversedPlaylists.find(p => p.id === playlistId);
                if (!playlist) return 0;

                const directSongs = playlist._count.songs;
                const children = traversedPlaylists.filter(p => p.parentId === playlistId);

                let childSongs = 0;
                for (const child of children) {
                    childSongs += calculateTotalSongs(child.id);
                }
                return directSongs + childSongs;
            };

            // Build hierarchy nodes
            const nodes = traversedPlaylists.map((playlist) => ({
                playlist,
                depth: calculateDepth(playlist.id, allPlaylists),
                childCount: playlist._count.children,
                totalSongs: calculateTotalSongs(playlist.id),
            }));

            // Calculate total songs from root only
            const rootTotalSongs = nodes.length > 0 && nodes[0].depth === 0
                ? nodes[0].totalSongs
                : nodes.reduce((sum: number, n) => sum + (n.depth === 0 ? n.totalSongs : 0), 0);

            return {
                root: rootPlaylist,
                nodes,
                maxDepth: tree.getDepth(),
                totalPlaylists: traversedPlaylists.length,
                totalSongs: rootTotalSongs,
                traversalOrder,
            };
        },

        rootPlaylists: async (_parent, { userId }, { prisma }) => {
            return prisma.playlist.findMany({
                where: {
                    userId,
                    parentId: null,
                },
                orderBy: { createdAt: 'asc' }
            });
        },

        playlistAncestors: async (_parent, { playlistId }, { prisma }) => {
            const ancestors: PlaylistModel[] = [];
            let currentId: string | null = playlistId;

            while (currentId) {
                const found: PlaylistModel | null = await prisma.playlist.findUnique({
                    where: { id: currentId },
                });

                if (!found) break;
                if (found.id !== playlistId) {
                    ancestors.push(found);
                }
                currentId = found.parentId;
            }
            return ancestors;
        },
    },

    Mutation: {
        setPlaylistParent: async (_parent, { input }, { prisma }) => {
            const { playlistId, parentId } = input;

            // Prevent circular reference
            if (parentId) {
                let currentId: string | null = parentId;
                while (currentId) {
                    if (currentId === playlistId) {
                        throw new Error('Cannot set parent playlist to a descendant');
                    }
                    const found: PlaylistModel | null = await prisma.playlist.findUnique({
                        where: { id: currentId },
                    });
                    currentId = found?.parentId ?? null;
                }
            }
            return prisma.playlist.update({
                where: { id: playlistId },
                data: { parentId },
            });
        },

        removeFromHierarchy: async (_parent, { playlistId }, { prisma }) => {
            // Get playlist & its parent
            const playlist = await prisma.playlist.findUnique({
                where: { id: playlistId },
            });

            if (!playlist) {
                throw new Error('Playlist not found');
            }

            // Re-parent children to current playlist's parent
            await prisma.playlist.updateMany({
                where: { parentId: playlistId },
                data: { parentId: playlist.parentId },
            });

            // Remove this playlist from hierarchy
            return prisma.playlist.update({
                where: { id: playlistId },
                data: { parentId: null },
            });
        },

        createChildPlaylist: async (_parent, { parentId, name, description }, { prisma }) => {
            // Verify parent exists
            const parent = await prisma.playlist.findUnique({
                where: { id: parentId },
            });

            if (!parent) {
                throw new Error('Parent playlist not found');
            }

            return prisma.playlist.create({
                data: {
                    name,
                    description,
                    userId: parent.userId,
                    parentId,
                },
            });
        },
    },
};