import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'RJ' | 'MODERATOR';
  avatar?: string;
  bio?: string;
  status: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ninada_user', JSON.stringify(user));
      localStorage.setItem('ninada_access_token', accessToken);
      localStorage.setItem('ninada_refresh_token', refreshToken);
    }
    set({ user, accessToken });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ninada_user');
      localStorage.removeItem('ninada_access_token');
      localStorage.removeItem('ninada_refresh_token');
    }
    set({ user: null, accessToken: null });
  },
  initAuth: () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('ninada_user');
      const storedToken = localStorage.getItem('ninada_access_token');
      if (storedUser && storedToken) {
        try {
          set({ user: JSON.parse(storedUser), accessToken: storedToken });
        } catch (e) {
          localStorage.removeItem('ninada_user');
        }
      }
    }
  },
}));
