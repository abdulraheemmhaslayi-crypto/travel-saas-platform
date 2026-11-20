'use client';

import React from 'react';
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
} from 'lucide-react';
import MapView, { MapMarker } from '@/components/maps/MapView';
import SearchInput from '@/components/maps/SearchInput';
import DatePicker from '@/components/ui/DatePicker';
import { cn } from '@/lib/utils';

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
  formatShortAddress: (addr: string) => string;
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
  formatDuration,
  getTripVehicleImage,
}: PassengerDashboardMobileProps) {
  const isGuest = !user;
  const todayStr = React.useMemo(() => formatLocalDate(new Date()), []);
  const tomorrowStr = React.useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatLocalDate(tomorrow);
  }, []);

  const loginUrl = `/login?returnUrl=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.pathname : '/dashboard/passenger'
  )}`;

  // Real Maharashtra routes displayed in Popular Routes matching mockup
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
      isHighlighted: true,
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
      isHighlighted: false,
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
      isHighlighted: false,
    },
  ];

  return (
    <div className="flex flex-col w-full bg-[#F0F5FA] min-h-[calc(100dvh-66px)] select-none pb-4">
      {viewMode === 'home' ? (
        /* ════════════════════════════════════════════════════════════════════
           SCREEN 1: Mobile Native Kokan Travel Home Experience (Guest / User)
           ════════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col w-full animate-fadeIn">
          {/* ── TOP SCENIC KOKAN LANDSCAPE & BRAND HEADER ──────────────────── */}
          <div className="relative w-full h-[220px] sm:h-[240px] shrink-0 overflow-hidden">
            {/* Scenic Kokan Beach Landscape Background (Clean Sky without logo collisions) */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('/images/kokan-dashboard-bg.jpg')`,
                backgroundPosition: 'center 35%',
              }}
            />

            {/* Rich multi-stop gradient overlay for maximum readability & high contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/35 to-black/55 pointer-events-none" />

            {/* Top Bar: Brand Logo & Sign In / User Profile */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-3.5">
              {/* Left: Bus Icon inside rounded white badge + Kokan Travel Title */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0">
                  <BusFront className="w-5 h-5 text-[#1D68F2] stroke-[2.2]" />
                </div>
                <div>
                  <h1 className="text-[19px] sm:text-xl font-bold text-white tracking-tight leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Kokan Travel
                  </h1>
                  <p className="text-[11px] text-white/95 font-medium tracking-wide mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    Intercity Rides Across Maharashtra
                  </p>
                </div>
              </div>

              {/* Right: Pill Sign In Button (or User Profile link if authenticated) */}
              {user ? (
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#1D68F2] font-semibold text-xs shadow-md active:scale-95 transition-transform shrink-0"
                >
                  <User className="w-3.5 h-3.5 stroke-[2]" />
                  <span>{user.firstName || 'Profile'}</span>
                </Link>
              ) : (
                <Link
                  href={loginUrl}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#1D68F2] font-semibold text-xs shadow-md active:scale-95 transition-transform shrink-0"
                >
                  <User className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Hero Title & Subtitle: "Where to? 👋" */}
            <div className="relative z-10 px-4 pt-4 pb-8">
              <h2 className="text-[26px] sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-tight">
                <span>{user?.firstName ? `Where to, ${user.firstName}?` : 'Where to?'}</span>
                <span>👋</span>
              </h2>
              <p className="text-xs sm:text-[13px] text-white/95 font-medium mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] max-w-[290px] leading-snug">
                Search and compare intercity rides across Maharashtra
              </p>
            </div>
          </div>

          {/* ── MAIN WHITE FLOATING CARD OVERLAPPING SCENERY ───────────────── */}
          <div className="relative z-20 -mt-7 sm:-mt-8 max-w-md w-full mx-auto px-3.5 sm:px-4">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-slate-100 p-4 sm:p-5">
              {/* Browsing as Guest Callout Banner (visible for guests) */}
              {isGuest && (
                <div className="bg-[#EFF6FF] border border-[#BFDBFE]/70 rounded-2xl p-3 flex items-center justify-between gap-3 mb-4 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#DBEAFE] text-[#1D68F2] flex items-center justify-center shrink-0">
                      <Users className="w-4.5 h-4.5 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                        Browsing as Guest
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                        Sign in to book seats & track drivers live
                      </p>
                    </div>
                  </div>
                  <Link
                    href={loginUrl}
                    className="px-3.5 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shrink-0 shadow-xs active:scale-95 transition-transform"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {/* ── Pickup Location Section ──────────────────────────────── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                    <span className="text-xs font-bold text-slate-900">Pickup Location</span>
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <Crosshair className={`w-3.5 h-3.5 text-[#4F46E5] ${isLocating ? 'animate-spin' : ''}`} />
                    <span>Use Current</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <SearchInput
                      isSource={true}
                      value={origin}
                      placeholder="Enter pickup city or address"
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

                  {/* Dedicated 📍 GPS Pill Button */}
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="h-[46px] px-3.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all shrink-0"
                    title="Detect GPS location"
                  >
                    <MapPin className={`w-3.5 h-3.5 text-[#4F46E5] ${isLocating ? 'animate-spin' : ''}`} />
                    <span>GPS</span>
                  </button>
                </div>
              </div>

              {/* ── Centered Swap Button ──────────────────────────────────── */}
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-full bg-white border border-indigo-200 shadow-xs flex items-center justify-center text-[#4F46E5] hover:bg-indigo-50 active:scale-90 transition-transform relative z-10"
                  title="Swap locations"
                  aria-label="Swap locations"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 stroke-[2]" />
                </button>
              </div>

              {/* ── Where to? (Destination) Section ───────────────────────── */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shrink-0" />
                  <span className="text-xs font-bold text-slate-900">Where to? (Destination)</span>
                </div>
                <SearchInput
                  isSource={false}
                  value={destination}
                  placeholder="Enter dropoff city or address"
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

              {/* ── Departure Date Section (Matching trips/search) ─────────── */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>Departure Date</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDate?.(date === todayStr ? '' : todayStr)}
                      className={cn(
                        'px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all active:scale-95',
                        date === todayStr
                          ? 'bg-[#4F46E5] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDate?.(date === tomorrowStr ? '' : tomorrowStr)}
                      className={cn(
                        'px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all active:scale-95',
                        date === tomorrowStr
                          ? 'bg-[#4F46E5] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      Tmrw
                    </button>
                    {date && (
                      <button
                        type="button"
                        onClick={() => setDate?.('')}
                        className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Clear date"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <DatePicker
                  value={parseLocalDate(date)}
                  onChange={(d) => setDate?.(formatLocalDate(d))}
                  onClear={() => setDate?.('')}
                  placeholder="Select Departure Date"
                  minDate={new Date()}
                  title="Select Departure Date"
                  subtitle="Intercity rides across Maharashtra"
                  className="w-full text-xs sm:text-sm"
                  triggerClassName="h-12 rounded-xl bg-slate-50/80 hover:bg-slate-50 border-slate-200/90 shadow-2xs"
                />
              </div>

              {/* ── Big Primary Search Button ─────────────────────────────── */}
              <button
                type="button"
                onClick={handleSearchAvailableRides}
                disabled={isSearching}
                className="w-full h-12 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm shadow-md shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching Available Rides...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 stroke-[2.5]" />
                    <span>Search Available Rides</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>

            {/* ── Popular Routes Section ──────────────────────────────────── */}
            <div className="mt-5 px-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Popular Routes</h3>
                <Link
                  href="/dashboard/passenger/popular-routes"
                  className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-0.5 active:scale-95 transition-transform"
                >
                  <span>See All</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                </Link>
              </div>

              {/* 3 Route Cards in a row */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {defaultRoutes.map((route) => {
                  const Icon = route.icon;
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
                      className={`p-2.5 rounded-2xl text-left active:scale-95 transition-all shadow-xs flex flex-col justify-between ${
                        route.isHighlighted
                          ? 'bg-[#EEF2FF] border border-[#C7D2FE]'
                          : 'bg-white border border-slate-200'
                      }`}
                    >
                      <div>
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 ${
                            route.isHighlighted
                              ? 'bg-[#E0E7FF] text-[#4F46E5]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {route.line1}
                        </p>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {route.line2}
                        </p>
                      </div>
                      <p
                        className={`text-[11px] mt-1.5 font-medium leading-none ${
                          route.isHighlighted ? 'text-[#4F46E5] font-bold' : 'text-slate-500'
                        }`}
                      >
                        {route.price}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════
           SCREEN 2: Available Rides & Interactive Route Map
           ════════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col w-full animate-fadeIn">
          {/* ── Edge-to-Edge Map Section with Route Polyline & Markers ─────── */}
          <div className="w-full h-[250px] sm:h-[270px] shrink-0 relative overflow-hidden bg-slate-100">
            <div className="absolute inset-0 w-full h-full">
              <MapView
                center={mapCenter}
                markers={mapMarkers}
                route={mapRoute}
                zoom={mapZoom}
                height="100%"
                className="w-full h-full"
              />
            </div>

            {/* Floating Back Button on Map (Rounded-2xl white card with soft shadow) */}
            <button
              type="button"
              onClick={() => setViewMode('home')}
              className="absolute top-3.5 left-3.5 z-[1001] w-11 h-11 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-90 transition-all cursor-pointer pointer-events-auto"
              aria-label="Back to search"
              title="Back to search"
            >
              <ChevronLeft className="w-5 h-5 text-slate-800 stroke-[2.5]" />
            </button>

            {/* Floating Route ETA Pill over the route */}
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-sm text-white font-semibold text-xs shadow-md flex items-center gap-1.5 animate-fadeIn pointer-events-none">
              <span>{formatDuration(estimatedMins)}</span>
              <span className="opacity-60">•</span>
              <span>{Math.round(distanceKm)} km</span>
            </div>

            {/* Floating Location GPS Button (Rounded-2xl white card matching mockup) */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="absolute bottom-9 right-3.5 z-20 w-11 h-11 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-90 transition-all group"
              title="Locate my position"
              aria-label="Locate my position"
            >
              <Crosshair
                className={`w-5 h-5 text-slate-800 stroke-[2] ${
                  isLocating ? 'animate-spin text-[#4F46E5]' : ''
                }`}
              />
            </button>
          </div>

          {/* ── Native Bottom Sheet: Available Rides List ──────────────────── */}
          <div className="relative z-10 -mt-6 bg-white rounded-t-[32px] sm:rounded-t-[36px] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] border-t border-slate-100 px-4 pt-3 pb-3 flex-1 flex flex-col justify-between">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

            <div className="flex flex-col space-y-2.5">
              {/* Header: Available Rides + Lavender Edit button */}
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-[20px] font-extrabold text-[#0B1527] tracking-tight">
                    Available Rides
                  </h2>
                  <p className="text-[12px] text-[#64748B] mt-0.5 font-normal">
                    {isSearching
                      ? 'Searching available fleet rides...'
                      : availableRealTrips.length > 0
                      ? `${availableRealTrips.length} trip${
                          availableRealTrips.length > 1 ? 's' : ''
                        } found`
                      : 'No direct trips on this route'}
                  </p>
                </div>

                {/* Edit Route Button (Soft purple/indigo pill with pencil icon) */}
                <button
                  type="button"
                  onClick={() => setViewMode('home')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[13px] font-bold text-slate-800 transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 border border-indigo-100/60"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-700 stroke-[2.2]" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Rides List Area */}
              <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-0.5">
                {isSearching ? (
                  <div className="py-8 flex flex-col items-center justify-center text-[#64748B] gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
                    <p className="text-xs font-semibold text-[#334155]">
                      Searching active scheduled rides...
                    </p>
                  </div>
                ) : availableRealTrips.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-7 flex flex-col items-center justify-center text-center my-1.5">
                    {/* SVG Illustration: Modern Sedan with Location Pin Drop matching mockup */}
                    <div className="relative w-36 h-28 flex items-center justify-center mb-1">
                      <svg viewBox="0 0 160 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Soft backdrop clouds & road glow */}
                        <ellipse cx="80" cy="90" rx="60" ry="12" fill="#EEF2FF" />
                        <path d="M42 76 C55 60 105 60 118 76" stroke="#E0E7FF" strokeWidth="22" strokeLinecap="round" opacity="0.5" />
                        
                        {/* Soft Road Shadow under tires */}
                        <ellipse cx="80" cy="86" rx="46" ry="6" fill="#CBD5E1" fillOpacity="0.5" />

                        {/* Modern Sedan Car (Front-3/4 angle) */}
                        <g transform="translate(36, 44)">
                          {/* Wheels */}
                          <rect x="12" y="32" width="10" height="9" rx="3" fill="#1E293B" />
                          <rect x="66" y="32" width="10" height="9" rx="3" fill="#1E293B" />
                          
                          {/* Dark Underbody */}
                          <rect x="10" y="28" width="68" height="6" rx="2" fill="#334155" />

                          {/* Windshield & Cabin Glass */}
                          <path d="M22 17 L33 4 L55 4 L66 17 Z" fill="#6366F1" fillOpacity="0.25" stroke="#4F46E5" strokeWidth="1.5" />
                          <path d="M34 5 L54 5 L63 16 L25 16 Z" fill="#93C5FD" fillOpacity="0.4" />

                          {/* Main Car Body in Pure White / Soft Indigo outline */}
                          <path d="M6 17 C6 14 15 14 22 17 L66 17 C73 14 82 14 82 17 L84 27 C84 30 82 32 76 32 L12 32 C6 32 4 30 4 27 Z" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="1.8" />

                          {/* Headlights (Glowing Cyan) */}
                          <rect x="8" y="20" width="8" height="4" rx="1.5" fill="#38BDF8" />
                          <rect x="72" y="20" width="8" height="4" rx="1.5" fill="#38BDF8" />

                          {/* Chrome Front Grill */}
                          <rect x="25" y="21" width="38" height="5" rx="1.5" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
                        </g>

                        {/* Floating Location Marker Pin (Over the car) */}
                        <g transform="translate(67, 10)">
                          <path d="M13 0 C5.82 0 0 5.82 0 13 C0 22.75 13 34 13 34 C13 34 26 22.75 26 13 C26 5.82 20.18 0 13 0 Z" fill="#4F46E5" />
                          <circle cx="13" cy="12" r="4.5" fill="#FFFFFF" />
                        </g>
                      </svg>
                    </div>

                    <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0F172A] mt-2 tracking-tight">
                      No Direct Rides Found
                    </h3>
                    <p className="text-[12px] text-[#64748B] mt-1.5 max-w-[270px] mx-auto leading-relaxed">
                      No direct trips available for this route right now.<br />
                      Try changing pickup or dropoff location.
                    </p>

                    {/* Change Route Pill Button with icon */}
                    <button
                      type="button"
                      onClick={() => setViewMode('home')}
                      className="mt-4 px-5 py-2.5 rounded-full bg-white border border-[#4F46E5]/30 hover:bg-[#EEF2FF]/60 text-[#4F46E5] text-xs font-bold shadow-2xs active:scale-95 transition-all flex items-center gap-2"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.4] text-[#4F46E5]" />
                      <span>Change Route</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableRealTrips.map((trip) => {
                      const isSelected =
                        (selectedTripId || availableRealTrips[0]?.id) === trip.id;
                      const tripImg = getTripVehicleImage(trip.vehicle || trip.vehicleType);
                      const priceVal = Number(
                        trip.pricePerSeat || trip.price || trip.basePrice || 0
                      );
                      const vName = formatVehicleName(
                        trip.vehicle
                           ? `${trip.vehicle.brand} ${trip.vehicle.model}`
                          : trip.vehicleName || 'Toyota Innova'
                      );

                      return (
                        <div
                          key={trip.id}
                          onClick={() => setSelectedTripId(trip.id)}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.99] ${
                            isSelected
                              ? 'border-[#4F46E5] bg-[#EEF2FF]/70 shadow-xs ring-1 ring-[#4F46E5]/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                          }`}
                        >
                          {/* Left: Radio + Vehicle Image + Details */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'border-[#4F46E5] bg-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                              )}
                            </div>

                            <img
                              src={tripImg}
                              alt={vName}
                              className="w-14 h-9 object-contain drop-shadow-xs shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-bold text-slate-900 truncate capitalize leading-tight">
                                {vName}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                                {trip.driver?.user?.firstName
                                  ? `Capt. ${trip.driver.user.firstName}`
                                  : trip.operatorName || 'Verified fleet'}{' '}
                                · {trip.availableSeats || 1} seats
                              </p>
                              {trip.departureTime && (
                                <p className="text-[11px] text-[#4F46E5] font-semibold mt-0.5">
                                  Dep:{' '}
                                  {new Date(trip.departureTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Fare & Duration */}
                          <div className="text-right shrink-0 min-w-[70px] pl-1">
                            <p className="text-[16px] font-extrabold text-slate-900 whitespace-nowrap">
                              {baseCurrencySymbol} {priceVal > 0 ? priceVal : 399}
                            </p>
                            <span className="text-[10px] text-slate-400 block whitespace-nowrap font-normal">
                              per seat
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                              {formatDuration(estimatedMins)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Payment Row & Action Button ────────────────────────────── */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  {user ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentMethod((p) => (p === 'Cash' ? 'Wallet' : 'Cash'))
                      }
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-all active:scale-95 shadow-2xs"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600 stroke-[2] shrink-0" />
                      <span>
                        {paymentMethod === 'Cash'
                          ? 'Pay on Board / Cash'
                          : `Wallet · ${baseCurrencySymbol}${walletBalance || 0}`}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-800 shadow-2xs">
                      <CreditCard className="w-4 h-4 text-emerald-600 stroke-[2] shrink-0" />
                      <span>Pay on Board / Cash</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-[11px] text-[#64748B] font-medium block leading-none mb-1">
                      Total Fare
                    </span>
                    <span className="font-black text-[#4F46E5] text-[22px] sm:text-[24px] leading-none whitespace-nowrap tracking-tight">
                      {baseCurrencySymbol}{' '}
                      {selectedFare > 0
                        ? selectedFare
                        : availableRealTrips[0]?.pricePerSeat ||
                          availableRealTrips[0]?.price ||
                          399}
                    </span>
                  </div>
                </div>

                {/* Primary Royal Blue/Indigo Gradient Button matching mockup */}
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="w-full h-[52px] rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] hover:opacity-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Car className="w-5 h-5 text-white stroke-[2.2] shrink-0" />
                  <span className="tracking-wide">
                    {user
                      ? `Confirm Booking  ${baseCurrencySymbol}${
                          selectedFare > 0 ? selectedFare : 399
                        }`
                      : `Sign In to Book a Ride  ${baseCurrencySymbol}${
                          selectedFare > 0 ? selectedFare : 399
                        }`}
                  </span>
                  <ArrowRight className="w-4.5 h-4.5 text-white stroke-[2.5] shrink-0 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
