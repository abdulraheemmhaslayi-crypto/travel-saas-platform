'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Crosshair,
  Search,
  Landmark,
  Building2,
  Plane,
  Car,
  Calendar,
  Wallet,
  ChevronDown,
  Banknote,
  Loader2,
  MapPin,
  Navigation,
  Compass,
  ChevronRight,
  Users,
  BusFront,
  User,
} from 'lucide-react';
import MapView, { MapMarker } from '@/components/maps/MapView';
import SearchInput from '@/components/maps/SearchInput';

export interface PassengerDashboardMobileProps {
  user: any;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
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
                    className="px-3.5 py-1.5 rounded-xl bg-[#1D68F2] hover:bg-blue-700 text-white text-xs font-semibold shrink-0 shadow-xs active:scale-95 transition-transform"
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
                    className="text-xs font-bold text-[#1D68F2] hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <Crosshair className={`w-3.5 h-3.5 text-[#1D68F2] ${isLocating ? 'animate-spin' : ''}`} />
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
                    className="h-[46px] px-3.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-[#1D68F2] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all shrink-0"
                    title="Detect GPS location"
                  >
                    <MapPin className={`w-3.5 h-3.5 text-[#1D68F2] ${isLocating ? 'animate-spin' : ''}`} />
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
                  className="w-8 h-8 rounded-full bg-white border border-blue-200 shadow-xs flex items-center justify-center text-[#1D68F2] hover:bg-blue-50 active:scale-90 transition-transform relative z-10"
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

              {/* ── Big Primary Search Button ─────────────────────────────── */}
              <button
                type="button"
                onClick={handleSearchAvailableRides}
                disabled={isSearching}
                className="w-full h-12 rounded-xl bg-[#1D68F2] hover:bg-blue-700 text-white font-bold text-sm shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
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
                  className="text-xs font-bold text-[#1D68F2] hover:text-blue-700 flex items-center gap-0.5 active:scale-95 transition-transform"
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
                          ? 'bg-[#EFF6FF] border border-[#BFDBFE]'
                          : 'bg-white border border-slate-200'
                      }`}
                    >
                      <div>
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 ${
                            route.isHighlighted
                              ? 'bg-[#DBEAFE] text-[#1D68F2]'
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
                          route.isHighlighted ? 'text-[#1D68F2] font-bold' : 'text-slate-500'
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
          {/* ── Curved Map Section with Route Markers & Route Polyline ──────── */}
          <div className="w-full px-3 pt-2 flex flex-col h-[210px] sm:h-[230px] shrink-0 relative">
            <div
              className="w-full h-full relative rounded-[24px] overflow-hidden bg-slate-100 border border-[#E2E8F0] shadow-xs z-0 isolate transform-gpu transition-all duration-300 flex flex-col"
              style={{
                WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                borderRadius: '24px',
              }}
            >
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

              {/* Floating Back Button on Map */}
              <button
                type="button"
                onClick={() => setViewMode('home')}
                className="absolute top-3 left-3 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] hover:bg-slate-50 active:scale-90 transition-all"
                aria-label="Back to search"
                title="Back to search"
              >
                <ArrowLeft className="w-4 h-4 text-[#0F172A] stroke-[2.2]" />
              </button>

              {/* Floating ETA Bubble on Map */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-[#0F172A]/90 backdrop-blur-sm text-white font-semibold text-xs shadow-md flex items-center gap-1.5 animate-fadeIn pointer-events-none">
                <span>{formatDuration(estimatedMins)}</span>
                <span className="opacity-60">•</span>
                <span>{Math.round(distanceKm)} km</span>
              </div>

              {/* Floating Location GPS Button */}
              <button
                type="button"
                onClick={detectLocation}
                className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] hover:bg-slate-50 active:scale-90 transition-all group"
                title="Locate my position"
                aria-label="Locate my position"
              >
                <Navigation
                  className={`w-4 h-4 text-[#2563EB] fill-[#2563EB] transform rotate-45 ${
                    isLocating ? 'animate-spin' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── Native Bottom Sheet: Available Rides List ──────────────────── */}
          <div className="relative z-10 -mt-4 bg-white rounded-t-[28px] shadow-[0_-4px_24px_rgba(15,23,42,0.08)] border-t border-[#E2E8F0] px-4 pt-3 pb-3 flex-1 flex flex-col justify-between">
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-[#CBD5E1] rounded-full mx-auto mb-2 shrink-0" />

            <div className="flex flex-col space-y-2.5">
              {/* Header: Available rides + Edit button */}
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight">
                    Available rides
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

                {/* Edit Route Button */}
                <button
                  type="button"
                  onClick={() => setViewMode('home')}
                  className="px-3.5 py-1.5 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[12px] font-semibold text-[#0F172A] transition-all active:scale-95 shadow-2xs"
                >
                  Edit
                </button>
              </div>

              {/* Rides List Area */}
              <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-0.5">
                {isSearching ? (
                  <div className="py-8 flex flex-col items-center justify-center text-[#64748B] gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
                    <p className="text-xs font-semibold text-[#334155]">
                      Searching active scheduled rides...
                    </p>
                  </div>
                ) : availableRealTrips.length === 0 ? (
                  <div className="py-6 px-4 text-center space-y-2.5 bg-[#F8FAFC] rounded-[18px] border border-dashed border-[#E2E8F0]">
                    <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#0F172A]">No Direct Rides Found</h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5 max-w-xs mx-auto">
                        No fleet trips found for this route right now. Try changing pickup or destination.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('home')}
                      className="px-4 py-1.5 rounded-[10px] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[12px] font-semibold text-[#2563EB] shadow-2xs active:scale-95 transition-all"
                    >
                      Change Route
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
                          className={`p-3 rounded-[18px] border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.99] ${
                            isSelected
                              ? 'border-[#2563EB] bg-[#EFF6FF]/60 shadow-xs'
                              : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC] shadow-2xs'
                          }`}
                        >
                          {/* Left: Radio + Vehicle Image + Details */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'border-[#2563EB] bg-white'
                                  : 'border-[#CBD5E1] bg-white'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                              )}
                            </div>

                            <img
                              src={tripImg}
                              alt={vName}
                              className="w-14 h-9 object-contain drop-shadow-xs shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-semibold text-[#0F172A] truncate capitalize leading-tight">
                                {vName}
                              </h4>
                              <p className="text-[11px] text-[#64748B] font-normal mt-0.5 truncate">
                                {trip.driver?.user?.firstName
                                  ? `Capt. ${trip.driver.user.firstName}`
                                  : trip.operatorName || 'Verified fleet'}{' '}
                                · {trip.availableSeats || 1} seats
                              </p>
                              {trip.departureTime && (
                                <p className="text-[11px] text-[#2563EB] font-medium mt-0.5">
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
                            <p className="text-[16px] font-bold text-[#0F172A] whitespace-nowrap">
                              {baseCurrencySymbol} {priceVal > 0 ? priceVal : 399}
                            </p>
                            <span className="text-[10px] text-[#64748B] block whitespace-nowrap font-normal">
                              per seat
                            </span>
                            <p className="text-[10px] text-[#64748B] font-medium mt-0.5 whitespace-nowrap">
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
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  {user ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentMethod((p) => (p === 'Cash' ? 'Wallet' : 'Cash'))
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[12px] font-semibold text-[#0F172A] transition-all active:scale-95 shadow-2xs"
                    >
                      <Banknote className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>
                        {paymentMethod === 'Cash'
                          ? 'Cash'
                          : `Wallet · ${baseCurrencySymbol}${walletBalance || 0}`}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-semibold text-[#0F172A] shadow-2xs">
                      <Banknote className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Pay on Board / Cash</span>
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block leading-none mb-0.5">
                      TOTAL
                    </span>
                    <span className="font-bold text-[#2563EB] text-[18px] leading-none whitespace-nowrap">
                      {baseCurrencySymbol}{' '}
                      {selectedFare > 0
                        ? selectedFare
                        : availableRealTrips[0]?.pricePerSeat ||
                          availableRealTrips[0]?.price ||
                          399}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isSearching || availableRealTrips.length === 0}
                  className="w-full h-[48px] rounded-[16px] bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[15px] shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Car className="w-4 h-4 stroke-[2]" />
                  <span>
                    {user
                      ? 'Confirm booking'
                      : `Sign In to Book • ${baseCurrencySymbol}${
                          selectedFare > 0 ? selectedFare : 399
                        }`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
