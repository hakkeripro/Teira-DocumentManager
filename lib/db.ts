import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const db: PrismaClient = global.__prisma ?? new PrismaClient({
  log: process.env.APP_ENV === 'dev' ? ['warn', 'error'] : ['error'],
});

if (process.env.APP_ENV !== 'production') global.__prisma = db;
