'use client';

import React from 'react';
import { Booking, BookingFilters } from '@/types/booking';
import BookingCard from './BookingCard';
import Link from 'next/link';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';

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
  { value: '', label: 'All Bookings' },
  { value: 'CONFIRMED', label: 'Upcoming' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── Status Tab Filter (Scrollable on mobile) ──────────────────────── */}
      {onFilterChange && (
        <div className="w-full min-w-0 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <div className="inline-flex items-center gap-1.5 min-w-max py-0.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1 mr-0.5" />
            {STATUS_TABS.map((tab) => {
              const isActive = activeStatus === tab.value;
              const tabCount = tab.value === ''
                ? bookings.length
                : bookings.filter(b => (b.status ?? '').toUpperCase() === tab.value).length;

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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  <span>{tab.label}</span>
                  {!isLoading && tabCount > 0 && (
                    <span
                      className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-3xl border border-gray-200/90 shadow-2xs">
          <div className="text-4xl mb-3">{emptyConfig.emoji}</div>
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">{emptyConfig.title}</h3>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-4">
            {emptyConfig.description}
          </p>
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
        <div className={variant === 'compact' ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4'}>
          {displayedBookings.map((booking) =>
            variant === 'compact' ? (
              <BookingCard
                key={booking.id}
                booking={booking}
                variant="compact"
              />
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
