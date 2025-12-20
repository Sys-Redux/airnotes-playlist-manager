import { Resolvers } from '@/types/generated/graphql';
import { GraphQLContext } from '@/graphql/context';

export const userResolvers: Resolvers<GraphQLContext> = {
    Query: {
        user: async (_parent, { id }, { prisma }) => {
            return prisma.user.findUnique({
                where: { id },
            });
        },

        userPreferences: async (_parent, { userId }, { prisma }) => {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            return user?.preferences ?? null;
        },
    },

    Mutation: {
        createUser: async (_parent, { input }, { prisma }) => {
            try {
                const user = await prisma.user.create({
                    data: {
                        name: input.name,
                        email: input.email,
                    },
                });

                return {
                    code: 201,
                    success: true,
                    message: 'User created successfully',
                    user,
                };
            } catch (error) {
                return {
                    code: 400,
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to create user',
                    user: null,
                };
            }
        },

        setUserPreferences: async (_parent, { userId, preferences }, { prisma }) => {
            return prisma.user.update({
                where: { id: userId },
                data: {
                    preferences: preferences as object,
                },
            });
        },
    },

    // Field Resolvers
    User: {
        playlists: async (parent, _args, { prisma }) => {
            return prisma.playlist.findMany({
                where: { userId: parent.id },
            });
        },
    },
};