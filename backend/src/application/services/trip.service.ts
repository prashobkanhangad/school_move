import { Server as SocketServer } from 'socket.io';
import { prisma } from '../../infrastructure/database/prisma';
import { AppError, ErrorCodes } from '../../utils/errors';
import { config } from '../../config';
import { haversineDistanceMeters } from '../../utils/crypto';
import { LocationUpdate } from '../../types';
import { NotificationService } from './notification.service';
import { buildPaginatedResult, getSkip } from '../../utils/pagination';

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer): void {
  io = server;
}

export function getSocketServer(): SocketServer | null {
  return io;
}

export class TripService {
  constructor(private readonly notificationService = new NotificationService()) {}

  async startTrip(
    schoolId: string,
    driverUserId: string,
    data: { routeId: string; busId: string }
  ) {
    const driver = await prisma.driverProfile.findFirst({
      where: { userId: driverUserId, user: { schoolId, status: 'ACTIVE' } },
    });

    if (!driver) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Driver profile not found', 404);
    }

    const bus = await prisma.bus.findFirst({
      where: { id: data.busId, schoolId, status: 'ACTIVE', driverId: driver.id },
    });

    if (!bus) {
      throw new AppError(ErrorCodes.BUS_NOT_ASSIGNED, 'Bus not assigned to driver', 422);
    }

    const route = await prisma.route.findFirst({
      where: { id: data.routeId, schoolId, status: 'ACTIVE', busId: data.busId },
    });

    if (!route) {
      throw new AppError(ErrorCodes.ROUTE_MISMATCH, 'Bus not assigned to route', 422);
    }

    const existingTrip = await prisma.trip.findFirst({
      where: {
        OR: [
          { busId: data.busId, status: 'ACTIVE' },
          { driverId: driver.id, status: 'ACTIVE' },
        ],
      },
    });

    if (existingTrip) {
      throw new AppError(ErrorCodes.ACTIVE_TRIP_EXISTS, 'Active trip already exists', 409);
    }

    const trip = await prisma.trip.create({
      data: {
        schoolId,
        routeId: data.routeId,
        busId: data.busId,
        driverId: driver.id,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
      include: {
        route: { select: { id: true, name: true } },
        bus: { select: { id: true, plateNumber: true } },
      },
    });

    this.broadcastTripStatus(trip);
    await this.notificationService.notifyTripStarted(schoolId, data.routeId, trip.id);

    return trip;
  }

  async endTrip(schoolId: string, driverUserId: string, tripId: string, location?: LocationUpdate) {
    const trip = await this.getDriverTrip(schoolId, driverUserId, tripId);

    if (trip.status !== 'ACTIVE') {
      throw new AppError(ErrorCodes.NO_ACTIVE_TRIP, 'Trip is not active', 422);
    }

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        ...(location?.latitude != null &&
          location?.longitude != null && {
            currentLat: location.latitude,
            currentLng: location.longitude,
            lastLocationAt: new Date(),
          }),
      },
      include: {
        route: { select: { id: true, name: true } },
        bus: { select: { id: true, plateNumber: true } },
      },
    });

    this.broadcastTripStatus(updated);
    await this.notificationService.notifyTripEnded(schoolId, trip.routeId, tripId);

    return updated;
  }

  async getActiveTripForDriver(schoolId: string, driverUserId: string) {
    const driver = await prisma.driverProfile.findFirst({
      where: { userId: driverUserId, user: { schoolId } },
    });

    if (!driver) return null;

    return prisma.trip.findFirst({
      where: { driverId: driver.id, status: 'ACTIVE' },
      include: {
        route: { include: { stops: { orderBy: { stopOrder: 'asc' } } } },
        bus: { select: { id: true, plateNumber: true } },
      },
    });
  }

  async getTrip(schoolId: string, tripId: string) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId },
      include: {
        route: { include: { stops: { orderBy: { stopOrder: 'asc' } } } },
        bus: { select: { id: true, plateNumber: true, model: true } },
        driver: { include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } } },
      },
    });

    if (!trip) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Trip not found', 404);
    }
    return trip;
  }

  async listTrips(
    schoolId: string,
    page: number,
    limit: number,
    filters?: { status?: string; routeId?: string; busId?: string; driverId?: string; date?: string }
  ) {
    const where = {
      schoolId,
      ...(filters?.status && { status: filters.status as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' }),
      ...(filters?.routeId && { routeId: filters.routeId }),
      ...(filters?.busId && { busId: filters.busId }),
      ...(filters?.driverId && { driverId: filters.driverId }),
      ...(filters?.date && {
        startedAt: {
          gte: new Date(`${filters.date}T00:00:00.000Z`),
          lt: new Date(`${filters.date}T23:59:59.999Z`),
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        include: {
          route: { select: { id: true, name: true } },
          bus: { select: { id: true, plateNumber: true } },
          driver: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trip.count({ where }),
    ]);

    return buildPaginatedResult(items, total, { page, limit });
  }

  async updateLocation(
    schoolId: string,
    driverUserId: string,
    tripId: string,
    location: LocationUpdate
  ) {
    const trip = await this.getDriverTrip(schoolId, driverUserId, tripId);

    if (trip.status !== 'ACTIVE') {
      throw new AppError(ErrorCodes.NO_ACTIVE_TRIP, 'Trip is not active', 422);
    }

    if (location.accuracy && location.accuracy > config.gps.maxAccuracyMeters) {
      throw new AppError(
        ErrorCodes.POOR_GPS_ACCURACY,
        `GPS accuracy must be within ${config.gps.maxAccuracyMeters}m`,
        422
      );
    }

    const recordedAt = location.recordedAt ?? new Date();

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        currentLat: location.latitude,
        currentLng: location.longitude,
        currentHeading: location.heading,
        currentSpeed: location.speed,
        currentAccuracy: location.accuracy,
        lastLocationAt: recordedAt,
      },
    });

    await prisma.locationLog.create({
      data: {
        tripId,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        recordedAt,
      },
    });

    this.broadcastLocation(updated, trip);
    await this.processGeofence(trip, location);

    return {
      tripId: updated.id,
      latitude: updated.currentLat,
      longitude: updated.currentLng,
      lastLocationAt: updated.lastLocationAt,
    };
  }

  async getLocationHistory(schoolId: string, tripId: string, limit = 100) {
    await this.getTrip(schoolId, tripId);

    return prisma.locationLog.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  private async getDriverTrip(schoolId: string, driverUserId: string, tripId: string) {
    const driver = await prisma.driverProfile.findFirst({
      where: { userId: driverUserId, user: { schoolId } },
    });

    if (!driver) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Driver not found', 404);
    }

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId, driverId: driver.id },
    });

    if (!trip) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Trip not found', 404);
    }

    return trip;
  }

  private broadcastLocation(
    trip: { id: string; schoolId: string; routeId: string; busId: string; currentLat: number | null; currentLng: number | null; currentHeading: number | null; currentSpeed: number | null; lastLocationAt: Date | null },
    _originalTrip: { id: string }
  ) {
    if (!io || trip.currentLat === null || trip.currentLng === null) return;

    const payload = {
      tripId: trip.id,
      busId: trip.busId,
      routeId: trip.routeId,
      latitude: trip.currentLat,
      longitude: trip.currentLng,
      heading: trip.currentHeading,
      speed: trip.currentSpeed,
      recordedAt: trip.lastLocationAt,
    };

    io.to(`trip:${trip.id}`).emit('bus:location', payload);
    io.to(`school:${trip.schoolId}`).emit('bus:location', payload);
  }

  private broadcastTripStatus(trip: {
    id: string;
    schoolId: string;
    routeId: string;
    busId: string;
    driverId: string;
    status: string;
    startedAt: Date | null;
    endedAt: Date | null;
  }) {
    if (!io) return;

    const payload = {
      tripId: trip.id,
      status: trip.status,
      routeId: trip.routeId,
      busId: trip.busId,
      driverId: trip.driverId,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
    };

    io.to(`trip:${trip.id}`).emit('trip:status', payload);
    io.to(`school:${trip.schoolId}`).emit('trip:status', payload);
  }

  private async processGeofence(
    trip: { id: string; schoolId: string; routeId: string },
    location: LocationUpdate
  ) {
    const assignments = await prisma.studentRouteAssignment.findMany({
      where: { routeId: trip.routeId, status: 'ACTIVE' },
      include: {
        student: { include: { parent: { include: { user: true } } } },
        pickupStop: true,
        dropStop: true,
      },
    });

    for (const assignment of assignments) {
      await this.checkStopProximity(trip, assignment, assignment.pickupStop, 'PICKUP', location);
      await this.checkStopProximity(trip, assignment, assignment.dropStop, 'DROP', location);
    }
  }

  private async checkStopProximity(
    trip: { id: string; schoolId: string },
    assignment: { studentId: string; student: { parent: { user: { id: string } } } },
    stop: { id: string; name: string; latitude: number; longitude: number; radiusM: number },
    type: 'PICKUP' | 'DROP',
    location: LocationUpdate
  ) {
    const distance = haversineDistanceMeters(
      location.latitude,
      location.longitude,
      stop.latitude,
      stop.longitude
    );

    const approachingType = type === 'PICKUP' ? 'APPROACHING_PICKUP' : 'APPROACHING_DROP';
    const arrivedType = type === 'PICKUP' ? 'ARRIVED_PICKUP' : 'ARRIVED_DROP';

    if (distance <= config.gps.approachingMeters) {
      await this.recordStopEventIfNew(trip.id, stop.id, approachingType, location, async () => {
        await this.notificationService.notifyApproaching(
          trip.schoolId,
          assignment.student.parent.user.id,
          type,
          stop.name,
          trip.id,
          assignment.studentId,
          stop.id
        );
      });
    }

    if (distance <= stop.radiusM) {
      await this.recordStopEventIfNew(trip.id, stop.id, arrivedType, location, async () => {
        await this.notificationService.notifyArrived(
          trip.schoolId,
          assignment.student.parent.user.id,
          type,
          stop.name,
          trip.id,
          assignment.studentId,
          stop.id
        );
      });
    }
  }

  private async recordStopEventIfNew(
    tripId: string,
    stopId: string,
    eventType: string,
    location: LocationUpdate,
    callback: () => Promise<void>
  ) {
    const existing = await prisma.tripStopEvent.findFirst({
      where: { tripId, stopId, eventType },
    });

    if (existing) return;

    await prisma.tripStopEvent.create({
      data: {
        tripId,
        stopId,
        eventType,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });

    await callback();
  }
}
