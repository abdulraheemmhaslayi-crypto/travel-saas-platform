'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Loading from '@/components/common/Loading';
import { cn } from '@/lib/utils';

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

  const pathname = usePathname();
  const isPassengerPage = pathname === '/dashboard/passenger';

  return (
    <ProtectedRoute allowedUserTypes={['PASSENGER', 'DRIVER', 'FLEET_OWNER', 'SUPPORT']}>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full overflow-x-hidden">
        <Navbar />

        <div className="flex flex-1 min-w-0 w-full overflow-x-hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main
            className={cn(
              'flex-1 min-w-0 w-full overflow-x-hidden',
              isPassengerPage ? 'pb-[72px] lg:pb-8 min-h-0' : 'pb-24 lg:pb-8 min-h-[calc(100vh-4rem)]'
            )}
          >
            <div
              className={cn(
                'max-w-7xl mx-auto w-full min-w-0',
                isPassengerPage ? 'p-0 sm:px-6 sm:py-8' : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-8'
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
