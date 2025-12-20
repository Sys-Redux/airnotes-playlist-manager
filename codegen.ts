import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: 'graphql/schema/**/*.graphql',
    generates: {
        'types/generated/graphql.ts': {
            plugins: [
                'typescript',
                'typescript-resolvers',
            ],
            config: {
                contextType: '@/graphql/context#GraphQLContext',
                // Mappers tell codegen that when a resolver returns a "User",
                // it's actually a Prisma User model, not the full GraphQL User type.
                // Field resolvers handle the relations (like playlists).
                mappers: {
                    User: '@prisma/client#User as UserModel',
                    Playlist: '@prisma/client#Playlist as PlaylistModel',
                    Song: '@prisma/client#Song as SongModel',
                    PlaylistSong: '@prisma/client#PlaylistSong as PlaylistSongModel',
                },
            },
        },
    },
};

export default config;