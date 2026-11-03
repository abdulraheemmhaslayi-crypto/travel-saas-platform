'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const PUBLIC_GUEST_PASSENGER_ROUTES = [
  '/dashboard/passenger',
  '/dashboard/passenger/popular-routes',
  '/dashboard/passenger/nearby-trips',
];

export default function PassengerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_GUEST_PASSENGER_ROUTES.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <ProtectedRoute allowedUserTypes="PASSENGER">{children}</ProtectedRoute>;
}
