import { SchoolRepository } from '../../infrastructure/repositories/school.repository';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { AppError, ErrorCodes } from '../../utils/errors';
import { hashPassword } from './auth.service';
import { prisma } from '../../infrastructure/database/prisma';
import { UserRole } from '@prisma/client';

export class SchoolService {
  constructor(
    private readonly schoolRepo = new SchoolRepository(),
    private readonly userRepo = new UserRepository()
  ) {}

  async createSchool(
    data: {
      name: string;
      code: string;
      address: string;
      city: string;
      state: string;
      country: string;
      phone?: string;
      email?: string;
      timezone: string;
    },
    adminData?: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }
  ) {
    const existing = await this.schoolRepo.findByCode(data.code);
    if (existing) {
      throw new AppError(ErrorCodes.DUPLICATE_ENTRY, 'School code already exists', 409);
    }

    const school = await this.schoolRepo.create(data);

    if (adminData) {
      const passwordHash = await hashPassword(adminData.password);
      await this.userRepo.create({
        schoolId: school.id,
        email: adminData.email,
        passwordHash,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        phone: adminData.phone,
        role: UserRole.SCHOOL_ADMIN,
      });
    }

    return school;
  }

  async getSchool(schoolId: string) {
    const school = await this.schoolRepo.findById(schoolId);
    if (!school) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'School not found', 404);
    }
    return school;
  }

  async updateSchool(schoolId: string, data: Record<string, unknown>) {
    await this.getSchool(schoolId);
    return this.schoolRepo.update(schoolId, data);
  }

  async listSchools(page: number, limit: number) {
    return this.schoolRepo.findMany({ page, limit });
  }
}

export class DriverService {
  async createDriver(
    schoolId: string,
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      licenseNumber: string;
      licenseExpiry?: string;
    }
  ) {
    const passwordHash = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        schoolId,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: UserRole.DRIVER,
        driverProfile: {
          create: {
            licenseNumber: data.licenseNumber,
            licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
          },
        },
      },
      include: { driverProfile: true },
    });
  }

  async listDrivers(schoolId: string, page: number, limit: number, filters?: { status?: string; search?: string }) {
    const where = {
      schoolId,
      role: UserRole.DRIVER,
      ...(filters?.status && { status: filters.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' as const } },
          { lastName: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { driverProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const items = await Promise.all(
      users.map(async (user) => {
        const bus = await prisma.bus.findFirst({
          where: { driverId: user.driverProfile?.id },
          select: { id: true, plateNumber: true },
        });
        const { passwordHash: _, ...safe } = user;
        return { ...safe, assignedBus: bus };
      })
    );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getDriver(schoolId: string, driverId: string) {
    const user = await prisma.user.findFirst({
      where: { id: driverId, schoolId, role: UserRole.DRIVER },
      include: {
        driverProfile: true,
      },
    });

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Driver not found', 404);
    }

    const bus = await prisma.bus.findFirst({
      where: { driverId: user.driverProfile?.id },
      select: { id: true, plateNumber: true, model: true },
    });

    const { passwordHash: _, ...safe } = user;
    return { ...safe, assignedBus: bus };
  }

  async updateDriver(schoolId: string, driverId: string, data: Record<string, unknown>) {
    await this.getDriver(schoolId, driverId);

    const { isAvailable, licenseExpiry, ...userData } = data as {
      isAvailable?: boolean;
      licenseExpiry?: string;
      [key: string]: unknown;
    };

    const user = await prisma.user.update({
      where: { id: driverId },
      data: userData,
      include: { driverProfile: true },
    });

    if (user.driverProfile && (isAvailable !== undefined || licenseExpiry)) {
      await prisma.driverProfile.update({
        where: { id: user.driverProfile.id },
        data: {
          ...(isAvailable !== undefined && { isAvailable }),
          ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
        },
      });
    }

    return this.getDriver(schoolId, driverId);
  }

  async deactivateDriver(schoolId: string, driverId: string) {
    const driver = await this.getDriver(schoolId, driverId);

    const activeTrip = await prisma.trip.findFirst({
      where: { driverId: driver.driverProfile!.id, status: 'ACTIVE' },
    });

    if (activeTrip) {
      throw new AppError(ErrorCodes.ACTIVE_TRIP_EXISTS, 'Driver has an active trip', 409);
    }

    await prisma.user.update({
      where: { id: driverId },
      data: { status: 'INACTIVE' },
    });
  }
}

export class ParentService {
  async createParent(
    schoolId: string,
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      address?: string;
    }
  ) {
    const passwordHash = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        schoolId,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: UserRole.PARENT,
        parentProfile: {
          create: { address: data.address },
        },
      },
      include: { parentProfile: true },
    });
  }

  async listParents(schoolId: string, page: number, limit: number, search?: string) {
    const where = {
      schoolId,
      role: UserRole.PARENT,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { parentProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const items = users.map(({ passwordHash: _, ...user }) => user);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getParent(schoolId: string, parentId: string) {
    const user = await prisma.user.findFirst({
      where: { id: parentId, schoolId, role: UserRole.PARENT },
      include: {
        parentProfile: {
          include: {
            students: {
              where: { isActive: true },
              include: {
                assignments: {
                  where: { status: 'ACTIVE' },
                  include: {
                    route: { select: { id: true, name: true } },
                    pickupStop: true,
                    dropStop: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Parent not found', 404);
    }

    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async updateParent(schoolId: string, parentId: string, data: Record<string, unknown>) {
    await this.getParent(schoolId, parentId);

    const { address, ...userData } = data as { address?: string; [key: string]: unknown };

    await prisma.user.update({ where: { id: parentId }, data: userData });

    if (address !== undefined) {
      const parent = await prisma.user.findUnique({
        where: { id: parentId },
        include: { parentProfile: true },
      });
      if (parent?.parentProfile) {
        await prisma.parentProfile.update({
          where: { id: parent.parentProfile.id },
          data: { address },
        });
      }
    }

    return this.getParent(schoolId, parentId);
  }

  async getMyChildren(parentUserId: string) {
    const parent = await prisma.parentProfile.findUnique({
      where: { userId: parentUserId },
      include: {
        students: {
          where: { isActive: true },
          include: {
            assignments: {
              where: { status: 'ACTIVE' },
              include: {
                route: {
                  include: { bus: { select: { id: true, plateNumber: true } } },
                },
                pickupStop: true,
                dropStop: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Parent profile not found', 404);
    }

    const children = await Promise.all(
      parent.students.map(async (student) => {
        const assignment = student.assignments[0];
        let activeTrip = null;

        if (assignment?.routeId) {
          activeTrip = await prisma.trip.findFirst({
            where: { routeId: assignment.routeId, status: 'ACTIVE' },
            select: {
              id: true,
              status: true,
              currentLat: true,
              currentLng: true,
              lastLocationAt: true,
            },
          });
        }

        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          grade: student.grade,
          activeAssignment: assignment
            ? {
                route: { id: assignment.route.id, name: assignment.route.name },
                bus: assignment.route.bus,
                pickupStop: assignment.pickupStop,
                dropStop: assignment.dropStop,
              }
            : null,
          activeTrip,
        };
      })
    );

    return children;
  }
}
