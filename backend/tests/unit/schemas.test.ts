import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  startTripSchema,
  locationUpdateSchema,
  assignStudentSchema,
  updateBusSchema,
  createStudentSchema,
  emergencySchema,
  createSchoolSchema,
} from '../../src/presentation/validators/schemas';

describe('Zod schemas', () => {
  it('loginSchema accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'admin@school.com',
      password: 'SecurePass123',
    });
    expect(result.success).toBe(true);
  });

  it('loginSchema rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'SecurePass123',
    });
    expect(result.success).toBe(false);
  });

  it('loginSchema rejects short password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@school.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('startTripSchema requires routeId and busId', () => {
    expect(startTripSchema.safeParse({}).success).toBe(false);
    expect(
      startTripSchema.safeParse({
        routeId: '665f1a2b3c4d5e6f7a8b9c01',
        busId: '665f1a2b3c4d5e6f7a8b9c02',
      }).success
    ).toBe(true);
  });

  it('locationUpdateSchema validates coordinates', () => {
    expect(
      locationUpdateSchema.safeParse({ latitude: 95, longitude: 0 }).success
    ).toBe(false);
    expect(
      locationUpdateSchema.safeParse({ latitude: 19.1, longitude: 72.8 }).success
    ).toBe(true);
  });

  it('assignStudentSchema requires stop ids', () => {
    expect(
      assignStudentSchema.safeParse({
        routeId: 'r1',
        pickupStopId: 's1',
        dropStopId: 's2',
      }).success
    ).toBe(true);
  });

  it('updateBusSchema allows null driverId for unassign', () => {
    expect(updateBusSchema.safeParse({ driverId: null }).success).toBe(true);
    expect(updateBusSchema.safeParse({ driverId: '665f1a2b3c4d5e6f7a8b9c01' }).success).toBe(true);
  });

  it('createStudentSchema requires parentId and names', () => {
    expect(createStudentSchema.safeParse({ firstName: 'A', lastName: 'B' }).success).toBe(false);
    expect(
      createStudentSchema.safeParse({
        parentId: '665f1a2b3c4d5e6f7a8b9c01',
        firstName: 'A',
        lastName: 'B',
      }).success
    ).toBe(true);
  });

  it('emergencySchema validates coordinates', () => {
    expect(emergencySchema.safeParse({ latitude: 19.1, longitude: 72.8 }).success).toBe(true);
    expect(emergencySchema.safeParse({ latitude: 200, longitude: 72.8 }).success).toBe(false);
  });

  it('createSchoolSchema accepts nested admin payload', () => {
    expect(
      createSchoolSchema.safeParse({
        name: 'Test School',
        code: 'TS001',
        address: '123 Street',
        city: 'Mumbai',
        state: 'MH',
        admin: {
          email: 'admin@test.com',
          password: 'Admin@12345',
          firstName: 'A',
          lastName: 'B',
        },
      }).success
    ).toBe(true);
  });

  it('createSchoolSchema rejects short admin password', () => {
    expect(
      createSchoolSchema.safeParse({
        name: 'Test School',
        code: 'TS001',
        address: '123 Street',
        city: 'Mumbai',
        state: 'MH',
        admin: {
          email: 'admin@test.com',
          password: 'short',
          firstName: 'A',
          lastName: 'B',
        },
      }).success
    ).toBe(false);
  });
});
