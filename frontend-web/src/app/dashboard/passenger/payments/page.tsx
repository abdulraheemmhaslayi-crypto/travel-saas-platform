'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePassengerStore } from '@/store/slices/passengerStore';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import Badge from '@/components/ui/Badge';
import {
  CreditCard,
  DollarSign,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet,
  Receipt,
  Filter,
} from 'lucide-react';

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'all';
  const { payments, paymentsLoading, getMyPayments } = usePassengerStore();
  const [activeTab, setActiveTab] = useState(tab);

  useEffect(() => {
    getMyPayments();
  }, [getMyPayments]);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  const filteredPayments = activeTab === 'refunds'
    ? payments.filter((p) => p.paymentType === 'REFUND' || p.refundStatus)
    : payments;

  if (paymentsLoading) return <Loading text="Loading payment history..." />;

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    PENDING: { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-700', label: 'Pending' },
    PROCESSING: { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-700', label: 'Processing' },
    COMPLETED: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-700', label: 'Completed' },
    FAILED: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-50 text-red-700', label: 'Failed' },
    REFUNDED: { icon: <RotateCcw className="w-3.5 h-3.5" />, color: 'bg-purple-50 text-purple-700', label: 'Refunded' },
    CANCELLED: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-gray-100 text-gray-600', label: 'Cancelled' },
  };

  const typeIcons: Record<string, React.ReactNode> = {
    BOOKING: <Receipt className="w-4 h-4" />,
    REFUND: <RotateCcw className="w-4 h-4" />,
    WALLET_TOPUP: <ArrowDownRight className="w-4 h-4" />,
    WALLET_WITHDRAWAL: <ArrowUpRight className="w-4 h-4" />,
  };

  const typeColors: Record<string, string> = {
    BOOKING: 'bg-blue-100 text-blue-600',
    REFUND: 'bg-emerald-100 text-emerald-600',
    WALLET_TOPUP: 'bg-violet-100 text-violet-600',
    WALLET_WITHDRAWAL: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 rounded-xl bg-indigo-100">
            <CreditCard className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Payment History</h1>
        </div>
        <p className="text-sm text-gray-500">
          View all your payments, refunds, and transaction details
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'all', label: 'All Payments', count: payments.length },
          { id: 'refunds', label: 'Refunds', count: payments.filter((p) => p.paymentType === 'REFUND' || p.refundStatus).length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-xs ${activeTab === t.id ? 'text-primary-600' : 'text-gray-400'}`}>
                ({t.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          title={activeTab === 'refunds' ? 'No refunds' : 'No payments yet'}
          description={activeTab === 'refunds'
            ? 'You have no refund transactions.'
            : 'Your payment history will appear here after you make a booking.'}
          customIcon={<Receipt className="w-8 h-8 text-gray-400" />}
        />
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => {
            const status = statusConfig[(payment.status || '').toUpperCase()] || statusConfig.PENDING;
            const typeIcon = typeIcons[(payment.paymentType || '').toUpperCase()] || <DollarSign className="w-4 h-4" />;
            const typeColor = typeColors[(payment.paymentType || '').toUpperCase()] || 'bg-gray-100 text-gray-600';

            return (
              <div
                key={payment.id}
                className="rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all duration-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${typeColor}`}>
                    {typeIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {(payment.paymentType || 'Payment').replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {payment.method?.replace(/_/g, ' ') || 'Unknown method'}
                          {payment.transactionId && ` · ${payment.transactionId.substring(0, 12)}...`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-base font-extrabold ${
                          payment.paymentType === 'REFUND' ? 'text-emerald-600' : 'text-gray-900'
                        }`}>
                          {payment.paymentType === 'REFUND' ? '+' : ''}{formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(payment.createdAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Refund Progress */}
                    {payment.refundStatus && (
                      <div className="mt-3 p-2.5 rounded-xl bg-gray-50">
                        <p className="text-xs font-semibold text-gray-700 mb-1.5">Refund Status</p>
                        <div className="flex items-center gap-2">
                          {['PENDING', 'PROCESSING', 'COMPLETED'].map((step, i) => {
                            const refundUpper = (payment.refundStatus || '').toUpperCase();
                            const stepIndex = ['PENDING', 'PROCESSING', 'COMPLETED'].indexOf(refundUpper);
                            const isActive = i <= stepIndex;
                            const isCurrent = i === stepIndex;
                            return (
                              <React.Fragment key={step}>
                                <div className={`flex items-center gap-1 ${isActive ? 'text-emerald-600' : 'text-gray-300'}`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                  } ${isCurrent ? 'ring-2 ring-emerald-200' : ''}`}>
                                    {isActive ? '✓' : i + 1}
                                  </div>
                                  <span className="text-[10px] font-medium">{step.charAt(0) + step.slice(1).toLowerCase()}</span>
                                </div>
                                {i < 2 && <div className={`flex-1 h-px ${isActive ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        {payment.refundAmount && (
                          <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                            Refund: {formatCurrency(payment.refundAmount, payment.currency)}
                          </p>
                        )}
                      </div>
                    )}

                    {payment.failureReason && (
                      <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-xs text-red-600">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          {payment.failureReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
