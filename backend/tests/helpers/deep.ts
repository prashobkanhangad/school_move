import { prisma } from '../../src/infrastructure/database/prisma';

export const DEEP_SCHOOL_CODE = 'DEEPTEST001';
export const DEEP_OTHER_SCHOOL_CODE = 'DEEPTEST002';
export const DEEP_ADMIN_EMAIL = 'deep-admin@school.com';
export const DEEP_OTHER_ADMIN_EMAIL = 'deep-other-admin@school.com';
export const DEEP_DRIVER_EMAIL = 'deep-driver@school.com';
export const DEEP_PARENT_EMAIL = 'deep-parent@school.com';

const DEEP_CODES = [DEEP_SCHOOL_CODE, DEEP_OTHER_SCHOOL_CODE];

export async function cleanupDeepTestData(): Promise<void> {
  const schools = await prisma.school.findMany({
    where: { code: { in: DEEP_CODES } },
    select: { id: true },
  });

  if (schools.length === 0) return;

  const schoolIds = schools.map((s) => s.id);

  const trips = await prisma.trip.findMany({
    where: { schoolId: { in: schoolIds } },
    select: { id: true },
  });
  const tripIds = trips.map((t) => t.id);

  if (tripIds.length > 0) {
    await prisma.emergencyAlert.deleteMany({ where: { tripId: { in: tripIds } } });
    await prisma.locationLog.deleteMany({ where: { tripId: { in: tripIds } } });
    await prisma.tripStopEvent.deleteMany({ where: { tripId: { in: tripIds } } });
    await prisma.trip.deleteMany({ where: { id: { in: tripIds } } });
  }

  await prisma.notification.deleteMany({ where: { schoolId: { in: schoolIds } } });

  const students = await prisma.student.findMany({
    where: { schoolId: { in: schoolIds } },
    select: { id: true },
  });
  const studentIds = students.map((s) => s.id);

  if (studentIds.length > 0) {
    await prisma.studentRouteAssignment.deleteMany({
      where: { studentId: { in: studentIds } },
    });
    await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
  }

  const routes = await prisma.route.findMany({
    where: { schoolId: { in: schoolIds } },
    select: { id: true },
  });
  const routeIds = routes.map((r) => r.id);

  if (routeIds.length > 0) {
    await prisma.routeStop.deleteMany({ where: { routeId: { in: routeIds } } });
    await prisma.route.deleteMany({ where: { id: { in: routeIds } } });
  }

  await prisma.bus.deleteMany({ where: { schoolId: { in: schoolIds } } });

  const users = await prisma.user.findMany({
    where: { schoolId: { in: schoolIds } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  if (userIds.length > 0) {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.deviceToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.driverProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.parentProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
}
