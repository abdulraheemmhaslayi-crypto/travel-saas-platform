'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Loading from '@/components/common/Loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isLoading, isInitializing } = useAuth();

  if (isInitializing) {
    return <Loading fullScreen text="Resolving account role and initializing..." />;
  }

  if (isLoading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  return (
    <ProtectedRoute allowedUserTypes={['PASSENGER', 'DRIVER', 'FLEET_OWNER', 'SUPPORT']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="flex-1 min-h-[calc(100vh-4rem)] pb-20 lg:pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>

        <MobileNav />
      </div>
    </ProtectedRoute>
  );
}
