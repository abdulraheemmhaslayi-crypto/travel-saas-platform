'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  MapPin,
  Car,
  ChevronRight,
  ChevronLeft,
  Navigation,
  User,
  Users,
  IndianRupee,
  Route,
  Plus,
  Sparkles,
  QrCode,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  LogOut,
  Calendar,
  Building2,
  TrendingUp,
  CreditCard,
  Phone,
  ArrowRight,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import DirectUpiSettingsCard from '@/components/fleet/DirectUpiSettingsCard';
import { cn } from '@/lib/utils';

// Helper to format currency
function fmtCurrency(n: number | undefined | null): string {
  const v = n ?? 0;
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${v.toFixed(0)}`;
}

// Helper to format date & time
function fmtDateTime(d: string | Date | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(d);
  }
}

export interface FleetOwnerDashboardMobileProps {
  user: any;
  unreadCount: number;
  currentFleetName?: string | null;
  trips: any[];
  vehicles: any[];
  drivers: any[];
  stats: any;
  revenue: any;
  vehicleStats: any;
  activeTrips: any[];
  scheduledTrips: any[];
  todayCount: number;
  activeDrivers: any[];
  assignedDrivers: any[];
  expiryAlerts: { title: string; daysLeft: number; critical: boolean }[];
  isLoadingTrips: boolean;
  isLoadingVehicles: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  showUpiSettings: boolean;
  setShowUpiSettings: (show: boolean) => void;
}

export default function FleetOwnerDashboardMobile({
  user,
  unreadCount,
  currentFleetName,
  trips,
  vehicles,
  drivers,
  stats,
  revenue,
  vehicleStats,
  activeTrips,
  scheduledTrips,
  todayCount,
  activeDrivers,
  assignedDrivers,
  expiryAlerts,
  isLoadingTrips,
  isLoadingVehicles,
  isRefreshing,
  onRefresh,
  showUpiSettings,
  setShowUpiSettings,
}: FleetOwnerDashboardMobileProps) {
  const [tripsTab, setTripsTab] = useState<'all' | 'active' | 'upcoming'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User initials
  const initials = useMemo(() => {
    const f = user?.firstName?.[0] || 'F';
    const l = user?.lastName?.[0] || 'O';
    return `${f}${l}`.toUpperCase();
  }, [user]);

  // Total and status vehicles
  const totalVehicles = vehicleStats?.total ?? vehicles.length;
  const approvedVehicles = vehicleStats?.approved ?? 0;
  const pendingVehicles = vehicleStats?.pending ?? 0;
  const rejectedVehicles = vehicleStats?.rejected ?? 0;
  const suspendedVehicles = vehicleStats?.suspended ?? 0;

  // Free drivers (active drivers without assigned vehicle)
  const freeDrivers = useMemo(() => {
    return drivers.filter(
      (d: any) =>
        String(d.status || '').toUpperCase() === 'ACTIVE' &&
        !d.assignedVehicle &&
        !d.assignedVehicleId &&
        !d.vehicleId
    );
  }, [drivers]);

  // Filtered trips for current tab
  const displayedTrips = useMemo(() => {
    if (tripsTab === 'active') return activeTrips;
    if (tripsTab === 'upcoming') return scheduledTrips;
    return trips;
  }, [trips, tripsTab, activeTrips, scheduledTrips]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-800 antialiased selection:bg-[#4F46E5] selection:text-white">
      {/* ── 1. Top Navigation App Bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between shadow-2xs">
        {/* Left: Hamburger Menu */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90 transition-all cursor-pointer"
            aria-label="Open fleet navigation drawer"
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

        {/* Right: Notifications & Profile Avatar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-[#4F46E5]')} />
          </button>

          <Link
            href="/dashboard/notifications"
            className="relative w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            {unreadCount > 0 && (
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

      {/* ── Document Expiry Alert Banner (if any) ───────────────────────────── */}
      {expiryAlerts.length > 0 && (
        <div className="px-4 pt-3">
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="min-w-0 text-xs text-amber-900 font-medium truncate">
                <span className="font-bold">Compliance Alert: </span>
                {expiryAlerts[0].title} expires in <strong>{expiryAlerts[0].daysLeft} days</strong>
                {expiryAlerts.length > 1 && ` (+${expiryAlerts.length - 1} more)`}
              </div>
            </div>
            <Link
              href="/dashboard/fleet-owner/vehicles?tab=documents"
              className="text-[11px] font-bold text-amber-900 underline shrink-0 hover:text-amber-950"
            >
              Review
            </Link>
          </div>
        </div>
      )}

      {/* ── Main Mobile Content Stack ───────────────────────────────────────── */}
      <div className="px-4 pt-3 space-y-3.5">
        {/* ── 2. Welcome Back Profile Hero Card ─────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#EDE9FE]/75 via-[#F5F3FF]/70 to-[#E0E7FF]/60 border border-purple-150/80 rounded-3xl p-4 shadow-2xs relative overflow-hidden">
                    {/* Subtle stylized background illustration: modern car */}
          <div className="absolute right-1 bottom-1 pointer-events-none opacity-90 flex items-end justify-end">
            <img
              src="/images/banner-car.png"
              alt="Fleet Vehicle"
              className="w-auto h-12 object-contain drop-shadow-sm"
            />
          </div>

          <div className="relative z-10 flex items-center gap-3.5">
            {/* Avatar Circle */}
            <div className="w-12 h-12 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              {initials}
            </div>

            {/* Text details */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 leading-tight">Welcome back,</p>
              <h1 className="text-base font-bold text-slate-900 tracking-tight truncate leading-tight mt-0.5">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Rouf Shaikh'} 👋
              </h1>
              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5 max-w-[200px]">
                {user?.email || 'rouf@gmail.com'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Action Buttons Row: Refresh & Create Trip ───────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-[#4F46E5]')} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/fleet-owner/create-trip"
            className="h-10 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Trip</span>
          </Link>
        </div>

        {/* ── 3. 4-Metric Quick Action Cards (2x2 Grid) ──────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Vehicles */}
          <Link
            href="/dashboard/fleet-owner/vehicles"
            className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs hover:border-blue-200 active:scale-[0.98] transition-all flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2 shrink-0">
                <Car className="w-4 h-4 stroke-[2]" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate">
                {approvedVehicles} <span className="text-[11px] font-bold text-slate-400">/ {totalVehicles} Total</span>
              </p>
              <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">
                {pendingVehicles > 0 ? `${pendingVehicles} Pending Approval` : 'All Approved & Ready'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 self-center" />
          </Link>

          {/* Card 2: Trips Live */}
          <Link
            href="/dashboard/fleet-owner/trips"
            className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs hover:border-emerald-200 active:scale-[0.98] transition-all flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2 shrink-0">
                <Users className="w-4 h-4 stroke-[2]" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate">
                {activeTrips.length} <span className="text-[11px] font-bold text-slate-400">Active Live</span>
              </p>
              <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">
                {scheduledTrips.length} Scheduled • {todayCount} Today
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 self-center" />
          </Link>

          {/* Card 3: Drivers */}
          <Link
            href="/dashboard/fleet-owner/drivers"
            className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs hover:border-purple-200 active:scale-[0.98] transition-all flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="w-7 h-7 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-2 shrink-0">
                <User className="w-4 h-4 stroke-[2]" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate">
                {activeDrivers.length} <span className="text-[11px] font-bold text-slate-400">/ {drivers.length} Active</span>
              </p>
              <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">
                {assignedDrivers.length} Assigned • {activeDrivers.length} Online
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400 shrink-0 self-center" />
          </Link>

          {/* Card 4: Revenue */}
          <Link
            href="/dashboard/fleet-owner/earnings"
            className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs hover:border-emerald-200 active:scale-[0.98] transition-all flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2 shrink-0">
                <IndianRupee className="w-4 h-4 stroke-[2.2]" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate">
                ₹{fmtCurrency(revenue?.thisMonth || revenue?.totalRevenue || 0)}
              </p>
              <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">
                Today: ₹{fmtCurrency(revenue?.today || 0)} • Wallet: ₹{fmtCurrency(revenue?.walletBalance || 0)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 self-center" />
          </Link>
        </div>

        {/* ── 4. Trip Operations Section ────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                <Navigation className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Trip Operations</h2>
            </div>
            <Link
              href="/dashboard/fleet-owner/trips"
              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setTripsTab('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0',
                tripsTab === 'all'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              All ({trips.length})
            </button>
            <button
              type="button"
              onClick={() => setTripsTab('active')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0',
                tripsTab === 'active'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Active ({activeTrips.length})
            </button>
            <button
              type="button"
              onClick={() => setTripsTab('upcoming')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0',
                tripsTab === 'upcoming'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Upcoming ({scheduledTrips.length})
            </button>
          </div>

          {/* Trips Content */}
          {displayedTrips.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {displayedTrips.slice(0, 3).map((t: any) => {
                const isLive = ['active', 'in_progress', 'started'].includes(String(t.status || '').toLowerCase());
                return (
                  <Link
                    key={t.id}
                    href={`/dashboard/fleet-owner/trips/${t.id}`}
                    className="block p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{t.origin || t.source || '—'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{t.destination || '—'}</span>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border uppercase',
                          isLive
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        )}
                      >
                        {t.status || 'Scheduled'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{fmtDateTime(t.departureTime || t.departureDate)}</span>
                      <span>
                        {t.vehicle?.model ? `${t.vehicle.model}` : 'Comfort Fleet'} •{' '}
                        {t.driver?.name || 'Driver Assigned'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Empty State exactly matching the design */
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                <Route className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-sm font-bold text-slate-800 leading-tight">No {tripsTab} trips</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs font-medium">
                Schedule a new trip to start taking bookings.
              </p>
              <Link
                href="/dashboard/fleet-owner/trips?action=create"
                className="mt-3.5 inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
              >
                Create Trip
              </Link>
            </div>
          )}
        </section>

        {/* ── 5. Revenue & Earnings Section ─────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <IndianRupee className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Revenue & Earnings</h2>
            </div>
            <Link
              href="/dashboard/fleet-owner/analytics"
              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-0.5"
            >
              Analytics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 2x2 Grid with real revenue numbers */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* TODAY */}
            <div className="bg-[#F0FDF4]/80 rounded-2xl p-3 border border-emerald-100/90">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TODAY</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5 leading-tight">
                ₹{fmtCurrency(revenue?.today || 0)}
              </p>
            </div>

            {/* THIS WEEK */}
            <div className="bg-[#EFF6FF]/80 rounded-2xl p-3 border border-blue-100/90">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">THIS WEEK</span>
              <p className="text-lg font-bold text-blue-700 mt-0.5 leading-tight">
                ₹{fmtCurrency(revenue?.thisWeek || 0)}
              </p>
            </div>

            {/* THIS MONTH */}
            <div className="bg-[#F0FDF4]/80 rounded-2xl p-3 border border-emerald-100/90">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">THIS MONTH</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5 leading-tight">
                ₹{fmtCurrency(revenue?.thisMonth || 0)}
              </p>
            </div>

            {/* ALL TIME */}
            <div className="bg-[#FAF5FF]/80 rounded-2xl p-3 border border-purple-100/90">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ALL TIME</span>
              <p className="text-lg font-bold text-purple-700 mt-0.5 leading-tight">
                ₹{fmtCurrency(revenue?.totalRevenue || revenue?.allTime || 0)}
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. Direct Passenger UPI & QR Card ─────────────────────────────── */}
        <div
          onClick={() => setShowUpiSettings(!showUpiSettings)}
          className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0">
              <QrCode className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 leading-tight">Direct Passenger UPI & QR</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                GPay | PhonePe | UPI ID | QR code
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#4F46E5] flex items-center gap-0.5 shrink-0">
            Manage <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Accordion Direct UPI Component if opened */}
        {showUpiSettings && (
          <div className="bg-white rounded-3xl border border-indigo-100 p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <DirectUpiSettingsCard />
          </div>
        )}

        {/* ── 7. Fleet Vehicles Overview Section ────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                <Car className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Fleet Vehicles Overview</h2>
            </div>
            <Link
              href="/dashboard/fleet-owner/vehicles"
              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-0.5"
            >
              View All ({totalVehicles}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Status Columns */}
          <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
            <div className="bg-slate-50/80 rounded-xl py-2 px-1 border border-slate-100">
              <span className="text-sm font-bold text-emerald-600 leading-none block">{approvedVehicles}</span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-1">APPROVED</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl py-2 px-1 border border-slate-100">
              <span className="text-sm font-bold text-amber-600 leading-none block">{pendingVehicles}</span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-1">PENDING</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl py-2 px-1 border border-slate-100">
              <span className="text-sm font-bold text-rose-600 leading-none block">{rejectedVehicles}</span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-1">REJECTED</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl py-2 px-1 border border-slate-100">
              <span className="text-sm font-bold text-orange-600 leading-none block">{suspendedVehicles}</span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-1">SUSPENDED</span>
            </div>
          </div>

          {/* Vehicles List or Empty State */}
          {vehicles.length > 0 ? (
            <div className="space-y-2 pt-1">
              {vehicles.slice(0, 2).map((v: any) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {[v.brand, v.model].filter(Boolean).join(' ') || 'Vehicle'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      {v.registrationNumber || 'No reg number'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0',
                      String(v.status || '').toUpperCase() === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    {v.status || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-slate-500 font-medium">No vehicles added yet.</p>
              <Link
                href="/dashboard/fleet-owner/vehicles?action=add"
                className="mt-2.5 inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
              >
                Add Vehicle
              </Link>
            </div>
          )}
        </section>

        {/* ── 8. Driver Roster Section ──────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Users className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Driver Roster ({drivers.length})
              </h2>
            </div>
            <Link
              href="/dashboard/fleet-owner/drivers"
              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-0.5"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Status Pillars */}
          <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
            <div className="bg-slate-50/80 rounded-xl py-2 px-1 border border-slate-100">
              <span className="text-sm font-bold text-slate-800 leading-none block">{drivers.length}</span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-1">TOTAL</span>
            </div>
            <div className="bg-[#F0FDF4]/90 rounded-xl py-2 px-1 border border-emerald-100">
              <span className="text-sm font-bold text-emerald-700 leading-none block">{activeDrivers.length}</span>
              <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider block mt-1">ACTIVE</span>
            </div>
            <div className="bg-[#EFF6FF]/90 rounded-xl py-2 px-1 border border-blue-100">
              <span className="text-sm font-bold text-blue-700 leading-none block">{assignedDrivers.length}</span>
              <span className="text-[9px] font-extrabold text-blue-800 uppercase tracking-wider block mt-1">ASSIGNED</span>
            </div>
            <div className="bg-[#FEFCE8]/90 rounded-xl py-2 px-1 border border-amber-100">
              <span className="text-sm font-bold text-amber-700 leading-none block">{freeDrivers.length}</span>
              <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider block mt-1">FREE</span>
            </div>
          </div>

          {/* Drivers Content */}
          {drivers.length > 0 ? (
            <div className="space-y-2 pt-1">
              {drivers.slice(0, 2).map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {d.user ? `${d.user.firstName || ''} ${d.user.lastName || ''}`.trim() : d.name || 'Driver'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {d.assignedVehicle?.model || d.assignedVehicle?.registrationNumber
                        ? `Assigned: ${d.assignedVehicle.model || d.assignedVehicle.registrationNumber}`
                        : 'No vehicle assigned'}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {d.status || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-slate-500 font-medium">
              No drivers yet.{' '}
              <Link href="/dashboard/fleet-owner/drivers?action=add" className="text-[#4F46E5] font-bold underline ml-1">
                Add Driver
              </Link>
            </div>
          )}
        </section>

        {/* ── 9. Compliance & Security Section ──────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Compliance & Security</h2>
            </div>
            <Link
              href="/dashboard/fleet-owner/vehicles?tab=documents"
              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-0.5"
            >
              Docs <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Item 1: Account KYC */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-800">Account KYC</span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
              VERIFIED
            </span>
          </div>

          {/* Item 2: Vehicle Documents */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-800">Vehicle Documents</span>
            </div>
            <span
              className={cn(
                'text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase',
                expiryAlerts.length > 0
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              )}
            >
              {expiryAlerts.length > 0 ? `${expiryAlerts.length} Action Needed` : 'ACTIVE'}
            </span>
          </div>
        </section>
      </div>

      {/* ── 10. Slide-Over Navigation Drawer (Hamburger Menu) ───────────────── */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white shadow-xs shrink-0">
                  <MapPin className="w-4 h-4 fill-white text-[#4F46E5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">Kokan Travel</h3>
                  <p className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-wider">Fleet Operator</p>
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

            {/* Profile Summary in Drawer */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Rouf Shaikh'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'fleet@kokantravel.com'}</p>
                {currentFleetName && (
                  <span className="inline-block mt-1 text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    {currentFleetName}
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-bold text-slate-700">
              <Link
                href="/dashboard/fleet-owner"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 text-[#4F46E5]"
              >
                <Layers className="w-4 h-4 text-[#4F46E5]" />
                <span>Command Center (Home)</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/trips"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
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
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setShowUpiSettings(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
              >
                <QrCode className="w-4 h-4 text-slate-500" />
                <span>Passenger UPI & QR Settings</span>
              </button>
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

            {/* Drawer Bottom info */}
            <div className="p-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold">
              Kokan Travel Operator Portal v2.0
            </div>
          </div>
        </>
      )}
    </div>
  );
}
