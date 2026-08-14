import { prisma } from './prisma';

export async function checkDatabaseConnection(timeoutMs = 5000): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$runCommandRaw({ ping: 1 }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database ping timeout')), timeoutMs);
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}
