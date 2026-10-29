'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
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
  const { user, isAuthenticated, isInitializing, isLoading, error, login, register, logout, setUser, setIsInitializing, clearError } = useAuthStore();
  const router = useRouter();

  // Effect to handle redirect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      // Don't redirect here - let the user navigate naturally or use page-level redirects
      // This effect is just to ensure user is properly hydrated
    }
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && !user) {
        try {
          const response = await apiClient.getProfile();
          setUser(response.data);
        } catch {
          apiClient.clearTokens();
        }
      }
      setIsInitializing(false);
    };
    initAuth();
  }, [user, setUser, setIsInitializing]);

  const handleLogin = useCallback(async (credentials: { email?: string; phone?: string; password: string }) => {
    try {
      await login(credentials);
      // Give the store a moment to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { user: loggedInUser } = useAuthStore.getState();
      console.log('Logged in user after login:', loggedInUser);
      if (loggedInUser) {
        const dashboardPath = getDashboardPath(loggedInUser);
        router.push(dashboardPath);
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }, [login, router]);

  const handleRegister = useCallback(async (data: unknown) => {
    try {
      await register(data);
      // Give the store a moment to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { user: registeredUser } = useAuthStore.getState();
      if (registeredUser) {
        const dashboardPath = getDashboardPath(registeredUser);
        router.push(dashboardPath);
      }
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  }, [register, router]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  const requireAuth = useCallback(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

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