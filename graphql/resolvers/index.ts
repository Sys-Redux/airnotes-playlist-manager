import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { userResolvers } from './user';
// TODO: Uncomment these once the resolver files are created
// import { songResolvers } from './song';
// import { playlistResolvers } from './playlist';

const resolvers = {
    DateTime: DateTimeResolver,
    JSON: JSONResolver,
    Query: {
        _health: () => 'OK',
        ...userResolvers.Query,
        // ...songResolvers.Query,
        // ...playlistResolvers.Query,
    },
    Mutation: {
        _health: () => 'OK',
        ...userResolvers.Mutation,
        // ...songResolvers.Mutation,
        // ...playlistResolvers.Mutation,
    },
    // Type Resolvers (Field Resolvers)
    // Spread with fallback to empty object to satisfy TypeScript
    User: { ...userResolvers.User },
    // Playlist: { ...playlistResolvers.Playlist },
};

export default resolvers;