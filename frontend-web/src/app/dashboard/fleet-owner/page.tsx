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
} from 'lucide-react';
import Card from '@/components/ui/Card';
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
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  subText?: string;
  href?: string;
  pulse?: boolean;
}

function KpiCard({ label, value, icon, iconColor = 'text-gray-500', iconBg = 'bg-gray-50', subText, href, pulse }: KpiCardProps) {
  const inner = (
    <Card className="hover:border-gray-200 transition-colors duration-150 cursor-pointer" shadow="none">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-2">{label}</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{value}</p>
            {subText && (
              <p className="text-xs text-gray-500 mt-2 truncate font-medium">{subText}</p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-xl shrink-0 relative', iconBg, iconColor)}>
            {pulse && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            )}
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
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

      // Fetch vehicles with documents for expiry checking
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
    trips.filter(t => ['ACTIVE', 'IN_PROGRESS', 'active', 'in_progress'].includes(t.status)),
  [trips]);

  const scheduledTrips = useMemo(() =>
    trips.filter(t => ['SCHEDULED', 'scheduled'].includes(t.status)),
  [trips]);

  const activeDrivers = useMemo(() =>
    drivers.filter((d: any) => d.status === 'ACTIVE'),
  [drivers]);

  const assignedDrivers = useMemo(() =>
    drivers.filter((d: any) => d.assignedVehicle || d.vehicleId),
  [drivers]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return trips.filter(t =>
      new Date(t.departureTime || t.departureDate || 0).toDateString() === today,
    ).length;
  }, [trips]);

  // ── Document expiry alerts ───────────────────────────────────────────────────
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

  // ── Shorthand stats ─────────────────────────────────────────────────────────
  const totalVehicles     = vehicleStats?.total     ?? vehicles.length;
  const approvedVehicles  = vehicleStats?.approved  ?? 0;
  const pendingVehicles   = vehicleStats?.pending   ?? 0;
  const rejectedVehicles  = vehicleStats?.rejected  ?? 0;
  const suspendedVehicles = vehicleStats?.suspended ?? 0;

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>

      {/* ── Expiry Alert Banner ──────────────────────────────────────────────── */}
      {expiryAlerts.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Expiry Alerts
            </span>
            {expiryAlerts.slice(0, 3).map((a, i) => (
              <span key={i} className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                a.critical
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {a.title} — {a.daysLeft}d left
              </span>
            ))}
            {expiryAlerts.length > 3 && (
              <span className="text-[11px] text-amber-700 font-semibold">
                +{expiryAlerts.length - 3} more
              </span>
            )}
            <Link
              href="/dashboard/fleet-owner/vehicles?tab=documents"
              className="ml-auto text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-0.5 transition-colors"
            >
              Review All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-8">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {currentFleetName && (
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-wide">
                <Building2 className="w-3.5 h-3.5" />
                {currentFleetName}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
              Fleet Command Center
            </h1>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">
              Welcome back,{' '}
              <span className="font-semibold text-gray-700">{user?.firstName}</span>.
              Here's your fleet overview for today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <button
              onClick={loadAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <Link href="/dashboard/notifications">
              <button className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
                <Bell className="w-3.5 h-3.5" />
                Alerts
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </Link>

            <Link href="/dashboard/fleet-owner/create-trip">
              <Button
                variant="secondary"
                className="rounded-xl text-sm py-2 font-semibold border-slate-200"
                disabled={!currentFleetId}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Create Trip
              </Button>
            </Link>

            <Link href="/dashboard/fleet-owner/vehicles">
              <Button className="rounded-xl text-sm py-2 font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Vehicle
              </Button>
            </Link>
          </div>
        </div>

        {/* ── 8 KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total Vehicles"
            value={totalVehicles}
            icon={<Truck className="w-5 h-5" />}
            iconColor="text-blue-600"
            iconBg="bg-blue-50/50"
            subText="Registered fleet size"
            href="/dashboard/fleet-owner/vehicles"
          />
          <KpiCard
            label="Approved Vehicles"
            value={approvedVehicles}
            icon={<CheckCircle className="w-5 h-5" />}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50/50"
            subText="Ready for trips"
            href="/dashboard/fleet-owner/vehicles?tab=approval"
          />
          <KpiCard
            label="Pending Approval"
            value={pendingVehicles}
            icon={<Clock className="w-5 h-5" />}
            iconColor="text-amber-600"
            iconBg="bg-amber-50/50"
            subText="Awaiting admin review"
            href="/dashboard/fleet-owner/vehicles?tab=approval"
          />
          <KpiCard
            label="Issues"
            value={rejectedVehicles + suspendedVehicles}
            icon={<XCircle className="w-5 h-5" />}
            iconColor="text-rose-600"
            iconBg="bg-rose-50/50"
            subText={`${rejectedVehicles} rejected · ${suspendedVehicles} suspended`}
            href="/dashboard/fleet-owner/vehicles?tab=approval"
          />
          <KpiCard
            label="Active Drivers"
            value={(activeDrivers.length || stats?.activeDrivers) ?? 0}
            icon={<Users className="w-5 h-5" />}
            iconColor="text-purple-650"
            iconBg="bg-purple-50/50"
            subText={`${drivers.length} total registered`}
            href="/dashboard/fleet-owner/drivers"
          />
          <KpiCard
            label="Active Trips"
            value={(activeTrips.length || revenue?.activeTrips) ?? 0}
            icon={<Navigation className="w-5 h-5" />}
            iconColor="text-cyan-600"
            iconBg="bg-cyan-50/50"
            subText={`${scheduledTrips.length} scheduled`}
            href="/dashboard/fleet-owner/trips?status=active"
            pulse={activeTrips.length > 0}
          />
          <KpiCard
            label="Today's Trips"
            value={todayCount}
            icon={<Calendar className="w-5 h-5" />}
            iconColor="text-pink-650"
            iconBg="bg-pink-50/50"
            subText="Departing today"
          />
          <KpiCard
            label="Monthly Revenue"
            value={fmtCurrency(revenue?.thisMonth)}
            icon={<DollarSign className="w-5 h-5" />}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-50/50"
            subText={`Today: ${fmtCurrency(revenue?.today)}`}
            href="/dashboard/fleet-owner/analytics?tab=revenue"
          />
        </div>

        {/* ── Main 3-column grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ────────── LEFT COLUMN (2/3) ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Vehicle Status Summary */}
            <Card
              className="border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden"
              padding="none"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-4.5 h-4.5 text-blue-600" />
                    Vehicle Status Summary
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Approval breakdown across your fleet</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/fleet-owner/vehicles">
                    <Button variant="secondary" size="sm" className="rounded-xl text-xs py-1.5 border-slate-200 font-semibold">
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View All
                    </Button>
                  </Link>
                  <Link href="/dashboard/fleet-owner/vehicles">
                    <Button size="sm" className="rounded-xl text-xs py-1.5 font-semibold">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Vehicle
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
                {[
                  { label: 'Approved',  value: approvedVehicles,  dot: 'bg-emerald-500', bg: 'bg-emerald-50/60', text: 'text-emerald-700' },
                  { label: 'Pending',   value: pendingVehicles,   dot: 'bg-amber-400',   bg: 'bg-amber-50/60',   text: 'text-amber-700' },
                  { label: 'Rejected',  value: rejectedVehicles,  dot: 'bg-red-500',     bg: 'bg-red-50/60',     text: 'text-red-700' },
                  { label: 'Suspended', value: suspendedVehicles, dot: 'bg-orange-500',  bg: 'bg-orange-50/60',  text: 'text-orange-700' },
                ].map(item => (
                  <Link
                    key={item.label}
                    href="/dashboard/fleet-owner/vehicles?tab=approval"
                    className={`flex flex-col items-center justify-center py-6 ${item.bg} hover:brightness-95 transition-all`}
                  >
                    <span className={`w-2 h-2 rounded-full ${item.dot} mb-2`} />
                    <span className={`text-2xl font-extrabold ${item.text}`}>{item.value}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Vehicle mini-list */}
              {isLoadingVehicles ? (
                <div className="p-6 text-center text-sm text-slate-400">Loading vehicles…</div>
              ) : vehicles.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Truck className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No vehicles yet</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Add your first vehicle to get started.</p>
                  <Link href="/dashboard/fleet-owner/vehicles">
                    <Button size="sm" className="rounded-xl">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Vehicle
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {vehicles.slice(0, 5).map((v: any) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
                    >
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100/50">
                        <Car className="w-4.5 h-4.5" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {v.brand || v.make || ''} {v.model || ''}
                          {v.year ? ` (${v.year})` : ''}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">{v.registrationNumber || '—'}</p>
                      </div>

                      {/* Rejection reason */}
                      {v.rejectionReason && (v.status || '').toUpperCase() === 'REJECTED' && (
                        <p className="hidden sm:block text-[10px] text-rose-500 italic truncate max-w-[120px]" title={v.rejectionReason}>
                          {v.rejectionReason}
                        </p>
                      )}

                      {/* Status */}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${statusChip(v.status)}`}>
                        {v.status}
                      </span>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </div>
                  ))}

                  {vehicles.length > 5 && (
                    <div className="pt-2 text-center">
                      <Link
                        href="/dashboard/fleet-owner/vehicles"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        View all {vehicles.length} vehicles <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Active & Upcoming Trips */}
            <Card
              className="border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden"
              padding="none"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Navigation className="w-4.5 h-4.5 text-cyan-600" />
                    Active & Upcoming Trips
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTrips.length} active · {scheduledTrips.length} scheduled
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/fleet-owner/create-trip">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-xl text-xs py-1.5 border-slate-200 font-semibold"
                      disabled={!currentFleetId}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Create
                    </Button>
                  </Link>
                  <Link href="/dashboard/fleet-owner/trips">
                    <Button size="sm" className="rounded-xl text-xs py-1.5 font-semibold">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Content */}
              {isLoadingTrips ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading trips…</div>
              ) : trips.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-7 h-7 text-cyan-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No trips yet</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Create your first trip to start accepting passenger bookings.
                  </p>
                  <Link href="/dashboard/fleet-owner/create-trip">
                    <Button size="sm" className="rounded-xl" disabled={!currentFleetId}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Create Trip
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {[...activeTrips, ...scheduledTrips].slice(0, 6).map((trip: any) => {
                    const isLive = ['ACTIVE', 'IN_PROGRESS', 'active', 'in_progress'].includes(trip.status);
                    return (
                      <div key={trip.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                        {/* Live indicator */}
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'}`} />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {trip.source || trip.origin || 'Origin'} → {trip.destination || 'Destination'}
                            </p>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${statusChip(trip.status)}`}>
                              {trip.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {fmtDate(trip.departureTime || trip.departureDate)}
                            </span>
                            {trip.vehicle && (
                              <span className="flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                {trip.vehicle.brand || trip.vehicle.make || ''} {trip.vehicle.model || ''}
                              </span>
                            )}
                            {trip.driver?.user && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {trip.driver.user.firstName} {trip.driver.user.lastName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {trip.bookedSeats ?? 0}/{trip.totalSeats ?? '?'} seats
                            </span>
                          </div>
                        </div>

                        {/* View button */}
                        <Link href={`/dashboard/trips/${trip.id}`}>
                          <button className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all opacity-0 group-hover:opacity-100">
                            View
                          </button>
                        </Link>
                      </div>
                    );
                  })}

                  {trips.length > 6 && (
                    <div className="px-5 py-3 text-center">
                      <Link
                        href="/dashboard/fleet-owner/trips"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        View all {trips.length} trips <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* ────────── RIGHT COLUMN (1/3) ─────────────────────────────────── */}
          <div className="space-y-5">

            {/* Revenue Widget */}
            <Card
              className="border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden"
              padding="none"
            >
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4.5 h-4.5 text-emerald-600" />
                  Revenue & Earnings
                </h2>
              </div>
              <div className="p-4 space-y-2.5">
                {[
                  { label: 'Today',      value: revenue?.today,     textColor: 'text-slate-800',   bg: 'bg-slate-50'   },
                  { label: 'This Week',  value: revenue?.thisWeek,  textColor: 'text-blue-700',    bg: 'bg-blue-50'    },
                  { label: 'This Month', value: revenue?.thisMonth, textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { label: 'All Time',   value: revenue?.total,     textColor: 'text-purple-700',  bg: 'bg-purple-50'  },
                ].map(item => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl ${item.bg}`}
                  >
                    <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                    <span className={`text-sm font-extrabold ${item.textColor}`}>
                      {fmtCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Link href="/dashboard/fleet-owner/analytics">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full rounded-xl text-xs border-slate-200 font-semibold"
                  >
                    <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                    Full Analytics
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Driver Overview */}
            <Card
              className="border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden"
              padding="none"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-violet-600" />
                  Driver Overview
                </h2>
                <Link href="/dashboard/fleet-owner/drivers">
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors">
                    Manage <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>

              <div className="p-4">
                {/* Mini stats grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    { label: 'Total',      value: drivers.length,           bg: 'bg-slate-50',   text: 'text-slate-800'   },
                    { label: 'Active',     value: activeDrivers.length,     bg: 'bg-emerald-50', text: 'text-emerald-700' },
                    { label: 'Assigned',   value: assignedDrivers.length,   bg: 'bg-blue-50',    text: 'text-blue-700'    },
                    { label: 'Unassigned', value: drivers.length - assignedDrivers.length, bg: 'bg-amber-50', text: 'text-amber-700' },
                  ].map(item => (
                    <div key={item.label} className={`text-center p-3 rounded-xl ${item.bg}`}>
                      <p className={`text-xl font-extrabold ${item.text}`}>{item.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Driver mini list */}
                {drivers.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-xs text-slate-500 mb-2">No drivers registered yet.</p>
                    <Link href="/dashboard/fleet-owner/drivers">
                      <Button size="sm" className="rounded-xl text-xs">Add Driver</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {drivers.slice(0, 3).map((driver: any) => (
                      <div key={driver.id} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {(driver.name || driver.firstName || 'D')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Driver'}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            {(driver.rating ?? 0).toFixed(1)} · {driver.totalTrips ?? 0} trips
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusChip(driver.status)}`}>
                          {driver.status || 'N/A'}
                        </span>
                      </div>
                    ))}
                    {drivers.length > 3 && (
                      <Link
                        href="/dashboard/fleet-owner/drivers"
                        className="flex items-center justify-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 pt-1 transition-colors"
                      >
                        +{drivers.length - 3} more <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Compliance & Approvals */}
            <Card
              className="border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden"
              padding="none"
            >
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-amber-600" />
                  Compliance & Approvals
                </h2>
              </div>

              <div className="p-4 space-y-2.5">
                {/* Pending vehicles */}
                {pendingVehicles > 0 && (
                  <Link href="/dashboard/fleet-owner/vehicles?tab=approval">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-amber-800">
                          {pendingVehicles} Vehicle{pendingVehicles > 1 ? 's' : ''} Pending
                        </p>
                        <p className="text-[10px] text-amber-600">Awaiting admin review</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                    </div>
                  </Link>
                )}

                {/* Rejected vehicles */}
                {rejectedVehicles > 0 && (
                  <Link href="/dashboard/fleet-owner/vehicles?tab=approval">
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                        <XCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-800">
                          {rejectedVehicles} Vehicle{rejectedVehicles > 1 ? 's' : ''} Rejected
                        </p>
                        <p className="text-[10px] text-red-600">Review and resubmit</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
                    </div>
                  </Link>
                )}

                {/* Expiry alerts */}
                {expiryAlerts.length > 0 && (
                  <Link href="/dashboard/fleet-owner/vehicles?tab=documents">
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-orange-800">
                          {expiryAlerts.length} Document{expiryAlerts.length > 1 ? 's' : ''} Expiring
                        </p>
                        <p className="text-[10px] text-orange-600 truncate" title={expiryAlerts[0].title}>
                          Next: {expiryAlerts[0].title} in {expiryAlerts[0].daysLeft}d
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
                    </div>
                  </Link>
                )}

                {/* All clear */}
                {pendingVehicles === 0 && rejectedVehicles === 0 && expiryAlerts.length === 0 && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-emerald-700">All Compliant</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">No pending actions required.</p>
                  </div>
                )}

                <Link href="/dashboard/fleet-owner/vehicles?tab=documents" className="block mt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full rounded-xl text-xs border-slate-200 font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Review Documents
                  </Button>
                </Link>
              </div>
            </Card>

            {/* KYC & Business Verification */}
            <Card
              className="border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden"
              padding="none"
            >
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-blue-600" />
                  KYC & Verification
                </h2>
              </div>
              <div className="p-4">
                {(() => {
                  const status = (user as any)?.kycStatus ?? 'NOT_STARTED';
                  const config: Record<string, { bg: string; border: string; icon: string; title: string; desc: string; btnLabel?: string }> = {
                    VERIFIED:    { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-600', title: 'KYC Verified',      desc: 'Your identity has been verified.' },
                    SUBMITTED:   { bg: 'bg-blue-50',    border: 'border-blue-100',    icon: 'text-blue-600',    title: 'Under Review',       desc: 'Documents submitted, pending review.' },
                    REJECTED:    { bg: 'bg-red-50',     border: 'border-red-100',     icon: 'text-red-600',     title: 'KYC Rejected',       desc: 'Please resubmit your documents.',     btnLabel: 'Resubmit KYC' },
                    NOT_STARTED: { bg: 'bg-gray-50',    border: 'border-gray-100',    icon: 'text-gray-500',    title: 'KYC Not Started',    desc: 'Upload documents to get verified.',    btnLabel: 'Start KYC' },
                  };
                  const c = config[status] ?? config.NOT_STARTED;

                  return (
                    <>
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.bg.replace('50', '100')}`}>
                          <Shield className={`w-4 h-4 ${c.icon}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${c.icon}`}>{c.title}</p>
                          <p className="text-[10px] text-slate-500">{c.desc}</p>
                        </div>
                      </div>
                      {c.btnLabel && (
                        <Link href="/dashboard/profile?tab=kyc" className="block mt-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full rounded-xl text-xs border-slate-200 font-semibold"
                          >
                            {c.btnLabel}
                          </Button>
                        </Link>
                      )}
                    </>
                  );
                })()}
              </div>
            </Card>

          </div>
          {/* END RIGHT COLUMN */}
        </div>
      </div>
    </>
  );
}
