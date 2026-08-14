import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiResponse } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { reconnectSocket } from '@/services/socket';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string> | null = null;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function getStoredTokens() {
  const raw = localStorage.getItem('auth');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      accessToken: string;
      refreshToken: string;
      user: { id: string };
    };
  } catch {
    return null;
  }
}

function storeTokens(accessToken: string, refreshToken: string) {
  const auth = getStoredTokens();
  if (auth) {
    localStorage.setItem(
      'auth',
      JSON.stringify({ ...auth, accessToken, refreshToken })
    );
  }
  useAuthStore.setState({ accessToken, refreshToken });
  reconnectSocket();
}

function clearAuth() {
  useAuthStore.getState().clearAuth();
  window.location.href = '/login';
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = getStoredTokens();
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  const activeSchoolId = useAuthStore.getState().activeSchoolId;
  if (activeSchoolId) {
    config.headers['X-School-Id'] = activeSchoolId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetryConfig | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      const auth = getStoredTokens();
      if (!auth?.refreshToken) {
        clearAuth();
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = api
          .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            '/auth/refresh',
            { refreshToken: auth.refreshToken }
          )
          .then((res) => {
            storeTokens(res.data.data.accessToken, res.data.data.refreshToken);
            return res.data.data.accessToken;
          })
          .catch(() => {
            clearAuth();
            throw error;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    const details = data?.error?.details;
    if (details?.length) {
      return details.map((d) => d.message).join('. ');
    }
    return data?.error?.message || error.message;
  }
  return 'An unexpected error occurred';
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const res = await api.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

export async function apiPost<T>(url: string, body?: unknown) {
  const res = await api.post<ApiResponse<T>>(url, body);
  return res.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown) {
  const res = await api.patch<ApiResponse<T>>(url, body);
  return res.data.data;
}

export async function apiDelete(url: string) {
  await api.delete(url);
}
