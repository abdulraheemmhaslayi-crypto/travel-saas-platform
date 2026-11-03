'use client';

import React, { useState, Suspense } from 'react';
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
  const { user, isAuthenticated, isLoading, isInitializing } = useAuth();
  const pathname = usePathname();

  const isPublicGuestRoute =
    pathname === '/dashboard/passenger' ||
    pathname?.startsWith('/dashboard/trips') ||
    pathname === '/dashboard/passenger/popular-routes' ||
    pathname === '/dashboard/passenger/nearby-trips';

  const isMobileAppPage =
    pathname === '/dashboard/passenger' ||
    pathname?.startsWith('/dashboard/trips/') ||
    pathname === '/dashboard/trips';

  // Only show fullScreen blocking loading state for private/protected routes
  if (isInitializing && !isPublicGuestRoute) {
    return <Loading fullScreen text="Resolving account role and initializing..." />;
  }

  if (isLoading && !isPublicGuestRoute) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  const dashboardContent = (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full overflow-x-hidden">
      <Navbar />

      <div className="flex flex-1 min-w-0 w-full overflow-x-hidden">
        {/* Only show persistent dashboard sidebar to logged-in users. Guests get clean full-width search. */}
        {isAuthenticated && (
          <Suspense fallback={<div className="w-64 bg-white border-r border-gray-200 hidden lg:block" />}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </Suspense>
        )}

        <main
          className={cn(
            'flex-1 min-w-0 w-full overflow-x-hidden',
            isMobileAppPage ? 'pb-[72px] lg:pb-8 min-h-0' : 'pb-24 lg:pb-8 min-h-[calc(100vh-4rem)]'
          )}
        >
          <div
            className={cn(
              'w-full min-w-0',
              isAuthenticated ? 'max-w-7xl mx-auto' : 'w-full',
              isMobileAppPage ? 'p-0 sm:px-6 sm:py-8' : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-8'
            )}
          >
            <Suspense fallback={<Loading fullScreen text="Loading content..." />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );

  if (isPublicGuestRoute) {
    return dashboardContent;
  }

  return (
    <ProtectedRoute allowedUserTypes={['PASSENGER', 'DRIVER', 'FLEET_OWNER', 'SUPPORT']}>
      {dashboardContent}
    </ProtectedRoute>
  );
}
