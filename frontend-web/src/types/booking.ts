import { UserSummary } from './trip';
import { PaymentStatus } from './payment';

// ─── Booking Status ────────────────────────────────────────────────────────
// Core DB statuses (what backend stores)
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

// ─── Cancellation Actor ────────────────────────────────────────────────────
export type CancelledBy = 'PASSENGER' | 'DRIVER' | 'ADMIN' | 'SYSTEM';

// ─── Booking Interface ─────────────────────────────────────────────────────
export interface Booking {
  id: string;
  tripId: string;
  trip?: TripSummary;
  passengerId: string;
  passenger?: UserSummary;

  // Seat & passenger details
  seats: number;
  seatNumbers?: string[];
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;

  // Pricing
  totalAmount: number;
  baseAmount?: number;
  platformFee?: number;
  taxAmount?: number;
  finalAmount: number;
  currency: string;

  // Status
  status: BookingStatus;
  paymentStatus: PaymentStatus;

  // Location
  pickupLocation?: string;
  dropoffLocation?: string;
  specialRequests?: string;

  // Cancellation
  cancellationReason?: string;
  cancelledBy?: CancelledBy;
  cancelledAt?: string;

  // Refund
  refundAmount?: number;
  refundStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  refundInitiatedAt?: string;
  refundCompletedAt?: string;

  // Payment metadata
  paymentMethod?: string;
  paymentProvider?: string;
  transactionId?: string;
  providerOrderId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ─── Trip Summary (embedded in booking) ───────────────────────────────────
export interface TripSummary {
  id: string;
  title?: string;
  origin: string;
  source?: string; // backend alias for origin
  destination: string;
  departureDate: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  vehicleType?: string;
  status?: string;
  vehicle?: VehicleSummary;
  driver?: DriverSummary;
}

export interface VehicleSummary {
  id: string;
  registrationNumber: string;
  brand?: string;
  model?: string;
  color?: string;
  type?: string;
  seatingCapacity?: number;
}

export interface DriverSummary {
  id: string;
  user?: {
    firstName: string;
    lastName: string;
    phone?: string;
    profileImage?: string;
  };
  rating?: number;
  totalTrips?: number;
}

// ─── DTOs ──────────────────────────────────────────────────────────────────
export interface CreateBookingDto {
  tripId: string;
  seatNumbers: string[];
  bookingType: 'one_way' | 'round_trip' | 'return_only';
  paymentMethod: 'wallet' | 'stripe' | 'razorpay' | 'cash';
  pickupLocation?: string;
  dropLocation?: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  couponCode?: string;
  specialRequests?: string;
  passengerGenders?: Record<string, string>;
}

export interface UpdateBookingStatusDto {
  status: BookingStatus;
}

export interface CancelBookingDto {
  reason?: string;
}

export interface BookingFilters {
  status?: BookingStatus | '';
  paymentStatus?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Returns a human-readable label for a booking status */
export function getBookingStatusLabel(status: BookingStatus | string): string {
  const labels: Record<string, string> = {
    PENDING: 'Awaiting Confirmation',
    CONFIRMED: 'Booking Confirmed',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Trip Completed',
    NO_SHOW: 'No Show',
  };
  return labels[(status ?? '').toUpperCase()] ?? (status ?? 'Unknown');
}

/** Returns a human-readable label for a payment status */
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Payment Pending',
    PAID: 'Payment Successful',
    FAILED: 'Payment Failed',
    REFUNDED: 'Refunded',
    PROCESSING: 'Processing Payment',
    REFUND_PENDING: 'Refund Initiated',
    REFUND_COMPLETED: 'Refund Completed',
  };
  return labels[(status ?? '').toUpperCase()] ?? (status ?? 'Unknown');
}

/** Returns true if a booking's payment is in a "pending" / needs-attention state */
export function isPaymentPending(booking: Booking): boolean {
  return (
    booking.paymentStatus === 'PENDING' ||
    (booking.paymentStatus as string) === 'PROCESSING'
  );
}

export function isCancellable(booking: Booking): boolean {
  return (
    booking.status === 'PENDING' ||
    booking.status === 'CONFIRMED'
  );
}

/** Returns a friendly "cancelled by" label */
export function getCancelledByLabel(cancelledBy?: CancelledBy): string {
  if (!cancelledBy) return 'Cancelled';
  const labels: Record<CancelledBy, string> = {
    PASSENGER: 'Cancelled by You',
    DRIVER: 'Cancelled by Driver',
    ADMIN: 'Cancelled by Admin',
    SYSTEM: 'Cancelled Automatically',
  };
  return labels[cancelledBy] ?? 'Cancelled';
}