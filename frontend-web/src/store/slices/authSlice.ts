import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@/types/auth';
import apiClient from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: { email?: string; phone?: string; password: string }) => Promise<void>;
  register: (data: unknown) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
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

      login: async (data: { email?: string; phone?: string; password: string }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.login(data);
          const { user, accessToken, refreshToken } = response.data;
          apiClient.setTokens(accessToken, refreshToken);
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
          apiClient.setTokens(accessToken, refreshToken);
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

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
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
    console.error(error);
  }

  state?.setIsInitializing(false);
},
    }
  )
);