import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app';
import { prisma, connectDatabase, disconnectDatabase } from '../../src/infrastructure/database/prisma';
import { UserRole } from '@prisma/client';
import { assertDatabaseReachable, assertTestDatabase } from '../helpers/db';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

const SUPER_EMAIL = 'super-test@platform.com';
const SCHOOL_ADMIN_EMAIL = 'school-admin-sa@test.com';
const SCHOOL_CODE = 'SAPLAT001';

async function cleanup() {
  const emails = [
    SUPER_EMAIL,
    SCHOOL_ADMIN_EMAIL,
    'new-admin-saplat@test.com',
    'sa-driver@test.com',
    'sa-parent@test.com',
  ];
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  if (userIds.length) {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.driverProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.parentProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  const school = await prisma.school.findUnique({ where: { code: SCHOOL_CODE }, select: { id: true } });
  if (school) {
    await prisma.user.deleteMany({ where: { schoolId: school.id } });
    await prisma.school.delete({ where: { id: school.id } });
  }

  // Cleanup schools created during tests (code prefix SAPLAT)
  const created = await prisma.school.findMany({
    where: { code: { startsWith: 'SAPLAT' } },
    select: { id: true },
  });
  for (const s of created) {
    const schoolUsers = await prisma.user.findMany({ where: { schoolId: s.id }, select: { id: true } });
    const ids = schoolUsers.map((u) => u.id);
    if (ids.length) {
      await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
      await prisma.driverProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.parentProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.school.delete({ where: { id: s.id } });
  }
}

describe.skipIf(!runIntegration)('Super admin + multi-school integration', () => {
  const app = createApp();
  let setupComplete = false;
  let schoolId: string;
  let superToken: string;
  let schoolAdminToken: string;

  beforeAll(async () => {
    assertTestDatabase();
    await assertDatabaseReachable();
    await connectDatabase();
    await cleanup();

    const school = await prisma.school.create({
      data: {
        name: 'SA Platform School',
        code: SCHOOL_CODE,
        address: '1 Platform St',
        city: 'Mumbai',
        state: 'MH',
        country: 'IN',
      },
    });
    schoolId = school.id;

    const passwordHash = await bcrypt.hash('Super@12345', 12);
    await prisma.user.create({
      data: {
        email: SUPER_EMAIL,
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
        schoolId: null,
      },
    });

    await prisma.user.create({
      data: {
        email: SCHOOL_ADMIN_EMAIL,
        passwordHash: await bcrypt.hash('Admin@12345', 12),
        firstName: 'School',
        lastName: 'Admin',
        role: UserRole.SCHOOL_ADMIN,
        schoolId,
      },
    });

    const superLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: SUPER_EMAIL, password: 'Super@12345' });
    expect(superLogin.status).toBe(200);
    expect(superLogin.body.data.user.role).toBe('SUPER_ADMIN');
    expect(superLogin.body.data.user.schoolId).toBeNull();
    superToken = superLogin.body.data.tokens.accessToken;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: SCHOOL_ADMIN_EMAIL, password: 'Admin@12345' });
    expect(adminLogin.status).toBe(200);
    schoolAdminToken = adminLogin.body.data.tokens.accessToken;

    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await disconnectDatabase().catch(() => undefined);
      return;
    }
    await cleanup();
    await disconnectDatabase();
  });

  it('lists schools for super admin only', async () => {
    const ok = await request(app)
      .get('/api/v1/schools')
      .set('Authorization', `Bearer ${superToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.items.some((s: { code: string }) => s.code === SCHOOL_CODE)).toBe(true);

    const denied = await request(app)
      .get('/api/v1/schools')
      .set('Authorization', `Bearer ${schoolAdminToken}`);
    expect(denied.status).toBe(403);
  });

  it('returns platform stats for super admin', async () => {
    const res = await request(app)
      .get('/api/v1/platform/stats')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalSchools');
    expect(res.body.data.totalSchools).toBeGreaterThanOrEqual(1);

    const denied = await request(app)
      .get('/api/v1/platform/stats')
      .set('Authorization', `Bearer ${schoolAdminToken}`);
    expect(denied.status).toBe(403);
  });

  it('creates a school with first admin', async () => {
    const res = await request(app)
      .post('/api/v1/schools')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        name: 'Created By Super',
        code: 'SAPLATNEW',
        address: '99 New Street',
        city: 'Pune',
        state: 'MH',
        country: 'IN',
        timezone: 'Asia/Kolkata',
        admin: {
          email: 'new-admin-saplat@test.com',
          password: 'Admin@12345',
          firstName: 'New',
          lastName: 'Admin',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('SAPLATNEW');

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'new-admin-saplat@test.com', password: 'Admin@12345' });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.data.user.role).toBe('SCHOOL_ADMIN');
    expect(adminLogin.body.data.user.schoolId).toBe(res.body.data.id);
  });

  it('requires X-School-Id for super admin school-scoped APIs', async () => {
    const missing = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${superToken}`);
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('VALIDATION_ERROR');

    const ok = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${superToken}`)
      .set('X-School-Id', schoolId);
    expect(ok.status).toBe(200);
    expect(ok.body.data).toHaveProperty('items');
  });

  it('allows school admin own school and blocks other school', async () => {
    const own = await request(app)
      .get(`/api/v1/schools/${schoolId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);
    expect(own.status).toBe(200);

    const otherSchool = await prisma.school.findUnique({ where: { code: 'SAPLATNEW' } });
    expect(otherSchool).toBeTruthy();

    const denied = await request(app)
      .get(`/api/v1/schools/${otherSchool!.id}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);
    expect(denied.status).toBe(403);

    const superGet = await request(app)
      .get(`/api/v1/schools/${otherSchool!.id}`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(superGet.status).toBe(200);
  });

  it('rejects public school creation', async () => {
    const res = await request(app).post('/api/v1/schools').send({
      name: 'Hacker School',
      code: 'HACK001',
      address: 'Hack Street',
      city: 'X',
      state: 'Y',
      timezone: 'Asia/Kolkata',
    });
    expect(res.status).toBe(401);
  });

  it('super admin can manage resources inside a school via X-School-Id', async () => {
    const driverRes = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${superToken}`)
      .set('X-School-Id', schoolId)
      .send({
        email: 'sa-driver@test.com',
        password: 'Driver@12345',
        firstName: 'SA',
        lastName: 'Driver',
        licenseNumber: 'DL-SA-99999',
      });
    expect(driverRes.status).toBe(201);
    expect(driverRes.body.data.driverProfile?.id).toBeDefined();

    const parentRes = await request(app)
      .post('/api/v1/parents')
      .set('Authorization', `Bearer ${superToken}`)
      .set('X-School-Id', schoolId)
      .send({
        email: 'sa-parent@test.com',
        password: 'Parent@12345',
        firstName: 'SA',
        lastName: 'Parent',
      });
    expect(parentRes.status).toBe(201);
    expect(parentRes.body.data.parentProfile?.id).toBeDefined();

    const stats = await request(app)
      .get('/api/v1/monitoring/stats')
      .set('Authorization', `Bearer ${superToken}`)
      .set('X-School-Id', schoolId);
    expect(stats.status).toBe(200);
    expect(stats.body.data.totalDrivers).toBeGreaterThanOrEqual(1);

    const patch = await request(app)
      .patch(`/api/v1/schools/${schoolId}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ phone: '+911111111111' });
    expect(patch.status).toBe(200);
    expect(patch.body.data.phone).toBe('+911111111111');
  });

  it('rejects invalid X-School-Id for super admin', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${superToken}`)
      .set('X-School-Id', '000000000000000000000000');
    expect(res.status).toBe(404);
  });
});
