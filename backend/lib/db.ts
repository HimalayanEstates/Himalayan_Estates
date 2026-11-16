import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function runtimeDatabaseUrl() {
  const configured = process.env.DATABASE_URL;
  if (!configured) return undefined;
  const url = new URL(configured);
  // Keep local pools small behind Neon's pooler. Explicit deployment values win.
  if (url.hostname.endsWith('.neon.tech')) {
    for (const [key, value] of Object.entries({ connection_limit: '5', connect_timeout: '15', pool_timeout: '15' })) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'], datasourceUrl: runtimeDatabaseUrl() });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
