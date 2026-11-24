'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  MapPin,
  Calendar,
  User,
  Car,
  Plus,
  RefreshCw,
  ChevronRight,
  X,
  Layers,
  Users,
  IndianRupee,
  TrendingUp,
  QrCode,
  HelpCircle,
  ArrowRight,
  Clock,
  Route,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TripTab = 'all' | 'active' | 'upcoming' | 'completed' | 'cancelled';

export interface FleetTripsMobileProps {
  user: any;
  unreadCount: number;
  trips: any[];
  filteredTrips: any[];
  activeTab: TripTab;
  setActiveTab: (tab: TripTab) => void;
  tabCounts: {
    all: number;
    active: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  };
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// Format date & time matching the screenshot (e.g., "30 Nov 2026, 4:20 pm")
function formatTripDate(d: string | Date | undefined): string {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(d);
  }
}

// Format price matching the screenshot (e.g., "₹499.00")
function formatTripPrice(p: number | undefined | null): string {
  const v = Number(p || 0);
  return `₹${v.toFixed(2)}`;
}

export default function FleetTripsMobile({
  user,
  unreadCount,
  trips,
  filteredTrips,
  activeTab,
  setActiveTab,
  tabCounts,
  isLoading,
  error,
  onRefresh,
}: FleetTripsMobileProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User initials for avatar circle (e.g. "RS")
  const initials = useMemo(() => {
    const f = user?.firstName?.[0] || 'R';
    const l = user?.lastName?.[0] || 'S';
    return `${f}${l}`.toUpperCase();
  }, [user]);

  // Tab definitions matching the screenshot
  const tabsList: { id: TripTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Trips', count: tabCounts.all },
    { id: 'active', label: 'Active', count: tabCounts.active },
    { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
    { id: 'completed', label: 'Completed', count: tabCounts.completed },
    { id: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-800 antialiased selection:bg-[#4F46E5] selection:text-white">
      {/* ── 1. Top App Bar (Header matching screenshot) ───────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between shadow-2xs">
        {/* Left: Hamburger Menu */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90 transition-all cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Kokan Travel Logo */}
          <Link href="/dashboard/fleet-owner" className="flex items-center gap-2 active:scale-95 transition-transform">
            <div className="w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center text-white shadow-xs shrink-0">
              <MapPin className="w-4 h-4 fill-white text-[#4F46E5]" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Kokan Travel</span>
          </Link>
        </div>

        {/* Right: Notification Bell + User Avatar */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className="relative w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </Link>

          <Link
            href="/dashboard/profile"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/90 flex items-center justify-center text-[11px] font-bold text-slate-700 active:scale-90 transition-all"
            aria-label="User Profile"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* ── 2. Page Title & Action Buttons ──────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">My Trips</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage, monitor, and track your scheduled or active routes.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-[#4F46E5]')} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/fleet-owner/create-trip"
            className="h-10 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Trip</span>
          </Link>
        </div>

        {/* ── 3. Filter Tabs with Count Badges (Matching Screenshot) ────────── */}
        <div className="pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {tabsList.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95',
                    isActive
                      ? 'bg-[#EEF2FF] text-[#4F46E5] border border-indigo-200/80 shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                      isActive ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}
      </div>

      {/* ── 4. Trip Cards List ──────────────────────────────────────────────── */}
      <div className="px-4 pt-1 space-y-3">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading trips...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] mx-auto">
              <Route className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                No {activeTab === 'all' ? '' : activeTab} trips found
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs mx-auto">
                {activeTab === 'active'
                  ? 'No active trips are running right now.'
                  : activeTab === 'upcoming'
                  ? 'No scheduled upcoming trips. Create a new trip to start bookings.'
                  : 'There are no trips in this category.'}
              </p>
            </div>
            <Link
              href="/dashboard/fleet-owner/create-trip"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#4F46E5] text-white font-bold text-xs shadow-xs hover:bg-[#4338CA] active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Create a Trip
            </Link>
          </div>
        ) : (
          /* List of Trip Cards */
          filteredTrips.map((trip) => {
            const statusStr = String(trip.status || '').toLowerCase().trim();
            const isCompleted = ['completed', 'finished', 'done'].includes(statusStr);
            const isScheduled = ['scheduled', 'upcoming', 'pending', 'created'].includes(statusStr);
            const isActive = ['active', 'in_progress', 'delayed', 'started'].includes(statusStr);
            const isCancelled = ['cancelled', 'canceled', 'aborted'].includes(statusStr);

            // Origin and destination text
            const originText = trip.pickupLocation || trip.source || trip.origin || 'Source';
            const destText = trip.dropoffLocation || trip.destination || 'Destination';
            const routeTitle = (trip.title || `${trip.source || originText} to ${trip.destination || destText}`).toLowerCase();

            // Driver info
            const driverName = trip.driver
              ? (trip.driver.name || `${trip.driver.user?.firstName || ''} ${trip.driver.user?.lastName || ''}`.trim() || 'Driver Assigned')
              : (trip.driverName || 'Unassigned');

            // Vehicle info
            const vehicleReg = trip.vehicle?.registrationNumber || trip.vehicleNumber || (trip.vehicle?.model ? `${trip.vehicle.model}` : 'MH-1');

            // Bookings & pricing
            const bookedSeats = trip.bookedSeats ?? trip.bookingCount ?? 0;
            const totalSeats = trip.totalSeats ?? trip.vehicle?.seatingCapacity ?? 8;
            const price = trip.pricePerSeat ?? trip.price ?? 499;

            return (
              <div
                key={trip.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Card Header: Route Title + Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight capitalize truncate">
                    {routeTitle}
                  </h3>

                  {isCompleted && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase shrink-0">
                      COMPLETED
                    </span>
                  )}
                  {isScheduled && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase shrink-0">
                      SCHEDULED
                    </span>
                  )}
                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      ACTIVE
                    </span>
                  )}
                  {isCancelled && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase shrink-0">
                      CANCELLED
                    </span>
                  )}
                </div>

                {/* Route Full Text */}
                <div className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 leading-relaxed">
                    {originText} → {destText}
                  </p>
                </div>

                {/* Departure Time */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Depart: {formatTripDate(trip.departureTime || trip.departureDate)}</span>
                </div>

                {/* Driver & Vehicle Row */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      <span className="font-semibold text-slate-800">Driver:</span> {driverName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      <span className="font-semibold text-slate-800">Vehicle:</span> {vehicleReg}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-3">
                  {/* Left: Price & Bookings */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {formatTripPrice(price)}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">per seat</p>
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {bookedSeats} / {totalSeats}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">bookings</p>
                    </div>
                  </div>

                  {/* Right: Action Buttons (View Details & Manage Trip) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/dashboard/trips/${trip.id}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs active:scale-95 transition-all"
                    >
                      View Details
                    </Link>

                    <Link
                      href={`/dashboard/fleet-owner/trips/${trip.id}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs active:scale-95 transition-all"
                    >
                      Manage Trip
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 5. Slide-Over Navigation Drawer (Hamburger Menu) ───────────────── */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white shadow-xs shrink-0">
                  <MapPin className="w-4 h-4 fill-white text-[#4F46E5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">Kokan Travel</h3>
                  <p className="text-[10px] font-semibold text-[#4F46E5] uppercase tracking-wider">Fleet Operator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-500 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Rouf Shaikh'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'fleet@kokantravel.com'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-bold text-slate-700">
              <Link
                href="/dashboard/fleet-owner"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Command Center (Home)</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/trips"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 text-[#4F46E5]"
              >
                <Calendar className="w-4 h-4 text-[#4F46E5]" />
                <span>Trips & Dispatches</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/vehicles"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Car className="w-4 h-4 text-slate-500" />
                <span>Fleet Vehicles</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/drivers"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Driver Management</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/earnings"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <IndianRupee className="w-4 h-4 text-slate-500" />
                <span>Revenue & Earnings</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/analytics"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span>Fleet Analytics</span>
              </Link>
              <Link
                href="/dashboard/support"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Support Tickets</span>
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Account Profile & KYC</span>
              </Link>
            </div>

            <div className="p-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold">
              Kokan Travel Operator Portal v2.0
            </div>
          </div>
        </>
      )}
    </div>
  );
}
