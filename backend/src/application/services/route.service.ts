import { prisma } from '../../infrastructure/database/prisma';
import { AppError, ErrorCodes } from '../../utils/errors';
import { buildPaginatedResult, getSkip } from '../../utils/pagination';

interface StopInput {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  stopType: 'PICKUP' | 'DROP' | 'BOTH';
  radiusM: number;
}

export class RouteService {
  async createRoute(
    schoolId: string,
    data: {
      name: string;
      description?: string;
      busId?: string;
      startTime?: string;
      stops: StopInput[];
    }
  ) {
    if (data.busId) {
      await this.validateBus(schoolId, data.busId);
    }

    return prisma.route.create({
      data: {
        schoolId,
        name: data.name,
        description: data.description,
        busId: data.busId,
        startTime: data.startTime,
        stops: { create: data.stops },
      },
      include: { stops: { orderBy: { stopOrder: 'asc' } }, bus: true },
    });
  }

  async listRoutes(schoolId: string, page: number, limit: number, filters?: { status?: string; busId?: string; search?: string }) {
    const where = {
      schoolId,
      ...(filters?.status && { status: filters.status as 'ACTIVE' | 'INACTIVE' }),
      ...(filters?.busId && { busId: filters.busId }),
      ...(filters?.search && { name: { contains: filters.search, mode: 'insensitive' as const } }),
    };

    const [items, total] = await Promise.all([
      prisma.route.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        include: {
          bus: { select: { id: true, plateNumber: true } },
          _count: { select: { assignments: { where: { status: 'ACTIVE' } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.route.count({ where }),
    ]);

    const mapped = items.map((route) => ({
      ...route,
      studentCount: route._count.assignments,
      _count: undefined,
    }));

    return buildPaginatedResult(mapped, total, { page, limit });
  }

  async getRoute(schoolId: string, routeId: string) {
    const route = await prisma.route.findFirst({
      where: { id: routeId, schoolId },
      include: {
        bus: { select: { id: true, plateNumber: true, model: true } },
        stops: { orderBy: { stopOrder: 'asc' } },
        _count: { select: { assignments: { where: { status: 'ACTIVE' } } } },
      },
    });

    if (!route) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Route not found', 404);
    }

    return { ...route, studentCount: route._count.assignments, _count: undefined };
  }

  async updateRoute(schoolId: string, routeId: string, data: Record<string, unknown>) {
    await this.getRoute(schoolId, routeId);

    if (data.busId) {
      await this.validateBus(schoolId, data.busId as string);
    }

    return prisma.route.update({
      where: { id: routeId },
      data,
      include: { stops: { orderBy: { stopOrder: 'asc' } }, bus: true },
    });
  }

  async deactivateRoute(schoolId: string, routeId: string) {
    await this.getRoute(schoolId, routeId);

    const activeTrip = await prisma.trip.findFirst({
      where: { routeId, status: 'ACTIVE' },
    });

    if (activeTrip) {
      throw new AppError(ErrorCodes.ACTIVE_TRIP_EXISTS, 'Route has an active trip', 409);
    }

    await prisma.route.update({
      where: { id: routeId },
      data: { status: 'INACTIVE' },
    });
  }

  async addStop(schoolId: string, routeId: string, data: StopInput) {
    await this.getRoute(schoolId, routeId);
    return prisma.routeStop.create({ data: { routeId, ...data } });
  }

  async updateStop(schoolId: string, routeId: string, stopId: string, data: Partial<StopInput>) {
    const stop = await prisma.routeStop.findFirst({ where: { id: stopId, routeId } });
    if (!stop) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Stop not found', 404);
    }
    await this.getRoute(schoolId, routeId);
    return prisma.routeStop.update({ where: { id: stopId }, data });
  }

  async deleteStop(schoolId: string, routeId: string, stopId: string) {
    await this.getRoute(schoolId, routeId);

    const assignment = await prisma.studentRouteAssignment.findFirst({
      where: {
        routeId,
        status: 'ACTIVE',
        OR: [{ pickupStopId: stopId }, { dropStopId: stopId }],
      },
    });

    if (assignment) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Cannot delete stop with active student assignments',
        422
      );
    }

    await prisma.routeStop.delete({ where: { id: stopId } });
  }

  async reorderStops(
    schoolId: string,
    routeId: string,
    stopOrders: Array<{ stopId: string; stopOrder: number }>
  ) {
    await this.getRoute(schoolId, routeId);

    await prisma.$transaction(
      stopOrders.map(({ stopId, stopOrder }) =>
        prisma.routeStop.update({ where: { id: stopId }, data: { stopOrder } })
      )
    );

    return prisma.routeStop.findMany({
      where: { routeId },
      orderBy: { stopOrder: 'asc' },
    });
  }

  private async validateBus(schoolId: string, busId: string) {
    const bus = await prisma.bus.findFirst({
      where: { id: busId, schoolId, status: 'ACTIVE' },
    });
    if (!bus) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Bus not found', 404);
    }
  }
}
