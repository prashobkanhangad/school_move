export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  status?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  timezone: string;
  isActive: boolean;
}

export interface DriverProfile {
  id: string;
  licenseNumber: string;
  licenseExpiry?: string | null;
  isAvailable: boolean;
}

export interface Driver extends User {
  driverProfile?: DriverProfile;
  assignedBus?: { id: string; plateNumber: string } | null;
}

export interface Parent extends User {
  parentProfile?: { id: string; address?: string | null };
}

export interface Bus {
  id: string;
  plateNumber: string;
  model?: string | null;
  capacity: number;
  status: string;
  driver?: {
    id: string;
    user?: { id: string; firstName: string; lastName: string };
  } | null;
}

export interface RouteStop {
  id: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  stopOrder: number;
  stopType: string;
  radiusM: number;
}

export interface Route {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startTime?: string | null;
  bus?: { id: string; plateNumber: string; model?: string } | null;
  stops?: RouteStop[];
  studentCount?: number;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade?: string | null;
  section?: string | null;
  isActive: boolean;
  parent?: {
    user?: { id: string; firstName: string; lastName: string; email: string };
  };
  assignments?: StudentAssignment[];
}

export interface StudentAssignment {
  id: string;
  routeId: string;
  status: string;
  route?: { id: string; name: string };
  pickupStop?: RouteStop;
  dropStop?: RouteStop;
}

export interface ActiveTrip {
  tripId: string;
  status: string;
  startedAt?: string;
  bus: { id: string; plateNumber: string };
  driver: { id: string; firstName: string; lastName: string };
  route: { id: string; name: string };
  location: {
    latitude: number | null;
    longitude: number | null;
    heading?: number | null;
    speed?: number | null;
    lastLocationAt?: string | null;
  };
  studentCount: number;
  activeEmergencies: number;
}

export interface DashboardStats {
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
  totalStudents: number;
  totalDrivers: number;
  activeTrips: number;
  activeEmergencies: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  readAt?: string | null;
}

export interface EmergencyAlert {
  id: string;
  status: string;
  message?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  trip?: {
    bus?: { plateNumber: string };
    driver?: { user?: { firstName: string; lastName: string } };
  };
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
