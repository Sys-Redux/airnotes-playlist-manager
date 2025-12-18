import { PrismaClient } from '@/lib/generated/prisma';
import prisma from '@/lib/prisma';

// Context is available in all resolvers
export interface GraphQLContext {
    prisma: PrismaClient;
}

// Context factory function - called for each request
export async function createContext(): Promise<GraphQLContext> {
    return { prisma };
}