'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';

export default function DashboardSuperAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/super-admin/dashboard');
  }, [router]);

  return <Loading fullScreen text="Redirecting to super admin dashboard..." />;
}
