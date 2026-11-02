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
  Headphones,
  ChevronDown,
  Banknote,
  Loader2,
  MapPin,
  Navigation,
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
  setMapZoom,
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
  const displayName = user?.firstName || 'Arman';

  return (
    <div className="flex flex-col w-full bg-[#F8FAFC] relative select-none">
      {/* ── Screen 2: Top Floating Route Header Bar (Ola/Uber Style) ── */}
      {viewMode === 'available-rides' && (
        <header className="bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between gap-3 z-30 sticky top-0 shadow-xs animate-fadeIn">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setViewMode('home')}
            className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] active:scale-90 transition-all flex items-center justify-center shrink-0 shadow-xs"
            aria-label="Back to search"
          >
            <ArrowLeft className="w-4 h-4 text-[#0F172A] stroke-[2]" />
          </button>

          {/* Route Summary */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F172A] min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 ring-2 ring-emerald-100" />
              <span className="truncate max-w-[110px]" title={origin}>
                {formatShortAddress(origin) || 'Pickup'}
              </span>
              <ArrowRight className="w-3 h-3 text-[#64748B] shrink-0 mx-0.5" />
              <span className="w-2 h-2 rounded-sm bg-[#EF4444] shrink-0 ring-2 ring-rose-100" />
              <span className="truncate max-w-[110px]" title={destination}>
                {formatShortAddress(destination) || 'Dropoff'}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-normal">
              {formatDuration(estimatedMins)} • {Math.round(distanceKm)} km trip
            </p>
          </div>

          {/* Swap Locations Button */}
          <button
            type="button"
            onClick={handleSwap}
            className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] active:scale-90 transition-all flex items-center justify-center shrink-0 shadow-xs"
            title="Swap locations"
            aria-label="Swap locations"
          >
            <ArrowUpDown className="w-4 h-4 text-[#0F172A] stroke-[2]" />
          </button>
        </header>
      )}

      {/* ── Curved Map Section (Symmetrical px-4, Curved Top & Bottom with 24px Radius) ── */}
      <div className="w-full   shrink-0">
        <div
          className={`w-full relative rounded-[24px] overflow-hidden bg-slate-200 border border-[#E2E8F0] shadow-xs z-0 transition-all duration-300 isolate transform-gpu ${viewMode === 'available-rides' ? 'h-[175px]' : 'h-[210px]'
            }`}
          style={{
            WebkitMaskImage: '-webkit-radial-gradient(white, black)',
            borderRadius: '24px',
          }}
        >
          <MapView
            center={mapCenter}
            markers={mapMarkers}
            route={mapRoute}
            zoom={mapZoom}
            height="100%"
          />

          {/* Floating Circular Blue Navigation Arrow Button on Bottom-Right */}
          <button
            type="button"
            onClick={detectLocation}
            className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] hover:bg-slate-50 active:scale-90 transition-all group"
            title="Locate my position"
            aria-label="Locate my position"
          >
            <Navigation
              className={`w-4 h-4 text-[#2563EB] fill-[#2563EB] transform rotate-45 ${isLocating ? 'animate-spin' : ''
                }`}
            />
          </button>

          {/* Screen 2: Floating Route ETA Bubble */}
          {viewMode === 'available-rides' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-3 py-1 rounded-full bg-[#2563EB] text-white font-semibold text-xs shadow-xl flex items-center gap-1.5 animate-fadeIn pointer-events-none">
              <span>{formatDuration(estimatedMins)}</span>
              <span className="opacity-70">•</span>
              <span>{Math.round(distanceKm)} km</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Native App Bottom Sheet (26px top radius with z-[500] ensuring it renders ON TOP of Leaflet) ── */}
      <div
        className={`relative z-[500] -mt-5 bg-white rounded-t-[26px] shadow-[0_-4px_24px_rgba(15,23,42,0.08)] border-t border-[#E2E8F0] px-4 pt-2.5 ${viewMode === 'home' ? 'pb-2 shrink-0' : 'pb-2 flex flex-col flex-1 min-h-[460px]'
          }`}
      >
        {viewMode === 'home' ? (
          /* ════════════════════════════════════════════════════════════════
             SCREEN 1: Mobile Native Home Booking Sheet (Exact Mockup Match)
             ════════════════════════════════════════════════════════════════ */
          <div className="space-y-2.5 animate-fadeIn">
            {/* Top Sheet Drag Handle */}
            <div className="w-10 h-1 bg-[#CBD5E1] rounded-full mx-auto mb-1.5 mt-0.5" />

            {/* Greeting Header (Page Heading: Inter 21px / Weight 700 Bold) */}
            <div>
              <h2 className="text-[21px] font-bold text-[#0F172A] tracking-tight flex items-center gap-1.5 leading-tight">
                <span>Where to, {displayName}?</span>
                <span className="text-xl">👋</span>
              </h2>
              <p className="text-[13px] text-[#64748B] font-normal mt-0.5">
                Book a ride to your destination
              </p>
            </div>

            {/* ── Section 2: Pickup & Destination Inputs Card (16px Radius, Surface Secondary Background) ── */}
            <div className="bg-[#F8FAFC] rounded-[16px] border border-[#E2E8F0] p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="flex gap-2.5 items-stretch relative">
                {/* Left Column: Semantic Indicator Pins & Dotted connecting line */}
                <div className="flex flex-col items-center pt-1.5 pb-2 shrink-0 w-5">
                  {/* Green Pickup Pin (#10B981) */}
                  <MapPin className="w-4 h-4 text-[#10B981] fill-[#10B981] shrink-0" />

                  {/* Dotted connecting line */}
                  <div className="w-0 flex-1 border-l-2 border-dashed border-[#CBD5E1] my-1" />

                  {/* Red Destination Pin (#EF4444) */}
                  <MapPin className="w-4 h-4 text-[#EF4444] fill-[#EF4444] shrink-0" />
                </div>

                {/* Right Column: Labels, Inputs, GPS Button & Swap */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Pickup Row */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-semibold text-[#0F172A]">Pickup Location</span>
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={isLocating}
                        className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <Crosshair className={`w-3.5 h-3.5 text-[#2563EB] ${isLocating ? 'animate-spin' : ''}`} />
                        <span>Use Current</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 relative">
                        <SearchInput
                          isSource={true}
                          value={origin}
                          placeholder="Enter pickup city or address"
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

                      {/* Dedicated ⌖ GPS Pill Button beside input */}
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={isLocating}
                        className="h-[44px] px-3 rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] text-[12px] font-semibold flex items-center gap-1 shadow-2xs active:scale-95 hover:bg-blue-100 transition-all shrink-0"
                        title="Detect GPS location"
                      >
                        <Crosshair className={`w-3.5 h-3.5 text-[#2563EB] ${isLocating ? 'animate-spin' : ''}`} />
                        <span>GPS</span>
                      </button>
                    </div>
                  </div>

                  {/* Centered Swap Circle Button */}
                  <div className="relative flex items-center justify-center -my-1">
                    <button
                      type="button"
                      onClick={handleSwap}
                      className="w-7 h-7 rounded-full bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#2563EB] hover:text-[#1D4ED8] active:scale-90 transition-transform relative z-10"
                      title="Swap locations"
                      aria-label="Swap locations"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>

                  {/* Destination Row */}
                  <div>
                    <div className="text-[12px] font-semibold text-[#0F172A] mb-1">
                      Where to? (Destination)
                    </div>

                    <div className="w-full relative">
                      <SearchInput
                        isSource={false}
                        value={destination}
                        placeholder="Enter dropoff city or address"
                        required
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
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Popular Routes (Section Heading: 18px / Weight 600, Cards: 16px Radius) ── */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#0F172A]">Popular Routes</h3>
                <button
                  type="button"
                  onClick={() => {
                    if (popularRoutes.length > 0) {
                      handleSelectRecentPlace(popularRoutes[0].source, popularRoutes[0].destination);
                    }
                  }}
                  className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] active:scale-95 transition-transform"
                >
                  See All
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                {/* Route 1: Mumbai (Active light blue style) */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectRecentPlace(
                      popularRoutes[0]?.source || 'Mhasla, Maharashtra',
                      popularRoutes[0]?.destination || 'Mumbai, Maharashtra',
                      18.113999,
                      73.159248,
                      19.054999,
                      72.8692035
                    )
                  }
                  className="min-w-0 p-2.5 rounded-[16px] bg-[#EFF6FF] border border-[#BFDBFE] text-left active:scale-95 transition-all group shadow-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center mb-1.5 transition-colors">
                    <Landmark className="w-3.5 h-3.5 text-[#2563EB] stroke-[2]" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                    {popularRoutes[0]?.destination?.split(',')[0] || 'Mumbai'}
                  </p>
                  <p className="text-[11px] font-medium text-[#2563EB] truncate mt-0.5">
                    {baseCurrencySymbol} {popularRoutes[0]?.avgPrice || 399} avg
                  </p>
                </button>

                {/* Route 2: Pune */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectRecentPlace(
                      popularRoutes[1]?.source || 'Mhasla, Maharashtra',
                      popularRoutes[1]?.destination || 'Pune, Maharashtra',
                      18.113999,
                      73.159248,
                      18.5204,
                      73.8567
                    )
                  }
                  className="min-w-0 p-2.5 rounded-[16px] bg-white border border-[#E2E8F0] shadow-xs text-left active:scale-95 group transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-1.5 transition-colors">
                    <Building2 className="w-3.5 h-3.5 text-[#64748B] stroke-[2]" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                    {popularRoutes[1]?.destination?.split(',')[0] || 'Pune'}
                  </p>
                  <p className="text-[11px] font-normal text-[#64748B] truncate mt-0.5">
                    {baseCurrencySymbol} {popularRoutes[1]?.avgPrice || 300} avg
                  </p>
                </button>

                {/* Route 3: Mhasla Taluka */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectRecentPlace(
                      popularRoutes[0]?.destination || 'Mumbai, Maharashtra',
                      popularRoutes[0]?.source || 'Mhasla, Maharashtra'
                    )
                  }
                  className="min-w-0 p-2.5 rounded-[16px] bg-white border border-[#E2E8F0] shadow-xs text-left active:scale-95 group transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-1.5 transition-colors">
                    <Plane className="w-3.5 h-3.5 text-[#64748B] stroke-[2]" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                    {popularRoutes[0]?.source?.split(',')[0] || 'Mhasla Taluka'}
                  </p>
                  <p className="text-[11px] font-normal text-[#64748B] truncate mt-0.5">Return Trip</p>
                </button>
              </div>
            </div>

            {/* ── Search Available Rides Primary CTA Button (Height 48px, Radius 14px, #2563EB) ── */}
            <button
              type="button"
              onClick={handleSearchAvailableRides}
              disabled={isSearching}
              className="w-full h-[48px] rounded-[14px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[15px] shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
                </>
              )}
            </button>

            {/* ── Quick Action Shortcuts (4 Soft Colored Cards sitting right above the bottom tab bar) ── */}
            <div className="grid grid-cols-4 gap-2 text-center pt-1 pb-1 w-full">
              {/* 1. Ride Now */}
              <button
                type="button"
                onClick={handleSearchAvailableRides}
                className="min-w-0 flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-1 shadow-2xs group-hover:bg-blue-100 transition-colors">
                  <Car className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-medium text-[#334155] tracking-tight">
                  Ride Now
                </span>
              </button>

              {/* 2. My Trips */}
              <Link
                href="/dashboard/bookings"
                className="min-w-0 flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mb-1 shadow-2xs group-hover:bg-emerald-100 transition-colors">
                  <Calendar className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-medium text-[#334155] tracking-tight">
                  My Trips
                </span>
              </Link>

              {/* 3. Wallet */}
              <Link
                href="/dashboard/wallet"
                className="min-w-0 flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center mb-1 shadow-2xs group-hover:bg-amber-100 transition-colors">
                  <Wallet className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-medium text-[#334155] tracking-tight">
                  Wallet
                </span>
              </Link>

              {/* 4. Support */}
              <Link
                href="/dashboard/support"
                className="min-w-0 flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-1 shadow-2xs group-hover:bg-purple-100 transition-colors">
                  <Headphones className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-medium text-[#334155] tracking-tight">
                  Support
                </span>
              </Link>
            </div>
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════════════
             SCREEN 2: Mobile Native Available Rides & Booking Flow
             ════════════════════════════════════════════════════════════════ */
          <div className="flex flex-col flex-1 min-h-0 animate-fadeIn">
            {/* Sheet Handle & Header */}
            <div className="pt-1 pb-2 shrink-0 border-b border-[#E2E8F0]">
              <div className="w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mb-2" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight">
                    Available Rides
                  </h2>
                  <p className="text-[11px] text-[#64748B] mt-0.5 font-normal">
                    {isSearching
                      ? 'Searching verified fleet rides...'
                      : availableRealTrips.length > 0
                        ? `${availableRealTrips.length} verified trip${availableRealTrips.length > 1 ? 's' : ''
                        } available`
                        : 'Choose your preferred journey'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('home')}
                  className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] px-2.5 py-1 rounded-[10px] bg-[#EFF6FF] active:scale-95 transition-all"
                >
                  Edit Route
                </button>
              </div>
            </div>

            {/* Scrollable Rides List Area (Only Real Backend Trips) */}
            <div className="flex-1 overflow-y-auto py-2.5 space-y-2 max-h-[46vh]">
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#64748B] gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
                  <p className="text-xs font-semibold text-[#334155]">
                    Searching active scheduled rides...
                  </p>
                </div>
              ) : availableRealTrips.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-3 bg-[#F8FAFC] rounded-[16px] border border-dashed border-[#E2E8F0]">
                  <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-[#0F172A]">No Direct Rides Found</h4>
                    <p className="text-[12px] text-[#64748B] mt-1 max-w-xs mx-auto">
                      No fleet trips found for this route right now. Try picking a route from Popular Routes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('home')}
                    className="px-4 py-2 rounded-[10px] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[12px] font-semibold text-[#2563EB] shadow-xs active:scale-95 transition-all"
                  >
                    Change Locations
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

                    return (
                      <div
                        key={trip.id}
                        onClick={() => setSelectedTripId(trip.id)}
                        className={`p-3 rounded-[16px] border transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.99] ${isSelected
                          ? 'border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]/30 shadow-xs'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC] shadow-2xs'
                          }`}
                      >
                        {/* Left: Radio + Real Vehicle Image + Details */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
                              ? 'border-[#2563EB] bg-[#2563EB]'
                              : 'border-[#CBD5E1] bg-white'
                              }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>

                          <img
                            src={tripImg}
                            alt={trip.vehicleName || 'Vehicle'}
                            className="w-14 h-9 object-contain drop-shadow-sm shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <h4 className="text-[13px] font-semibold text-[#0F172A] truncate capitalize leading-tight">
                              {trip.vehicle
                                ? `${trip.vehicle.brand} ${trip.vehicle.model}`
                                : trip.vehicleName || 'Toyota Innova'}
                            </h4>
                            <p className="text-[11px] text-[#64748B] font-normal mt-0.5 truncate">
                              {trip.driver?.user?.firstName
                                ? `Capt. ${trip.driver.user.firstName}`
                                : trip.operatorName || 'Verified Fleet'}{' '}
                              • {trip.availableSeats || 1} seats open
                            </p>
                            {trip.departureTime && (
                              <p className="text-[10px] text-[#2563EB] font-medium mt-0.5">
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
                          <p className="text-[14px] font-bold text-[#0F172A] whitespace-nowrap">
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

            {/* ── Fixed Sticky Bottom Action Bar (Payment, Fare & Confirm Button) ── */}
            <div className="shrink-0 pt-2.5 border-t border-[#E2E8F0] bg-white/95 backdrop-blur-md space-y-2 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]">
              {/* Compact Payment Row & Estimated Fare */}
              <div className="flex items-center justify-between gap-2">
                {/* Payment Pill Button */}
                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod((p) => (p === 'Cash' ? 'Wallet' : 'Cash'))
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[12px] font-semibold text-[#0F172A] transition-all active:scale-95 shadow-xs"
                >
                  <Banknote className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>
                    {paymentMethod === 'Cash'
                      ? 'Cash'
                      : `Wallet (${baseCurrencySymbol} ${walletBalance || 0})`}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#64748B] shrink-0" />
                </button>

                {/* Estimated Fare Display */}
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block leading-none mb-0.5">
                    Estimated Fare
                  </span>
                  <span className="font-bold text-[#2563EB] text-[15px] leading-none whitespace-nowrap">
                    {baseCurrencySymbol}{' '}
                    {selectedFare > 0
                      ? selectedFare
                      : availableRealTrips[0]?.pricePerSeat ||
                      availableRealTrips[0]?.price ||
                      399}
                  </span>
                </div>
              </div>

              {/* Confirm Booking CTA Button (Routes directly to /dashboard/trips/[id]) */}
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isSearching || availableRealTrips.length === 0}
                className="w-full h-[46px] rounded-[14px] bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[14px] shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Car className="w-4 h-4 stroke-[2]" />
                <span>Confirm Ticket</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
