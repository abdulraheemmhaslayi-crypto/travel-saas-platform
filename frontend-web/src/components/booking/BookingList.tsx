'use client';

import React from 'react';
import { Booking, BookingFilters } from '@/types/booking';
import BookingCard from './BookingCard';
import Link from 'next/link';
import {
  Search,
  Ticket,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Flame,
} from 'lucide-react';

interface BookingListProps {
  bookings: Booking[];
  isLoading?: boolean;
  onCancel?: (booking: Booking) => void;
  onPayNow?: (booking: Booking) => void;
  onRefreshStatus?: (id: string) => void;
  filters?: BookingFilters;
  onFilterChange?: (filters: BookingFilters) => void;
  emptyMessage?: string;
  variant?: 'default' | 'compact';
}

interface StatusTabConfig {
  value: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  badgeActive: string;
}

const STATUS_TABS: StatusTabConfig[] = [
  {
    value: '',
    label: 'All Bookings',
    icon: Ticket,
    iconColor: 'text-indigo-600',
    badgeActive: 'bg-white/25 text-white',
  },
  {
    value: 'CONFIRMED',
    label: 'Upcoming',
    icon: Sparkles,
    iconColor: 'text-emerald-600',
    badgeActive: 'bg-white/25 text-white',
  },
  {
    value: 'PENDING',
    label: 'Pending',
    icon: Clock,
    iconColor: 'text-amber-600',
    badgeActive: 'bg-white/25 text-white',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    icon: CheckCircle2,
    iconColor: 'text-blue-600',
    badgeActive: 'bg-white/25 text-white',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
    icon: XCircle,
    iconColor: 'text-rose-600',
    badgeActive: 'bg-white/25 text-white',
  },
];

const EMPTY_STATE_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
  }
> = {
  '': {
    title: "You haven't made any bookings yet",
    description: 'Explore live rides connecting Mhasla, Raigad, Mumbai, and Pune and book your seat in seconds.',
    icon: Ticket,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 border-blue-200 ring-4 ring-blue-50',
  },
  CONFIRMED: {
    title: 'No upcoming trips scheduled',
    description: 'You have no confirmed upcoming journeys right now. Ready to travel? Book your next ride today.',
    icon: Sparkles,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200 ring-4 ring-emerald-50',
  },
  PENDING: {
    title: 'No pending bookings',
    description: "You don't have any bookings awaiting payment, seat approval, or driver confirmation.",
    icon: Clock,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-200 ring-4 ring-amber-50',
  },
  COMPLETED: {
    title: 'No completed trips yet',
    description: 'Your completed journeys, driver ratings, and ride receipts will appear here.',
    icon: CheckCircle2,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 border-purple-200 ring-4 ring-purple-50',
  },
  CANCELLED: {
    title: 'No cancelled bookings',
    description: "You haven't cancelled any ride bookings on your account.",
    icon: ShieldCheck,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-200 ring-4 ring-rose-50',
  },
};

// ── Skeleton loader ────────────────────────────────────────────────────────
function BookingCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex gap-2.5 items-center">
          <div className="h-8 w-12 bg-slate-200 rounded-xl" />
          <div className="space-y-1">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-16 bg-slate-100 rounded-xl" />
      <div className="flex gap-2">
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="h-6 w-16 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-10 w-full bg-slate-200 rounded-xl" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
const BookingList: React.FC<BookingListProps> = ({
  bookings,
  isLoading = false,
  onCancel,
  onPayNow,
  onRefreshStatus,
  filters,
  onFilterChange,
  variant = 'default',
}) => {
  const activeStatus = filters?.status || '';
  const emptyConfig = EMPTY_STATE_CONFIG[activeStatus] ?? EMPTY_STATE_CONFIG[''];
  const EmptyIcon = emptyConfig.icon;

  const displayedBookings = activeStatus
    ? bookings.filter((b) => (b.status ?? '').toUpperCase() === activeStatus)
    : bookings;

  const pendingBookingsCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'PENDING'
  ).length;

  const confirmedBookingsCount = bookings.filter(
    (b) => (b.status ?? '').toUpperCase() === 'CONFIRMED'
  ).length;

  return (
    <div className="space-y-4">
      {/* ── Status Tab Filter Bar: Responsive Desktop Segmented Control + Mobile Smooth Scroll ── */}
      {onFilterChange && (
        <div className="w-full bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5 px-0.5">
            {STATUS_TABS.map((tab) => {
              const isActive = activeStatus === tab.value;
              const Icon = tab.icon;
              const tabCount =
                tab.value === ''
                  ? bookings.length
                  : bookings.filter((b) => (b.status ?? '').toUpperCase() === tab.value).length;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      status: tab.value as BookingFilters['status'],
                    })
                  }
                  className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex-1 sm:flex-initial justify-center ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : tab.iconColor
                    }`}
                  />
                  <span>{tab.label}</span>
                  {!isLoading && (
                    <span
                      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs font-black rounded-full min-w-[20px] transition-colors ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : tabCount > 0
                          ? 'bg-white text-slate-800 shadow-2xs border border-slate-200'
                          : 'bg-slate-200/70 text-slate-400'
                      }`}
                    >
                      {tabCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Loading Skeletons ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Rich Illustrated Empty State ────────────────────────────────── */}
      {!isLoading && displayedBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-5 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          {/* High Quality Illustrated Icon Badge */}
          <div
            className={`w-16 h-16 rounded-2xl ${emptyConfig.iconBg} border flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-200`}
          >
            <EmptyIcon className={`w-8 h-8 ${emptyConfig.iconColor}`} />
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1 tracking-tight">
            {emptyConfig.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed mb-5">
            {emptyConfig.description}
          </p>

          {/* Smart Helper: If user clicked Upcoming (0) but has Pending (e.g. 3) */}
          {activeStatus === 'CONFIRMED' && pendingBookingsCount > 0 && onFilterChange && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-center max-w-sm w-full animate-in fade-in duration-200">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  You have {pendingBookingsCount} booking{pendingBookingsCount > 1 ? 's' : ''} in Pending status
                </span>
              </div>
              <p className="text-[11px] text-amber-700 mb-2">
                These rides are waiting for payment or driver confirmation.
              </p>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, status: 'PENDING' })}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Switch to Pending ({pendingBookingsCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Smart Helper: If user clicked Pending (0) but has Confirmed/Upcoming */}
          {activeStatus === 'PENDING' && confirmedBookingsCount > 0 && onFilterChange && (
            <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-center max-w-sm w-full animate-in fade-in duration-200">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  You have {confirmedBookingsCount} confirmed upcoming trip{confirmedBookingsCount > 1 ? 's' : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, status: 'CONFIRMED' })}
                className="mt-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                <span>View Upcoming Trips ({confirmedBookingsCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {activeStatus !== '' && onFilterChange && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, status: '' })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors"
              >
                Show All Bookings ({bookings.length})
              </button>
            )}
            <Link
              href="/dashboard/passenger"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Search Available Rides</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Booking Cards List ─────────────────────────────────────────── */}
      {!isLoading && displayedBookings.length > 0 && (
        <div
          className={
            variant === 'compact'
              ? 'space-y-2'
              : 'grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4'
          }
        >
          {displayedBookings.map((booking) =>
            variant === 'compact' ? (
              <BookingCard key={booking.id} booking={booking} variant="compact" />
            ) : (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={onCancel}
                onPayNow={onPayNow}
                onRefreshStatus={onRefreshStatus}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default BookingList;
