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
  const displayName = user?.firstName || 'Rider';

  return (
    <div className="flex flex-col w-full bg-[#F8FAFC] min-h-[calc(100dvh-3.5rem-4.5rem)] select-none">
      {/* ── Curved Map Section (Fixed 200-220px height as per design standards) ── */}
      <div className="w-full px-4 pt-1.5 flex flex-col h-[200px] sm:h-[220px] shrink-0 relative">
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

          {/* Floating Back Button on Map in Available Rides Mode */}
          {viewMode === 'available-rides' && (
            <button
              type="button"
              onClick={() => setViewMode('home')}
              className="absolute top-3 left-3 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] hover:bg-slate-50 active:scale-90 transition-all"
              aria-label="Back to search"
              title="Back to search"
            >
              <ArrowLeft className="w-4 h-4 text-[#0F172A] stroke-[2.2]" />
            </button>
          )}

          {/* Floating ETA Bubble on Map in Available Rides Mode */}
          {viewMode === 'available-rides' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-[#0F172A]/90 backdrop-blur-sm text-white font-semibold text-xs shadow-md flex items-center gap-1.5 animate-fadeIn pointer-events-none">
              <span>{formatDuration(estimatedMins)}</span>
              <span className="opacity-60">•</span>
              <span>{Math.round(distanceKm)} km</span>
            </div>
          )}

          {/* Floating Circular Blue Navigation Arrow Button on Bottom-Right */}
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

      {/* ── Native App Bottom Sheet (Overlaps bottom of map with -mt-5, zero gap) ── */}
      <div className="relative z-10 -mt-5 bg-white rounded-t-[28px] shadow-[0_-4px_24px_rgba(15,23,42,0.08)] border-t border-[#E2E8F0] px-4 pt-3 pb-3 flex-1 flex flex-col justify-between">
        {/* Sheet Top Drag Handle */}
        <div className="w-10 h-1 bg-[#CBD5E1] rounded-full mx-auto mb-2 shrink-0" />

        {viewMode === 'home' ? (
          /* ════════════════════════════════════════════════════════════════
             SCREEN 1: Mobile Native Home Booking Sheet
             ════════════════════════════════════════════════════════════════ */
          <div className="space-y-2.5 animate-fadeIn">
            {/* Greeting Header (Inter 21px / Weight 700 Bold) */}
            <div>
              <h2 className="text-[21px] font-bold text-[#0F172A] tracking-tight flex items-center gap-1.5 leading-tight">
                <span>Where to, {displayName}?</span>
                <span className="text-xl">👋</span>
              </h2>
              <p className="text-[13px] text-[#64748B] font-normal mt-0.5">
                Book a ride to your destination
              </p>
            </div>

            {/* ── Pickup & Destination Inputs Card (16px Radius) ── */}
            <div className="bg-[#F8FAFC] rounded-[16px] border border-[#E2E8F0] p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="flex gap-2.5 items-stretch relative">
                {/* Left Column: Semantic Indicator Pins & Dotted connecting line */}
                <div className="flex flex-col items-center pt-1.5 pb-2 shrink-0 w-5">
                  <MapPin className="w-4 h-4 text-[#10B981] fill-[#10B981] shrink-0" />
                  <div className="w-0 flex-1 border-l-2 border-dashed border-[#CBD5E1] my-1" />
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

            {/* ── Popular Routes (16px Radius) ── */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-[#0F172A]">Popular Routes</h3>
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

            {/* ── Search Available Rides Primary CTA Button ── */}
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

            {/* ── Quick Action Shortcuts (Directly above the bottom tab bar) ── */}
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
             SCREEN 2: Available Rides & Booking Flow (Compact - NO Gap)
             ════════════════════════════════════════════════════════════════ */
          <div className="flex flex-col animate-fadeIn space-y-2.5">
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

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setViewMode('home')}
                className="px-3.5 py-1.5 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[12px] font-semibold text-[#0F172A] transition-all active:scale-95 shadow-2xs"
              >
                Edit
              </button>
            </div>

            {/* Rides List Area (Natural height, max 38vh for multiple rides) */}
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
                      No fleet trips found for this route. Try changing pickup or destination.
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
                          {/* Radio Button */}
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

            {/* ── Payment Row & Confirm Booking CTA Button (Directly below the ride card) ── */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-2 shrink-0">
              {/* Payment Pill Button & Total Fare */}
              <div className="flex items-center justify-between gap-2">
                {/* Payment Pill Button */}
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

                {/* Total Price Display */}
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

              {/* Confirm Booking CTA Button */}
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isSearching || availableRealTrips.length === 0}
                className="w-full h-[48px] rounded-[16px] bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[15px] shadow-[0_4px_14px_rgba(37,99,235,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Car className="w-4 h-4 stroke-[2]" />
                <span>Confirm booking</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
