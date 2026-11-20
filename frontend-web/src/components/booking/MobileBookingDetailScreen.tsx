'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Booking } from '@/types/booking';
import { formatCurrency } from '@/lib/utils';
import {
  ChevronLeft,
  CreditCard,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Download,
  HeadphonesIcon,
  Shield,
  Star,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface MobileBookingDetailScreenProps {
  booking: Booking;
  onRetryPayment: () => void;
  onCancelBooking: () => void;
  onRefresh: () => void;
  canCancel: boolean;
  isPayFailed: boolean;
  isPayProcessing: boolean;
  isPaid: boolean;
  cancelledByLabel: string | null;
  driverName: string | null;
  driverPhone: string | null;
  formatDT: (d: Date | null) => string;
  baseAmount: number;
  platformFee: number;
  taxAmount: number;
  finalAmount: number;
  currency: string;
}

export default function MobileBookingDetailScreen({
  booking,
  onRetryPayment,
  onCancelBooking,
  onRefresh,
  canCancel,
  isPayFailed,
  isPayProcessing,
  isPaid,
  cancelledByLabel,
  driverName,
  driverPhone,
  formatDT,
  baseAmount,
  platformFee,
  taxAmount,
  finalAmount,
  currency,
}: MobileBookingDetailScreenProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState(false);

  const trip = booking.trip;
  const vehicle = trip?.vehicle;
  const driver = trip?.driver;

  const origin = trip?.origin || trip?.source || '—';
  const destination = trip?.destination || '—';
  const departureRaw = trip?.departureDate || trip?.departureTime;
  const arrivalRaw = trip?.arrivalDate || trip?.arrivalTime;

  const departureDate = departureRaw ? new Date(departureRaw) : null;
  const arrivalDate = arrivalRaw ? new Date(arrivalRaw) : null;

  const bookingStatus = (booking.status ?? '').toUpperCase();
  const paymentStatus = (booking.paymentStatus ?? '').toUpperCase();
  const isCancelled = bookingStatus === 'CANCELLED';
  const isConfirmed = bookingStatus === 'CONFIRMED';

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(booking.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Format short date for badges
  const formattedBookDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-36 px-4 pt-2 space-y-4 max-w-md mx-auto">
      {/* ── Native Mobile Top Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/dashboard/bookings');
            }
          }}
          className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200/90 flex items-center justify-center text-slate-800 active:scale-90 transition-transform shrink-0 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight">
            Booking Details
          </h1>
          <p className="text-[11px] font-mono font-bold text-slate-400 truncate">
            #{booking.id.slice(0, 10).toUpperCase()}
          </p>
        </div>

        <Link
          href="/dashboard/support"
          className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200/90 flex items-center justify-center text-slate-700 active:scale-90 transition-transform shrink-0"
          aria-label="Support"
        >
          <HeadphonesIcon className="w-4 h-4 text-slate-600" />
        </Link>
      </div>

      {/* ── Unified Status Hero Card ─────────────────────────────────────── */}
      {isCancelled ? (
        <div className="bg-white rounded-3xl border border-rose-150 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <XCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {cancelledByLabel || 'Booking Cancelled'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 shrink-0">
                  {paymentStatus === 'FAILED' ? 'Failed' : 'Cancelled'}
                </span>
              </div>
              <p className="text-xs text-rose-600 mt-1 font-medium leading-relaxed">
                {booking.cancellationReason || (isPayFailed ? 'Payment was not completed within the session timeout.' : 'This booking has been cancelled.')}
              </p>
              <div className="mt-2.5 pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Booked on {formattedBookDate}</span>
                <span className="font-semibold text-rose-600">No active seat reserved</span>
              </div>
            </div>
          </div>

          {/* Action buttons inside status card */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            {isPayFailed && (
              <button
                type="button"
                onClick={onRetryPayment}
                className="w-full h-12 rounded-2xl bg-[#4F46E5] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs hover:bg-[#4338CA] active:scale-[0.98] transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4 stroke-[2.2]" />
                Retry Payment • {formatCurrency(finalAmount, currency)}
              </button>
            )}
            <Link
              href="/dashboard/passenger"
              className="w-full h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
              Book Another Ride
            </Link>
          </div>
        </div>
      ) : isPayProcessing ? (
        <div className="bg-white rounded-3xl border border-indigo-150 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#4F46E5] shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Verifying Payment
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 shrink-0">
                  Processing
                </span>
              </div>
              <p className="text-xs text-indigo-700 mt-1 font-medium leading-relaxed">
                We are confirming your payment status with the gateway. Your seats are on hold.
              </p>
              <p className="text-[11px] font-bold text-amber-700 mt-2">
                ⚠️ Please do not make another payment while verification is pending.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="h-11 rounded-2xl bg-[#4F46E5] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
            <Link
              href="/dashboard/support"
              className="h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <HeadphonesIcon className="w-3.5 h-3.5" />
              Help & Support
            </Link>
          </div>
        </div>
      ) : isConfirmed ? (
        <div className="bg-white rounded-3xl border border-emerald-150 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Booking Confirmed
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                  Confirmed • Paid
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                Your seats are reserved. Please arrive 10 minutes prior to departure.
              </p>
              <div className="mt-3 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PNR / Ticket Ref</span>
                  <span className="text-xs font-black font-mono text-slate-800">
                    #{booking.id.slice(0, 10).toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 active:scale-95 transition-all shadow-2xs"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedId ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking Status</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{bookingStatus}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
              {paymentStatus}
            </span>
          </div>
        </div>
      )}

      {/* ── Journey Timeline Card ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Date and Trip Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                {departureDate ? formatDT(departureDate) : 'Date To Be Announced'}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">Scheduled Departure</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {trip?.vehicleType || '100% AC Fleet'}
          </span>
        </div>

        {/* Boarding and Drop Timeline */}
        <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:border-l-2 before:border-dashed before:border-slate-200">
          {/* Pickup */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex items-center justify-center" />
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Pickup / Boarding</p>
              <p className="text-sm font-black text-slate-900 mt-0.5 leading-snug">{origin}</p>
              {booking.pickupLocation && (
                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {booking.pickupLocation}
                </p>
              )}
            </div>
          </div>

          {/* Dropoff */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100 flex items-center justify-center" />
            <div>
              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Destination / Dropoff</p>
              <p className="text-sm font-black text-slate-900 mt-0.5 leading-snug">{destination}</p>
              {booking.dropoffLocation && (
                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {booking.dropoffLocation}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle & Driver Summary pill if available */}
        {(vehicle || driver) && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 truncate">
                  {[vehicle?.brand, vehicle?.model].filter(Boolean).join(' ') || 'Comfort AC Fleet'}
                </p>
                <p className="text-[11px] font-mono text-slate-400 truncate">
                  {vehicle?.registrationNumber || 'Assigned on departure'}
                </p>
              </div>
            </div>
            {driver && driverName && (
              <div className="text-right shrink-0">
                <p className="font-bold text-slate-800 text-[11px]">{driverName}</p>
                {driver.rating && (
                  <p className="text-[10px] text-amber-600 font-bold flex items-center justify-end gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    {Number(driver.rating).toFixed(1)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Booked Passengers Card ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Passenger Information</h3>
          </div>
          <span className="text-xs font-extrabold text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
            {booking.seats} {booking.seats === 1 ? 'Seat' : 'Seats'}
          </span>
        </div>

        {booking.metadata?.passengers && Array.isArray(booking.metadata.passengers) && booking.metadata.passengers.length > 0 ? (
          <div className="space-y-2">
            {booking.metadata.passengers.map((p: any, idx: number) => {
              const isFemale = p.gender === 'female';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="bg-[#4F46E5] text-white text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0">
                      Seat #{p.seatNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {p.age} years · <span className={isFemale ? 'text-pink-600 font-bold' : 'text-[#4F46E5] font-bold'}>{isFemale ? '♀ Female' : '♂ Male'}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isFemale ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-indigo-50 text-[#4F46E5] border-indigo-200'}`}>
                    Passenger {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-900">
                {booking.passengerName || (booking.passenger ? `${booking.passenger?.firstName ?? ''} ${booking.passenger?.lastName ?? ''}`.trim() : 'Primary Passenger')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Seats booked: {booking.seatNumbers && booking.seatNumbers.length > 0 ? booking.seatNumbers.join(', ') : `${booking.seats} seat(s)`}
              </p>
            </div>
            <span className="bg-[#4F46E5] text-white text-[11px] font-black px-2 py-0.5 rounded-lg">
              {booking.seats} Pax
            </span>
          </div>
        )}

        {/* Contact details */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 gap-2 text-xs">
          {booking.passengerPhone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold">{booking.passengerPhone}</span>
            </div>
          )}
          {booking.passengerEmail && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold truncate">{booking.passengerEmail}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Fare Breakdown Card ──────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <CreditCard className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Payment Breakdown</h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Base Fare ({booking.seats} seat{booking.seats !== 1 ? 's' : ''})</span>
            <span className="font-extrabold text-slate-900">{formatCurrency(baseAmount, currency)}</span>
          </div>
          {platformFee > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Platform Convenience Fee</span>
              <span>{formatCurrency(platformFee, currency)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>GST / Taxes</span>
              <span>{formatCurrency(taxAmount, currency)}</span>
            </div>
          )}
          <div className="pt-2.5 border-t border-slate-100 flex justify-between items-baseline font-black">
            <span className="text-slate-900 text-sm">Total Fare</span>
            <span className="text-base font-black text-[#4F46E5]">{formatCurrency(finalAmount, currency)}</span>
          </div>
        </div>

        <div className="mt-2 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Method: <strong className="text-slate-700 capitalize">{booking.paymentMethod || 'Online'}</strong></span>
          {booking.transactionId && (
            <span className="font-mono text-slate-500">Txn: #{booking.transactionId.slice(-8)}</span>
          )}
        </div>
      </div>

      {/* ── Refund Notice (if present) ───────────────────────────────────── */}
      {booking.refundAmount !== undefined && booking.refundAmount > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-4 shadow-xs text-xs space-y-1">
          <p className="font-black text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Refund of {formatCurrency(booking.refundAmount, currency)} {booking.refundStatus === 'COMPLETED' ? 'Processed' : 'Initiated'}
          </p>
          <p className="text-emerald-700 font-medium">
            Amount is refunded to your original payment method. Depending on your bank, it reflects in 3-5 business days.
          </p>
        </div>
      )}

      {/* ── Cancel Booking / Support Actions ─────────────────────────────── */}
      <div className="pt-2 space-y-2">
        {canCancel && (
          <button
            type="button"
            onClick={onCancelBooking}
            className="w-full h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Cancel This Booking
          </button>
        )}
      </div>

      {/* ── Fixed Bottom Sticky Bar for Mobile ───────────────────────────── */}
      {isPayFailed && (
        <div className="fixed bottom-[66px] left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-md mx-auto flex items-center gap-3 px-2">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Due</span>
              <span className="text-base font-black text-[#4F46E5] leading-none block">
                {formatCurrency(finalAmount, currency)}
              </span>
            </div>
            <button
              type="button"
              onClick={onRetryPayment}
              className="flex-[2] h-11 rounded-2xl bg-[#4F46E5] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Retry Payment Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
