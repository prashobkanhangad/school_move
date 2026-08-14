import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureSuperAdmin() {
  const email = 'superadmin@platform.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== UserRole.SUPER_ADMIN || existing.schoolId !== null) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.SUPER_ADMIN, schoolId: null },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('Super@12345', 12),
      firstName: 'Platform',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      schoolId: null,
    },
  });
}

async function main() {
  const superAdmin = await ensureSuperAdmin();
  console.log('Super admin ready:', superAdmin.email);

  const existingSchool = await prisma.school.findUnique({ where: { code: 'DEMO001' } });
  if (existingSchool) {
    console.log('Demo school seed already exists. Skipping demo data.');
    return;
  }

  const school = await prisma.school.create({
    data: {
      name: 'Green Valley School',
      code: 'DEMO001',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'IN',
      phone: '+911234567890',
      email: 'admin@greenvalley.edu',
    },
  });

  const passwordHash = await bcrypt.hash('Admin@12345', 12);

  const admin = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'admin@greenvalley.edu',
      passwordHash,
      firstName: 'School',
      lastName: 'Admin',
      role: UserRole.SCHOOL_ADMIN,
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'driver@greenvalley.edu',
      passwordHash: await bcrypt.hash('Driver@12345', 12),
      firstName: 'Raj',
      lastName: 'Kumar',
      phone: '+919876543210',
      role: UserRole.DRIVER,
      driverProfile: {
        create: { licenseNumber: 'MH-12-2020-1234567' },
      },
    },
    include: { driverProfile: true },
  });

  const parentUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'parent@email.com',
      passwordHash: await bcrypt.hash('Parent@12345', 12),
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+919999999999',
      role: UserRole.PARENT,
      parentProfile: { create: { address: '45 Park Avenue, Mumbai' } },
    },
    include: { parentProfile: true },
  });

  const bus = await prisma.bus.create({
    data: {
      schoolId: school.id,
      plateNumber: 'MH-01-AB-1234',
      model: 'Tata Starbus',
      capacity: 40,
      driverId: driverUser.driverProfile!.id,
    },
  });

  const route = await prisma.route.create({
    data: {
      schoolId: school.id,
      busId: bus.id,
      name: 'Route A - North Zone',
      description: 'Andheri to Bandra',
      startTime: '07:30',
      stops: {
        create: [
          {
            name: 'Andheri Station',
            address: 'Andheri West, Mumbai',
            latitude: 19.1197,
            longitude: 72.8468,
            stopOrder: 1,
            stopType: 'PICKUP',
            radiusM: 100,
          },
          {
            name: 'Bandra West',
            address: 'Bandra West, Mumbai',
            latitude: 19.0596,
            longitude: 72.8295,
            stopOrder: 2,
            stopType: 'DROP',
            radiusM: 100,
          },
        ],
      },
    },
    include: { stops: true },
  });

  const student = await prisma.student.create({
    data: {
      schoolId: school.id,
      parentId: parentUser.parentProfile!.id,
      firstName: 'Aarav',
      lastName: 'Sharma',
      grade: '5',
      section: 'A',
    },
  });

  await prisma.studentRouteAssignment.create({
    data: {
      studentId: student.id,
      routeId: route.id,
      pickupStopId: route.stops[0].id,
      dropStopId: route.stops[1].id,
    },
  });

  console.log('Seed completed successfully');
  console.log({
    schoolId: school.id,
    adminEmail: admin.email,
    driverEmail: driverUser.email,
    parentEmail: parentUser.email,
    superAdminEmail: 'superadmin@platform.com',
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
