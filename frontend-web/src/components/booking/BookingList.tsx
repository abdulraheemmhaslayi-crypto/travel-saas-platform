'use client';

import React from 'react';
import { Booking, BookingFilters } from '@/types/booking';
import BookingCard from './BookingCard';
import Link from 'next/link';
import {
  Search,
  Ticket,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
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

const STATUS_TABS = [
  { value: '', label: 'All Bookings', icon: Ticket },
  { value: 'CONFIRMED', label: 'Upcoming', icon: Clock },
  { value: 'PENDING', label: 'Pending', icon: AlertCircle },
  { value: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

const EMPTY_STATE_CONFIG: Record<string, { title: string; description: string; emoji: string }> = {
  '': {
    title: "You haven't made any bookings yet",
    description: 'Explore live rides and book your first journey today.',
    emoji: '🗺️',
  },
  CONFIRMED: {
    title: 'No upcoming trips',
    description: 'You have no confirmed bookings right now. Book a ride to plan your next journey.',
    emoji: '🚗',
  },
  PENDING: {
    title: 'No pending bookings',
    description: "You don't have any bookings awaiting payment or driver confirmation.",
    emoji: '⏳',
  },
  COMPLETED: {
    title: 'No completed trips yet',
    description: 'Your completed journeys and ride receipts will appear here.',
    emoji: '🏁',
  },
  CANCELLED: {
    title: 'No cancelled bookings',
    description: "You haven't cancelled any ride bookings.",
    emoji: '✅',
  },
};

// ── Skeleton loader ────────────────────────────────────────────────────────
function BookingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-5 space-y-3.5 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex gap-2.5 items-center">
          <div className="h-8 w-12 bg-gray-200 rounded-xl" />
          <div className="space-y-1">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-16 bg-gray-100 rounded-2xl" />
      <div className="flex gap-2">
        <div className="h-6 w-24 bg-gray-200 rounded-lg" />
        <div className="h-6 w-16 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-10 w-full bg-gray-200 rounded-xl" />
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
    <div className="space-y-3 sm:space-y-4">
      {/* ── Status Tab Filter (Clean Mobile Horizontal Scroll without Scrollbar) ── */}
      {onFilterChange && (
        <div className="w-full min-w-0 overflow-x-auto py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex items-center gap-2 min-w-max py-0.5">
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
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/20'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {!isLoading && (
                    <span
                      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black rounded-full min-w-[18px] ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : tabCount > 0
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-slate-50 text-slate-400'
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

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {!isLoading && displayedBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white rounded-3xl border border-gray-200/90 shadow-2xs">
          <div className="text-4xl mb-3">{emptyConfig.emoji}</div>
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">
            {emptyConfig.title}
          </h3>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-4">
            {emptyConfig.description}
          </p>

          {/* Smart Helper: If user is on Upcoming (0) but has Pending (e.g. 3) */}
          {activeStatus === 'CONFIRMED' && pendingBookingsCount > 0 && onFilterChange && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center max-w-xs animate-in fade-in">
              <p className="text-xs font-bold text-amber-900">
                You have {pendingBookingsCount} booking{pendingBookingsCount > 1 ? 's' : ''} in Pending status
              </p>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, status: 'PENDING' })}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 hover:text-amber-900 underline"
              >
                <span>View Pending Bookings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Smart Helper: If user is on Pending (0) but has Confirmed/Upcoming */}
          {activeStatus === 'PENDING' && confirmedBookingsCount > 0 && onFilterChange && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-center max-w-xs animate-in fade-in">
              <p className="text-xs font-bold text-blue-900">
                You have {confirmedBookingsCount} confirmed upcoming trip{confirmedBookingsCount > 1 ? 's' : ''}
              </p>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, status: 'CONFIRMED' })}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 hover:text-blue-900 underline"
              >
                <span>View Upcoming Trips</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <Link
            href="/dashboard/passenger"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Search & Book a Ride</span>
          </Link>
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
