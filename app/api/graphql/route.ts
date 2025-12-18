import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createContext, GraphQLContext } from '@/graphql/context';
import resolvers from '@/graphql/resolvers';

// Load schema from .graphql file
const typeDefs = readFileSync(join(process.cwd(), 'graphql/schema/schema.graphql'), 'utf8');

// Create Apollo Server instance
const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
});

// Next.js route handler
const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(
    server,
    {
        context: async () => createContext(),
    }
);

// GET: Apollo Sandbox
// POST: GraphQL queries & mutations
export { handler as GET, handler as POST };