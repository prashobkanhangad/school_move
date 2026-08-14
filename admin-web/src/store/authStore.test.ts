import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';

function resetStorage() {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
}

describe('authStore school context', () => {
  beforeEach(() => {
    resetStorage();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      activeSchoolId: null,
      activeSchoolName: null,
    });
  });

  it('persists auth and school context', () => {
    useAuthStore.getState().setAuth(
      {
        id: '1',
        email: 'superadmin@platform.com',
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        schoolId: null,
      },
      'access',
      'refresh'
    );

    useAuthStore.getState().setActiveSchool('school-abc', 'Green Valley');
    expect(useAuthStore.getState().activeSchoolId).toBe('school-abc');
    expect(useAuthStore.getState().activeSchoolName).toBe('Green Valley');
    expect(JSON.parse(localStorage.getItem('activeSchool')!).id).toBe('school-abc');

    useAuthStore.getState().clearActiveSchool();
    expect(useAuthStore.getState().activeSchoolId).toBeNull();
    expect(localStorage.getItem('activeSchool')).toBeNull();
  });

  it('clears school context on logout', () => {
    useAuthStore.getState().setAuth(
      {
        id: '1',
        email: 'superadmin@platform.com',
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        schoolId: null,
      },
      'access',
      'refresh'
    );
    useAuthStore.getState().setActiveSchool('school-abc', 'Green Valley');
    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().activeSchoolId).toBeNull();
    expect(localStorage.getItem('auth')).toBeNull();
    expect(localStorage.getItem('activeSchool')).toBeNull();
  });

  it('hydrates auth and active school from localStorage', () => {
    localStorage.setItem(
      'auth',
      JSON.stringify({
        user: {
          id: '1',
          email: 'superadmin@platform.com',
          firstName: 'Platform',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          schoolId: null,
        },
        accessToken: 'access',
        refreshToken: 'refresh',
      })
    );
    localStorage.setItem('activeSchool', JSON.stringify({ id: 'school-xyz', name: 'Demo' }));

    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe('SUPER_ADMIN');
    expect(useAuthStore.getState().activeSchoolId).toBe('school-xyz');
    expect(useAuthStore.getState().activeSchoolName).toBe('Demo');
  });
});
