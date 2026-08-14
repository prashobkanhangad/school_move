import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app';
import { prisma, connectDatabase, disconnectDatabase } from '../../src/infrastructure/database/prisma';
import { UserRole } from '@prisma/client';
import { assertDatabaseReachable, assertTestDatabase } from '../helpers/db';
import {
  DEEP_ADMIN_EMAIL,
  DEEP_DRIVER_EMAIL,
  DEEP_OTHER_ADMIN_EMAIL,
  DEEP_OTHER_SCHOOL_CODE,
  DEEP_PARENT_EMAIL,
  DEEP_SCHOOL_CODE,
  cleanupDeepTestData,
} from '../helpers/deep';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!runIntegration)('Deep resource + trip API integration', () => {
  const app = createApp();
  let setupComplete = false;

  let schoolId: string;
  let otherSchoolId: string;
  let adminToken: string;
  let otherAdminToken: string;
  let driverToken: string;
  let parentToken: string;

  let driverUserId: string;
  let driverProfileId: string;
  let parentUserId: string;
  let parentProfileId: string;
  let busId: string;
  let routeId: string;
  let pickupStopId: string;
  let dropStopId: string;
  let studentId: string;
  let tripId: string;
  let alertId: string;

  async function login(email: string, password: string) {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    return res.body.data.tokens as { accessToken: string; refreshToken: string };
  }

  beforeAll(async () => {
    assertTestDatabase();
    await assertDatabaseReachable();
    await connectDatabase();
    await cleanupDeepTestData();

    const school = await prisma.school.create({
      data: {
        name: 'Deep Test School',
        code: DEEP_SCHOOL_CODE,
        address: '1 Deep St',
        city: 'Mumbai',
        state: 'MH',
        country: 'IN',
      },
    });
    schoolId = school.id;

    const otherSchool = await prisma.school.create({
      data: {
        name: 'Deep Other School',
        code: DEEP_OTHER_SCHOOL_CODE,
        address: '2 Other St',
        city: 'Pune',
        state: 'MH',
        country: 'IN',
      },
    });
    otherSchoolId = otherSchool.id;

    const passwordHash = await bcrypt.hash('Admin@12345', 12);

    await prisma.user.create({
      data: {
        schoolId,
        email: DEEP_ADMIN_EMAIL,
        passwordHash,
        firstName: 'Deep',
        lastName: 'Admin',
        role: UserRole.SCHOOL_ADMIN,
      },
    });

    await prisma.user.create({
      data: {
        schoolId: otherSchoolId,
        email: DEEP_OTHER_ADMIN_EMAIL,
        passwordHash,
        firstName: 'Other',
        lastName: 'Admin',
        role: UserRole.SCHOOL_ADMIN,
      },
    });

    const adminTokens = await login(DEEP_ADMIN_EMAIL, 'Admin@12345');
    adminToken = adminTokens.accessToken;

    const otherTokens = await login(DEEP_OTHER_ADMIN_EMAIL, 'Admin@12345');
    otherAdminToken = otherTokens.accessToken;

    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await disconnectDatabase().catch(() => undefined);
      return;
    }
    await cleanupDeepTestData();
    await disconnectDatabase();
  });

  it('creates driver and returns driverProfile', async () => {
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: DEEP_DRIVER_EMAIL,
        password: 'Driver@12345',
        firstName: 'Deep',
        lastName: 'Driver',
        phone: '9999900001',
        licenseNumber: 'DL-DEEP-001',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(DEEP_DRIVER_EMAIL);
    expect(res.body.data.driverProfile?.id).toBeDefined();

    driverUserId = res.body.data.id;
    driverProfileId = res.body.data.driverProfile.id;

    const tokens = await login(DEEP_DRIVER_EMAIL, 'Driver@12345');
    driverToken = tokens.accessToken;
  });

  it('creates parent with parentProfile and lists it for student create', async () => {
    const createRes = await request(app)
      .post('/api/v1/parents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: DEEP_PARENT_EMAIL,
        password: 'Parent@12345',
        firstName: 'Deep',
        lastName: 'Parent',
        phone: '9999900002',
        address: 'Parent House',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.parentProfile?.id).toBeDefined();
    parentUserId = createRes.body.data.id;
    parentProfileId = createRes.body.data.parentProfile.id;

    const listRes = await request(app)
      .get('/api/v1/parents')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 20 });

    expect(listRes.status).toBe(200);
    const listed = listRes.body.data.items.find((p: { email: string }) => p.email === DEEP_PARENT_EMAIL);
    expect(listed).toBeDefined();
    expect(listed.parentProfile?.id).toBe(parentProfileId);

    const tokens = await login(DEEP_PARENT_EMAIL, 'Parent@12345');
    parentToken = tokens.accessToken;
  });

  it('creates bus, assigns driver, then unassigns with null', async () => {
    const createRes = await request(app)
      .post('/api/v1/buses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        plateNumber: 'DEEP-BUS-01',
        model: 'Tata',
        capacity: 40,
        driverId: driverProfileId,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.driver?.id || createRes.body.data.driverId).toBeTruthy();
    busId = createRes.body.data.id;

    const unassignRes = await request(app)
      .patch(`/api/v1/buses/${busId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ driverId: null });

    expect(unassignRes.status).toBe(200);
    expect(unassignRes.body.data.driver).toBeNull();

    const reassignRes = await request(app)
      .patch(`/api/v1/buses/${busId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ driverId: driverProfileId });

    expect(reassignRes.status).toBe(200);
    expect(reassignRes.body.data.driver?.id).toBe(driverProfileId);
  });

  it('creates route with stops and assigns bus', async () => {
    const res = await request(app)
      .post('/api/v1/routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Deep Morning Route',
        busId,
        startTime: '07:30',
        stops: [
          {
            name: 'Stop A',
            latitude: 19.076,
            longitude: 72.8777,
            stopOrder: 1,
            stopType: 'PICKUP',
          },
          {
            name: 'School Gate',
            latitude: 19.08,
            longitude: 72.88,
            stopOrder: 2,
            stopType: 'DROP',
          },
        ],
      });

    expect(res.status).toBe(201);
    routeId = res.body.data.id;
    expect(res.body.data.stops?.length).toBe(2);

    pickupStopId = res.body.data.stops.find((s: { stopOrder: number }) => s.stopOrder === 1).id;
    dropStopId = res.body.data.stops.find((s: { stopOrder: number }) => s.stopOrder === 2).id;
  });

  it('creates student with parentProfile id and assigns to route', async () => {
    const createRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        parentId: parentProfileId,
        firstName: 'Deep',
        lastName: 'Kid',
        grade: '5',
        section: 'A',
      });

    expect(createRes.status).toBe(201);
    studentId = createRes.body.data.id;

    const assignRes = await request(app)
      .post(`/api/v1/students/${studentId}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        routeId,
        pickupStopId,
        dropStopId,
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.data.routeId || assignRes.body.data.route?.id).toBeTruthy();
  });

  it('rejects school get/update for mismatched schoolId', async () => {
    const getRes = await request(app)
      .get(`/api/v1/schools/${otherSchoolId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.error.code).toBe('FORBIDDEN');

    const patchRes = await request(app)
      .patch(`/api/v1/schools/${otherSchoolId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hacked Name' });

    expect(patchRes.status).toBe(403);

    const okRes = await request(app)
      .get(`/api/v1/schools/${schoolId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(okRes.status).toBe(200);
    expect(okRes.body.data.code).toBe(DEEP_SCHOOL_CODE);
  });

  it('enforces role authorization on admin endpoints', async () => {
    const driverParents = await request(app)
      .get('/api/v1/parents')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverParents.status).toBe(403);

    const parentDrivers = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(parentDrivers.status).toBe(403);

    const parentChildren = await request(app)
      .get('/api/v1/parents/me/children')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(parentChildren.status).toBe(200);
    expect(parentChildren.body.data.some((s: { id: string }) => s.id === studentId)).toBe(true);
  });

  it('isolates resources across schools', async () => {
    const buses = await request(app)
      .get('/api/v1/buses')
      .set('Authorization', `Bearer ${otherAdminToken}`);

    expect(buses.status).toBe(200);
    expect(buses.body.data.items.find((b: { id: string }) => b.id === busId)).toBeUndefined();

    const parents = await request(app)
      .get('/api/v1/parents')
      .set('Authorization', `Bearer ${otherAdminToken}`);

    expect(parents.body.data.items.find((p: { email: string }) => p.email === DEEP_PARENT_EMAIL)).toBeUndefined();
  });

  it('runs full trip lifecycle: start → location → emergency → ack → resolve → end', async () => {
    const startRes = await request(app)
      .post('/api/v1/trips/start')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ routeId, busId });

    expect(startRes.status).toBe(201);
    tripId = startRes.body.data.id;
    expect(startRes.body.data.status).toBe('ACTIVE');

    const locRes = await request(app)
      .post(`/api/v1/trips/${tripId}/location`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        latitude: 19.0765,
        longitude: 72.878,
        speed: 22,
        heading: 90,
        accuracy: 10,
      });

    expect(locRes.status).toBe(200);

    const activeAdmin = await request(app)
      .get('/api/v1/monitoring/active-trips')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(activeAdmin.status).toBe(200);
    const live = activeAdmin.body.data.find((t: { tripId: string }) => t.tripId === tripId);
    expect(live).toBeDefined();
    expect(live.location.latitude).toBeCloseTo(19.0765, 3);

    const emergencyRes = await request(app)
      .post(`/api/v1/trips/${tripId}/emergency`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        message: 'Deep test SOS',
        latitude: 19.0765,
        longitude: 72.878,
      });

    expect(emergencyRes.status).toBe(201);
    alertId = emergencyRes.body.data.id;

    const listEmergencies = await request(app)
      .get('/api/v1/emergencies')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listEmergencies.status).toBe(200);
    expect(listEmergencies.body.data.items.some((a: { id: string }) => a.id === alertId)).toBe(true);

    const otherAck = await request(app)
      .patch(`/api/v1/emergencies/${alertId}/acknowledge`)
      .set('Authorization', `Bearer ${otherAdminToken}`);
    expect(otherAck.status).toBe(404);

    const ackRes = await request(app)
      .patch(`/api/v1/emergencies/${alertId}/acknowledge`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.status).toBe('ACKNOWLEDGED');

    const resolveRes = await request(app)
      .patch(`/api/v1/emergencies/${alertId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('RESOLVED');

    const endRes = await request(app)
      .post(`/api/v1/trips/${tripId}/end`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(endRes.status).toBe(200);
    expect(endRes.body.data.status).toBe('COMPLETED');

    const activeAfter = await request(app)
      .get('/api/v1/monitoring/active-trips')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(activeAfter.body.data.find((t: { tripId: string }) => t.tripId === tripId)).toBeUndefined();
  });

  it('rejects invalid student create and duplicate active trip', async () => {
    const badParent = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        parentId: '000000000000000000000000',
        firstName: 'X',
        lastName: 'Y',
      });
    expect([404, 400, 422]).toContain(badParent.status);

    const startAgain = await request(app)
      .post('/api/v1/trips/start')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ routeId, busId });
    expect(startAgain.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/v1/trips/start')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ routeId, busId });
    expect(duplicate.status).toBe(409);

    await request(app)
      .post(`/api/v1/trips/${startAgain.body.data.id}/end`)
      .set('Authorization', `Bearer ${driverToken}`);
  });

  it('supports notification broadcast and mark read for parent', async () => {
    const broadcast = await request(app)
      .post('/api/v1/notifications/broadcast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Deep broadcast',
        body: 'Please note early dismissal',
        target: 'ALL_PARENTS',
      });

    expect(broadcast.status).toBe(201);

    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThan(0);

    const notificationId = list.body.data.items[0].id;
    const mark = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(mark.status).toBe(200);
  });

  it('rejects driver starting trip without assigned bus', async () => {
    await request(app)
      .patch(`/api/v1/buses/${busId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ driverId: null });

    const startRes = await request(app)
      .post('/api/v1/trips/start')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ routeId, busId });

    expect(startRes.status).toBe(422);
    expect(startRes.body.error.code).toBe('BUS_NOT_ASSIGNED');

    // restore for cleanup safety
    await request(app)
      .patch(`/api/v1/buses/${busId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ driverId: driverProfileId });
  });

  it('logs out and rejects reuse of revoked refresh token', async () => {
    const tokens = await login(DEEP_ADMIN_EMAIL, 'Admin@12345');

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({ refreshToken: tokens.refreshToken });

    expect(logout.status).toBe(200);

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(refresh.status).toBe(401);
  });
});
