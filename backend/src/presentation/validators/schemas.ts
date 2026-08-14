import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const deviceTokenSchema = z.object({
  fcmToken: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
});

export const paginationSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const createSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(20),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().default('IN'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().default('Asia/Kolkata'),
  admin: z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
    })
    .optional(),
});

export const updateSchoolSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  code: z.string().min(2).max(20).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export const createDriverSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  licenseNumber: z.string().min(5),
  licenseExpiry: z.string().datetime().optional(),
});

export const updateDriverSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  licenseExpiry: z.string().datetime().optional(),
  isAvailable: z.boolean().optional(),
});

export const createParentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateParentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const createBusSchema = z.object({
  plateNumber: z.string().min(3),
  model: z.string().optional(),
  capacity: z.number().int().min(1).max(200),
  driverId: z.string().optional(),
});

export const updateBusSchema = z.object({
  plateNumber: z.string().min(3).optional(),
  model: z.string().optional(),
  capacity: z.number().int().min(1).max(200).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
  driverId: z.string().nullable().optional(),
});

const routeStopSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  stopOrder: z.number().int().min(1),
  stopType: z.enum(['PICKUP', 'DROP', 'BOTH']).default('BOTH'),
  radiusM: z.number().int().min(50).max(500).default(100),
});

export const createRouteSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  busId: z.string().optional(),
  startTime: z.string().optional(),
  stops: z.array(routeStopSchema).min(1),
});

export const updateRouteSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  busId: z.string().nullable().optional(),
  startTime: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createStopSchema = routeStopSchema;
export const updateStopSchema = routeStopSchema.partial();

export const reorderStopsSchema = z.object({
  stopOrders: z.array(
    z.object({
      stopId: z.string(),
      stopOrder: z.number().int().min(1),
    })
  ),
});

export const createStudentSchema = z.object({
  parentId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().optional(),
  section: z.string().optional(),
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  grade: z.string().optional(),
  section: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const assignStudentSchema = z.object({
  routeId: z.string(),
  pickupStopId: z.string(),
  dropStopId: z.string(),
});

export const startTripSchema = z.object({
  routeId: z.string(),
  busId: z.string(),
});

export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().optional(),
  speed: z.number().optional(),
  accuracy: z.number().optional(),
  recordedAt: z.string().datetime().optional(),
});

export const emergencySchema = z.object({
  message: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  target: z.enum(['ALL_PARENTS', 'ALL_DRIVERS', 'ROUTE', 'CUSTOM']),
  routeId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  data: z.record(z.unknown()).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const updateTemplateSchema = createTemplateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const presignUploadSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  purpose: z.enum(['AVATAR', 'SCHOOL_LOGO', 'DOCUMENT']),
});
