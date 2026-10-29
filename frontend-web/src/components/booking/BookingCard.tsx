'use client';

import React from 'react';
import Link from 'next/link';
import { Booking, isCancellable, getCancelledByLabel } from '@/types/booking';
import { formatCurrency } from '@/lib/utils';
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
  Bus,
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
  const origin = trip?.origin || trip?.source || '—';
  const destination = trip?.destination || '—';

  // Normalize departure date (backend may use departureTime or departureDate)
  const departureRaw = trip?.departureDate || trip?.departureTime;
  const departureDate = departureRaw ? new Date(departureRaw) : null;
  const departureDateStr = departureDate
    ? departureDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : '—';
  const departureTimeStr = departureDate
    ? departureDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const isUpcoming = departureDate ? departureDate > new Date() : false;
  const bookingStatus = (booking.status ?? '').toUpperCase();
  const paymentStatus = (booking.paymentStatus ?? '').toUpperCase();

  const canCancel = isCancellable(booking);
  const canPayNow = bookingStatus === 'PENDING' && (paymentStatus === 'PENDING' || paymentStatus === 'FAILED');
  const canRetryPayment = paymentStatus === 'FAILED';
  const isProcessing = paymentStatus === 'PROCESSING';
  const showDownload = bookingStatus === 'CONFIRMED' && paymentStatus === 'PAID';
  const showRateTrip = bookingStatus === 'COMPLETED';
  const showRefundInfo = paymentStatus === 'REFUND_PENDING' || paymentStatus === 'REFUNDED' || paymentStatus === 'REFUND_COMPLETED';
  const cancelledByLabel = bookingStatus === 'CANCELLED' ? getCancelledByLabel(booking.cancelledBy) : null;

  // ── Compact variant ──────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <Link
        href={`/dashboard/bookings/${booking.id}`}
        className="block bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-primary-100 transition-all group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 truncate">
              <span className="truncate">{origin}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{destination}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {departureDateStr}{departureTimeStr && ` · ${departureTimeStr}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BookingStatus status={booking.status} showLabel={false} size="sm" />
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors" />
          </div>
        </div>
      </Link>
    );
  }

  // ── Default full card ────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">

      {/* ── Payment Alert Banner ─────────────────────────────────────────── */}
      {paymentStatus === 'FAILED' && (
        <div className="bg-red-50 border-b border-red-100 px-5 py-2.5 flex items-center gap-2 text-xs font-semibold text-red-700">
          <CreditCard className="w-3.5 h-3.5 shrink-0" />
          Payment failed — please retry to confirm your booking
        </div>
      )}
      {isProcessing && (
        <div className="bg-blue-50 border-b border-blue-100 px-5 py-2.5 flex items-center gap-2 text-xs font-semibold text-blue-700">
          <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
          Payment is being verified — do not make another payment
        </div>
      )}
      {showRefundInfo && paymentStatus === 'REFUND_PENDING' && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-2.5 flex items-center gap-2 text-xs font-semibold text-indigo-700">
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          Refund of {formatCurrency(booking.refundAmount ?? 0, booking.currency)} has been initiated
        </div>
      )}
      {cancelledByLabel && booking.cancelledBy !== 'PASSENGER' && (
        <div className="bg-orange-50 border-b border-orange-100 px-5 py-2.5 flex items-center gap-2 text-xs font-semibold text-orange-700">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {cancelledByLabel} — a refund will be processed if payment was made
        </div>
      )}

      {/* ── Card Body ────────────────────────────────────────────────────── */}
      <div className="p-5">

        {/* Header: Status Badges + Amount */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatus status={booking.status} size="sm" />
            <PaymentStatusBadge status={booking.paymentStatus} size="sm" />
          </div>
          <div className="sm:text-right shrink-0">
            <p className="text-xl font-black text-gray-900">
              {formatCurrency(booking.finalAmount || booking.totalAmount, booking.currency)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.seats} seat{booking.seats !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800 min-w-0">
            <span className="truncate">{origin}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{destination}</span>
          </div>
        </div>

        {/* Details row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-4">
          {departureDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {departureDateStr}
              {departureTimeStr && (
                <span className="font-semibold text-gray-700"> · {departureTimeStr}</span>
              )}
            </span>
          )}
          {trip?.vehicleType && (
            <span className="flex items-center gap-1">
              <Bus className="w-3.5 h-3.5" />
              {trip.vehicleType}
            </span>
          )}
          {booking.seats > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {booking.seats} Passenger{booking.seats !== 1 ? 's' : ''}
            </span>
          )}
          {booking.seatNumbers && booking.seatNumbers.length > 0 && (
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" />
              Seat{booking.seatNumbers.length > 1 ? 's' : ''}: {booking.seatNumbers.join(', ')}
            </span>
          )}
        </div>

        {/* Driver & Vehicle details */}
        {trip?.driver && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50/30 border border-gray-100 space-y-3">
            {/* Driver info */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                  {trip.driver.user?.profileImage ? (
                    <img
                      src={trip.driver.user.profileImage}
                      alt={trip.driver.user.firstName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>
                      {trip.driver.user?.firstName?.[0] || 'D'}
                      {trip.driver.user?.lastName?.[0] || ''}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-400">Driver</p>
                  <p className="text-xs font-bold text-gray-800">
                    {trip.driver.user?.firstName} {trip.driver.user?.lastName}
                  </p>
                </div>
              </div>
              {trip.driver.rating && (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-[10px] font-bold text-amber-700">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>{trip.driver.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Vehicle info */}
            {trip.vehicle && (
              <div className="flex items-center gap-2.5 pt-2.5 border-t border-gray-200/50 text-xs text-gray-600">
                <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-850 truncate text-[11px]">
                    {trip.vehicle.color && `${trip.vehicle.color} `}
                    {trip.vehicle.brand} {trip.vehicle.model}
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono bg-gray-100 px-1 py-0.5 rounded border border-gray-250 inline-block mt-0.5">
                    {trip.vehicle.registrationNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking meta */}
        <div className="flex items-center justify-between text-xs text-gray-400 pb-4 border-b border-gray-50">
          <span>
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </span>
          <span>
            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* ── Action Buttons ──────────────────────────────────────────────── */}
        <div className="pt-4 grid grid-cols-2 gap-2 w-full">

          {/* Primary: View Details — always present */}
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="col-span-2"
          >
            <Button variant="secondary" size="sm" className="w-full font-semibold text-xs rounded-xl">
              View Details
            </Button>
          </Link>

          {/* Track Live for ongoing trips */}
          {(bookingStatus === 'ON_TRIP' || bookingStatus === 'CHECKED_IN') && trip?.id && (
            <Link
              href={`/dashboard/trips/${trip.id}/tracking`}
              className="col-span-2"
            >
              <Button
                size="sm"
                className="w-full font-semibold text-xs rounded-xl bg-gradient-to-r from-primary-650 to-primary-750 text-white"
                leftIcon={<MapPin className="w-3.5 h-3.5" />}
              >
                Track Live
              </Button>
            </Link>
          )}

          {/* Pay Now / Retry Payment */}
          {canPayNow && onPayNow && (
            <div className="col-span-2">
              <Button
                size="sm"
                className={`w-full font-semibold text-xs rounded-xl ${canRetryPayment ? 'bg-red-500 hover:bg-red-650 border-red-500' : ''}`}
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                onClick={() => onPayNow(booking)}
              >
                {canRetryPayment ? 'Retry Payment' : 'Pay Now'}
              </Button>
            </div>
          )}

          {/* Processing: Refresh Status */}
          {isProcessing && onRefreshStatus && (
            <div className="col-span-2">
              <Button
                size="sm"
                variant="secondary"
                className="w-full font-semibold text-xs rounded-xl"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => onRefreshStatus(booking.id)}
              >
                Refresh Status
              </Button>
            </div>
          )}

          {/* Download Ticket */}
          {showDownload && (
            <Link href={`/dashboard/bookings/${booking.id}`} className="col-span-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full font-semibold text-xs rounded-xl"
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Ticket
              </Button>
            </Link>
          )}

          {/* Rate Trip */}
          {showRateTrip && (
            <Link href={`/dashboard/bookings/${booking.id}`} className="col-span-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full font-semibold text-xs rounded-xl"
                leftIcon={<Star className="w-3.5 h-3.5" />}
              >
                Rate Trip
              </Button>
            </Link>
          )}

          {/* Rebook */}
          {(bookingStatus === 'COMPLETED' || bookingStatus === 'CANCELLED') && (
            <Link
              href={`/dashboard/trips/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`}
              className="col-span-2"
            >
              <Button
                size="sm"
                variant="secondary"
                className="w-full font-semibold text-xs rounded-xl"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Rebook
              </Button>
            </Link>
          )}

          {/* Share Trip */}
          {(bookingStatus === 'CONFIRMED' || bookingStatus === 'PENDING' || bookingStatus === 'ON_TRIP') && (
            <div className="col-span-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full font-semibold text-xs rounded-xl"
                leftIcon={<Share2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  const shareData = {
                    title: `My Trip on TravelFlow`,
                    text: `I'm travelling from ${origin} to ${destination} on ${departureDateStr}${departureTimeStr ? ` at ${departureTimeStr}` : ''}. Booking ref: ${booking.id.slice(0, 8).toUpperCase()}.`,
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
              >
                Share
              </Button>
            </div>
          )}

          {/* Contact Driver (confirmed + upcoming) */}
          {bookingStatus === 'CONFIRMED' && isUpcoming && trip?.driver?.user?.phone && (
            <a href={`tel:${trip.driver.user.phone}`} className="col-span-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full font-semibold text-xs rounded-xl"
                leftIcon={<Phone className="w-3.5 h-3.5" />}
              >
                Driver
              </Button>
            </a>
          )}

          {/* Contact Support */}
          <Link href="/dashboard/support" className="col-span-1">
            <Button
              size="sm"
              variant="secondary"
              className="w-full font-semibold text-xs rounded-xl text-gray-500"
              leftIcon={<HeadphonesIcon className="w-3.5 h-3.5" />}
            >
              Support
            </Button>
          </Link>

          {/* Cancel Booking */}
          {canCancel && onCancel && (
            <div className="col-span-1">
              <Button
                variant="danger"
                size="sm"
                className="w-full font-semibold text-xs rounded-xl"
                onClick={() => onCancel(booking)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;