import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { userResolvers } from './user';
import { songResolvers } from './song';
import { playlistResolvers } from './playlist';
import { dijkstraResolvers } from './dijkstra';
import { binaryTreeResolvers } from './binary-tree';
import { StackQueueResolvers } from './stack-queue';

const resolvers = {
    DateTime: DateTimeResolver,
    JSON: JSONResolver,
    Query: {
        _health: () => 'OK',
        ...userResolvers.Query,
        ...songResolvers.Query,
        ...playlistResolvers.Query,
        ...dijkstraResolvers.Query,
        ...binaryTreeResolvers.Query,
        ...StackQueueResolvers.Query,
    },
    Mutation: {
        _health: () => 'OK',
        ...userResolvers.Mutation,
        ...songResolvers.Mutation,
        ...playlistResolvers.Mutation,
        ...dijkstraResolvers.Mutation,
        ...binaryTreeResolvers.Mutation,
        ...StackQueueResolvers.Mutation,
    },
    // Type Resolvers (Field Resolvers)
    User: { ...userResolvers.User },
    Playlist: { ...playlistResolvers.Playlist },
    SongConnection: { ...dijkstraResolvers.SongConnection },
};

export default resolvers;