'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import Loading from '@/components/common/Loading';
import { formatDateTime, cn } from '@/lib/utils';
import ProtectedRoute from '@/components/common/ProtectedRoute';

function AdminAuditLogsContent() {
  const { showToast } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = searchParams.get('tab') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const setTabAndPage = (newTab: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }
    if (newPage === 1) {
      params.delete('page');
    } else {
      params.set('page', newPage.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (tab === 'logins') {
        params.action = 'login';
      }
      const response = await apiClient.getAuditLogs(params);
      const responseData = response.data;
      setLogs(responseData.data || responseData);
      setTotalCount(responseData.meta?.total || (Array.isArray(responseData) ? responseData.length : 0));
    } catch (error: any) {
      showToast(error.message || 'Unable to load audit logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [tab, page]);

  const handlePageChange = (newPage: number) => {
    setTabAndPage(tab, newPage);
  };

  const handleTabChange = (newTab: string) => {
    setTabAndPage(newTab, 1);
  };

  const columns = [
    {
      key: 'action',
      header: 'Action',
      render: (log: any) => (
        <span className={cn(
          "px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider font-mono",
          log.action === 'login' ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-150 text-gray-700"
        )}>
          {log.action || log.type || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (log: any) => log.entityType || log.entity || 'N/A',
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (log: any) => log.user?.name || log.userId || 'System',
    },
    {
      key: 'details',
      header: 'Details',
      render: (log: any) => log.description || JSON.stringify(log.newValues || log.changes || {}),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (log: any) => formatDateTime(log.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track administrative activity and system events</p>
        </div>
        <Button onClick={loadAuditLogs}>Reload</Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'all', name: 'All Activities' },
            { id: 'logins', name: 'Login Activities' },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-150',
                  active
                    ? 'border-primary-600 text-primary-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {t.name}
              </button>
            );
          })}
        </nav>
      </div>

      {isLoading ? (
        <Loading text="Loading audit logs..." />
      ) : (
        <DataTable
          title={tab === 'logins' ? "Login Actions Only" : "All System Events"}
          subtitle="Recent actions performed on the platform"
          columns={columns}
          data={logs}
          keyExtractor={(log) => log.id || `${log.action}-${log.createdAt}-${Math.random()}`}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          onPageChange={handlePageChange}
          emptyMessage="No audit logs available for this filter"
        />
      )}
    </div>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN" allowedUserTypes="SUPER_ADMIN">
      <Suspense fallback={<Loading text="Loading audit logs..." />}>
        <AdminAuditLogsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
