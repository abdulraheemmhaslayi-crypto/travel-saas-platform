'use client';

import React from 'react';
import Link from 'next/link';
import { Booking, isCancellable, getCancelledByLabel } from '@/types/booking';
import { formatCurrency, formatShortAddress, getTripVehicleImage, cn } from '@/lib/utils';
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  CreditCard,
  Download,
  Phone,
  HeadphonesIcon,
  RefreshCw,
  Star,
  ChevronRight,
  Clock,
  Hash,
  Share2,
  Car,
} from 'lucide-react';
import BookingStatus, { PaymentStatusBadge } from './BookingStatus';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (booking: Booking) => void;
  onPayNow?: (booking: Booking) => void;
  onRefreshStatus?: (id: string) => void;
  variant?: 'default' | 'compact';
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onPayNow,
  onRefreshStatus,
  variant = 'default',
}) => {
  const { showToast } = useAppStore();
  const trip = booking.trip;
  
  // Clean short city names for mobile
  const rawOrigin = trip?.origin || trip?.source || '—';
  const rawDestination = trip?.destination || '—';
  const cleanOrigin = formatShortAddress(rawOrigin);
  const cleanDestination = formatShortAddress(rawDestination);

  // Normalize departure date
  const departureRaw = trip?.departureDate || trip?.departureTime;
  const departureDate = departureRaw ? new Date(departureRaw) : null;
  const departureDateStr = departureDate
    ? departureDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : '—';
  const departureTimeStr = departureDate
    ? departureDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const isUpcoming = departureDate ? departureDate > new Date() : false;
  const bookingStatus = (booking.status ?? '').toUpperCase();
  const paymentStatus = (booking.paymentStatus ?? '').toUpperCase();

  const canCancel = isCancellable(booking);
  const canPayNow = bookingStatus === 'PENDING' && (paymentStatus === 'PENDING' || paymentStatus === 'FAILED' || !paymentStatus);
  const canRetryPayment = paymentStatus === 'FAILED';
  const isProcessing = paymentStatus === 'PROCESSING';
  const showDownload = bookingStatus === 'CONFIRMED' && paymentStatus === 'PAID';
  const showRefundInfo = paymentStatus === 'REFUND_PENDING' || paymentStatus === 'REFUNDED' || paymentStatus === 'REFUND_COMPLETED';
  const cancelledByLabel = bookingStatus === 'CANCELLED' ? getCancelledByLabel(booking.cancelledBy) : null;

  const vehicleImg = getTripVehicleImage(trip?.vehicle);
  const vehicleName = trip?.vehicle
    ? `${trip.vehicle.brand} ${trip.vehicle.model}`
    : trip?.vehicleName || trip?.vehicleType || 'Verified Vehicle';

  // Amount calculation with safe fallback
  const bookingPrice = Number(booking.finalAmount) || Number(booking.totalAmount) || Number((trip as any)?.basePrice) || 400;

  // ── Compact variant ────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <Link
        href={`/dashboard/bookings/${booking.id}`}
        className="block bg-white border border-gray-200/90 rounded-2xl p-3 sm:p-4 hover:shadow-xs hover:border-blue-300 transition-all group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-gray-900 truncate">
              <span className="truncate">{cleanOrigin}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{cleanDestination}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              {departureDateStr}{departureTimeStr && ` · ${departureTimeStr}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BookingStatus status={booking.status} showLabel={false} size="sm" />
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </Link>
    );
  }

  // ── Default Mobile-First Card ──────────────────────────────────────────────
  return (
    <div className="w-full min-w-0 max-w-full bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200 relative">
      {/* ── Payment Alert Banners ── */}
      {paymentStatus === 'FAILED' && (
        <div className="bg-red-50 border-b border-red-100 px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-red-700">
          <CreditCard className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <span>Payment failed — retry to confirm seat</span>
        </div>
      )}
      {isProcessing && (
        <div className="bg-blue-50 border-b border-blue-100 px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-blue-700">
          <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin text-blue-500" />
          <span>Payment verifying...</span>
        </div>
      )}
      {showRefundInfo && paymentStatus === 'REFUND_PENDING' && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-indigo-700">
          <RefreshCw className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
          <span>Refund of {formatCurrency(booking.refundAmount ?? 0, 'INR')} initiated</span>
        </div>
      )}
      {cancelledByLabel && booking.cancelledBy !== 'PASSENGER' && (
        <div className="bg-orange-50 border-b border-orange-100 px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-orange-700">
          <Clock className="w-3.5 h-3.5 shrink-0 text-orange-500" />
          <span>{cancelledByLabel} — refund will be processed</span>
        </div>
      )}

      {/* ── Card Main Body ── */}
      <div className="p-3.5 sm:p-5 space-y-3">
        {/* Top Header: Vehicle Info + Amount & Status */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <img
              src={vehicleImg}
              alt={vehicleName}
              className="w-12 h-8 sm:w-14 sm:h-9 object-contain drop-shadow-xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate capitalize">
                {vehicleName}
              </h3>
              <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                #{booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center shrink-0">
            <p className="text-xs sm:text-sm font-black text-blue-600 leading-none">
              {formatCurrency(bookingPrice, booking.currency || 'INR')}
            </p>
            <div className="mt-1">
              <BookingStatus status={booking.status} size="sm" />
            </div>
          </div>
        </div>

        {/* ── Route Journey Path (Connected Dots) ── */}
        <div className="bg-slate-50/70 rounded-2xl p-2.5 sm:p-3 border border-gray-150/80 space-y-1.5">
          {/* Pickup */}
          <div className="flex items-start gap-2 min-w-0">
            <div className="flex flex-col items-center mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shrink-0" />
              <span className="w-0.5 h-3 bg-gray-300 my-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {cleanOrigin}
                </p>
                {departureTimeStr && (
                  <span className="text-[10px] font-bold text-gray-500 shrink-0">
                    {departureTimeStr}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 truncate leading-tight">
                {rawOrigin}
              </p>
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-start gap-2 min-w-0">
            <span className="w-2 h-2 rounded-sm bg-rose-500 ring-2 ring-rose-100 shrink-0 mt-1" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">
                {cleanDestination}
              </p>
              <p className="text-[10px] text-gray-400 truncate leading-tight">
                {rawDestination}
              </p>
            </div>
          </div>
        </div>

        {/* ── Key Travel Chips (Date, Seat Number, Passengers, Payment) ── */}
        <div className="flex flex-wrap items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-gray-600">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700">
            <Calendar className="w-3 h-3 text-gray-500 shrink-0" />
            <span>{departureDateStr}</span>
          </div>

          {booking.seatNumbers && booking.seatNumbers.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold">
              <Hash className="w-3 h-3 text-blue-500 shrink-0" />
              <span>Seat {booking.seatNumbers.join(', ')}</span>
            </div>
          )}

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700">
            <Users className="w-3 h-3 text-gray-500 shrink-0" />
            <span>{booking.seats || 1} {(booking.seats || 1) === 1 ? 'Seat' : 'Seats'}</span>
          </div>

          <div className="ml-auto shrink-0">
            <PaymentStatusBadge status={booking.paymentStatus} size="sm" />
          </div>
        </div>

        {/* ── Driver Detail Strip (If Assigned) ── */}
        {trip?.driver && (
          <div className="p-2 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                {trip.driver.user?.firstName?.[0] || 'D'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate">
                  Capt. {trip.driver.user?.firstName || 'Assigned Driver'}
                </p>
                <p className="text-[9px] text-gray-400 truncate flex items-center gap-1">
                  <span>Verified Driver</span>
                  <span className="opacity-40">•</span>
                  <span className="text-amber-600 font-bold flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> 4.8
                  </span>
                </p>
              </div>
            </div>

            {trip.driver.user?.phone && isUpcoming && bookingStatus === 'CONFIRMED' && (
              <a
                href={`tel:${trip.driver.user.phone}`}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shrink-0 transition-colors"
                title="Call Driver"
              >
                <Phone className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* ── Action Buttons Row (Clean & Mobile-Optimized) ── */}
        <div className="pt-1.5 border-t border-gray-100 flex flex-col gap-2">
          {/* Primary Action Button (State dependent) */}
          {canPayNow && onPayNow ? (
            <button
              type="button"
              onClick={() => onPayNow(booking)}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{canRetryPayment ? 'Retry Payment' : 'Pay Now to Confirm Seat'}</span>
            </button>
          ) : isProcessing && onRefreshStatus ? (
            <button
              type="button"
              onClick={() => onRefreshStatus(booking.id)}
              className="w-full h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Check Payment Status</span>
            </button>
          ) : (
            <Link
              href={`/dashboard/bookings/${booking.id}`}
              className="w-full"
            >
              <button
                type="button"
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Ticket & Trip Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          )}

          {/* Secondary Actions (Clean horizontal icon & pill row) */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {/* Download Ticket (Confirmed bookings) */}
            {showDownload && (
              <Link href={`/dashboard/bookings/${booking.id}`} className="flex-1">
                <button
                  type="button"
                  className="w-full h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Ticket</span>
                </button>
              </Link>
            )}

            {/* Rebook (Completed / Cancelled bookings) */}
            {(bookingStatus === 'COMPLETED' || bookingStatus === 'CANCELLED') && (
              <Link
                href={`/dashboard/trips/search?origin=${encodeURIComponent(rawOrigin)}&destination=${encodeURIComponent(rawDestination)}`}
                className="flex-1"
              >
                <button
                  type="button"
                  className="w-full h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rebook</span>
                </button>
              </Link>
            )}

            {/* Share Button */}
            <button
              type="button"
              onClick={() => {
                const shareData = {
                  title: `My Trip on TravelFlow`,
                  text: `Travelling from ${cleanOrigin} to ${cleanDestination} on ${departureDateStr}. Ref: ${booking.id.slice(0, 8).toUpperCase()}.`,
                  url: typeof window !== 'undefined' ? `${window.location.origin}/dashboard/bookings/${booking.id}` : '',
                };
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share(shareData).catch(console.error);
                } else {
                  navigator.clipboard.writeText(shareData.url).then(() => {
                    showToast('Trip booking link copied to clipboard!', 'success');
                  }).catch(console.error);
                }
              }}
              className="h-8 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] active:scale-95 transition-all flex items-center justify-center gap-1"
              title="Share Trip"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Support Link */}
            <Link href="/dashboard/support">
              <button
                type="button"
                className="h-8 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] active:scale-95 transition-all flex items-center justify-center gap-1"
                title="Help & Support"
              >
                <HeadphonesIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Support</span>
              </button>
            </Link>

            {/* Cancel Booking Button (If Cancellable) */}
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(booking)}
                className="h-8 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] active:scale-95 transition-all ml-auto"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
