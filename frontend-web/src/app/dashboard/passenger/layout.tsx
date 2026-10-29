'use client';

import React from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function PassengerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedUserTypes="PASSENGER">{children}</ProtectedRoute>;
}
