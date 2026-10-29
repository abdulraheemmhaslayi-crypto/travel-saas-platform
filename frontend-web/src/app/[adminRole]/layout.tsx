'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Loading from '@/components/common/Loading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading } = useAuthStore();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const adminRole = params?.adminRole as string;

  const normalizedRole = String(user?.role || '').toUpperCase();
  const isCorrectRolePath =
    (normalizedRole === 'SUPER_ADMIN' && adminRole === 'super-admin') ||
    (normalizedRole === 'ADMIN' && adminRole === 'admin');

  useEffect(() => {
    if (user && !isLoading) {
      if (normalizedRole === 'SUPER_ADMIN' && adminRole !== 'super-admin') {
        const target = pathname.replace(/^\/admin/, '/super-admin');
        router.replace(target);
      } else if (normalizedRole === 'ADMIN' && adminRole !== 'admin') {
        const target = pathname.replace(/^\/super-admin/, '/admin');
        router.replace(target);
      }
    }
  }, [user, isLoading, adminRole, normalizedRole, pathname, router]);

  if (isLoading || (user && !isCorrectRolePath)) {
    return <Loading fullScreen text="Loading admin panel..." />;
  }

  return (
    <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-gray-100">
        <div className="flex">
          <AdminSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          
          <main className="flex-1 min-h-screen">
            {/* Mobile header */}
            <div className="lg:hidden bg-gray-900 text-white p-4 flex items-center justify-between">
              <span className="font-semibold">Admin Panel</span>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}