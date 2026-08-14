/** Pure access helpers used by admin routing / login. */

export function isAdminRole(role?: string | null): boolean {
  return role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN';
}

export function postLoginPath(role: string): string {
  return role === 'SUPER_ADMIN' ? '/schools' : '/dashboard';
}

/** True when super admin must be redirected to the schools hub. */
export function shouldRedirectSuperAdminToHub(
  role: string | undefined,
  activeSchoolId: string | null,
  pathname: string
): boolean {
  if (role !== 'SUPER_ADMIN' || activeSchoolId) return false;
  return pathname !== '/schools' && !pathname.startsWith('/schools/');
}
