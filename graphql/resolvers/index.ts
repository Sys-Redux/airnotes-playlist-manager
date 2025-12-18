const resolvers = {
    Query: {
        _health: () => 'OK',
    },
    Mutation: {
        _health: () => 'OK',
    },
};

export default resolvers;