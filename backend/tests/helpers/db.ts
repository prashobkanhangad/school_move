import { prisma } from '../../src/infrastructure/database/prisma';
import { checkDatabaseConnection } from '../../src/infrastructure/database/health';

export const TEST_ADMIN_EMAIL = 'integration-test-admin@school.com';
export const TEST_SCHOOL_CODE = 'INTTEST001';

export function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL ?? '';
  const isTestDatabase =
    url.includes('school_bus_test') ||
    url.includes('127.0.0.1') ||
    url.includes('localhost');

  if (!isTestDatabase) {
    throw new Error(
      'Integration tests must use a dedicated test database (school_bus_test). ' +
        'Set INTEGRATION_DATABASE_URL or use the default in-memory/local test setup.'
    );
  }
}

export async function assertDatabaseReachable(): Promise<void> {
  const connected = await checkDatabaseConnection(5000);
  if (!connected) {
    throw new Error('Test database is not reachable after integration setup.');
  }
}

export async function cleanupAuthTestData(): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: TEST_ADMIN_EMAIL },
    select: { id: true },
  });

  if (user) {
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  const school = await prisma.school.findUnique({
    where: { code: TEST_SCHOOL_CODE },
    select: { id: true },
  });

  if (school) {
    await prisma.school.delete({ where: { id: school.id } });
  }
}
