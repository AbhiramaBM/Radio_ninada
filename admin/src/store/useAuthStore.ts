import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'RJ' | 'MODERATOR' | 'LISTENER';
  avatar?: string;
  bio?: string;
  status: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ninada_user', JSON.stringify(user));
      localStorage.setItem('ninada_access_token', accessToken);
      localStorage.setItem('ninada_refresh_token', refreshToken);
    }
    set({ user, accessToken, isInitialized: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('ninada_refresh_token');
      if (refreshToken) {
        api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
      localStorage.removeItem('ninada_user');
      localStorage.removeItem('ninada_access_token');
      localStorage.removeItem('ninada_refresh_token');
    }
    set({ user: null, accessToken: null, isInitialized: true });
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  },
  initAuth: () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('ninada_user');
      const storedToken = localStorage.getItem('ninada_access_token');
      if (storedUser && storedToken) {
        try {
          const user = JSON.parse(storedUser);
          set({ user, accessToken: storedToken, isInitialized: true });

          // Re-verify session & fetch updated profile from backend
          api.get('/auth/me')
            .then((res) => {
              const freshUser = res.data?.user || res.data?.data?.user || res.data?.data;
              if (freshUser && freshUser.id) {
                localStorage.setItem('ninada_user', JSON.stringify(freshUser));
                set({ user: freshUser, accessToken: storedToken, isInitialized: true });
              }
            })
            .catch(() => {
              // Interceptor will handle 401 logout if token is expired
            });
          return;
        } catch (e) {
          localStorage.removeItem('ninada_user');
          localStorage.removeItem('ninada_access_token');
          localStorage.removeItem('ninada_refresh_token');
        }
      }
    }
    set({ isInitialized: true });
  },
}));
