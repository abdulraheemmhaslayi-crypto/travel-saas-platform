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
  RefreshCw,
  IndianRupee,
  Sparkles,
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
        const stillPending = useBookingStore.getState().bookings.some(isPaymentPending);
        if (!stillPending) stopPolling();
      }, 30_000);
    } else if (!hasPendingPayment) {
      stopPolling();
    }

    return stopPolling;
  }, [bookings, getMyBookings, stopPolling]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === 'PAID' || (b.paymentStatus as string) === 'REFUNDED')
    .reduce((sum, b) => sum + (Number(b.finalAmount) || Number(b.totalAmount) || 0), 0);

  const confirmedCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'CONFIRMED'
  ).length;

  const completedCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'COMPLETED'
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
      {/* ── Page Header (Clean Mobile Greeting) ────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {bookings.length > 0
              ? `${bookings.length} journey${bookings.length !== 1 ? 's' : ''} booked`
              : 'Manage and track all your rides'}
          </p>
        </div>

        <button
          onClick={handleRefreshStatus}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-colors disabled:opacity-50 active:scale-95 shadow-2xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Payment Polling Alert Banner ─────────────────────────────────── */}
      {hasPendingPayments && !isLoading && (
        <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-blue-50 border border-blue-200/90 rounded-2xl animate-pulse">
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

      {/* ── Stats Strip (Unified 4-Column Card) ─────────────────────────── */}
      {bookings.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-200/90 shadow-2xs p-2.5 sm:p-3.5">
          <div className="grid grid-cols-4 divide-x divide-gray-100 text-center">
            <div className="px-1 sm:px-2">
              <p className="text-sm sm:text-lg font-black text-gray-900 leading-tight">
                {bookings.length}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 font-semibold mt-0.5">Total</p>
            </div>

            <div className="px-1 sm:px-2">
              <p className="text-sm sm:text-lg font-black text-emerald-600 leading-tight">
                {confirmedCount}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 font-semibold mt-0.5">Upcoming</p>
            </div>

            <div className="px-1 sm:px-2">
              <p className="text-sm sm:text-lg font-black text-blue-600 leading-tight">
                {completedCount}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 font-semibold mt-0.5">Completed</p>
            </div>

            <div className="px-1 sm:px-2">
              <p className="text-xs sm:text-base font-black text-purple-600 leading-tight truncate">
                ₹{Math.round(totalSpent).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 font-semibold mt-0.5">Spent</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking List & Cards ────────────────────────────────────────── */}
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

      {/* ── Payment Modal (Retry / Complete Payment) ────────────────────── */}
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
