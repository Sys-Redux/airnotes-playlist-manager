import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Create the PostgreSQL adapter with connection string from environment
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

// Global type declaration for singleton pattern
declare global {
    var prisma: PrismaClient | undefined;
}

// Use singleton pattern to prevent multiple instances of Prisma Client in development
// The adapter is required in Prisma v7 - you can no longer use PrismaClient without one
const prisma = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

export { prisma };
export default prisma;