import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app';
import { prisma, connectDatabase, disconnectDatabase } from '../../src/infrastructure/database/prisma';
import { UserRole } from '@prisma/client';
import {
  TEST_ADMIN_EMAIL,
  TEST_SCHOOL_CODE,
  assertDatabaseReachable,
  assertTestDatabase,
  cleanupAuthTestData,
} from '../helpers/db';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!runIntegration)('Auth API integration', () => {
  const app = createApp();
  let schoolId: string;
  let adminTokens: { accessToken: string; refreshToken: string };
  let setupComplete = false;

  beforeAll(async () => {
    assertTestDatabase();
    await assertDatabaseReachable();
    await connectDatabase();
    await cleanupAuthTestData();

    const school = await prisma.school.create({
      data: {
        name: 'Integration Test School',
        code: TEST_SCHOOL_CODE,
        address: '123 Test St',
        city: 'Mumbai',
        state: 'MH',
        country: 'IN',
      },
    });
    schoolId = school.id;

    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    await prisma.user.create({
      data: {
        schoolId,
        email: TEST_ADMIN_EMAIL,
        passwordHash,
        firstName: 'Test',
        lastName: 'Admin',
        role: UserRole.SCHOOL_ADMIN,
      },
    });

    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await disconnectDatabase().catch(() => undefined);
      return;
    }

    await cleanupAuthTestData();
    await disconnectDatabase();
  });

  it('POST /auth/login returns tokens for valid admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_ADMIN_EMAIL, password: 'Admin@12345' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('SCHOOL_ADMIN');

    adminTokens = res.body.data.tokens;
  });

  it('GET /auth/me returns authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminTokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_ADMIN_EMAIL);
  });

  it('POST /auth/refresh rotates tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: adminTokens.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(adminTokens.refreshToken);
    adminTokens = res.body.data;
  });

  it('GET /monitoring/stats requires authentication', async () => {
    const res = await request(app).get('/api/v1/monitoring/stats');
    expect(res.status).toBe(401);
  });

  it('GET /monitoring/stats returns data for admin', async () => {
    const res = await request(app)
      .get('/api/v1/monitoring/stats')
      .set('Authorization', `Bearer ${adminTokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalBuses');
    expect(res.body.data).toHaveProperty('totalStudents');
  });
});
