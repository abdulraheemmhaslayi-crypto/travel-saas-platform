'use client';

import React from 'react';
import { BookingStatus as BookingStatusType } from '@/types/booking';
import { PaymentStatus } from '@/types/payment';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Loader2,
  RefreshCw,
  CircleDollarSign,
  CheckCheck,
} from 'lucide-react';

// ─── Booking Status Config ────────────────────────────────────────────────

interface StatusConfigEntry {
  label: string;
  icon: React.ElementType;
  color: string;
  dotColor: string;
}

const bookingStatusConfig: Record<string, StatusConfigEntry> = {
  PENDING: {
    label: 'Awaiting Confirmation',
    icon: Clock,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    dotColor: 'bg-amber-400',
  },
  CONFIRMED: {
    label: 'Booking Confirmed',
    icon: CheckCircle2,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-700 bg-red-50 border-red-200',
    dotColor: 'bg-red-400',
  },
  COMPLETED: {
    label: 'Trip Completed',
    icon: CheckCheck,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    dotColor: 'bg-blue-400',
  },
  NO_SHOW: {
    label: 'No Show',
    icon: Ban,
    color: 'text-gray-600 bg-gray-100 border-gray-200',
    dotColor: 'bg-gray-400',
  },
};

const bookingStatusFallback: StatusConfigEntry = {
  label: 'Unknown',
  icon: AlertCircle,
  color: 'text-gray-600 bg-gray-100 border-gray-200',
  dotColor: 'bg-gray-400',
};

// ─── Payment Status Config ────────────────────────────────────────────────

const paymentStatusConfig: Record<string, StatusConfigEntry> = {
  PENDING: {
    label: 'Payment Pending',
    icon: Clock,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    dotColor: 'bg-amber-400',
  },
  PROCESSING: {
    label: 'Processing Payment',
    icon: Loader2,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    dotColor: 'bg-blue-400',
  },
  PAID: {
    label: 'Payment Successful',
    icon: CircleDollarSign,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-400',
  },
  FAILED: {
    label: 'Payment Failed',
    icon: XCircle,
    color: 'text-red-700 bg-red-50 border-red-200',
    dotColor: 'bg-red-400',
  },
  REFUNDED: {
    label: 'Refunded',
    icon: RefreshCw,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    dotColor: 'bg-purple-400',
  },
  REFUND_PENDING: {
    label: 'Refund Initiated',
    icon: Clock,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    dotColor: 'bg-indigo-400',
  },
  REFUND_COMPLETED: {
    label: 'Refund Completed',
    icon: CheckCircle2,
    color: 'text-teal-700 bg-teal-50 border-teal-200',
    dotColor: 'bg-teal-400',
  },
};

const paymentStatusFallback: StatusConfigEntry = {
  label: 'Unknown',
  icon: AlertCircle,
  color: 'text-gray-600 bg-gray-100 border-gray-200',
  dotColor: 'bg-gray-400',
};

// ─── Shared Badge Component ───────────────────────────────────────────────

interface StatusBadgeProps {
  config: StatusConfigEntry;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

function StatusBadge({
  config,
  showLabel = true,
  size = 'md',
  className,
  animate = false,
}: StatusBadgeProps) {
  const Icon = config.icon;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2 h-2',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        config.color,
        sizes[size],
        className
      )}
    >
      <span className={cn('rounded-full shrink-0', config.dotColor, dotSizes[size])} />
      <Icon className={cn(iconSizes[size], animate && 'animate-spin')} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

// ─── Public Components ────────────────────────────────────────────────────

interface BookingStatusProps {
  status: BookingStatusType | string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BookingStatus: React.FC<BookingStatusProps> = ({
  status,
  showLabel = true,
  size = 'md',
  className,
}) => {
  const normalizedStatus = (status ?? '').toUpperCase();
  const config = bookingStatusConfig[normalizedStatus] ?? bookingStatusFallback;
  return (
    <StatusBadge
      config={config}
      showLabel={showLabel}
      size={size}
      className={className}
    />
  );
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  showLabel = true,
  size = 'md',
  className,
}) => {
  const normalizedStatus = (status ?? '').toUpperCase();
  const config = paymentStatusConfig[normalizedStatus] ?? paymentStatusFallback;
  const shouldAnimate = normalizedStatus === 'PROCESSING';
  return (
    <StatusBadge
      config={config}
      showLabel={showLabel}
      size={size}
      className={className}
      animate={shouldAnimate}
    />
  );
};

export default BookingStatus;