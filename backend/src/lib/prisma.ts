import { PrismaClient } from '@prisma/client';
import { ENV } from '@/config/env';
import { logger } from '@/utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  if (!ENV.databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: ENV.databaseUrl,
      },
    },
    log: ENV.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (ENV.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectPrisma() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL via Prisma', error);
    throw error;
  }
}

export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected Prisma client');
  } catch (error) {
    logger.error('Failed to gracefully disconnect Prisma client', error);
  }
}
