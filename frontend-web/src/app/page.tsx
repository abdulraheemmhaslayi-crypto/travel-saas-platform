'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import Loading from '@/components/common/Loading';
import { getDashboardPath } from '@/hooks/useAuth';

export default function RootHomePage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        router.replace(getDashboardPath(user));
      } else {
        router.replace('/dashboard/passenger');
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  return <Loading fullScreen text="Loading dashboard..." />;
}
