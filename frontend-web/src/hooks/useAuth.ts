'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { getCookie } from '@/lib/cookieUtils';
import type { User } from '@/types/auth';

const normalizeRole = (role?: string) => String(role || '').toUpperCase();
const normalizeUserType = (userType?: string) => String(userType || '').toUpperCase();

export const getDashboardPath = (user: User): string => {
  const role = normalizeRole(user.role);
  const userType = normalizeUserType(user.userType);

  if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';

  switch (userType) {
    case 'PASSENGER':
      return '/dashboard/passenger';
    case 'DRIVER':
      return '/dashboard/driver';
    case 'FLEET_OWNER':
    case 'VEHICLE_OWNER':
      return '/dashboard/vehicle-owner';
    case 'SUPPORT':
      return '/dashboard/support';
    default:
      return '/dashboard/passenger';
  }
};

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isInitializing,
    isLoading,
    error,
    login,
    register,
    logout,
    setUser,
    setIsInitializing,
    clearError,
  } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('accessToken') || getCookie('accessToken');

      if (token) {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          try {
            const response = await apiClient.getProfile();
            if (isMounted) {
              setUser(response.data);
            }
          } catch (err: any) {
            // Only clear tokens if the token is definitely rejected (401)
            if (err?.status === 401 || err?.response?.status === 401) {
              apiClient.clearTokens();
              setUser(null);
            }
          }
        }
      } else {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          setUser(null);
        }
      }

      if (isMounted) {
        setIsInitializing(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [setUser, setIsInitializing]);

  const handleLogin = useCallback(
    async (credentials: { email?: string; phone?: string; password: string; rememberMe?: boolean }) => {
      try {
        await login(credentials);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const { user: loggedInUser } = useAuthStore.getState();
        if (loggedInUser) {
          const dashboardPath = getDashboardPath(loggedInUser);
          router.push(dashboardPath);
        }
      } catch (err) {
        console.error('Login error:', err);
        throw err;
      }
    },
    [login, router]
  );

  const handleRegister = useCallback(
    async (data: unknown) => {
      try {
        await register(data);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const { user: registeredUser } = useAuthStore.getState();
        if (registeredUser) {
          const dashboardPath = getDashboardPath(registeredUser);
          router.push(dashboardPath);
        }
      } catch (err) {
        console.error('Register error:', err);
        throw err;
      }
    },
    [register, router]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  const requireAuth = useCallback(() => {
    if (!isAuthenticated && !isLoading && !isInitializing) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, isInitializing, router]);

  return {
    user,
    isAuthenticated,
    isInitializing,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    requireAuth,
    clearError,
    getDashboardPath,
  };
}
