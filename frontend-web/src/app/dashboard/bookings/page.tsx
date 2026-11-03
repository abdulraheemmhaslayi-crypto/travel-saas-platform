'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
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
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

function BookingsContent() {
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

  // Sync URL query parameters to filter state
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

  // Initial load
  useEffect(() => {
    getMyBookings();
  }, [getMyBookings]);

  // Auto-polling when any booking has a pending/processing payment
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
        const stillPending = useBookingStore.getState().bookings.some(isPaymentPending);
        if (!stillPending) stopPolling();
      }, 30_000);
    } else if (!hasPendingPayment) {
      stopPolling();
    }

    return stopPolling;
  }, [bookings, getMyBookings, stopPolling]);

  // Stats calculation
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === 'PAID' || (b.paymentStatus as string) === 'REFUNDED')
    .reduce((sum, b) => sum + (Number(b.finalAmount) || Number(b.totalAmount) || 0), 0);

  const confirmedCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'CONFIRMED'
  ).length;

  const completedCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'COMPLETED'
  ).length;

  const pendingCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'PENDING'
  ).length;

  // Handlers
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

  const handleRefreshStatus = async () => {
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
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0 pb-28 md:pb-12">
      {/* Header section */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {bookings.length > 0
              ? `${bookings.length} journey${bookings.length !== 1 ? 's' : ''} booked`
              : 'Manage and track all your rides'}
          </p>
        </div>

        <button
          onClick={handleRefreshStatus}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors disabled:opacity-50 active:scale-95 shadow-2xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Payment Polling Alert Banner */}
      {hasPendingPayments && !isLoading && (
        <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-blue-50 border border-blue-200 rounded-2xl animate-pulse">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-blue-900">
              Verifying payment status...
            </p>
            <p className="text-[11px] text-blue-600 mt-0.5 leading-tight">
              We are checking your confirmation. Please do not make another payment.
            </p>
          </div>
        </div>
      )}

      {/* Interactive 4-Card Overview Strip */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Card 1: Total */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, status: '' }))}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex items-center justify-between gap-2.5 ${
              filters.status === ''
                ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-500 block">Total</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                {bookings.length}
              </p>
              <span className="text-[10px] text-slate-400 font-medium block truncate">All Journeys</span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </button>

          {/* Card 2: Upcoming */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, status: 'CONFIRMED' }))}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex items-center justify-between gap-2.5 ${
              filters.status === 'CONFIRMED'
                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-500 block">Upcoming</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 leading-tight mt-0.5">
                {confirmedCount}
              </p>
              <span className="text-[10px] text-slate-400 font-medium block truncate">Confirmed</span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </button>

          {/* Card 3: Pending */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, status: 'PENDING' }))}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex items-center justify-between gap-2.5 ${
              filters.status === 'PENDING'
                ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-500 block">Pending</span>
              <p className="text-xl sm:text-2xl font-black text-amber-600 leading-tight mt-0.5">
                {pendingCount}
              </p>
              <span className="text-[10px] text-slate-400 font-medium block truncate">Action Needed</span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </button>

          {/* Card 4: Completed */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, status: 'COMPLETED' }))}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex items-center justify-between gap-2.5 ${
              filters.status === 'COMPLETED'
                ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-500 block">Completed</span>
              <p className="text-xl sm:text-2xl font-black text-purple-600 leading-tight mt-0.5">
                {completedCount}
              </p>
              <span className="text-[10px] text-slate-400 font-medium block truncate">Past Trips</span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Booking List & Filter Tabs */}
      <BookingList
        bookings={bookings}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onCancel={setCancelTarget}
        onPayNow={setPayTarget}
        onRefreshStatus={handleRefreshStatus}
      />

      {/* Cancellation Modal */}
      {cancelTarget && (
        <CancellationModal
          booking={cancelTarget}
          isOpen={!!cancelTarget}
          isLoading={isCancelling}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {/* Payment Modal */}
      {payTarget && (
        <Modal
          isOpen={!!payTarget}
          onClose={() => setPayTarget(null)}
          title={payTarget.paymentStatus === 'FAILED' ? 'Retry Payment' : 'Complete Payment'}
          size="md"
        >
          <div className="space-y-3.5">
            {payTarget.paymentStatus === 'FAILED' && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1">
                <p className="text-xs font-bold text-red-800">
                  Previous payment attempt failed
                </p>
                <p className="text-[11px] text-red-600 leading-relaxed">
                  Possible reasons: Network issue, bank decline, or expired session. Please try again.
                </p>
              </div>
            )}
            <PaymentForm
              amount={Number(payTarget.finalAmount) || Number(payTarget.totalAmount) || 0}
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

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <p className="text-slate-500 font-medium animate-pulse">Loading bookings...</p>
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
