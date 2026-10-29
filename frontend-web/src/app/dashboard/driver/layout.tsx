'use client';

import React from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function DriverDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedUserTypes="DRIVER">{children}</ProtectedRoute>;
}
     