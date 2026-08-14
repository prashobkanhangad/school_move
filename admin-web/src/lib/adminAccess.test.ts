import { describe, it, expect } from 'vitest';
import {
  isAdminRole,
  postLoginPath,
  shouldRedirectSuperAdminToHub,
} from './adminAccess';

describe('adminAccess', () => {
  it('accepts school and super admin roles only', () => {
    expect(isAdminRole('SCHOOL_ADMIN')).toBe(true);
    expect(isAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminRole('DRIVER')).toBe(false);
    expect(isAdminRole('PARENT')).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  it('routes login destinations by role', () => {
    expect(postLoginPath('SUPER_ADMIN')).toBe('/schools');
    expect(postLoginPath('SCHOOL_ADMIN')).toBe('/dashboard');
  });

  it('forces super admin without school context onto hub', () => {
    expect(shouldRedirectSuperAdminToHub('SUPER_ADMIN', null, '/dashboard')).toBe(true);
    expect(shouldRedirectSuperAdminToHub('SUPER_ADMIN', null, '/drivers')).toBe(true);
    expect(shouldRedirectSuperAdminToHub('SUPER_ADMIN', null, '/schools')).toBe(false);
    expect(shouldRedirectSuperAdminToHub('SUPER_ADMIN', 'school-1', '/dashboard')).toBe(false);
    expect(shouldRedirectSuperAdminToHub('SCHOOL_ADMIN', null, '/dashboard')).toBe(false);
  });
});
