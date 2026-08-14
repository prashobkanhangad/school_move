import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicRoute } from '@/components/layout/ProtectedRoute';
import { ToastProvider } from '@/components/common/Toast';
import { connectSocket, disconnectSocket, reconnectSocket } from '@/services/socket';
import { LoginPage } from '@/features/auth/LoginPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SchoolPage } from '@/features/school/SchoolPage';
import { SchoolsPage } from '@/features/schools/SchoolsPage';
import { DriversPage } from '@/features/drivers/DriversPage';
import { ParentsPage } from '@/features/parents/ParentsPage';
import { BusesPage } from '@/features/buses/BusesPage';
import { RoutesPage } from '@/features/routes/RoutesPage';
import { StudentsPage } from '@/features/students/StudentsPage';
import { MonitoringPage } from '@/features/monitoring/MonitoringPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { EmergenciesPage } from '@/features/emergencies/EmergenciesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function AppRoutes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeSchoolId = useAuthStore((s) => s.activeSchoolId);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      reconnectSocket();
    }
  }, [isAuthenticated, activeSchoolId]);

  const appHome = role === 'SUPER_ADMIN' && !activeSchoolId ? '/schools' : '/dashboard';

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/school" element={<SchoolPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/parents" element={<ParentsPage />} />
          <Route path="/buses" element={<BusesPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/emergencies" element={<EmergenciesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? appHome : '/'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastProvider />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
