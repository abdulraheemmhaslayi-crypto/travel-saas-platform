'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import Loading from '@/components/common/Loading';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CreditCard, DollarSign, Wallet, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPaymentsPage() {
  const { showToast } = useAppStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const adminRole = params?.adminRole as string || 'admin';

  // Active tab can be payments | refunds | wallet
  const activeTab = searchParams.get('tab') || 'payments';

  const [payments, setPayments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [page, activeTab]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      let queryParams: any = { page, limit: 10 };
      if (activeTab === 'refunds') {
        queryParams.status = 'REFUNDED';
      } else if (activeTab === 'wallet') {
        queryParams.method = 'WALLET';
      }

      const response = await apiClient.getAdminPayments(queryParams);
      const responseData = response.data;
      setPayments(responseData.data || responseData || []);
      setTotalCount(responseData.meta?.total || (Array.isArray(responseData) ? responseData.length : 0));
    } catch (error) {
      showToast('Unable to load payment records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setPage(1);
    router.push(`/${adminRole}/payments?tab=${tab}`);
  };

  const columns = [
    {
      key: 'id',
      header: 'Transaction ID',
      render: (payment: any) => (
        <div>
          <p className="font-bold text-gray-900 font-mono text-xs">#{payment.id?.slice(0, 12)}</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">{payment.provider || payment.gateway || 'STRIPE'}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Customer / Payer',
      render: (payment: any) => (
        <div>
          <p className="font-semibold text-gray-800">{payment.user?.firstName ? `${payment.user.firstName} ${payment.user.lastName}` : 'System user'}</p>
          <p className="text-[10px] text-gray-400">{payment.user?.email || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payment: any) => (
        <span className="font-extrabold text-slate-900">
          {formatCurrency(payment.amount || 0, payment.currency || 'INR')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Billing Status',
      render: (payment: any) => {
        const isSuccess = payment.status === 'COMPLETED' || payment.status === 'PAID' || payment.status === 'SUCCESS';
        const isRefund = payment.status === 'REFUNDED';
        return (
          <Badge variant={isSuccess ? 'success' : isRefund ? 'default' : 'warning'} className="uppercase text-[9px] font-bold">
            {payment.status}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Transaction Date',
      render: (payment: any) => formatDateTime(payment.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href={`/${adminRole}/dashboard`} className="p-2 rounded-lg hover:bg-gray-150 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Financial Control</h1>
            <p className="text-gray-500 mt-1 font-medium">Monitor billing metrics, refund requests, and wallet ledger histories</p>
          </div>
        </div>
        <Button onClick={loadPayments} variant="secondary" className="font-bold flex items-center gap-1.5 shrink-0">
          <RefreshCw className="w-4 h-4" />
          Refresh Records
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto space-x-6">
        {[
          { id: 'payments', label: 'All Payments', icon: <CreditCard className="w-4.5 h-4.5" /> },
          { id: 'refunds', label: 'Refund Requests', icon: <DollarSign className="w-4.5 h-4.5" /> },
          { id: 'wallet', label: 'Wallet Ledgers', icon: <Wallet className="w-4.5 h-4.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-bold tracking-wide border-b-2 shrink-0 transition-all ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading text="Retrieving financial data..." />
      ) : (
        <DataTable
          title={activeTab === 'refunds' ? 'Refund Logs' : activeTab === 'wallet' ? 'Wallet Transactions' : 'Platform Payments'}
          subtitle="Real-time billing transactions"
          columns={columns}
          data={payments}
          keyExtractor={(payment) => payment.id}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          onPageChange={setPage}
          emptyMessage="No billing records matches this category."
        />
      )}
    </div>
  );
}
