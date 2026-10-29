'use client';

import React from 'react';
import { Booking, BookingFilters } from '@/types/booking';
import BookingCard from './BookingCard';
import Link from 'next/link';
import { Calendar, Search, SlidersHorizontal } from 'lucide-react';

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
    description: 'Start exploring trips and book your first journey today.',
    emoji: '🗺️',
  },
  CONFIRMED: {
    title: 'No upcoming trips',
    description: 'You have no confirmed bookings. Search for trips to plan your next journey.',
    emoji: '🚌',
  },
  PENDING: {
    title: 'No pending bookings',
    description: "You don't have any bookings awaiting payment or confirmation.",
    emoji: '⏳',
  },
  COMPLETED: {
    title: 'No completed trips yet',
    description: 'Your completed trips will appear here.',
    emoji: '🏁',
  },
  CANCELLED: {
    title: 'No cancelled bookings',
    description: "You haven't cancelled any bookings.",
    emoji: '✅',
  },
};

// ── Skeleton loader ────────────────────────────────────────────────────────

function BookingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <div className="h-6 w-28 bg-gray-100 rounded-full" />
          <div className="h-6 w-32 bg-gray-100 rounded-full" />
        </div>
        <div className="h-7 w-20 bg-gray-100 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-gray-100 rounded-full" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
      <div className="flex justify-between pt-3 border-t border-gray-50">
        <div className="h-3 w-28 bg-gray-100 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-8 flex-1 bg-gray-100 rounded-xl" />
        <div className="h-8 flex-1 bg-gray-100 rounded-xl" />
        <div className="h-8 w-16 bg-gray-100 rounded-xl" />
      </div>
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
    <div className="space-y-4">
      {/* ── Status Tab Filter ──────────────────────────────────────────── */}
      {onFilterChange && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex items-center gap-2 min-w-max">
            {STATUS_TABS.map((tab) => {
              const isActive = activeStatus === tab.value;
              const tabCount = tab.value === ''
                ? bookings.length
                : bookings.filter(b => (b.status ?? '').toUpperCase() === tab.value).length;

              return (
                <button
                  key={tab.value}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      status: tab.value as BookingFilters['status'],
                    })
                  }
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  {tab.label}
                  {!isLoading && tabCount > 0 && (
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-500'
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
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {!isLoading && displayedBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="text-5xl mb-4">{emptyConfig.emoji}</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{emptyConfig.title}</h3>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
            {emptyConfig.description}
          </p>
          <Link
            href="/dashboard/trips"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            Search Trips
          </Link>
        </div>
      )}

      {/* ── Booking Cards ─────────────────────────────────────────────── */}
      {!isLoading && displayedBookings.length > 0 && (
        <div className={variant === 'compact' ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
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