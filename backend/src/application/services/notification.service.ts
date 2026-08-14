import { NotificationType, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import { AppError, ErrorCodes } from '../../utils/errors';
import { buildPaginatedResult, getSkip } from '../../utils/pagination';
import { getSocketServer } from './trip.service';

export class NotificationService {
  async notifyTripStarted(schoolId: string, routeId: string, tripId: string) {
    const parentUserIds = await this.getParentUserIdsForRoute(routeId);
    await this.sendToUsers(schoolId, parentUserIds, {
      type: NotificationType.TRIP_STARTED,
      title: 'Trip Started',
      body: 'The school bus has started its route.',
      data: { tripId, routeId },
    });
  }

  async notifyTripEnded(schoolId: string, routeId: string, tripId: string) {
    const parentUserIds = await this.getParentUserIdsForRoute(routeId);
    await this.sendToUsers(schoolId, parentUserIds, {
      type: NotificationType.TRIP_ENDED,
      title: 'Trip Completed',
      body: 'The school bus has completed its route.',
      data: { tripId, routeId },
    });
  }

  async notifyApproaching(
    schoolId: string,
    userId: string,
    type: 'PICKUP' | 'DROP',
    stopName: string,
    tripId: string,
    studentId: string,
    stopId: string
  ) {
    const notifType =
      type === 'PICKUP' ? NotificationType.PICKUP_APPROACHING : NotificationType.DROP_APPROACHING;

    await this.sendToUsers(schoolId, [userId], {
      type: notifType,
      title: 'Bus Approaching',
      body: `Bus is approaching ${stopName}.`,
      data: { tripId, studentId, stopId },
    });
  }

  async notifyArrived(
    schoolId: string,
    userId: string,
    type: 'PICKUP' | 'DROP',
    stopName: string,
    tripId: string,
    studentId: string,
    stopId: string
  ) {
    const notifType =
      type === 'PICKUP' ? NotificationType.PICKUP_COMPLETED : NotificationType.DROP_COMPLETED;

    await this.sendToUsers(schoolId, [userId], {
      type: notifType,
      title: type === 'PICKUP' ? 'Pickup Completed' : 'Drop Completed',
      body: `Bus has arrived at ${stopName}.`,
      data: { tripId, studentId, stopId },
    });
  }

  async notifyEmergency(
    schoolId: string,
    tripId: string,
    routeId: string,
    alertId: string,
    message?: string
  ) {
    const parentUserIds = await this.getParentUserIdsForRoute(routeId);
    const admins = await prisma.user.findMany({
      where: { schoolId, role: UserRole.SCHOOL_ADMIN, status: 'ACTIVE' },
      select: { id: true },
    });

    const userIds = [...new Set([...parentUserIds, ...admins.map((a) => a.id)])];

    await this.sendToUsers(schoolId, userIds, {
      type: NotificationType.EMERGENCY,
      title: 'Emergency Alert',
      body: message ?? 'An emergency has been reported on the school bus.',
      data: { tripId, alertId },
    });
  }

  async listNotifications(userId: string, page: number, limit: number, filters?: { type?: string; status?: string }) {
    const where = {
      userId,
      ...(filters?.type && { type: filters.type as NotificationType }),
      ...(filters?.status && { status: filters.status as 'SENT' | 'READ' | 'PENDING' | 'FAILED' }),
    };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(items, total, { page, limit });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Notification not found', 404);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, status: { in: ['SENT', 'PENDING'] } },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async broadcast(
    schoolId: string,
    data: {
      title: string;
      body: string;
      target: 'ALL_PARENTS' | 'ALL_DRIVERS' | 'ROUTE' | 'CUSTOM';
      routeId?: string;
      userIds?: string[];
      data?: Record<string, unknown>;
    }
  ) {
    let userIds: string[] = [];

    switch (data.target) {
      case 'ALL_PARENTS':
        userIds = (
          await prisma.user.findMany({
            where: { schoolId, role: UserRole.PARENT, status: 'ACTIVE' },
            select: { id: true },
          })
        ).map((u) => u.id);
        break;
      case 'ALL_DRIVERS':
        userIds = (
          await prisma.user.findMany({
            where: { schoolId, role: UserRole.DRIVER, status: 'ACTIVE' },
            select: { id: true },
          })
        ).map((u) => u.id);
        break;
      case 'ROUTE':
        if (!data.routeId) {
          throw new AppError(ErrorCodes.VALIDATION_ERROR, 'routeId is required for ROUTE target', 400);
        }
        userIds = await this.getParentUserIdsForRoute(data.routeId);
        break;
      case 'CUSTOM':
        if (!data.userIds?.length) {
          throw new AppError(ErrorCodes.VALIDATION_ERROR, 'userIds required for CUSTOM target', 400);
        }
        userIds = data.userIds;
        break;
    }

    return this.sendToUsers(schoolId, userIds, {
      type: NotificationType.GENERAL,
      title: data.title,
      body: data.body,
      data: data.data ?? {},
    });
  }

  private async sendToUsers(
    schoolId: string,
    userIds: string[],
    payload: {
      type: NotificationType;
      title: string;
      body: string;
      data: Record<string, unknown>;
    }
  ) {
    if (!userIds.length) return { sentCount: 0, failedCount: 0 };

    const notifications = await Promise.all(
      userIds.map((userId) =>
        prisma.notification.create({
          data: {
            schoolId,
            userId,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            data: payload.data as Prisma.InputJsonValue,
            status: 'SENT',
            sentAt: new Date(),
          },
        })
      )
    );

    const io = getSocketServer();
    if (io) {
      for (const notification of notifications) {
        io.to(`parent:${notification.userId}`).emit('notification:event', notification);
        io.to(`driver:${notification.userId}`).emit('notification:event', notification);
      }
    }

    // FCM integration point: send push via Firebase when credentials are configured
    return { sentCount: notifications.length, failedCount: 0 };
  }

  private async getParentUserIdsForRoute(routeId: string): Promise<string[]> {
    const assignments = await prisma.studentRouteAssignment.findMany({
      where: { routeId, status: 'ACTIVE' },
      include: { student: { include: { parent: { include: { user: true } } } } },
    });

    return [...new Set(assignments.map((a) => a.student.parent.user.id))];
  }
}

export class EmergencyService {
  constructor(private readonly notificationService = new NotificationService()) {}

  async triggerEmergency(
    schoolId: string,
    driverUserId: string,
    tripId: string,
    data: { message?: string; latitude: number; longitude: number }
  ) {
    const driver = await prisma.driverProfile.findFirst({
      where: { userId: driverUserId, user: { schoolId } },
    });

    if (!driver) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Driver not found', 404);
    }

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId, driverId: driver.id, status: 'ACTIVE' },
      include: { bus: true, driver: { include: { user: true } } },
    });

    if (!trip) {
      throw new AppError(ErrorCodes.NO_ACTIVE_TRIP, 'No active trip found', 422);
    }

    const alert = await prisma.emergencyAlert.create({
      data: {
        tripId,
        message: data.message,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });

    await this.notificationService.notifyEmergency(schoolId, tripId, trip.routeId, alert.id, data.message);

    const io = getSocketServer();
    if (io) {
      const payload = {
        alertId: alert.id,
        tripId: trip.id,
        status: alert.status,
        message: alert.message,
        latitude: alert.latitude,
        longitude: alert.longitude,
        driver: {
          firstName: trip.driver.user.firstName,
          lastName: trip.driver.user.lastName,
        },
        bus: { plateNumber: trip.bus.plateNumber },
        createdAt: alert.createdAt,
      };

      io.to(`school:${schoolId}`).emit('emergency:alert', payload);
      io.to(`trip:${tripId}`).emit('emergency:alert', payload);
    }

    return alert;
  }

  async listEmergencies(schoolId: string, page: number, limit: number, filters?: { status?: string; tripId?: string }) {
    const trips = await prisma.trip.findMany({
      where: { schoolId },
      select: { id: true },
    });
    const tripIds = trips.map((t) => t.id);

    const where = {
      tripId: { in: tripIds },
      ...(filters?.status && { status: filters.status as 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' }),
      ...(filters?.tripId && { tripId: filters.tripId }),
    };

    const [items, total] = await Promise.all([
      prisma.emergencyAlert.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        include: {
          trip: {
            include: {
              bus: { select: { plateNumber: true } },
              driver: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.emergencyAlert.count({ where }),
    ]);

    return buildPaginatedResult(items, total, { page, limit });
  }

  async acknowledge(schoolId: string, alertId: string, adminUserId: string) {
    const alert = await this.getAlert(schoolId, alertId);

    const updated = await prisma.emergencyAlert.update({
      where: { id: alert.id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedById: adminUserId,
        acknowledgedAt: new Date(),
      },
    });

    this.broadcastStatus(schoolId, updated);
    return updated;
  }

  async resolve(schoolId: string, alertId: string) {
    const alert = await this.getAlert(schoolId, alertId);

    const updated = await prisma.emergencyAlert.update({
      where: { id: alert.id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });

    this.broadcastStatus(schoolId, updated);
    return updated;
  }

  private async getAlert(schoolId: string, alertId: string) {
    const alert = await prisma.emergencyAlert.findFirst({
      where: { id: alertId },
      include: { trip: true },
    });

    if (!alert || alert.trip.schoolId !== schoolId) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Emergency alert not found', 404);
    }

    return alert;
  }

  private broadcastStatus(
    schoolId: string,
    alert: { id: string; status: string; acknowledgedAt: Date | null; resolvedAt: Date | null }
  ) {
    const io = getSocketServer();
    if (!io) return;

    const payload = {
      alertId: alert.id,
      status: alert.status,
      acknowledgedAt: alert.acknowledgedAt,
      resolvedAt: alert.resolvedAt,
    };

    io.to(`school:${schoolId}`).emit('emergency:status', payload);
  }
}

export class MonitoringService {
  async getActiveTrips(schoolId: string) {
    const trips = await prisma.trip.findMany({
      where: { schoolId, status: 'ACTIVE' },
      include: {
        bus: { select: { id: true, plateNumber: true } },
        driver: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        route: { select: { id: true, name: true } },
        _count: { select: { emergencyAlerts: { where: { status: 'ACTIVE' } } } },
      },
    });

    const enriched = await Promise.all(
      trips.map(async (trip) => {
        const studentCount = await prisma.studentRouteAssignment.count({
          where: { routeId: trip.routeId, status: 'ACTIVE' },
        });

        return {
          tripId: trip.id,
          status: trip.status,
          startedAt: trip.startedAt,
          bus: trip.bus,
          driver: {
            id: trip.driver.user.id,
            firstName: trip.driver.user.firstName,
            lastName: trip.driver.user.lastName,
          },
          route: trip.route,
          location: {
            latitude: trip.currentLat,
            longitude: trip.currentLng,
            heading: trip.currentHeading,
            speed: trip.currentSpeed,
            lastLocationAt: trip.lastLocationAt,
          },
          studentCount,
          activeEmergencies: trip._count.emergencyAlerts,
        };
      })
    );

    return enriched;
  }

  async getStats(schoolId: string) {
    const [totalBuses, activeBuses, totalRoutes, totalStudents, totalDrivers, activeTrips, activeEmergencies] =
      await Promise.all([
        prisma.bus.count({ where: { schoolId } }),
        prisma.bus.count({ where: { schoolId, status: 'ACTIVE' } }),
        prisma.route.count({ where: { schoolId, status: 'ACTIVE' } }),
        prisma.student.count({ where: { schoolId, isActive: true } }),
        prisma.user.count({ where: { schoolId, role: UserRole.DRIVER, status: 'ACTIVE' } }),
        prisma.trip.count({ where: { schoolId, status: 'ACTIVE' } }),
        prisma.emergencyAlert.count({
          where: { status: 'ACTIVE', trip: { schoolId } },
        }),
      ]);

    return { totalBuses, activeBuses, totalRoutes, totalStudents, totalDrivers, activeTrips, activeEmergencies };
  }
}

export class EtaService {
  async getEta(
    schoolId: string,
    tripId: string,
    options?: { stopId?: string; studentId?: string; parentUserId?: string }
  ) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, schoolId, status: 'ACTIVE' },
    });

    if (!trip || trip.currentLat === null || trip.currentLng === null) {
      throw new AppError(ErrorCodes.NO_ACTIVE_TRIP, 'No active trip with location', 422);
    }

    let stop;

    if (options?.stopId) {
      stop = await prisma.routeStop.findFirst({
        where: { id: options.stopId, routeId: trip.routeId },
      });
    } else if (options?.studentId) {
      const assignment = await prisma.studentRouteAssignment.findFirst({
        where: { studentId: options.studentId, routeId: trip.routeId, status: 'ACTIVE' },
        include: { pickupStop: true },
      });
      stop = assignment?.pickupStop;
    } else if (options?.parentUserId) {
      const parent = await prisma.parentProfile.findUnique({
        where: { userId: options.parentUserId },
        include: {
          students: {
            include: {
              assignments: {
                where: { routeId: trip.routeId, status: 'ACTIVE' },
                include: { pickupStop: true },
              },
            },
          },
        },
      });
      stop = parent?.students[0]?.assignments[0]?.pickupStop;
    }

    if (!stop) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Stop not found', 404);
    }

    const distanceMeters = this.haversine(
      trip.currentLat,
      trip.currentLng,
      stop.latitude,
      stop.longitude
    );

    const avgSpeedMps = trip.currentSpeed && trip.currentSpeed > 0 ? trip.currentSpeed / 3.6 : 8.33;
    const durationSeconds = Math.round(distanceMeters / avgSpeedMps);
    const estimatedArrival = new Date(Date.now() + durationSeconds * 1000);

    return {
      tripId: trip.id,
      stop: { id: stop.id, name: stop.name, latitude: stop.latitude, longitude: stop.longitude },
      currentLocation: {
        latitude: trip.currentLat,
        longitude: trip.currentLng,
        lastLocationAt: trip.lastLocationAt,
      },
      eta: {
        durationSeconds,
        durationText: `${Math.ceil(durationSeconds / 60)} mins`,
        distanceMeters: Math.round(distanceMeters),
        distanceText: `${(distanceMeters / 1000).toFixed(1)} km`,
        estimatedArrival,
      },
    };
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
