import { prisma } from '../../infrastructure/database/prisma';
import { AppError, ErrorCodes } from '../../utils/errors';
import { buildPaginatedResult, getSkip } from '../../utils/pagination';

export class BusService {
  async createBus(
    schoolId: string,
    data: { plateNumber: string; model?: string; capacity: number; driverId?: string }
  ) {
    if (data.driverId) {
      await this.validateDriver(schoolId, data.driverId);
      const existingBus = await prisma.bus.findFirst({ where: { driverId: data.driverId } });
      if (existingBus) {
        throw new AppError(ErrorCodes.DUPLICATE_ENTRY, 'Driver already assigned to a bus', 409);
      }
    }

    return prisma.bus.create({
      data: {
        schoolId,
        plateNumber: data.plateNumber,
        model: data.model,
        capacity: data.capacity,
        driverId: data.driverId,
      },
      include: {
        driver: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
  }

  async listBuses(schoolId: string, page: number, limit: number, filters?: { status?: string; search?: string }) {
    const where = {
      schoolId,
      ...(filters?.status && { status: filters.status as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' }),
      ...(filters?.search && {
        OR: [
          { plateNumber: { contains: filters.search, mode: 'insensitive' as const } },
          { model: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.bus.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        include: {
          driver: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bus.count({ where }),
    ]);

    return buildPaginatedResult(items, total, { page, limit });
  }

  async getBus(schoolId: string, busId: string) {
    const bus = await prisma.bus.findFirst({
      where: { id: busId, schoolId },
      include: {
        driver: {
          include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } },
        },
        routes: { where: { status: 'ACTIVE' }, select: { id: true, name: true } },
      },
    });

    if (!bus) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Bus not found', 404);
    }
    return bus;
  }

  async updateBus(schoolId: string, busId: string, data: Record<string, unknown>) {
    await this.getBus(schoolId, busId);

    if (data.driverId) {
      await this.validateDriver(schoolId, data.driverId as string);
      const existingBus = await prisma.bus.findFirst({
        where: { driverId: data.driverId as string, id: { not: busId } },
      });
      if (existingBus) {
        throw new AppError(ErrorCodes.DUPLICATE_ENTRY, 'Driver already assigned to a bus', 409);
      }
    }

    return prisma.bus.update({
      where: { id: busId },
      data,
      include: {
        driver: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
  }

  async deactivateBus(schoolId: string, busId: string) {
    await this.getBus(schoolId, busId);

    const activeTrip = await prisma.trip.findFirst({
      where: { busId, status: 'ACTIVE' },
    });

    if (activeTrip) {
      throw new AppError(ErrorCodes.ACTIVE_TRIP_EXISTS, 'Bus has an active trip', 409);
    }

    await prisma.bus.update({
      where: { id: busId },
      data: { status: 'INACTIVE', driverId: null },
    });
  }

  private async validateDriver(schoolId: string, driverProfileId: string) {
    const driver = await prisma.driverProfile.findFirst({
      where: { id: driverProfileId, user: { schoolId, role: 'DRIVER', status: 'ACTIVE' } },
    });
    if (!driver) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Driver not found', 404);
    }
  }
}
