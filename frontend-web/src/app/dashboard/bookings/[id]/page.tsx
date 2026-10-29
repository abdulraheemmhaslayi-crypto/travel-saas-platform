'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/slices/bookingSlice';
import { useAppStore } from '@/store';
import { isPaymentPending, isCancellable, getCancelledByLabel } from '@/types/booking';
import BookingStatus, { PaymentStatusBadge } from '@/components/booking/BookingStatus';
import CancellationModal from '@/components/booking/CancellationModal';
import PaymentForm from '@/components/payments/PaymentForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Bus,
  User,
  Phone,
  Mail,
  CreditCard,
  Download,
  HeadphonesIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Hash,
  Star,
  Shield,
  ArrowRight,
  Car,
  BadgeCheck,
} from 'lucide-react';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-100 rounded-xl" />
        <div className="space-y-1.5">
          <div className="w-36 h-5 bg-gray-100 rounded" />
          <div className="w-24 h-3 bg-gray-100 rounded" />
        </div>
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <div className="w-32 h-4 bg-gray-100 rounded" />
          <div className="space-y-2">
            <div className="w-full h-3 bg-gray-100 rounded" />
            <div className="w-3/4 h-3 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
  highlight?: boolean;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-primary-600' : 'text-gray-800'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  children,
  accent,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm 
    ${accent ? `border-l-4 ${accent} border-gray-100` : 'border-gray-100'}`}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { currentBooking, getBooking, cancelBooking, isLoading } = useBookingStore();
  const { showToast } = useAppStore();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  // ── Load booking ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (bookingId) getBooking(bookingId);
  }, [bookingId, getBooking]);

  // ── Auto-poll if payment is pending ─────────────────────────────────────
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (currentBooking && isPaymentPending(currentBooking)) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          await getBooking(bookingId);
          const updated = useBookingStore.getState().currentBooking;
          if (updated && !isPaymentPending(updated)) stopPolling();
        }, 15_000);
      }
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [currentBooking, bookingId, getBooking, stopPolling]);

  // ── Cancel handler ────────────────────────────────────────────────────────
  const handleCancelConfirm = async (reason: string) => {
    setIsCancelling(true);
    try {
      await cancelBooking(bookingId, reason);
      showToast('Booking cancelled. Refund will be processed shortly.', 'success');
      setCancelOpen(false);
      getBooking(bookingId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to cancel booking';
      showToast(msg, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || !currentBooking) {
    return (
      <div className="max-w-2xl mx-auto">
        <DetailSkeleton />
      </div>
    );
  }

  const booking = currentBooking;
  const trip = booking.trip;
  const vehicle = trip?.vehicle;
  const driver = trip?.driver;

  const origin = trip?.origin || trip?.source || '—';
  const destination = trip?.destination || '—';
  const departureRaw = trip?.departureDate || trip?.departureTime;
  const arrivalRaw = trip?.arrivalDate || trip?.arrivalTime;

  const departureDate = departureRaw ? new Date(departureRaw) : null;
  const arrivalDate = arrivalRaw ? new Date(arrivalRaw) : null;

  const formatDT = (d: Date | null) =>
    d
      ? d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : '—';

  const bookingStatus = (booking.status ?? '').toUpperCase();
  const paymentStatus = (booking.paymentStatus ?? '').toUpperCase();

  const isPayFailed = paymentStatus === 'FAILED';
  const isPayProcessing = paymentStatus === 'PROCESSING' || paymentStatus === 'PENDING';
  const isPaid = paymentStatus === 'PAID';
  const canCancel = isCancellable(booking);
  const cancelledByLabel = bookingStatus === 'CANCELLED' ? getCancelledByLabel(booking.cancelledBy) : null;

  const driverName = driver?.user
    ? `${driver.user.firstName ?? ''} ${driver.user.lastName ?? ''}`.trim()
    : null;
  const driverPhone = driver?.user?.phone
    ? driver.user.phone.replace(/(\d{5})(\d{5})/, '$1 *****')
    : null;

  const baseAmount = booking.baseAmount ?? booking.totalAmount ?? 0;
  const platformFee = booking.platformFee ?? 0;
  const taxAmount = booking.taxAmount ?? 0;
  const finalAmount = booking.finalAmount ?? booking.totalAmount ?? 0;
  const currency = booking.currency || 'INR';

  return (
    <div className="max-w-2xl mx-auto space-y-4 px-4 sm:px-0 pb-12">

      {/* ── Back + Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors bg-white border border-gray-100 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Booking Details</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">#{booking.id.toUpperCase()}</p>
        </div>
      </div>

      {/* ── Payment Failure Banner ─────────────────────────────────────────── */}
      {isPayFailed && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Payment Failed</p>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                We were unable to complete your payment. Your booking is on hold.
              </p>
              <p className="text-xs text-red-500 mt-2 font-semibold">Possible reasons:</p>
              <ul className="text-xs text-red-500 mt-1 space-y-0.5 list-disc list-inside">
                <li>Insufficient account balance</li>
                <li>Network issue during payment</li>
                <li>Bank declined the transaction</li>
                <li>Payment session expired</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              size="sm"
              className="font-bold text-xs rounded-xl w-full"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={() => setPayOpen(true)}
            >
              Retry Payment
            </Button>
            <Link href="/dashboard/support" className="w-full">
              <Button variant="secondary" size="sm" className="w-full font-bold text-xs rounded-xl">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Payment Processing Banner ──────────────────────────────────────── */}
      {isPayProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-800">Payment Being Verified</p>
              <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                Your payment is being processed. We will automatically update your booking status once confirmation is received.
              </p>
              <p className="text-xs font-bold text-blue-700 mt-2">
                ⚠️ Please do not make another payment.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 w-full">
            <Button
              size="sm"
              variant="secondary"
              className="font-bold text-xs rounded-xl w-full"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => getBooking(bookingId)}
            >
              Refresh Status
            </Button>
            <Link href="/dashboard/support" className="w-full">
              <Button variant="secondary" size="sm" className="w-full font-bold text-xs rounded-xl">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Cancelled Banner ──────────────────────────────────────────────── */}
      {bookingStatus === 'CANCELLED' && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-700">{cancelledByLabel ?? 'Cancelled'}</p>
              {booking.cancellationReason && (
                <p className="text-xs text-gray-500 mt-1">Reason: {booking.cancellationReason}</p>
              )}
              {booking.refundAmount && booking.refundAmount > 0 && (
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                  Refund of {formatCurrency(booking.refundAmount, currency)} is being processed.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Status Overview ───────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Booking Status</p>
            <BookingStatus status={booking.status} size="lg" />
          </div>
          <div className="space-y-1 sm:text-right">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Payment Status</p>
            <PaymentStatusBadge status={booking.paymentStatus} size="lg" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
          <span>Booked {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {isPaid && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Payment Confirmed
            </span>
          )}
        </div>
      </div>

      {/* ── Trip Information ──────────────────────────────────────────────── */}
      <SectionCard title="Trip Information" icon={MapPin} accent="border-l-primary-400">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-400 font-medium mb-1">Route</p>
            <div className="flex flex-wrap items-center gap-2 text-base font-black text-gray-900">
              <MapPin className="w-4 h-4 text-green-500 shrink-0" />
              <span>{origin}</span>
              <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span>{destination}</span>
            </div>
          </div>
          <InfoRow icon={Calendar} label="Departure" value={formatDT(departureDate)} />
          {arrivalDate && <InfoRow icon={Clock} label="Arrival" value={formatDT(arrivalDate)} />}
          {trip?.vehicleType && <InfoRow icon={Bus} label="Vehicle Type" value={trip.vehicleType} />}
          {trip?.status && <InfoRow icon={BadgeCheck} label="Trip Status" value={trip.status} />}
        </div>
      </SectionCard>

      {/* ── Vehicle Information ───────────────────────────────────────────── */}
      {vehicle && (
        <SectionCard title="Vehicle Information" icon={Car} accent="border-l-blue-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Car} label="Vehicle" value={[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || null} />
            <InfoRow icon={Hash} label="Registration" value={vehicle.registrationNumber} />
            <InfoRow icon={Bus} label="Type" value={vehicle.type} />
            {vehicle.color && <InfoRow icon={BadgeCheck} label="Color" value={vehicle.color} />}
          </div>
        </SectionCard>
      )}

      {/* ── Driver Information ────────────────────────────────────────────── */}
      {driver && (driverName || driverPhone) && (
        <SectionCard title="Driver Information" icon={User} accent="border-l-amber-400">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              {driverName && (
                <p className="text-sm font-bold text-gray-900">{driverName}</p>
              )}
              {driverPhone && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {driverPhone}
                </p>
              )}
              {driver.rating !== undefined && (
                <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {Number(driver.rating).toFixed(1)} rating · {driver.totalTrips ?? 0} trips
                </p>
              )}
            </div>
            {bookingStatus === 'CONFIRMED' && driver?.user?.phone && (
              <a href={`tel:${driver.user.phone}`}>
                <Button size="sm" variant="secondary" className="font-bold text-xs rounded-xl shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Passenger Information ─────────────────────────────────────────── */}
      <SectionCard title="Passenger Information" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={User} label="Passenger Name" value={booking.passengerName || booking.passenger ? `${booking.passenger?.firstName ?? ''} ${booking.passenger?.lastName ?? ''}`.trim() || null : null} />
          <InfoRow icon={Phone} label="Phone" value={booking.passengerPhone} />
          <InfoRow icon={Mail} label="Email" value={booking.passengerEmail} />
          <InfoRow icon={Hash} label="Seats" value={booking.seats ? `${booking.seats} seat${booking.seats !== 1 ? 's' : ''}` : null} />
          {booking.seatNumbers && booking.seatNumbers.length > 0 && (
            <InfoRow icon={Hash} label="Seat Numbers" value={booking.seatNumbers.join(', ')} />
          )}
        </div>
        {(booking.pickupLocation || booking.dropoffLocation) && (
          <div className="mt-2 pt-4 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={MapPin} label="Pickup Point" value={booking.pickupLocation} />
            <InfoRow icon={MapPin} label="Drop Point" value={booking.dropoffLocation} />
          </div>
        )}
      </SectionCard>

      {/* ── Payment Breakdown ─────────────────────────────────────────────── */}
      <SectionCard title="Payment Information" icon={CreditCard} accent="border-l-emerald-400">
        <div className="space-y-2.5 text-sm">
          {baseAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Base Fare ({booking.seats} seat{booking.seats !== 1 ? 's' : ''})</span>
              <span className="font-semibold text-gray-800">{formatCurrency(baseAmount, currency)}</span>
            </div>
          )}
          {platformFee > 0 && (
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Platform Fee</span>
              <span>{formatCurrency(platformFee, currency)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-gray-500 text-xs">
              <span>GST / Tax</span>
              <span>{formatCurrency(taxAmount, currency)}</span>
            </div>
          )}
          <div className="pt-2.5 border-t border-gray-100 flex justify-between font-bold text-gray-900">
            <span>Total Paid</span>
            <span className="text-lg text-primary-600">{formatCurrency(finalAmount, currency)}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
          {booking.paymentMethod && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Payment Method</span>
              <span className="font-semibold capitalize">{booking.paymentMethod}</span>
            </div>
          )}
          {booking.transactionId && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Transaction ID</span>
              <span className="font-mono text-gray-700">{booking.transactionId}</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Refund Information ───────────────────────────────────────────── */}
      {booking.refundAmount !== undefined && booking.refundAmount > 0 && (
        <SectionCard title="Refund Information" icon={RefreshCw} accent="border-l-purple-400">
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Refund Amount</span>
              <span className="font-bold text-emerald-600">{formatCurrency(booking.refundAmount, currency)}</span>
            </div>
            {booking.refundStatus && (
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Refund Status</span>
                <span className="font-semibold capitalize">{booking.refundStatus.replace('_', ' ')}</span>
              </div>
            )}
            {booking.refundInitiatedAt && (
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Initiated</span>
                <span>{new Date(booking.refundInitiatedAt).toLocaleDateString('en-IN')}</span>
              </div>
            )}
            {booking.refundCompletedAt && (
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Completed</span>
                <span>{new Date(booking.refundCompletedAt).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Cancellation Policy ──────────────────────────────────────────── */}
      {canCancel && (
        <SectionCard title="Cancellation Policy" icon={Shield}>
          <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-gray-700">Free cancellation</strong> — more than 48 hours before departure</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span><strong className="text-gray-700">10% fee</strong> — between 24–48 hours before departure</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              <span><strong className="text-gray-700">50% fee</strong> — within 24 hours of departure</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <span><strong className="text-gray-700">No refund</strong> — within 2 hours of departure</span>
            </div>
            <p className="mt-2 text-gray-400">Refunds are credited to your original payment method within 5–7 business days.</p>
          </div>
        </SectionCard>
      )}

      {/* ── Action Bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 pt-2 sm:flex sm:flex-row w-full">
        {isPayFailed && (
          <Button
            className="col-span-2 sm:flex-1 font-bold rounded-xl"
            leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => setPayOpen(true)}
          >
            Retry Payment
          </Button>
        )}
        {bookingStatus === 'CONFIRMED' && isPaid && (
          <Button
            variant="secondary"
            className="col-span-2 sm:flex-1 font-bold rounded-xl"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download Ticket
          </Button>
        )}
        {canCancel && (
          <Button
            variant="danger"
            className="col-span-1 sm:flex-1 font-bold rounded-xl"
            onClick={() => setCancelOpen(true)}
          >
            Cancel Booking
          </Button>
        )}
        <Link href="/dashboard/support" className={canCancel ? "col-span-1 sm:flex-1" : "col-span-2 sm:flex-1"}>
          <Button
            variant="secondary"
            className="w-full font-bold rounded-xl"
            leftIcon={<HeadphonesIcon className="w-4 h-4" />}
          >
            Contact Support
          </Button>
        </Link>
      </div>

      {/* ── Cancellation Modal ──────────────────────────────────────────────── */}
      <CancellationModal
        booking={booking}
        isOpen={cancelOpen}
        isLoading={isCancelling}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
      />

      {/* ── Retry Payment Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        title="Retry Payment"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium leading-relaxed">
            You are retrying payment for booking <strong>#{booking.id.slice(0, 8).toUpperCase()}</strong>.
            Amount: <strong>{formatCurrency(finalAmount, currency)}</strong>
          </div>
          <PaymentForm
            amount={finalAmount}
            currency={currency}
            bookingId={booking.id}
            provider="RAZORPAY"
            onSuccess={() => {
              setPayOpen(false);
              showToast('Payment successful! Your booking is confirmed.', 'success');
              getBooking(bookingId);
            }}
            onError={(error) => showToast(error, 'error')}
          />
        </div>
      </Modal>
    </div>
  );
}