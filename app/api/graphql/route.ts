import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createContext, GraphQLContext } from '@/graphql/context';
import resolvers from '@/graphql/resolvers';

// Helper function to recursively read .graphql files from a directory
function loadGraphQLFiles(dir: string): string[] {
    const files: string[] = [];

    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...loadGraphQLFiles(fullPath));
        } else if (entry.endsWith('.graphql')) {
            files.push(fullPath);
        }
    }
    return files;
}

// Load & merge all .graphql schema files
const schemaDir = join(process.cwd(), 'graphql/schema');
const typeDefs = loadGraphQLFiles(schemaDir)
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

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