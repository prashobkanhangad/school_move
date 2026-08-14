import { Request, Response, NextFunction } from 'express';
import { SchoolService, DriverService, ParentService } from '../../application/services/school.service';
import { BusService } from '../../application/services/bus.service';
import { RouteService } from '../../application/services/route.service';
import { StudentService } from '../../application/services/student.service';
import { TripService } from '../../application/services/trip.service';
import {
  EmergencyService,
  EtaService,
  MonitoringService,
  NotificationService,
} from '../../application/services/notification.service';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { parsePagination } from '../../utils/pagination';
import { AppError, ErrorCodes } from '../../utils/errors';
import { param } from '../../utils/request';
import { assertCanAccessSchool, resolveSchoolId } from '../middlewares/school-context';
import { prisma } from '../../infrastructure/database/prisma';
import { UserRole } from '@prisma/client';

const schoolService = new SchoolService();
const driverService = new DriverService();
const parentService = new ParentService();
const busService = new BusService();
const routeService = new RouteService();
const studentService = new StudentService();
const tripService = new TripService();
const emergencyService = new EmergencyService();
const notificationService = new NotificationService();
const monitoringService = new MonitoringService();
const etaService = new EtaService();

export class SchoolController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { admin, ...schoolData } = req.body;
      const school = await schoolService.createSchool(schoolData, admin);
      sendSuccess(res, school, 201);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = param(req.params.schoolId);
      assertCanAccessSchool(req, schoolId);
      const school = await schoolService.getSchool(schoolId);
      sendSuccess(res, school);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = param(req.params.schoolId);
      assertCanAccessSchool(req, schoolId);
      const school = await schoolService.updateSchool(schoolId, req.body);
      sendSuccess(res, school);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await schoolService.listSchools(page, limit);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export class PlatformController {
  async stats(_req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalSchools,
        activeSchools,
        totalAdmins,
        totalDrivers,
        totalParents,
        totalBuses,
        totalStudents,
        activeTrips,
      ] = await Promise.all([
        prisma.school.count(),
        prisma.school.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: UserRole.SCHOOL_ADMIN, status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: UserRole.DRIVER, status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: UserRole.PARENT, status: 'ACTIVE' } }),
        prisma.bus.count(),
        prisma.student.count({ where: { isActive: true } }),
        prisma.trip.count({ where: { status: 'ACTIVE' } }),
      ]);

      sendSuccess(res, {
        totalSchools,
        activeSchools,
        totalAdmins,
        totalDrivers,
        totalParents,
        totalBuses,
        totalStudents,
        activeTrips,
      });
    } catch (error) {
      next(error);
    }
  }
}

export class DriverController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await driverService.createDriver(await resolveSchoolId(req), req.body);
      const { passwordHash: _, ...safe } = driver;
      sendSuccess(res, safe, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await driverService.listDrivers(await resolveSchoolId(req), page, limit, {
        status: req.query.status as string,
        search: req.query.search as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await driverService.getDriver(await resolveSchoolId(req), param(req.params.driverId));
      sendSuccess(res, driver);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await driverService.updateDriver(await resolveSchoolId(req), param(req.params.driverId), req.body);
      sendSuccess(res, driver);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await driverService.deactivateDriver(await resolveSchoolId(req), param(req.params.driverId));
      sendSuccess(res, null, 200, 'Driver deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export class ParentController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parent = await parentService.createParent(await resolveSchoolId(req), req.body);
      const { passwordHash: _, ...safe } = parent;
      sendSuccess(res, safe, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await parentService.listParents(await resolveSchoolId(req), page, limit, req.query.search as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const parent = await parentService.getParent(await resolveSchoolId(req), param(req.params.parentId));
      sendSuccess(res, parent);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parent = await parentService.updateParent(await resolveSchoolId(req), param(req.params.parentId), req.body);
      sendSuccess(res, parent);
    } catch (error) {
      next(error);
    }
  }

  async getMyChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const children = await parentService.getMyChildren((req as AuthRequest).user.id);
      sendSuccess(res, children);
    } catch (error) {
      next(error);
    }
  }
}

export class BusController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const bus = await busService.createBus(await resolveSchoolId(req), req.body);
      sendSuccess(res, bus, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await busService.listBuses(await resolveSchoolId(req), page, limit, {
        status: req.query.status as string,
        search: req.query.search as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const bus = await busService.getBus(await resolveSchoolId(req), param(req.params.busId));
      sendSuccess(res, bus);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const bus = await busService.updateBus(await resolveSchoolId(req), param(req.params.busId), req.body);
      sendSuccess(res, bus);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await busService.deactivateBus(await resolveSchoolId(req), param(req.params.busId));
      sendSuccess(res, null, 200, 'Bus deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export class RouteController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await routeService.createRoute(await resolveSchoolId(req), req.body);
      sendSuccess(res, route, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await routeService.listRoutes(await resolveSchoolId(req), page, limit, {
        status: req.query.status as string,
        busId: req.query.busId as string,
        search: req.query.search as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await routeService.getRoute(await resolveSchoolId(req), param(req.params.routeId));
      sendSuccess(res, route);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await routeService.updateRoute(await resolveSchoolId(req), param(req.params.routeId), req.body);
      sendSuccess(res, route);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await routeService.deactivateRoute(await resolveSchoolId(req), param(req.params.routeId));
      sendSuccess(res, null, 200, 'Route deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  async addStop(req: Request, res: Response, next: NextFunction) {
    try {
      const stop = await routeService.addStop(await resolveSchoolId(req), param(req.params.routeId), req.body);
      sendSuccess(res, stop, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateStop(req: Request, res: Response, next: NextFunction) {
    try {
      const stop = await routeService.updateStop(
        await resolveSchoolId(req),
        param(req.params.routeId),
        param(req.params.stopId),
        req.body
      );
      sendSuccess(res, stop);
    } catch (error) {
      next(error);
    }
  }

  async deleteStop(req: Request, res: Response, next: NextFunction) {
    try {
      await routeService.deleteStop(await resolveSchoolId(req), param(req.params.routeId), param(req.params.stopId));
      sendSuccess(res, null, 200, 'Stop deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async reorderStops(req: Request, res: Response, next: NextFunction) {
    try {
      const stops = await routeService.reorderStops(
        await resolveSchoolId(req),
        param(req.params.routeId),
        req.body.stopOrders
      );
      sendSuccess(res, stops);
    } catch (error) {
      next(error);
    }
  }
}

export class StudentController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentService.createStudent(await resolveSchoolId(req), req.body);
      sendSuccess(res, student, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await studentService.listStudents(await resolveSchoolId(req), page, limit, {
        search: req.query.search as string,
        grade: req.query.grade as string,
        parentId: req.query.parentId as string,
        routeId: req.query.routeId as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentService.getStudent(await resolveSchoolId(req), param(req.params.studentId));
      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentService.updateStudent(await resolveSchoolId(req), param(req.params.studentId), req.body);
      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await studentService.deactivateStudent(await resolveSchoolId(req), param(req.params.studentId));
      sendSuccess(res, null, 200, 'Student deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const assignment = await studentService.assignToRoute(
        await resolveSchoolId(req),
        param(req.params.studentId),
        req.body
      );
      sendSuccess(res, assignment, 201);
    } catch (error) {
      next(error);
    }
  }

  async listAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = await studentService.listAssignments(
        await resolveSchoolId(req),
        param(req.params.studentId)
      );
      sendSuccess(res, assignments);
    } catch (error) {
      next(error);
    }
  }

  async removeAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      await studentService.removeAssignment(
        await resolveSchoolId(req),
        param(req.params.studentId),
        param(req.params.assignmentId)
      );
      sendSuccess(res, null, 200, 'Assignment removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export class TripController {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await tripService.startTrip(await resolveSchoolId(req), (req as AuthRequest).user.id, req.body);
      sendSuccess(res, trip, 201, 'Trip started successfully');
    } catch (error) {
      next(error);
    }
  }

  async end(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await tripService.endTrip(
        await resolveSchoolId(req),
        (req as AuthRequest).user.id,
        param(req.params.tripId),
        req.body
      );
      sendSuccess(res, trip);
    } catch (error) {
      next(error);
    }
  }

  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await tripService.getActiveTripForDriver(await resolveSchoolId(req), (req as AuthRequest).user.id);
      sendSuccess(res, trip);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await tripService.getTrip(await resolveSchoolId(req), param(req.params.tripId));
      sendSuccess(res, trip);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await tripService.listTrips(await resolveSchoolId(req), page, limit, {
        status: req.query.status as string,
        routeId: req.query.routeId as string,
        busId: req.query.busId as string,
        driverId: req.query.driverId as string,
        date: req.query.date as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tripService.updateLocation(
        await resolveSchoolId(req),
        (req as AuthRequest).user.id,
        param(req.params.tripId),
        req.body
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await tripService.getLocationHistory(
        await resolveSchoolId(req),
        param(req.params.tripId),
        parseInt(req.query.limit as string, 10) || 100
      );
      sendSuccess(res, locations);
    } catch (error) {
      next(error);
    }
  }

  async getEta(req: Request, res: Response, next: NextFunction) {
    try {
      const eta = await etaService.getEta(await resolveSchoolId(req), param(req.params.tripId), {
        stopId: req.query.stopId as string,
        studentId: req.query.studentId as string,
        parentUserId: (req as AuthRequest).user.role === 'PARENT' ? (req as AuthRequest).user.id : undefined,
      });
      sendSuccess(res, eta);
    } catch (error) {
      next(error);
    }
  }
}

export class EmergencyController {
  async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await emergencyService.triggerEmergency(
        await resolveSchoolId(req),
        (req as AuthRequest).user.id,
        param(req.params.tripId),
        req.body
      );
      sendSuccess(res, alert, 201, 'Emergency alert sent');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await emergencyService.listEmergencies(await resolveSchoolId(req), page, limit, {
        status: req.query.status as string,
        tripId: req.query.tripId as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await emergencyService.acknowledge(
        await resolveSchoolId(req),
        param(req.params.alertId),
        (req as AuthRequest).user.id
      );
      sendSuccess(res, alert);
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await emergencyService.resolve(await resolveSchoolId(req), param(req.params.alertId));
      sendSuccess(res, alert);
    } catch (error) {
      next(error);
    }
  }
}

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
      const result = await notificationService.listNotifications((req as AuthRequest).user.id, page, limit, {
        type: req.query.type as string,
        status: req.query.status as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markAsRead(
        (req as AuthRequest).user.id,
        param(req.params.notificationId)
      );
      sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead((req as AuthRequest).user.id);
      sendSuccess(res, null, 200, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  async broadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.broadcast(await resolveSchoolId(req), req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }
}

export class MonitoringController {
  async activeTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const trips = await monitoringService.getActiveTrips(await resolveSchoolId(req));
      sendSuccess(res, trips);
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await monitoringService.getStats(await resolveSchoolId(req));
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export class UploadController {
  async presign(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName, fileType, purpose } = req.body;
      const key = `uploads/${purpose.toLowerCase()}/${(req as AuthRequest).user.id}/${Date.now()}-${fileName}`;

      if (!process.env.AWS_S3_BUCKET) {
        throw new AppError(
          ErrorCodes.INTERNAL_ERROR,
          'S3 is not configured. Set AWS_S3_BUCKET in environment.',
          500
        );
      }

      sendSuccess(res, {
        uploadUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`,
        fileUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`,
        fileType,
        expiresIn: 300,
      });
    } catch (error) {
      next(error);
    }
  }
}
