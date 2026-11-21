'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { useFleetStore } from '@/store/slices/fleetSlice';
import apiClient from '@/lib/api';
import {
  Truck,
  Bell,
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  MapPin,
  Plus,
  Car,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Building2,
  Navigation,
  User,
  Eye,
  Activity,
  ArrowRight,
  Route,
  Star,
  CheckCircle2,
  Receipt,
  PlayCircle,
  QrCode,
  UserCheck,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import DirectUpiSettingsCard from '@/components/fleet/DirectUpiSettingsCard';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | undefined | null): string {
  const v = n ?? 0;
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000)      return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

function fmtDate(d: string | Date | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return String(d);
  }
}

function statusChip(status: string): string {
  const s = (status ?? '').toUpperCase();
  if (['ACTIVE', 'APPROVED'].includes(s))        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (s === 'SCHEDULED')                          return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (s === 'IN_PROGRESS')                        return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
  if (s === 'COMPLETED')                          return 'bg-gray-100 text-gray-600 border border-gray-200';
  if (['CANCELLED', 'REJECTED'].includes(s))      return 'bg-red-50 text-red-700 border border-red-200';
  if (['PENDING', 'DELAYED'].includes(s))         return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (s === 'SUSPENDED')                          return 'bg-orange-50 text-orange-700 border border-orange-200';
  if (s === 'INACTIVE')                           return 'bg-gray-50 text-gray-500 border border-gray-200';
  return 'bg-gray-50 text-gray-600 border border-gray-200';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function FleetOwnerDashboardPage() {
  const { user } = useAuthStore();
  const { unreadCount, getUnreadCount } = useNotificationStore();
  const {
    getFleetStats,
    stats,
    currentFleetName,
    currentFleetId,
    getRevenue,
    revenue,
    getVehicleStats,
    vehicleStats,
    drivers,
    getDrivers,
    getMyFleets,
  } = useFleetStore();

  const [trips, setTrips]                         = useState<any[]>([]);
  const [vehicles, setVehicles]                   = useState<any[]>([]);
  const [isLoadingTrips, setIsLoadingTrips]       = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isRefreshing, setIsRefreshing]           = useState(false);
  const [showUpiSettings, setShowUpiSettings]     = useState(false);
  const [tripsTab, setTripsTab]                   = useState<'all' | 'active' | 'upcoming'>('all');

  const loadAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        getUnreadCount().catch(() => null),
        getFleetStats().catch(() => null),
        getRevenue().catch(() => null),
        getVehicleStats().catch(() => null),
        getDrivers().catch(() => null),
        getMyFleets().catch(() => null),
      ]);

      // Fetch trips
      setIsLoadingTrips(true);
      apiClient.getMyTrips()
        .then((r: any) => setTrips(r.data?.data ?? r.data ?? []))
        .catch(() => null)
        .finally(() => setIsLoadingTrips(false));

      // Fetch vehicles
      setIsLoadingVehicles(true);
      apiClient.getMyVehicles()
        .then((r: any) => setVehicles(r.data?.data ?? r.data ?? []))
        .catch(() => null)
        .finally(() => setIsLoadingVehicles(false));

    } finally {
      setIsRefreshing(false);
    }
  }, [getUnreadCount, getFleetStats, getRevenue, getVehicleStats, getDrivers, getMyFleets]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const activeTrips = useMemo(() =>
    trips.filter(t => ['ACTIVE', 'IN_PROGRESS', 'active', 'in_progress', 'delayed', 'started'].includes(String(t.status || '').toLowerCase())),
  [trips]);

  const scheduledTrips = useMemo(() =>
    trips.filter(t => ['SCHEDULED', 'scheduled', 'upcoming'].includes(String(t.status || '').toLowerCase())),
  [trips]);

  const activeDrivers = useMemo(() =>
    drivers.filter((d: any) => String(d.status || '').toUpperCase() === 'ACTIVE'),
  [drivers]);

  const assignedDrivers = useMemo(() =>
    drivers.filter((d: any) => d.assignedVehicle || d.assignedVehicleId || d.vehicleId),
  [drivers]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return trips.filter(t =>
      new Date(t.departureTime || t.departureDate || 0).toDateString() === today,
    ).length;
  }, [trips]);

  // Document expiry alerts
  const expiryAlerts = useMemo(() => {
    const now  = new Date();
    const list: { title: string; daysLeft: number; critical: boolean }[] = [];

    vehicles.forEach((v: any) => {
      const name = `${v.brand || v.make || ''} ${v.model || ''}`.trim();
      const reg  = v.registrationNumber ? ` (${v.registrationNumber})` : '';
      const label = `${name}${reg}`;

      const check = (dateStr: string | null | undefined, docType: string) => {
        if (!dateStr) return;
        const expiry  = new Date(dateStr);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000);
        if (daysLeft >= 0 && daysLeft <= 30)
          list.push({ title: `${docType} — ${label}`, daysLeft, critical: daysLeft <= 7 });
      };

      check(v.insuranceExpiry, 'Insurance');
      check(v.registrationExpiry, 'Registration');
      check(v.permitExpiry, 'Permit');
      check(v.fitnessCertificateExpiry, 'Fitness Certificate');

      (v.documents ?? []).forEach((doc: any) => {
        const typeName = (doc.documentType ?? '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        check(doc.expiryDate, typeName || 'Document');
      });
    });

    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [vehicles]);

  // Shorthand stats
  const totalVehicles     = vehicleStats?.total     ?? vehicles.length;
  const approvedVehicles  = vehicleStats?.approved  ?? 0;
  const pendingVehicles   = vehicleStats?.pending   ?? 0;
  const rejectedVehicles  = vehicleStats?.rejected  ?? 0;
  const suspendedVehicles = vehicleStats?.suspended ?? 0;

  // Filtered trips for left column card
  const displayedTrips = useMemo(() => {
    if (tripsTab === 'active') return activeTrips;
    if (tripsTab === 'upcoming') return scheduledTrips;
    return trips;
  }, [trips, tripsTab, activeTrips, scheduledTrips]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* ── Expiry Alert Ribbon (Compact, non-intrusive) ──────────────────────── */}
      {expiryAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold text-amber-900">Document Expiries:</span>
            <span className="text-amber-800">
              {expiryAlerts[0].title} expires in <strong>{expiryAlerts[0].daysLeft} days</strong>.
              {expiryAlerts.length > 1 && ` (+${expiryAlerts.length - 1} more)`}
            </span>
          </div>
          <Link
            href="/dashboard/fleet-owner/vehicles?tab=documents"
            className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 underline underline-offset-2"
          >
            Review Compliance <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Compact Executive Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {currentFleetName ? (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                <Building2 className="w-3 h-3" />
                {currentFleetName}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              {activeTrips.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeTrips.length} Trip{activeTrips.length > 1 ? 's' : ''} Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Operations Ready
                </span>
              )}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Fleet Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, <strong className="text-slate-700">{user?.firstName}</strong>. Real-time overview of your fleet, dispatches, and revenue.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadAll}
            disabled={isRefreshing}
            title="Refresh fleet data"
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link href="/dashboard/fleet-owner/create-trip">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs py-2 px-3.5 font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create Trip
            </Button>
          </Link>

          <Link href="/dashboard/fleet-owner/vehicles">
            <Button variant="secondary" size="sm" className="rounded-xl text-xs py-2 px-3 font-semibold border-slate-200">
              <Car className="w-3.5 h-3.5 mr-1" />
              Add Vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* ── High-Density Executive KPI Cards (Row of 4) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Vehicles KPI */}
        <Link href="/dashboard/fleet-owner/vehicles" className="block group">
          <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-blue-400 hover:shadow-xs transition-all" shadow="none">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vehicles</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">{approvedVehicles}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {totalVehicles} Total</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                  {pendingVehicles > 0 ? (
                    <span className="text-amber-600 font-semibold">{pendingVehicles} Pending Review</span>
                  ) : rejectedVehicles > 0 ? (
                    <span className="text-rose-600 font-semibold">{rejectedVehicles} Needs Action</span>
                  ) : (
                    'All Approved & Ready'
                  )}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Truck className="w-4.5 h-4.5" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Trips KPI */}
        <Link href="/dashboard/fleet-owner/trips?status=active" className="block group">
          <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-cyan-400 hover:shadow-xs transition-all" shadow="none">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live & Scheduled Trips</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">{activeTrips.length}</span>
                  <span className="text-xs text-emerald-600 font-bold">Active Live</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                  {scheduledTrips.length} Scheduled • {todayCount} Departing Today
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative">
                {activeTrips.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
                <Navigation className="w-4.5 h-4.5" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Drivers KPI */}
        <Link href="/dashboard/fleet-owner/drivers" className="block group">
          <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-violet-400 hover:shadow-xs transition-all" shadow="none">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fleet Drivers</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">{activeDrivers.length}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {drivers.length} Active</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                  <span className="text-blue-600 font-semibold">{assignedDrivers.length} Assigned</span> • {drivers.length - assignedDrivers.length} Free
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Revenue KPI */}
        <Link href="/dashboard/fleet-owner/analytics" className="block group">
          <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-emerald-400 hover:shadow-xs transition-all" shadow="none">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Revenue</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">{fmtCurrency(revenue?.thisMonth)}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                  Today: <strong className="text-emerald-700">{fmtCurrency(revenue?.today)}</strong> • Week: {fmtCurrency(revenue?.thisWeek)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* ── Active Trip Spotlight (Hero alert when a live trip is ongoing) ──── */}
      {activeTrips.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-l-4 border-emerald-500 p-4 rounded-2xl shadow-xs bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Live Dispatch</span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">IN TRANSIT</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {activeTrips[0].source} → {activeTrips[0].destination}
                </p>
                <div className="flex flex-wrap gap-x-3 text-xs text-slate-600 mt-0.5">
                  {activeTrips[0].vehicle?.registrationNumber && (
                    <span className="font-mono text-slate-700">🚗 {activeTrips[0].vehicle.registrationNumber}</span>
                  )}
                  {activeTrips[0].driver?.name && (
                    <span>👤 {activeTrips[0].driver.name}</span>
                  )}
                  <span>👥 {activeTrips[0].bookedSeats || 0}/{activeTrips[0].totalSeats || '?'} Seats</span>
                </div>
              </div>
            </div>
            <Link href={`/dashboard/fleet-owner/trips/${activeTrips[0].id}`}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-1.5 px-3 self-end sm:self-auto">
                Manage Live Trip
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Main Two-Column Balanced Operational Layout ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ────────── LEFT COLUMN (7/12 - 58%) ──────────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">

          {/* Trips Operational Center */}
          <Card className="border border-slate-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden" padding="none">
            {/* Header with quick sub-tabs */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4.5 h-4.5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Trip Operations</h2>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold ml-2">
                  <button
                    onClick={() => setTripsTab('all')}
                    className={cn('px-2.5 py-1 rounded-md transition-all', tripsTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900')}
                  >
                    All ({trips.length})
                  </button>
                  <button
                    onClick={() => setTripsTab('active')}
                    className={cn('px-2.5 py-1 rounded-md transition-all', tripsTab === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900')}
                  >
                    Active ({activeTrips.length})
                  </button>
                  <button
                    onClick={() => setTripsTab('upcoming')}
                    className={cn('px-2.5 py-1 rounded-md transition-all', tripsTab === 'upcoming' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900')}
                  >
                    Upcoming ({scheduledTrips.length})
                  </button>
                </div>
              </div>

              <Link href="/dashboard/fleet-owner/trips" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Trips List */}
            {isLoadingTrips ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading trips…</div>
            ) : displayedTrips.length === 0 ? (
              <div className="p-8 text-center">
                <Route className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No {tripsTab} trips</p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Schedule a new trip to start taking bookings.</p>
                <Link href="/dashboard/fleet-owner/create-trip">
                  <Button size="sm" className="rounded-xl text-xs py-1.5">Create Trip</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayedTrips.slice(0, 5).map((trip: any) => {
                  const isLive = ['ACTIVE', 'IN_PROGRESS', 'active', 'in_progress'].includes(trip.status);
                  const driverName = trip.driver?.name || `${trip.driver?.user?.firstName || ''} ${trip.driver?.user?.lastName || ''}`.trim() || trip.driverName;
                  return (
                    <div key={trip.id} className="p-3.5 sm:px-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'}`} />
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {trip.source} → {trip.destination}
                          </p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full shrink-0 ${statusChip(trip.status)}`}>
                            {trip.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {fmtDate(trip.departureTime || trip.departureDate)}
                          </span>
                          {trip.vehicle?.registrationNumber && (
                            <span className="flex items-center gap-1 font-mono text-slate-600">
                              <Car className="w-3 h-3 text-slate-400" />
                              {trip.vehicle.registrationNumber}
                            </span>
                          )}
                          {driverName && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              {driverName}
                            </span>
                          )}
                          <span className="text-slate-600 font-semibold">
                            {trip.bookedSeats || 0}/{trip.totalSeats || '?'} booked
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-900 hidden sm:block">
                          ₹{trip.pricePerSeat || trip.price || 0}
                        </span>
                        <Link href={`/dashboard/fleet-owner/trips/${trip.id}`}>
                          <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                            Manage
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Fleet Vehicles Status Card */}
          <Card className="border border-slate-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden" padding="none">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4.5 h-4.5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Fleet Vehicles Overview</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/fleet-owner/vehicles" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                  View All ({vehicles.length}) <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Compact Status Pills Bar */}
            <div className="grid grid-cols-4 divide-x divide-slate-100 bg-slate-50/50 border-b border-slate-100 text-center py-2.5">
              <div>
                <p className="text-base font-black text-emerald-700">{approvedVehicles}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved</p>
              </div>
              <div>
                <p className="text-base font-black text-amber-700">{pendingVehicles}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending</p>
              </div>
              <div>
                <p className="text-base font-black text-rose-700">{rejectedVehicles}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rejected</p>
              </div>
              <div>
                <p className="text-base font-black text-orange-700">{suspendedVehicles}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suspended</p>
              </div>
            </div>

            {/* Mini Vehicle Roster */}
            {isLoadingVehicles ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading vehicles…</div>
            ) : vehicles.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500">No vehicles added yet.</p>
                <Link href="/dashboard/fleet-owner/vehicles">
                  <Button size="sm" className="rounded-xl text-xs mt-2">Add Vehicle</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {vehicles.slice(0, 4).map((v: any) => (
                  <div key={v.id} className="p-3 px-4 hover:bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {v.brand || v.make} {v.model}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500">{v.registrationNumber || 'No Plate'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full ${statusChip(v.status)}`}>
                        {v.status}
                      </span>
                      <Link href={`/dashboard/fleet-owner/vehicles`}>
                        <button className="text-xs text-blue-600 hover:text-blue-800 font-semibold p-1">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ────────── RIGHT COLUMN (5/12 - 42%) ─────────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Revenue Snapshot Card */}
          <Card className="border border-slate-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden" padding="none">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4.5 h-4.5 text-emerald-600" />
                Revenue & Earnings
              </h2>
              <Link href="/dashboard/fleet-owner/analytics" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                Analytics <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-3.5 grid grid-cols-2 gap-2.5">
              {[
                { label: 'Today',      value: revenue?.today,     textColor: 'text-slate-900',   bg: 'bg-slate-50'   },
                { label: 'This Week',  value: revenue?.thisWeek,  textColor: 'text-blue-700',    bg: 'bg-blue-50/70' },
                { label: 'This Month', value: revenue?.thisMonth, textColor: 'text-emerald-700', bg: 'bg-emerald-50/70' },
                { label: 'All Time',   value: revenue?.total,     textColor: 'text-violet-700',  bg: 'bg-violet-50/70' },
              ].map(item => (
                <div key={item.label} className={`p-2.5 rounded-xl ${item.bg}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                  <p className={`text-base font-extrabold mt-0.5 ${item.textColor}`}>{fmtCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Direct Passenger UPI & QR Code Card (Compact with inline toggle) */}
          <Card className="border border-slate-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden" padding="none">
            <button
              onClick={() => setShowUpiSettings(!showUpiSettings)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">Direct Passenger UPI & QR</p>
                    {user?.upiId && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                    {user?.upiId ? user.upiId : 'Configure UPI ID & QR Code'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-semibold text-blue-600 hidden sm:inline">
                  {showUpiSettings ? 'Close' : 'Manage'}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-200', showUpiSettings ? 'rotate-180' : '')} />
              </div>
            </button>

            {/* Inline expandable settings container */}
            {showUpiSettings && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <DirectUpiSettingsCard />
              </div>
            )}
          </Card>

          {/* Drivers Snapshot */}
          <Card className="border border-slate-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden" padding="none">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-violet-600" />
                Driver Roster ({drivers.length})
              </h2>
              <Link href="/dashboard/fleet-owner/drivers" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-3.5">
              <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-sm font-bold text-slate-900">{drivers.length}</p>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Total</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <p className="text-sm font-bold text-emerald-700">{activeDrivers.length}</p>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-600">Active</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <p className="text-sm font-bold text-blue-700">{assignedDrivers.length}</p>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-blue-600">Assigned</p>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg">
                  <p className="text-sm font-bold text-amber-700">{drivers.length - assignedDrivers.length}</p>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-amber-600">Free</p>
                </div>
              </div>

              {drivers.length === 0 ? (
                <div className="text-center py-2 text-xs text-slate-400">
                  No drivers yet. <Link href="/dashboard/fleet-owner/drivers" className="text-blue-600 underline">Add driver</Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {drivers.slice(0, 3).map((driver: any) => (
                    <div key={driver.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {(driver.name || driver.firstName || 'D')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Driver'}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            {(driver.rating ?? 5).toFixed(1)} • {driver.totalTrips ?? 0} trips
                          </p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${statusChip(driver.status)}`}>
                        {driver.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Compliance & KYC Card */}
          <Card className="border border-slate-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden" padding="none">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-amber-600" />
                Compliance & Security
              </h2>
              <Link href="/dashboard/fleet-owner/vehicles?tab=documents" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                Docs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-3.5 space-y-2">
              {/* KYC Status */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">Account KYC</span>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                  {(user as any)?.kycStatus || 'VERIFIED'}
                </span>
              </div>

              {/* Vehicle Documents */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-700">Vehicle Documents</span>
                </div>
                {expiryAlerts.length > 0 ? (
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                    {expiryAlerts.length} Expiring Soon
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    All Valid
                  </span>
                )}
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
