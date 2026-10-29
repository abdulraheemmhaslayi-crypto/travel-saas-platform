'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';

export default function DashboardVehicleOwnerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/fleet-owner');
  }, [router]);

  return <Loading fullScreen text="Redirecting to vehicle owner dashboard..." />;
}
