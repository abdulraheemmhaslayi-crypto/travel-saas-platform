'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBookingStore } from '@/store/slices/bookingSlice';
import { useAppStore } from '@/store';
import { Booking, BookingFilters, isPaymentPending } from '@/types/booking';
import BookingList from '@/components/booking/BookingList';
import { useSearchParams } from 'next/navigation';
import CancellationModal from '@/components/booking/CancellationModal';
import PaymentForm from '@/components/payments/PaymentForm';
import Modal from '@/components/ui/Modal';
import {
  Ticket,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  IndianRupee,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function BookingsPage() {
  const { bookings, isLoading, getMyBookings, cancelBooking } = useBookingStore();
  const { showToast } = useAppStore();
  const searchParams = useSearchParams();
  const statusParam = searchParams ? searchParams.get('status') : null;
  const viewParam = searchParams ? searchParams.get('view') : null;

  const [filters, setFilters] = useState<BookingFilters>({ status: '' });
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [payTarget, setPayTarget] = useState<Booking | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Sync URL query parameters to filter state ──────────────────────────
  useEffect(() => {
    let targetStatus: BookingFilters['status'] = '';

    if (statusParam) {
      targetStatus = statusParam.toUpperCase() as BookingFilters['status'];
    } else if (viewParam === 'history') {
      targetStatus = 'COMPLETED';
    }

    setFilters((prev) => ({
      ...prev,
      status: targetStatus,
    }));
  }, [statusParam, viewParam]);

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    getMyBookings();
  }, [getMyBookings]);

  // ── Auto-polling when any booking has a pending/processing payment ─────
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    const hasPendingPayment = bookings.some(isPaymentPending);

    if (hasPendingPayment && !pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        await getMyBookings();
        // Re-check — stop if no more pending
        const stillPending = useBookingStore.getState().bookings.some(isPaymentPending);
        if (!stillPending) stopPolling();
      }, 30_000);
    } else if (!hasPendingPayment) {
      stopPolling();
    }

    return stopPolling;
  }, [bookings, getMyBookings, stopPolling]);

  // ── Filtered bookings by active tab ───────────────────────────────────
  const filteredBookings = filters.status
    ? bookings.filter(
      (b) => (b.status ?? '').toUpperCase() === filters.status
    )
    : bookings;

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === 'PAID' || (b.paymentStatus as string) === 'REFUNDED')
    .reduce((sum, b) => sum + (b.finalAmount || b.totalAmount || 0), 0);

  const confirmedCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'CONFIRMED'
  ).length;

  const completedCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'COMPLETED'
  ).length;

  const pendingCount = bookings.filter(
    (b) =>
      (b.status ?? '').toUpperCase() === 'PENDING' ||
      (b.paymentStatus ?? '').toUpperCase() === 'PENDING' ||
      (b.paymentStatus ?? '').toUpperCase() === 'PROCESSING'
  ).length;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await cancelBooking(cancelTarget.id, reason);
      showToast('Booking cancelled successfully. Refund will be processed shortly.', 'success');
      setCancelTarget(null);
      getMyBookings();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to cancel booking';
      showToast(msg, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRefreshStatus = async (id: string) => {
    setIsRefreshing(true);
    try {
      await getMyBookings();
      showToast('Booking status refreshed', 'success');
    } catch {
      showToast('Failed to refresh. Please try again.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPayTarget(null);
    showToast('Payment successful! Your booking is confirmed.', 'success');
    getMyBookings();
  };

  const hasPendingPayments = bookings.some(isPaymentPending);

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0 pb-12">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {bookings.length > 0
              ? `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} total`
              : 'Manage your trip bookings'}
          </p>
        </div>
        {hasPendingPayments && (
          <button
            onClick={() => handleRefreshStatus('')}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-2 rounded-xl border border-primary-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* ── Polling Notice ───────────────────────────────────────────────── */}
      {hasPendingPayments && !isLoading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Verifying your payment
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              We're checking your payment status and will update automatically. Do not make another payment.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Bookings',
              value: bookings.length,
              icon: Ticket,
              color: 'bg-gray-50 border-gray-100 text-gray-700',
              iconColor: 'text-gray-500',
            },
            {
              label: 'Upcoming',
              value: confirmedCount,
              icon: Clock,
              color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
              iconColor: 'text-emerald-500',
            },
            {
              label: 'Completed',
              value: completedCount,
              icon: CheckCircle2,
              color: 'bg-blue-50 border-blue-100 text-blue-700',
              iconColor: 'text-blue-500',
            },
            {
              label: 'Total Spent',
              value: formatCurrency(totalSpent, 'INR'),
              icon: IndianRupee,
              color: 'bg-primary-50 border-primary-100 text-primary-700',
              iconColor: 'text-primary-500',
              isText: true,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-3.5 sm:p-4 rounded-2xl border ${stat.color} flex flex-col gap-2`}
            >
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              <div>
                <p className="text-lg sm:text-xl font-black truncate">
                  {stat.value}
                </p>
                <p className="text-xs font-medium opacity-70 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Booking List ──────────────────────────────────────────────────── */}
      <BookingList
        bookings={bookings}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onCancel={setCancelTarget}
        onPayNow={setPayTarget}
        onRefreshStatus={handleRefreshStatus}
      />

      {/* ── Cancellation Modal ──────────────────────────────────────────── */}
      {cancelTarget && (
        <CancellationModal
          booking={cancelTarget}
          isOpen={!!cancelTarget}
          isLoading={isCancelling}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      {payTarget && (
        <Modal
          isOpen={!!payTarget}
          onClose={() => setPayTarget(null)}
          title={payTarget.paymentStatus === 'FAILED' ? 'Retry Payment' : 'Complete Payment'}
          size="md"
        >
          <div className="space-y-4">
            {payTarget.paymentStatus === 'FAILED' && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
                <p className="text-sm font-bold text-red-800">
                  Previous payment failed
                </p>
                <p className="text-xs text-red-600 leading-relaxed">
                  Possible reasons: Insufficient balance · Network issue · Bank declined · Payment session expired
                </p>
              </div>
            )}
            <PaymentForm
              amount={payTarget.finalAmount || payTarget.totalAmount}
              currency={payTarget.currency || 'INR'}
              bookingId={payTarget.id}
              provider="RAZORPAY"
              onSuccess={handlePaymentSuccess}
              onError={(error) => showToast(error, 'error')}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}