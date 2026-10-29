'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';

export default function DashboardAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return <Loading fullScreen text="Redirecting to admin dashboard..." />;
}
