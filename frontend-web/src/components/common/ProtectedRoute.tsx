'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import { getCookie } from '@/lib/cookieUtils';
import { Role, UserType } from '@/types/auth';
import { getDashboardPath } from '@/hooks/useAuth';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
  allowedUserTypes?: UserType | UserType[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const normalizeRole = (role?: string) => String(role || '').toUpperCase();
const normalizeUserType = (userType?: string) => String(userType || '').toUpperCase();

const isMatchingRole = (userRole: string, requiredRole?: Role | Role[]) => {
  if (!requiredRole) return true;
  const normalizedUserRole = normalizeRole(userRole);
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.map(normalizeRole).includes(normalizedUserRole);
};

const isMatchingUserType = (userType: string, allowedUserTypes?: UserType | UserType[]) => {
  if (!allowedUserTypes) return true;
  const normalizedUserType = normalizeUserType(userType);
  const types = Array.isArray(allowedUserTypes) ? allowedUserTypes : [allowedUserTypes];
  return types.map(normalizeUserType).includes(normalizedUserType);
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedUserTypes,
  fallback,
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, isLoading, isInitializing } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken') || getCookie('accessToken'));

  useEffect(() => {
    if (!hasHydrated || isInitializing || isLoading) {
      return;
    }

    if (!isAuthenticated && !hasToken) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
      return;
    }

    if (user) {
      const hasRole = isMatchingRole(user.role, requiredRole);
      const hasUserType = isMatchingUserType(user.userType, allowedUserTypes);

      if (!hasRole || !hasUserType) {
        router.push(getDashboardPath(user));
      }
    }
  }, [hasHydrated, isInitializing, isLoading, isAuthenticated, hasToken, user, router, pathname, redirectTo, requiredRole, allowedUserTypes]);

  if (!hasHydrated || isInitializing || isLoading || (!isAuthenticated && hasToken)) {
    return <Loading fullScreen text="Checking authentication..." />;
  }

  if (!isAuthenticated && !hasToken) {
    return fallback || <Loading fullScreen text="Redirecting to login..." />;
  }

  if (user) {
    const hasRole = isMatchingRole(user.role, requiredRole);
    const hasUserType = isMatchingUserType(user.userType, allowedUserTypes);

    if (!hasRole || !hasUserType) {
      return <Loading fullScreen text="Redirecting..." />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
