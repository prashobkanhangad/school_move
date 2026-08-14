import { apiPost, apiGet, apiPatch } from './api';
import { LoginResponse, User, School, Paginated } from '@/types';

export async function login(email: string, password: string) {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

export async function logout(refreshToken: string) {
  return apiPost<null>('/auth/logout', { refreshToken });
}

export async function getMe() {
  return apiGet<User & { school?: School }>('/auth/me');
}

export async function getSchool(schoolId: string) {
  return apiGet<School>(`/schools/${schoolId}`);
}

export async function updateSchool(schoolId: string, data: Partial<School>) {
  return apiPatch<School>(`/schools/${schoolId}`, data);
}

export async function listSchools(params?: { page?: number; limit?: number }) {
  return apiGet<Paginated<School>>('/schools', params);
}

export async function createSchool(data: {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  admin?: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}) {
  return apiPost<School>('/schools', data);
}

export async function getPlatformStats() {
  return apiGet<{
    totalSchools: number;
    activeSchools: number;
    totalAdmins: number;
    totalDrivers: number;
    totalParents: number;
    totalBuses: number;
    totalStudents: number;
    activeTrips: number;
  }>('/platform/stats');
}

export async function getDashboardStats() {
  return apiGet<import('@/types').DashboardStats>('/monitoring/stats');
}

export async function getActiveTrips() {
  return apiGet<import('@/types').ActiveTrip[]>('/monitoring/active-trips');
}
