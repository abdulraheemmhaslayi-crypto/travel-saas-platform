import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';
import apiClient from '@/lib/api';
import { setCookie, getCookie } from '@/lib/cookieUtils';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: { email?: string; phone?: string; password: string; rememberMe?: boolean }) => Promise<void>;
  register: (data: unknown) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsInitializing: (value: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      isLoading: false,
      error: null,

      login: async (data: { email?: string; phone?: string; password: string; rememberMe?: boolean }) => {
        set({ isLoading: true, error: null });
        try {
          const { rememberMe = true, ...loginCredentials } = data;
          const response = await apiClient.login(loginCredentials);
          const { user, accessToken, refreshToken } = response.data;
          apiClient.setTokens(accessToken, refreshToken, user, rememberMe);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data: unknown) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.register(data);
          const { user, accessToken, refreshToken } = response.data;
          apiClient.setTokens(accessToken, refreshToken, user, true);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          apiClient.clearTokens();
          set({ user: null, isAuthenticated: false, error: null });
        }
      },

      setUser: (user: User | null) => {
        if (user) {
          set({ user, isAuthenticated: true });
          if (typeof window !== 'undefined') {
            if (user.role) setCookie('userRole', user.role, 30);
            if (user.userType) setCookie('userType', user.userType, 30);
          }
        } else {
          set({ user: null, isAuthenticated: false });
        }
      },

      setIsInitializing: (value: boolean) => {
        set({ isInitializing: value });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate auth-storage:', error);
        }
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken') || getCookie('accessToken');
          if (!token) {
            state?.setUser(null);
          } else if (state?.user) {
            if (state.user.role) setCookie('userRole', state.user.role, 30);
            if (state.user.userType) setCookie('userType', state.user.userType, 30);
          }
        }
        state?.setIsInitializing(false);
      },
    }
  )
);
