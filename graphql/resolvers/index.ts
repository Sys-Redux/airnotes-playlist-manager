import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { userResolvers } from './user';
import { songResolvers } from './song';
import { playlistResolvers } from './playlist';

const resolvers = {
    DateTime: DateTimeResolver,
    JSON: JSONResolver,
    Query: {
        _health: () => 'OK',
        ...userResolvers.Query,
        ...songResolvers.Query,
        ...playlistResolvers.Query,
    },
    Mutation: {
        _health: () => 'OK',
        ...userResolvers.Mutation,
        ...songResolvers.Mutation,
        ...playlistResolvers.Mutation,
    },
    // Type Resolvers (Field Resolvers)
    User: { ...userResolvers.User },
    Playlist: { ...playlistResolvers.Playlist },
};

export default resolvers;