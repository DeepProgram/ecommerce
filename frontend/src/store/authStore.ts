import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, access: string, refresh: string) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user, access, refresh) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true, isInitialized: true });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isInitialized: true });
  },
  updateUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user });
  },
  initialize: async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ 
            user, 
            accessToken: token, 
            refreshToken: localStorage.getItem('refresh_token'), 
            isAuthenticated: true,
            isInitialized: true
          });
        } catch (error) {
          console.error('Failed to restore auth state:', error);
          set({ isInitialized: true });
        }
      } else {
        set({ isInitialized: true });
      }
    }
  },
}));
