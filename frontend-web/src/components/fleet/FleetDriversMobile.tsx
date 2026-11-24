'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  MapPin,
  Calendar,
  User,
  Users,
  Car,
  UserPlus,
  Plus,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  IndianRupee,
  TrendingUp,
  HelpCircle,
  FileText,
  Shield,
  Star,
  Download,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  UserCog,
  Activity,
  Briefcase,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DriverTab = 'all' | 'assignments' | 'documents' | 'performance';

export interface FleetDriversMobileProps {
  user: any;
  unreadCount: number;
  drivers: any[];
  vehicles: any[];
  currentTab: DriverTab;
  setCurrentTab: (tab: DriverTab) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onAddDriver: () => void;
  onAssignVehicle: (driver: any) => void;
  onViewDocs: (driver: any) => void;
}

export default function FleetDriversMobile({
  user,
  unreadCount,
  drivers,
  vehicles,
  currentTab,
  setCurrentTab,
  isLoading,
  onRefresh,
  onAddDriver,
  onAssignVehicle,
  onViewDocs,
}: FleetDriversMobileProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // User initials for top avatar (e.g. "RS")
  const initials = useMemo(() => {
    const f = user?.firstName?.[0] || 'R';
    const l = user?.lastName?.[0] || 'S';
    return `${f}${l}`.toUpperCase();
  }, [user]);

  // Stats calculation matching the screenshot
  const totalDrivers = drivers.length;
  const activeDrivers = useMemo(
    () => drivers.filter((d) => String(d.status || '').toUpperCase() === 'ACTIVE').length,
    [drivers]
  );
  const verifiedDrivers = useMemo(
    () =>
      drivers.filter(
        (d) => d.isVerified || String(d.verificationStatus || '').toUpperCase() === 'VERIFIED'
      ).length,
    [drivers]
  );
  const avgRating = useMemo(() => {
    if (drivers.length === 0) return '0.0';
    const total = drivers.reduce((sum, d) => sum + (Number(d.rating) || 0), 0);
    return (total / drivers.length).toFixed(1);
  }, [drivers]);

  // Tab definitions matching the screenshot
  const tabsList: { id: DriverTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Drivers', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'assignments', label: 'Assignments', icon: <UserCog className="w-3.5 h-3.5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'performance', label: 'Performance', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  // Paginated drivers
  const totalPages = Math.max(1, Math.ceil(drivers.length / pageSize));
  const paginatedDrivers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return drivers.slice(start, start + pageSize);
  }, [drivers, currentPage, pageSize]);

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
        {/* Banner Card matching screenshot */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-100/50 p-4 border border-purple-100/60 shadow-xs">
          <div className="relative z-10 max-w-[70%]">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Drivers</h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-normal">
              View your fleet drivers and their performance.
            </p>
          </div>

                    {/* Decorative Modern Car Graphic */}
          <div className="absolute -right-2 bottom-0 opacity-95 pointer-events-none">
            <div className="relative w-32 h-14 flex items-end justify-end">
              <img
                src="/images/banner-car.png"
                alt="Fleet Vehicle"
                className="w-auto h-full max-h-13 object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-[#4F46E5]')} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onAddDriver}
            className="h-10 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Driver</span>
          </button>
        </div>

        {/* ── 3. 4-Stat Cards (2x2 Grid Matching Screenshot) ────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Card 1: TOTAL DRIVERS */}
          <div className="bg-[#FAF5FF] border border-purple-100/90 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL DRIVERS</span>
            </div>
            <p className="text-xl font-bold text-slate-900 leading-tight pl-1">{totalDrivers}</p>
          </div>

          {/* Card 2: ACTIVE */}
          <div className="bg-[#F0FDF4] border border-emerald-100/90 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Car className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ACTIVE</span>
            </div>
            <p className="text-xl font-bold text-emerald-700 leading-tight pl-1">{activeDrivers}</p>
          </div>

          {/* Card 3: VERIFIED */}
          <div className="bg-[#EFF6FF] border border-blue-100/90 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">VERIFIED</span>
            </div>
            <p className="text-xl font-bold text-blue-700 leading-tight pl-1">{verifiedDrivers}</p>
          </div>

          {/* Card 4: AVG RATING */}
          <div className="bg-[#FFFBEB] border border-amber-100/90 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AVG RATING</span>
            </div>
            <p className="text-xl font-bold text-amber-700 leading-tight pl-1">{avgRating}</p>
          </div>
        </div>

        {/* ── 4. Filter Tabs Row (Matching Screenshot) ──────────────────────── */}
        <div className="pt-1 overflow-x-auto pb-0.5 no-scrollbar">
          <div className="flex items-center gap-2">
            {tabsList.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCurrentTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shrink-0',
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 5. Driver List Header: Fleet Drivers + Export ───────────────────── */}
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              {currentTab === 'assignments'
                ? 'Driver-Vehicle Assignments'
                : currentTab === 'documents'
                ? 'Driver Documents'
                : currentTab === 'performance'
                ? 'Driver Performance'
                : 'Fleet Drivers'}
            </h2>
            <p className="text-xs text-slate-500 font-normal">Active driver roster</p>
          </div>

          <button
            type="button"
            onClick={() => {
              // Export drivers to CSV
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['Name,Phone,Email,Status,Rating,Vehicle']
                  .concat(
                    drivers.map(
                      (d) =>
                        `"${d.name || d.user?.firstName || ''}","${d.phone || ''}","${d.email || ''}","${d.status || ''}","${d.rating || 0}","${d.assignedVehicle?.registrationNumber || 'Unassigned'}"`
                    )
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `fleet_drivers_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.2] text-[#4F46E5]" />
            <span>Export</span>
          </button>
        </div>

        {/* ── 6. Driver Cards Stack (Matching Screenshot) ───────────────────── */}
        <div className="space-y-3 pt-1">
          {drivers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] mx-auto">
                <Users className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No drivers registered yet</h3>
              <p className="text-xs text-slate-500 font-normal max-w-xs mx-auto">
                Add your personal drivers or invite existing drivers to your fleet.
              </p>
              <button
                type="button"
                onClick={onAddDriver}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#4F46E5] text-white font-semibold text-xs shadow-xs hover:bg-[#4338CA] active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Add Driver
              </button>
            </div>
          ) : (
            paginatedDrivers.map((driver: any, idx: number) => {
              const driverName =
                driver.name ||
                [driver.user?.firstName, driver.user?.lastName].filter(Boolean).join(' ') ||
                driver.firstName
                  ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
                  : 'Driver';

              const driverInitial = (driverName?.[0] || 'D').toUpperCase();
              const driverEmail = driver.email || driver.user?.email || '—';
              const driverPhone = driver.phone || driver.user?.phone || '—';
              const isVerified = driver.isVerified || driver.verificationStatus === 'VERIFIED';
              const assignedVehicle =
                driver.assignedVehicle?.registrationNumber ||
                driver.assignedVehicle?.model ||
                driver.assignedVehicleNumber ||
                'Unassigned';

              // Alternate soft avatar background like in screenshot (purple / light blue)
              const avatarBg =
                idx % 2 === 0
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-sky-100 text-sky-700 border-sky-200';

              return (
                <div
                  key={driver.id || idx}
                  className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                >
                  {/* Driver Header Row: Avatar, Name, Email, Phone, Verification Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar Circle */}
                      <div
                        className={cn(
                          'w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm border shrink-0',
                          avatarBg
                        )}
                      >
                        {driverInitial}
                      </div>

                      {/* Name & Contact */}
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight truncate leading-tight">
                          {driverName}
                        </h3>

                        {driverEmail !== '—' && (
                          <p className="text-xs text-slate-500 font-normal truncate flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{driverEmail}</span>
                          </p>
                        )}

                        <p className="text-xs text-slate-500 font-normal flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{driverPhone}</span>
                        </p>
                      </div>
                    </div>

                    {/* Verification Status Pill */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0',
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      <Shield className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>{isVerified ? 'Verified' : 'Pending'}</span>
                    </span>
                  </div>

                  {/* 4-Stat Subcard Row (Matching Screenshot) */}
                  <div className="bg-slate-50/90 rounded-2xl p-2.5 grid grid-cols-4 gap-1 text-center border border-slate-100">
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        STATUS
                      </span>
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {String(driver.status || 'active').toLowerCase()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        RATING
                      </span>
                      <span className="text-xs font-bold text-slate-900 block">
                        {Number(driver.rating || 0).toFixed(1)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        ACTIVE TRIPS
                      </span>
                      <span className="text-xs font-bold text-slate-900 block">
                        {driver.activeTrips ?? 0}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        TOTAL TRIPS
                      </span>
                      <span className="text-xs font-bold text-slate-900 block">
                        {driver.totalTrips ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Contextual Info for Tab: Assigned Vehicle or Documents */}
                  {currentTab === 'assignments' && (
                    <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold">Vehicle:</span>
                        <span className="font-mono font-bold">{assignedVehicle}</span>
                      </div>
                    </div>
                  )}

                  {currentTab === 'documents' && (
                    <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-500 font-medium">
                        License: <strong className="text-slate-800">{driver.licenseNumber || 'Not Uploaded'}</strong>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Exp: {driver.experienceYears ? `${driver.experienceYears} yrs` : '—'}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons: [Assign] & [Docs] (Matching Screenshot) */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onAssignVehicle(driver)}
                      className="h-10 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Assign</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewDocs(driver)}
                      className="h-10 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 stroke-[2.2] text-slate-500" />
                      <span>Docs</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── 7. Pagination (Matching Screenshot) ────────────────────────────── */}
        {drivers.length > 0 && (
          <div className="pt-4 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-500">
              Showing {Math.min(1, drivers.length)} to {Math.min(pageSize, drivers.length)} of {drivers.length} results
            </p>

            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-xs font-bold text-slate-600 disabled:opacity-40"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-xs font-bold text-slate-600 disabled:opacity-40"
              >
                ‹
              </button>
              <span className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-xs font-bold text-slate-600 disabled:opacity-40"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-xs font-bold text-slate-600 disabled:opacity-40"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 8. Slide-Over Navigation Drawer (Hamburger Menu) ───────────────── */}
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 text-[#4F46E5]"
              >
                <Users className="w-4 h-4 text-[#4F46E5]" />
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
