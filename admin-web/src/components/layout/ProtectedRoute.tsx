import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { isAdminRole, postLoginPath, shouldRedirectSuperAdminToHub } from '@/lib/adminAccess';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const activeSchoolId = useAuthStore((s) => s.activeSchoolId);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user && !isAdminRole(user.role)) {
    return <Navigate to="/login" replace />;
  }

  if (shouldRedirectSuperAdminToHub(user?.role, activeSchoolId, location.pathname)) {
    return <Navigate to="/schools" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const defaultPath = postLoginPath(user?.role || 'SCHOOL_ADMIN');
  const from = fromState || defaultPath;

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
