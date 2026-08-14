import { create } from 'zustand';
import { User } from '@/types';

const SCHOOL_CTX_KEY = 'activeSchool';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  activeSchoolId: string | null;
  activeSchoolName: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
  setActiveSchool: (id: string, name: string) => void;
  clearActiveSchool: () => void;
}

function persistSchoolContext(id: string | null, name: string | null) {
  if (!id) {
    localStorage.removeItem(SCHOOL_CTX_KEY);
    return;
  }
  localStorage.setItem(SCHOOL_CTX_KEY, JSON.stringify({ id, name }));
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  activeSchoolId: null,
  activeSchoolName: null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('auth', JSON.stringify({ user, accessToken, refreshToken }));
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('auth');
    localStorage.removeItem(SCHOOL_CTX_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      activeSchoolId: null,
      activeSchoolName: null,
    });
  },

  setActiveSchool: (id, name) => {
    persistSchoolContext(id, name);
    set({ activeSchoolId: id, activeSchoolName: name });
  },

  clearActiveSchool: () => {
    persistSchoolContext(null, null);
    set({ activeSchoolId: null, activeSchoolName: null });
  },

  hydrate: () => {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem('auth');
    if (!raw) return;
    try {
      const { user, accessToken, refreshToken } = JSON.parse(raw);
      if (user && accessToken) {
        let activeSchoolId: string | null = null;
        let activeSchoolName: string | null = null;
        const schoolRaw = localStorage.getItem(SCHOOL_CTX_KEY);
        if (schoolRaw) {
          const ctx = JSON.parse(schoolRaw) as { id: string; name: string };
          activeSchoolId = ctx.id;
          activeSchoolName = ctx.name;
        }
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          activeSchoolId,
          activeSchoolName,
        });
      }
    } catch {
      localStorage.removeItem('auth');
      localStorage.removeItem(SCHOOL_CTX_KEY);
    }
  },
}));

// Sync hydrate before first route render to preserve deep links.
useAuthStore.getState().hydrate();
