'use client';

import React from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function FleetOwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedUserTypes="FLEET_OWNER">{children}</ProtectedRoute>;
}
      