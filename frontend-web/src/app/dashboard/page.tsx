'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import Loading from '@/components/common/Loading';
import { getDashboardPath } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user) {
      const targetPath = getDashboardPath(user);
      if (!pathname.startsWith(targetPath)) {
        router.replace(targetPath);
      }
    }
  }, [user, isLoading, router, pathname]);

  return (
    <Loading fullScreen text="Redirecting to your dashboard..." />
  );
}