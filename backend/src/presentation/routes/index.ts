import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import {
  SchoolController,
  PlatformController,
  DriverController,
  ParentController,
  BusController,
  RouteController,
  StudentController,
  TripController,
  EmergencyController,
  NotificationController,
  MonitoringController,
  UploadController,
} from '../controllers/resource.controller';
import { authenticate, authorize, validateBody } from '../middlewares/auth.middleware';
import {
  loginSchema,
  refreshTokenSchema,
  deviceTokenSchema,
  createSchoolSchema,
  updateSchoolSchema,
  createDriverSchema,
  updateDriverSchema,
  createParentSchema,
  updateParentSchema,
  createBusSchema,
  updateBusSchema,
  createRouteSchema,
  updateRouteSchema,
  createStopSchema,
  updateStopSchema,
  reorderStopsSchema,
  createStudentSchema,
  updateStudentSchema,
  assignStudentSchema,
  startTripSchema,
  locationUpdateSchema,
  emergencySchema,
  broadcastNotificationSchema,
  presignUploadSchema,
} from '../validators/schemas';

const router = Router();

const authController = new AuthController();
const schoolController = new SchoolController();
const platformController = new PlatformController();
const driverController = new DriverController();
const parentController = new ParentController();
const busController = new BusController();
const routeController = new RouteController();
const studentController = new StudentController();
const tripController = new TripController();
const emergencyController = new EmergencyController();
const notificationController = new NotificationController();
const monitoringController = new MonitoringController();
const uploadController = new UploadController();

const schoolAdmin = authorize('SCHOOL_ADMIN', 'SUPER_ADMIN');

// Auth
router.post('/auth/login', validateBody(loginSchema), authController.login.bind(authController));
router.post('/auth/refresh', validateBody(refreshTokenSchema), authController.refresh.bind(authController));
router.post('/auth/logout', authenticate, validateBody(refreshTokenSchema), authController.logout.bind(authController));
router.get('/auth/me', authenticate, authController.me.bind(authController));
router.post('/auth/device-token', authenticate, validateBody(deviceTokenSchema), authController.registerDeviceToken.bind(authController));
router.delete('/auth/device-token', authenticate, validateBody(deviceTokenSchema), authController.removeDeviceToken.bind(authController));

// Platform (super admin)
router.get('/platform/stats', authenticate, authorize('SUPER_ADMIN'), platformController.stats.bind(platformController));

// Schools
router.post('/schools', authenticate, authorize('SUPER_ADMIN'), validateBody(createSchoolSchema), schoolController.create.bind(schoolController));
router.get('/schools', authenticate, authorize('SUPER_ADMIN'), schoolController.list.bind(schoolController));
router.get('/schools/:schoolId', authenticate, schoolAdmin, schoolController.get.bind(schoolController));
router.patch('/schools/:schoolId', authenticate, schoolAdmin, validateBody(updateSchoolSchema), schoolController.update.bind(schoolController));

// Drivers
router.post('/drivers', authenticate, schoolAdmin, validateBody(createDriverSchema), driverController.create.bind(driverController));
router.get('/drivers', authenticate, schoolAdmin, driverController.list.bind(driverController));
router.get('/drivers/:driverId', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'DRIVER'), driverController.get.bind(driverController));
router.patch('/drivers/:driverId', authenticate, schoolAdmin, validateBody(updateDriverSchema), driverController.update.bind(driverController));
router.delete('/drivers/:driverId', authenticate, schoolAdmin, driverController.remove.bind(driverController));

// Parents
router.post('/parents', authenticate, schoolAdmin, validateBody(createParentSchema), parentController.create.bind(parentController));
router.get('/parents', authenticate, schoolAdmin, parentController.list.bind(parentController));
router.get('/parents/me/children', authenticate, authorize('PARENT'), parentController.getMyChildren.bind(parentController));
router.get('/parents/:parentId', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT'), parentController.get.bind(parentController));
router.patch('/parents/:parentId', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT'), validateBody(updateParentSchema), parentController.update.bind(parentController));

// Buses
router.post('/buses', authenticate, schoolAdmin, validateBody(createBusSchema), busController.create.bind(busController));
router.get('/buses', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'DRIVER'), busController.list.bind(busController));
router.get('/buses/:busId', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'DRIVER', 'PARENT'), busController.get.bind(busController));
router.patch('/buses/:busId', authenticate, schoolAdmin, validateBody(updateBusSchema), busController.update.bind(busController));
router.delete('/buses/:busId', authenticate, schoolAdmin, busController.remove.bind(busController));

// Routes
router.post('/routes', authenticate, schoolAdmin, validateBody(createRouteSchema), routeController.create.bind(routeController));
router.get('/routes', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'DRIVER'), routeController.list.bind(routeController));
router.get('/routes/:routeId', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'DRIVER', 'PARENT'), routeController.get.bind(routeController));
router.patch('/routes/:routeId', authenticate, schoolAdmin, validateBody(updateRouteSchema), routeController.update.bind(routeController));
router.delete('/routes/:routeId', authenticate, schoolAdmin, routeController.remove.bind(routeController));
router.post('/routes/:routeId/stops', authenticate, schoolAdmin, validateBody(createStopSchema), routeController.addStop.bind(routeController));
router.patch('/routes/:routeId/stops/:stopId', authenticate, schoolAdmin, validateBody(updateStopSchema), routeController.updateStop.bind(routeController));
router.delete('/routes/:routeId/stops/:stopId', authenticate, schoolAdmin, routeController.deleteStop.bind(routeController));
router.put('/routes/:routeId/stops/reorder', authenticate, schoolAdmin, validateBody(reorderStopsSchema), routeController.reorderStops.bind(routeController));

// Students
router.post('/students', authenticate, schoolAdmin, validateBody(createStudentSchema), studentController.create.bind(studentController));
router.get('/students', authenticate, schoolAdmin, studentController.list.bind(studentController));
router.get('/students/:studentId', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT'), studentController.get.bind(studentController));
router.patch('/students/:studentId', authenticate, schoolAdmin, validateBody(updateStudentSchema), studentController.update.bind(studentController));
router.delete('/students/:studentId', authenticate, schoolAdmin, studentController.remove.bind(studentController));
router.post('/students/:studentId/assignments', authenticate, schoolAdmin, validateBody(assignStudentSchema), studentController.assign.bind(studentController));
router.get('/students/:studentId/assignments', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT'), studentController.listAssignments.bind(studentController));
router.delete('/students/:studentId/assignments/:assignmentId', authenticate, schoolAdmin, studentController.removeAssignment.bind(studentController));

// Trips
router.post('/trips/start', authenticate, authorize('DRIVER'), validateBody(startTripSchema), tripController.start.bind(tripController));
router.post('/trips/:tripId/end', authenticate, authorize('DRIVER'), tripController.end.bind(tripController));
router.get('/trips/active', authenticate, authorize('DRIVER'), tripController.getActive.bind(tripController));
router.get('/trips', authenticate, schoolAdmin, tripController.list.bind(tripController));
router.get('/trips/:tripId', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'DRIVER', 'PARENT'), tripController.get.bind(tripController));
router.post('/trips/:tripId/location', authenticate, authorize('DRIVER'), validateBody(locationUpdateSchema), tripController.updateLocation.bind(tripController));
router.get('/trips/:tripId/locations', authenticate, schoolAdmin, tripController.getLocations.bind(tripController));
router.get('/trips/:tripId/eta', authenticate, authorize('SCHOOL_ADMIN', 'SUPER_ADMIN', 'DRIVER', 'PARENT'), tripController.getEta.bind(tripController));
router.post('/trips/:tripId/emergency', authenticate, authorize('DRIVER'), validateBody(emergencySchema), emergencyController.trigger.bind(emergencyController));

// Emergencies
router.get('/emergencies', authenticate, schoolAdmin, emergencyController.list.bind(emergencyController));
router.patch('/emergencies/:alertId/acknowledge', authenticate, schoolAdmin, emergencyController.acknowledge.bind(emergencyController));
router.patch('/emergencies/:alertId/resolve', authenticate, schoolAdmin, emergencyController.resolve.bind(emergencyController));

// Notifications
router.get('/notifications', authenticate, notificationController.list.bind(notificationController));
router.patch('/notifications/read-all', authenticate, notificationController.markAllRead.bind(notificationController));
router.patch('/notifications/:notificationId/read', authenticate, notificationController.markRead.bind(notificationController));
router.post('/notifications/broadcast', authenticate, schoolAdmin, validateBody(broadcastNotificationSchema), notificationController.broadcast.bind(notificationController));

// Monitoring
router.get('/monitoring/active-trips', authenticate, schoolAdmin, monitoringController.activeTrips.bind(monitoringController));
router.get('/monitoring/stats', authenticate, schoolAdmin, monitoringController.stats.bind(monitoringController));

// Uploads
router.post('/uploads/presign', authenticate, validateBody(presignUploadSchema), uploadController.presign.bind(uploadController));

export default router;
