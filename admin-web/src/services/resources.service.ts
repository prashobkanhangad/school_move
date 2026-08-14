import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import { Bus, Driver, Paginated, Parent, Route, Student } from '@/types';

export const driversApi = {
  list: (params?: Record<string, unknown>) => apiGet<Paginated<Driver>>('/drivers', params),
  get: (id: string) => apiGet<Driver>(`/drivers/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Driver>('/drivers', data),
  update: (id: string, data: Record<string, unknown>) => apiPatch<Driver>(`/drivers/${id}`, data),
  remove: (id: string) => apiDelete(`/drivers/${id}`),
};

export const parentsApi = {
  list: (params?: Record<string, unknown>) => apiGet<Paginated<Parent>>('/parents', params),
  get: (id: string) => apiGet<Parent>(`/parents/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Parent>('/parents', data),
  update: (id: string, data: Record<string, unknown>) => apiPatch<Parent>(`/parents/${id}`, data),
};

export const busesApi = {
  list: (params?: Record<string, unknown>) => apiGet<Paginated<Bus>>('/buses', params),
  get: (id: string) => apiGet<Bus>(`/buses/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Bus>('/buses', data),
  update: (id: string, data: Record<string, unknown>) => apiPatch<Bus>(`/buses/${id}`, data),
  remove: (id: string) => apiDelete(`/buses/${id}`),
};

export const routesApi = {
  list: (params?: Record<string, unknown>) => apiGet<Paginated<Route>>('/routes', params),
  get: (id: string) => apiGet<Route>(`/routes/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Route>('/routes', data),
  update: (id: string, data: Record<string, unknown>) => apiPatch<Route>(`/routes/${id}`, data),
  remove: (id: string) => apiDelete(`/routes/${id}`),
  addStop: (routeId: string, data: Record<string, unknown>) =>
    apiPost(`/routes/${routeId}/stops`, data),
  updateStop: (routeId: string, stopId: string, data: Record<string, unknown>) =>
    apiPatch(`/routes/${routeId}/stops/${stopId}`, data),
  deleteStop: (routeId: string, stopId: string) =>
    apiDelete(`/routes/${routeId}/stops/${stopId}`),
};

export const studentsApi = {
  list: (params?: Record<string, unknown>) => apiGet<Paginated<Student>>('/students', params),
  get: (id: string) => apiGet<Student>(`/students/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Student>('/students', data),
  update: (id: string, data: Record<string, unknown>) => apiPatch<Student>(`/students/${id}`, data),
  remove: (id: string) => apiDelete(`/students/${id}`),
  assign: (studentId: string, data: Record<string, unknown>) =>
    apiPost(`/students/${studentId}/assignments`, data),
  removeAssignment: (studentId: string, assignmentId: string) =>
    apiDelete(`/students/${studentId}/assignments/${assignmentId}`),
};

export const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    apiGet<Paginated<import('@/types').Notification>>('/notifications', params),
  markRead: (id: string) => apiPatch(`/notifications/${id}/read`),
  markAllRead: () => apiPatch('/notifications/read-all'),
  broadcast: (data: Record<string, unknown>) =>
    apiPost<{ sentCount: number; failedCount: number }>('/notifications/broadcast', data),
};

export const emergenciesApi = {
  list: (params?: Record<string, unknown>) =>
    apiGet<Paginated<import('@/types').EmergencyAlert>>('/emergencies', params),
  acknowledge: (id: string) => apiPatch(`/emergencies/${id}/acknowledge`),
  resolve: (id: string) => apiPatch(`/emergencies/${id}/resolve`),
};
