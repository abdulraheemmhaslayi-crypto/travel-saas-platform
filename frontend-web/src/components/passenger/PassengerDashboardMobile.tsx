'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ArrowLeftRight,
  Crosshair,
  Search,
  Landmark,
  Building2,
  Plane,
  Car,
  Calendar,
  Wallet,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Banknote,
  Loader2,
  MapPin,
  Navigation,
  Compass,
  ChevronRight,
  Users,
  BusFront,
  User,
  Pencil,
  Bell,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Snowflake,
  Luggage,
} from 'lucide-react';
import MapView, { MapMarker } from '@/components/maps/MapView';
import SearchInput from '@/components/maps/SearchInput';
import DatePicker from '@/components/ui/DatePicker';
import { cn, formatRideDateTime } from '@/lib/utils';

export interface PassengerDashboardMobileProps {
  user: any;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  date?: string;
  setDate?: (v: string) => void;
  userCoords: { lat: number; lng: number };
  pickupPoint: { lat: number; lng: number };
  dropPoint: { lat: number; lng: number } | null;
  distanceKm: number;
  estimatedMins: number;
  isLocating: boolean;
  isSearching: boolean;
  viewMode: 'home' | 'available-rides';
  availableRealTrips: any[];
  selectedTripId: string | null;
  selectedTrip: any;
  selectedFare: number;
  paymentMethod: 'Cash' | 'Wallet';
  walletBalance: number | null;
  walletCurrency: string;
  baseCurrencySymbol: string;
  popularRoutes: any[];
  mapCenter: { lat: number; lng: number };
  mapMarkers: MapMarker[];
  mapRoute: { lat: number; lng: number }[];
  mapZoom: number;
  setOrigin: (v: string) => void;
  setDestination: (v: string) => void;
  setOriginLat: (v?: number) => void;
  setOriginLng: (v?: number) => void;
  setDestLat: (v?: number) => void;
  setDestLng: (v?: number) => void;
  setMapZoom: React.Dispatch<React.SetStateAction<number>>;
  setViewMode: (v: 'home' | 'available-rides') => void;
  setSelectedTripId: (id: string) => void;
  setPaymentMethod: React.Dispatch<React.SetStateAction<'Cash' | 'Wallet'>>;
  detectLocation: () => void;
  handlePickupSelect: (addr: string, lat: number, lng: number) => void;
  handleDestinationSelect: (addr: string, lat: number, lng: number) => void;
  handleSwap: () => void;
  handleSelectRecentPlace: (
    src: string,
    dst: string,
    sLat?: number,
    sLng?: number,
    dLat?: number,
    dLng?: number
  ) => void;
  handleSearchAvailableRides: () => void;
  handleConfirmBooking: () => void;
  formatShortAddress?: (addr: string) => string;
  formatDuration: (mins: number) => string;
  getTripVehicleImage: (vehicle?: any) => string;
}

function formatVehicleName(name?: string): string {
  if (!name) return 'Toyota Innova';
  return name.replace(/\btyota\b/gi, 'Toyota');
}

const parseLocalDate = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return undefined;
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
  return new Date(year, month - 1, day);
};

const formatLocalDate = (date: Date | null | undefined): string => {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function PassengerDashboardMobile({
  user,
  origin,
  destination,
  setOrigin,
  setDestination,
  setOriginLat,
  setOriginLng,
  setDestLat,
  setDestLng,
  date = '',
  setDate,
  distanceKm,
  estimatedMins,
  isLocating,
  isSearching,
  viewMode,
  availableRealTrips,
  selectedTripId,
  selectedFare,
  paymentMethod,
  walletBalance,
  baseCurrencySymbol,
  popularRoutes,
  mapCenter,
  mapMarkers,
  mapRoute,
  mapZoom,
  setViewMode,
  setSelectedTripId,
  setPaymentMethod,
  detectLocation,
  handlePickupSelect,
  handleDestinationSelect,
  handleSwap,
  handleSelectRecentPlace,
  handleSearchAvailableRides,
  handleConfirmBooking,
  formatShortAddress,
  formatDuration,
  getTripVehicleImage,
}: PassengerDashboardMobileProps) {
  const isGuest = !user;
  const [rideFilter, setRideFilter] = useState<'all' | 'innova' | 'sedan'>('all');

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  const loginUrl = `/login?returnUrl=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.pathname : '/dashboard/passenger'
  )}`;

  // Next 7 days calendar selector matching mockup style
  const dateOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = formatLocalDate(d);
      const dayNum = d.getDate();
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      list.push({ iso, dayNum, dayName, monthName });
    }
    return list;
  }, []);

  // Filtered trips in Screen 2
  const filteredTrips = useMemo(() => {
    if (rideFilter === 'all') return availableRealTrips;
    if (rideFilter === 'innova') {
      return availableRealTrips.filter((t) => {
        const str = `${t.vehicle?.brand || ''} ${t.vehicle?.model || ''} ${t.vehicle?.type || ''}`.toLowerCase();
        return str.includes('innova') || str.includes('xl') || str.includes('van');
      });
    }
    if (rideFilter === 'sedan') {
      return availableRealTrips.filter((t) => {
        const str = `${t.vehicle?.brand || ''} ${t.vehicle?.model || ''} ${t.vehicle?.type || ''}`.toLowerCase();
        return str.includes('sedan') || str.includes('city') || str.includes('dzire') || str.includes('comfort');
      });
    }
    return availableRealTrips;
  }, [availableRealTrips, rideFilter]);

  // Real Maharashtra routes displayed with pastel backgrounds matching mockup
  const defaultRoutes = [
    {
      id: 'dadar-mhasla',
      line1: 'Dadar T.T.',
      line2: '→ Mhasla',
      price: `${baseCurrencySymbol} 399 avg`,
      source: 'Dadar T.T., Mumbai',
      destination: 'Mhasla, Maharashtra',
      sLat: 19.0178,
      sLng: 72.8478,
      dLat: 18.114,
      dLng: 73.1592,
      icon: Landmark,
      theme: 'peach',
      tag: 'Fast Corridor',
    },
    {
      id: 'teenhath-dapoli',
      line1: 'Teen Hath',
      line2: '→ Dapoli',
      price: `${baseCurrencySymbol} 380 avg`,
      source: 'Teen Hath Naka, Thane',
      destination: 'Dapoli, Maharashtra',
      sLat: 19.186,
      sLng: 72.9698,
      dLat: 17.7562,
      dLng: 73.1873,
      icon: Building2,
      theme: 'cyan',
      tag: 'Daily Fleet',
    },
    {
      id: 'mhasla-mumbai',
      line1: 'Mhasla',
      line2: '→ Mumbai',
      price: 'Return Trip',
      source: 'Mhasla, Maharashtra',
      destination: 'Mumbai, Maharashtra',
      sLat: 18.114,
      sLng: 73.1592,
      dLat: 19.055,
      dLng: 72.8692,
      icon: Plane,
      theme: 'violet',
      tag: 'Express Return',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-[#F8F9FE] min-h-[calc(100dvh-66px)] select-none pb-6 relative overflow-x-hidden">
      {viewMode === 'home' ? (
        /* ════════════════════════════════════════════════════════════════════
           SCREEN 1: Mobile Native Kokan Tour & Travel Experience
           ════════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col w-full animate-fadeIn px-4 pt-3 max-w-md mx-auto space-y-3.5 relative z-10">

          {/* ── Top Header Bar: Kokan Tour Official Branding + Sign In / Profile ── */}
          <header className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Bus Brand Icon Badge */}
              <div className="w-11 h-11 rounded-2xl bg-[#4F46E5] text-white shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0">
                <BusFront className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                    Kokan Tour
                  </h1>
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-[#4F46E5] font-extrabold text-[9px] uppercase tracking-wider">
                    Travel
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold tracking-wide mt-1 truncate">
                  Intercity Rides Across Maharashtra
                </p>
              </div>
            </div>

            {/* Profile / Sign In Pill */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-[#4F46E5] font-bold text-xs active:scale-95 transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-[#4F46E5] text-white text-[10px] font-black flex items-center justify-center">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="truncate max-w-[70px]">{user.firstName || 'Profile'}</span>
                </Link>
              ) : (
                <Link
                  href={loginUrl}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  <User className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </header>

          {/* ── Hero Banner Card (Solid #4F46E5 Brand Color - No Gradient) ────── */}
          <div className="relative rounded-[26px] bg-[#4F46E5] p-5 text-white shadow-lg shadow-indigo-500/20 space-y-3">
            {/* <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider text-white border border-white/25 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>Kokan Express Fleet</span>
              </span>
              <span className="text-[11px] font-bold text-indigo-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Fixed Fares</span>
              </span>
            </div> */}

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Where to, {user?.firstName ? user.firstName : 'Traveler'}? 👋
              </h2>
              <p className="text-xs text-indigo-100 font-medium mt-1 leading-relaxed">
                Comfortable AC Innova, sedans & daily express rides across Mumbai, Thane, Pune & Kokan.
              </p>
            </div>

            {/* Quick Feature Badges */}
            {/* <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-indigo-100 flex-wrap">
              <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg">
                <Snowflake className="w-3 h-3 text-cyan-200" /> AC Guaranteed
              </span>
              <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg">
                <Luggage className="w-3 h-3 text-amber-200" /> Free Luggage
              </span>
              <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg">
                <CheckCircle2 className="w-3 h-3 text-emerald-200" /> Doorstep Pickup
              </span>
            </div> */}
          </div>

          {/* ── Main Search & Route Card (Clean Neo-App Card) ───────────────── */}
          <div className="bg-white rounded-[28px] p-4 sm:p-5 shadow-[0_10px_35px_rgba(20,20,60,0.05)] border border-slate-150/80 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Plan Your Ride
                </h3>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={isLocating}
                className="text-[11px] font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>Auto GPS</span>
              </button>
            </div>

            {/* Input: Pickup Location */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                <span>Pickup Point</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <SearchInput
                    isSource={true}
                    value={origin}
                    placeholder="Enter pickup city or landmark"
                    showSearchIcon={true}
                    onChange={(v) => {
                      setOrigin(v);
                      setOriginLat(undefined);
                      setOriginLng(undefined);
                    }}
                    onPlaceSelect={handlePickupSelect}
                    onClear={() => {
                      setOrigin('');
                      setOriginLat(undefined);
                      setOriginLng(undefined);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={isLocating}
                  className="h-[46px] px-3.5 rounded-2xl border border-indigo-200/80 bg-indigo-50/70 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all shrink-0"
                  title="Detect GPS"
                >
                  <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>GPS</span>
                </button>
              </div>
            </div>

            {/* Central Circular Swap Button */}
            <div className="relative flex items-center justify-center my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <button
                type="button"
                onClick={handleSwap}
                className="w-8 h-8 rounded-full bg-white border border-indigo-200 shadow-xs flex items-center justify-center text-[#4F46E5] hover:bg-indigo-50 active:rotate-180 transition-transform relative z-10"
                title="Swap origin & destination"
                aria-label="Swap locations"
              >
                <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>

            {/* Input: Dropoff Location */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-100" />
                <span>Destination (Where To?)</span>
              </label>
              <SearchInput
                isSource={false}
                value={destination}
                placeholder="Enter destination city or stop"
                required
                showSearchIcon={true}
                onChange={(v) => {
                  setDestination(v);
                  setDestLat(undefined);
                  setDestLng(undefined);
                }}
                onPlaceSelect={handleDestinationSelect}
                onClear={() => {
                  setDestination('');
                  setDestLat(undefined);
                  setDestLng(undefined);
                }}
              />
            </div>

            {/* ── Native Date Section (Custom Date First, Followed by Quick Shortcuts) ── */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Travel Date</span>
                </label>
                {date && (
                  <button
                    type="button"
                    onClick={() => setDate?.('')}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 active:scale-95 transition-all cursor-pointer"
                  >
                    Reset Date
                  </button>
                )}
              </div>

              {/* 1. Custom Date Picker (Pehle: Tap to open full calendar modal) */}
              <DatePicker
                value={parseLocalDate(date)}
                onChange={(d) => setDate?.(formatLocalDate(d))}
                onClear={() => setDate?.('')}
                placeholder="Choose Custom Travel Date"
                minDate={new Date()}
                title="Select Travel Date"
                subtitle="Intercity rides across Maharashtra"
                className="w-full"
                triggerClassName="h-12 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 shadow-2xs font-bold text-xs sm:text-sm text-slate-800"
              />

              {/* 2. Quick Date Shortcuts (Baad me: Today, Tomorrow, Upcoming Days) */}
              <div className="space-y-1 pt-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Select (Today / Tomorrow)
                </p>
                <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] py-1 -mx-0.5 px-0.5">
                  {dateOptions.map((opt) => {
                    const isSelected = date === opt.iso;
                    return (
                      <button
                        key={opt.iso}
                        type="button"
                        onClick={() => setDate?.(isSelected ? '' : opt.iso)}
                        className={cn(
                          'min-w-[62px] h-[64px] rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all active:scale-95 shrink-0 cursor-pointer',
                          isSelected
                            ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-500/25 scale-102 ring-2 ring-indigo-400'
                            : 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:border-indigo-200 hover:bg-slate-100/70 shadow-2xs'
                        )}
                      >
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wider leading-none',
                            isSelected ? 'text-white/80' : 'text-slate-400'
                          )}
                        >
                          {opt.dayName}
                        </span>
                        <span
                          className={cn(
                            'text-base font-black leading-tight mt-1',
                            isSelected ? 'text-white' : 'text-slate-900'
                          )}
                        >
                          {opt.dayNum}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] font-semibold mt-0.5 leading-none',
                            isSelected ? 'text-white/80' : 'text-slate-400'
                          )}
                        >
                          {opt.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Main Action Button ("Let's Start" style matching mockup) ────── */}
            <button
              type="button"
              onClick={handleSearchAvailableRides}
              disabled={isSearching}
              className="w-full h-[52px] rounded-[20px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Searching Available Fleet...</span>
                </>
              ) : (
                <>
                  <Search className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Find Available Rides</span>
                  <ArrowRight className="w-4.5 h-4.5 stroke-[2.5] ml-1" />
                </>
              )}
            </button>
          </div>

          {/* ── Popular Corridors Section (Pastel Cards Matching Mockup) ─────── */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Popular Route Corridors
                </h3>
                <p className="text-[11px] text-slate-400">Regular daily departures</p>
              </div>
              <Link
                href="/dashboard/passenger/popular-routes"
                className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 active:scale-95 transition-transform"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>

            {/* 3 Pastel Cards Grid (Matching reference mockup style) */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {defaultRoutes.map((route) => {
                const Icon = route.icon;
                const isPeach = route.theme === 'peach';
                const isCyan = route.theme === 'cyan';

                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() =>
                      handleSelectRecentPlace(
                        route.source,
                        route.destination,
                        route.sLat,
                        route.sLng,
                        route.dLat,
                        route.dLng
                      )
                    }
                    className={cn(
                      'p-3 rounded-[22px] text-left active:scale-95 transition-all shadow-xs flex flex-col justify-between h-[120px] relative overflow-hidden',
                      isPeach
                        ? 'bg-[#FFF6F0] border border-[#FFE6D5]'
                        : isCyan
                          ? 'bg-[#F0F7FF] border border-[#DCEBFF]'
                          : 'bg-[#F6F4FF] border border-[#EBE4FF]'
                    )}
                  >
                    <div>
                      <div
                        className={cn(
                          'w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 shadow-2xs',
                          isPeach
                            ? 'bg-[#FFE2D0] text-[#EA580C]'
                            : isCyan
                              ? 'bg-[#D7EAFF] text-[#2563EB]'
                              : 'bg-[#E4DDFF] text-[#6366F1]'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <p className="text-xs font-black text-slate-900 leading-tight truncate">
                        {route.line1}
                      </p>
                      <p className="text-xs font-bold text-slate-600 leading-tight truncate">
                        {route.line2}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-black/5 flex items-center justify-between">
                      <span
                        className={cn(
                          'text-[10px] font-black leading-none truncate',
                          isPeach
                            ? 'text-[#EA580C]'
                            : isCyan
                              ? 'text-[#2563EB]'
                              : 'text-[#6366F1]'
                        )}
                      >
                        {route.price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════
           SCREEN 2: Available Rides & Interactive Route Bottom Sheet
           ════════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col w-full animate-fadeIn min-h-[calc(100dvh-66px)]">
          {/* ── Map Header with Back Button & ETA Pill ─────────────────────── */}
          <div className="w-full h-[240px] sm:h-[260px] shrink-0 relative overflow-hidden bg-slate-100 rounded-b-[28px] shadow-sm">
            <MapView
              center={mapCenter}
              markers={mapMarkers}
              route={mapRoute}
              zoom={mapZoom}
              height="100%"
              className="w-full h-full"
            />

            {/* Back Button (Clean round card matching mockup) */}
            <button
              type="button"
              onClick={() => setViewMode('home')}
              className="absolute top-3.5 left-3.5 z-[1001] w-11 h-11 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-90 transition-all cursor-pointer pointer-events-auto"
              aria-label="Back to search"
              title="Back to search"
            >
              <ChevronLeft className="w-5 h-5 text-slate-800 stroke-[2.5]" />
            </button>

            {/* Floating Route Distance & ETA Pill */}
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md text-white font-bold text-xs shadow-md flex items-center gap-1.5 pointer-events-none">
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <span>{formatDuration(estimatedMins)}</span>
              <span className="opacity-40">•</span>
              <span>{Math.round(distanceKm)} km</span>
            </div>

            {/* Floating GPS Button */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="absolute bottom-4 right-3.5 z-20 w-11 h-11 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-90 transition-all"
              title="Locate my position"
            >
              <Crosshair
                className={`w-5 h-5 text-slate-800 stroke-[2] ${isLocating ? 'animate-spin text-[#4F46E5]' : ''
                  }`}
              />
            </button>
          </div>

          {/* ── Native Bottom Sheet: Available Rides List ──────────────────── */}
          <div className="relative z-10 -mt-5 bg-white rounded-t-[32px] sm:rounded-t-[36px] shadow-[0_-10px_35px_rgba(20,20,60,0.08)] border-t border-slate-150/90 px-4 pt-2.5 pb-4 flex-1 flex flex-col justify-between max-w-md w-full mx-auto">
            {/* Top Content: Handle + Header + Filters + Rides List (No unwanted top gap) */}
            <div className="flex flex-col space-y-3">
              {/* Sheet Handle */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1 shrink-0" />

              {/* Header: Title + Lavender Edit Button */}
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Available Rides
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isSearching
                      ? 'Searching fleet departures...'
                      : filteredTrips.length > 0
                        ? `${filteredTrips.length} available trip${filteredTrips.length > 1 ? 's' : ''
                        }`
                        : 'No direct trips on this route'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('home')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-indigo-100 text-[12px] font-bold text-[#4F46E5] transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 border border-indigo-200/60"
                >
                  <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Category Filter Pills (Matching mockup style [All] [To do] [In Progress]) */}
              <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1">
                <button
                  type="button"
                  onClick={() => setRideFilter('all')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0',
                    rideFilter === 'all'
                      ? 'bg-[#4F46E5] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  )}
                >
                  All Fleet
                </button>
                <button
                  type="button"
                  onClick={() => setRideFilter('innova')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0',
                    rideFilter === 'innova'
                      ? 'bg-[#4F46E5] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  )}
                >
                  Innova XL
                </button>
                <button
                  type="button"
                  onClick={() => setRideFilter('sedan')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0',
                    rideFilter === 'sedan'
                      ? 'bg-[#4F46E5] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  )}
                >
                  Comfort Sedan
                </button>
              </div>

              {/* Rides List Area */}
              <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                {isSearching ? (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
                    <p className="text-xs font-bold text-slate-600">
                      Finding available rides...
                    </p>
                  </div>
                ) : filteredTrips.length === 0 ? (
                  <div className="bg-[#F8F9FE] rounded-[24px] border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center my-1 shadow-2xs">
                    {/* SVG Illustration: Modern Sedan with Location Pin Drop */}
                    <div className="relative w-32 h-24 flex items-center justify-center mb-1">
                      <svg viewBox="0 0 160 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="80" cy="90" rx="60" ry="12" fill="#EEF2FF" />
                        <path d="M42 76 C55 60 105 60 118 76" stroke="#E0E7FF" strokeWidth="20" strokeLinecap="round" opacity="0.5" />
                        <ellipse cx="80" cy="86" rx="46" ry="6" fill="#CBD5E1" fillOpacity="0.5" />
                        <g transform="translate(36, 44)">
                          <rect x="12" y="32" width="10" height="9" rx="3" fill="#1E293B" />
                          <rect x="66" y="32" width="10" height="9" rx="3" fill="#1E293B" />
                          <rect x="10" y="28" width="68" height="6" rx="2" fill="#334155" />
                          <path d="M22 17 L33 4 L55 4 L66 17 Z" fill="#6366F1" fillOpacity="0.25" stroke="#4F46E5" strokeWidth="1.5" />
                          <path d="M34 5 L54 5 L63 16 L25 16 Z" fill="#93C5FD" fillOpacity="0.4" />
                          <path d="M6 17 C6 14 15 14 22 17 L66 17 C73 14 82 14 82 17 L84 27 C84 30 82 32 76 32 L12 32 C6 32 4 30 4 27 Z" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="1.8" />
                          <rect x="8" y="20" width="8" height="4" rx="1.5" fill="#38BDF8" />
                          <rect x="72" y="20" width="8" height="4" rx="1.5" fill="#38BDF8" />
                        </g>
                        <g transform="translate(67, 10)">
                          <path d="M13 0 C5.82 0 0 5.82 0 13 C0 22.75 13 34 13 34 C13 34 26 22.75 26 13 C26 5.82 20.18 0 13 0 Z" fill="#4F46E5" />
                          <circle cx="13" cy="12" r="4.5" fill="#FFFFFF" />
                        </g>
                      </svg>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mt-1">
                      No Direct Rides Found
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                      No direct trips available for this route right now. Try changing pickup or dropoff location.
                    </p>

                    <button
                      type="button"
                      onClick={() => setViewMode('home')}
                      className="mt-3.5 px-6 py-2.5 rounded-full bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] text-[#4F46E5] text-xs font-bold shadow-2xs active:scale-95 transition-all flex items-center gap-2"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Change Route</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTrips.map((trip) => {
                      const isSelected =
                        (selectedTripId || availableRealTrips[0]?.id) === trip.id;
                      const tripImg = getTripVehicleImage(trip.vehicle || trip.vehicleType);
                      const isFullVehicle =
                        (trip.bookingMode || '').toUpperCase() === 'FULL_VEHICLE' ||
                        (Boolean(trip.fullVehiclePrice) && Number(trip.fullVehiclePrice) > 0);
                      const priceVal = isFullVehicle
                        ? Math.round(Number(trip.fullVehiclePrice || trip.price || trip.pricePerSeat || 2999))
                        : Math.round(Number(trip.pricePerSeat || trip.price || trip.basePrice || 399));
                      const vName = formatVehicleName(
                        trip.vehicle
                          ? `${trip.vehicle.brand} ${trip.vehicle.model}`
                          : trip.vehicleName || 'Toyota Innova'
                      );

                      return (
                        <div
                          key={trip.id}
                          onClick={() => setSelectedTripId(trip.id)}
                          className={cn(
                            'p-3.5 rounded-[22px] border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]',
                            isSelected
                              ? 'border-[#4F46E5] bg-indigo-50/70 shadow-xs ring-1 ring-[#4F46E5]/30'
                              : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Selection Radio */}
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                isSelected
                                  ? 'border-[#4F46E5] bg-white'
                                  : 'border-slate-300 bg-white'
                              )}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                              )}
                            </div>

                            {/* Vehicle Image */}
                            <img
                              src={tripImg}
                              alt={vName}
                              className="w-14 h-10 object-contain shrink-0 drop-shadow-xs"
                            />

                            {/* Vehicle Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-black text-slate-900 truncate">
                                  {vName}
                                </h4>
                                {isFullVehicle && (
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded shrink-0">
                                    Full Car
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-indigo-600 font-bold truncate mt-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>{formatRideDateTime(trip.departureDate || trip.departureTime)}</span>
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                <span className="text-emerald-600 font-bold">
                                  {isFullVehicle ? 'Private Cab (Entire Car)' : `${trip.availableSeats || 4} seats left`}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-[#4F46E5]">
                              {baseCurrencySymbol} {priceVal > 0 ? priceVal : 399}
                            </span>
                            <span className="text-[9px] text-slate-400 block leading-tight">
                              {isFullVehicle ? 'entire car' : 'per seat'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Payment Row & Action Button Matching Mockup ──────────────── */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  {user ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentMethod((p) => (p === 'Cash' ? 'Wallet' : 'Cash'))
                      }
                      className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-all active:scale-95 shadow-2xs"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600 stroke-[2] shrink-0" />
                      <span>
                        {paymentMethod === 'Cash'
                          ? 'Pay on Board / Cash'
                          : `Wallet • ${baseCurrencySymbol}${walletBalance || 0}`}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-2xs">
                      <CreditCard className="w-4 h-4 text-emerald-600 stroke-[2] shrink-0" />
                      <span>Pay on Board / Cash</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none mb-1">
                      Total Fare
                    </span>
                    <span className="font-black text-[#4F46E5] text-xl sm:text-2xl leading-none whitespace-nowrap tracking-tight">
                      {baseCurrencySymbol}{' '}
                      {selectedFare > 0
                        ? selectedFare
                        : availableRealTrips[0]?.pricePerSeat ||
                        availableRealTrips[0]?.price ||
                        399}
                    </span>
                  </div>
                </div>

                {/* Primary Button Matching Mockup ("Let's Start" style) */}
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="w-full h-[54px] rounded-[20px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Car className="w-5 h-5 text-white stroke-[2.2] shrink-0" />
                  <span>
                    {user
                      ? `Confirm Booking • ${baseCurrencySymbol}${selectedFare > 0 ? selectedFare : 399
                      }`
                      : `Sign In to Book a Ride ${baseCurrencySymbol}${selectedFare > 0 ? selectedFare : 399
                      }`}
                  </span>
                  <ArrowRight className="w-4.5 h-4.5 text-white stroke-[2.5] ml-1 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
