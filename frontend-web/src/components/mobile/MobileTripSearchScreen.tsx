'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTripStore } from '@/store/slices/tripSlice';
import { useAppStore } from '@/store';
import MapView, { MapMarker } from '@/components/maps/MapView';
import SearchInput from '@/components/maps/SearchInput';
import DatePicker from '@/components/ui/DatePicker';
import { cn, formatCurrency } from '@/lib/utils';
import {
  MapPin,
  ArrowRight,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronDown,
  Clock,
  Car,
  Calendar,
  CreditCard,
  Crosshair,
  Pencil,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Snowflake,
  Luggage,
  Loader2,
  ArrowLeftRight,
  BusFront,
  User,
  Search,
  Check,
} from 'lucide-react';

// Known coordinates for major Maharashtra / Konkan transit corridors
const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  mhasla: { lat: 18.114, lng: 73.1592 },
  dadar: { lat: 19.0178, lng: 72.8478 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  swargate: { lat: 18.5018, lng: 73.8586 },
  thane: { lat: 19.2183, lng: 72.9781 },
  panvel: { lat: 18.9894, lng: 73.1175 },
  vashi: { lat: 19.0771, lng: 72.9986 },
  mangaon: { lat: 18.2541, lng: 73.2862 },
  shrivardhan: { lat: 18.0333, lng: 73.0167 },
  alibag: { lat: 18.6414, lng: 72.8722 },
  kothrud: { lat: 18.5074, lng: 73.8077 },
  chembur: { lat: 19.0522, lng: 72.8995 },
};

function resolveCoords(name: string, fallback: { lat: number; lng: number }) {
  if (!name) return fallback;
  const lower = name.toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return fallback;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c * 1.3;
  return Math.max(1, Math.round(dist * 10) / 10);
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs} hrs`;
}

function formatVehicleName(name?: string): string {
  if (!name) return 'Toyota Innova';
  return name.replace(/\btyota\b/gi, 'Toyota');
}

function getTripVehicleImage(vehicle?: any): string {
  if (!vehicle) return '/images/vehicles/comfort.png';
  const str = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.type || ''}`.toLowerCase();
  if (str.includes('innova') || str.includes('xl') || str.includes('van') || vehicle.seatingCapacity > 5) {
    return '/images/vehicles/xl.png';
  }
  if (str.includes('suv') || str.includes('fortuner') || str.includes('audi') || str.includes('creta')) {
    return '/images/vehicles/premium.png';
  }
  if (str.includes('camry') || str.includes('city') || str.includes('sedan') || str.includes('comfort')) {
    return '/images/vehicles/comfort.png';
  }
  return '/images/vehicles/economy.png';
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

export default function MobileTripSearchScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showToast } = useAppStore();
  const {
    filters,
    exactMatches,
    trips,
    partialMatches,
    nearbyDeparture,
    nearbyDestination,
    similarRoutes,
    isLoading: isSearching,
    searchTrips,
    setFilters,
  } = useTripStore();

  // Combine real trips
  const allTrips = useMemo(() => {
    const combined = [
      ...(exactMatches || []),
      ...(trips || []),
      ...(partialMatches || []),
      ...(nearbyDeparture || []),
      ...(nearbyDestination || []),
      ...(similarRoutes || []),
    ];
    return Array.from(new Map(combined.map((t) => [t.id, t])).values());
  }, [exactMatches, trips, partialMatches, nearbyDeparture, nearbyDestination, similarRoutes]);

  // Form State
  const [origin, setOrigin] = useState<string>(filters.origin || 'Mhasla Stand');
  const [destination, setDestination] = useState<string>(filters.destination || 'Dadar T.T. Circle');
  const [date, setDate] = useState<string>(filters.date || '');
  const [passengerCount, setPassengerCount] = useState<number>(filters.seats || 1);
  const [isLocating, setIsLocating] = useState(false);
  const [rideFilter, setRideFilter] = useState<'all' | 'innova' | 'sedan'>('all');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Wallet'>('Cash');

  // View mode: if origin and destination were passed or already searched, start on 'rides'
  const [viewMode, setViewMode] = useState<'rides' | 'edit'>(
    filters.origin || filters.destination ? 'rides' : 'rides'
  );

  // 7-day calendar strip
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

  // Filtered trips
  const filteredTrips = useMemo(() => {
    if (rideFilter === 'all') return allTrips;
    if (rideFilter === 'innova') {
      return allTrips.filter((t) => {
        const str = `${t.vehicle?.brand || ''} ${t.vehicle?.model || ''} ${t.vehicle?.type || ''}`.toLowerCase();
        return str.includes('innova') || str.includes('xl') || str.includes('van');
      });
    }
    if (rideFilter === 'sedan') {
      return allTrips.filter((t) => {
        const str = `${t.vehicle?.brand || ''} ${t.vehicle?.model || ''} ${t.vehicle?.type || ''}`.toLowerCase();
        return str.includes('sedan') || str.includes('city') || str.includes('dzire') || str.includes('comfort');
      });
    }
    return allTrips;
  }, [allTrips, rideFilter]);

  // Coordinates resolution
  const pickupPoint = useMemo(() => {
    if (filters.originLat && filters.originLng) {
      return { lat: filters.originLat, lng: filters.originLng };
    }
    return resolveCoords(origin, { lat: 18.114, lng: 73.1592 }); // Default Mhasla
  }, [filters.originLat, filters.originLng, origin]);

  const dropPoint = useMemo(() => {
    if (filters.destLat && filters.destLng) {
      return { lat: filters.destLat, lng: filters.destLng };
    }
    return resolveCoords(destination, { lat: 19.0178, lng: 72.8478 }); // Default Dadar
  }, [filters.destLat, filters.destLng, destination]);

  const distanceKm = useMemo(() => {
    return calculateDistanceKm(pickupPoint.lat, pickupPoint.lng, dropPoint.lat, dropPoint.lng);
  }, [pickupPoint, dropPoint]);

  const estimatedMins = useMemo(() => {
    return Math.max(10, Math.round((distanceKm / 48) * 60));
  }, [distanceKm]);

  // Map Markers
  const mapCenter = useMemo(() => {
    return {
      lat: (pickupPoint.lat + dropPoint.lat) / 2,
      lng: (pickupPoint.lng + dropPoint.lng) / 2,
    };
  }, [pickupPoint, dropPoint]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return [
      {
        id: 'pickup-marker',
        position: pickupPoint,
        popup: `📍 Pickup: ${origin}`,
        iconHtml: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -50%);">
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;">
              <div style="position:absolute;width:40px;height:40px;border-radius:9999px;background-color:rgba(16,185,129,0.22);animation:pulse 2s infinite;"></div>
              <div style="position:absolute;width:24px;height:24px;border-radius:9999px;background-color:rgba(16,185,129,0.4);"></div>
              <div style="width:14px;height:14px;border-radius:9999px;background-color:#10B981;border:2.5px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>
            </div>
            <div style="margin-top:-2px;background:#10B981;color:#FFFFFF;font-size:10px;font-weight:800;padding:2px 8px;border-radius:9999px;box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap;">
              Pickup
            </div>
          </div>
        `,
      },
      {
        id: 'dropoff-marker',
        position: dropPoint,
        popup: `🏁 Dropoff: ${destination}`,
        iconHtml: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -50%);">
            <div style="width:14px;height:14px;border-radius:9999px;background-color:#EF4444;border:2.5px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>
            <div style="margin-top:2px;background:#EF4444;color:#FFFFFF;font-size:10px;font-weight:800;padding:2px 8px;border-radius:9999px;box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap;">
              Dropoff
            </div>
          </div>
        `,
      },
    ];
  }, [pickupPoint, dropPoint, origin, destination]);

  // Route Polyline
  const mapRoute = useMemo(() => {
    const steps = 14;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = pickupPoint.lat + (dropPoint.lat - pickupPoint.lat) * t;
      const lng = pickupPoint.lng + (dropPoint.lng - dropPoint.lng) * t;
      const curve = Math.sin(t * Math.PI) * 0.035;
      pts.push({ lat: lat + curve, lng: lng - curve * 0.4 });
    }
    return pts;
  }, [pickupPoint, dropPoint]);

  // Detect GPS
  const detectLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showToast('Geolocation is not supported', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const road = data.address?.road || data.address?.suburb || '';
          const city = data.address?.city || data.address?.town || data.address?.state || '';
          const addr = [road, city].filter(Boolean).join(', ') || `Current Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
          setOrigin(addr);
          showToast('Pickup location detected', 'success');
        } catch {
          setOrigin(`Current Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        showToast('Unable to detect location. Please type manually.', 'error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [showToast]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleExecuteSearch = () => {
    if (!origin.trim() || !destination.trim()) {
      showToast('Please specify pickup and destination locations', 'error');
      return;
    }
    const originShort = origin.split(',')[0].trim();
    const destShort = destination.split(',')[0].trim();
    const newFilters = {
      origin: originShort,
      destination: destShort,
      ...(date ? { date } : {}),
      ...(passengerCount > 1 ? { seats: passengerCount } : {}),
    };
    setFilters(newFilters);
    searchTrips(newFilters);
    setViewMode('rides');
  };

  const selectedTrip = useMemo(() => {
    if (selectedTripId) {
      return allTrips.find((t) => t.id === selectedTripId);
    }
    return filteredTrips[0] || null;
  }, [selectedTripId, allTrips, filteredTrips]);

  const selectedFare = Number(
    selectedTrip?.pricePerSeat || selectedTrip?.price || selectedTrip?.basePrice || 399
  );

  const handleConfirmBooking = () => {
    if (!user) {
      const returnUrl = `/dashboard/trips/search?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}${date ? `&date=${encodeURIComponent(date)}` : ''}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (selectedTrip?.id) {
      router.push(`/dashboard/trips/${selectedTrip.id}`);
    } else {
      showToast('No ride available for this route yet. Please choose another route.', 'info');
    }
  };

  return (
    <div className="w-full bg-[#F8F9FE] min-h-[calc(100dvh-66px)] select-none pb-6 relative overflow-x-hidden">
      {viewMode === 'edit' ? (
        /* ════════════════════════════════════════════════════════════════════
           SCREEN 1: Native Mobile Search Form
           ════════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col w-full animate-fadeIn px-4 pt-3 max-w-md mx-auto space-y-3.5 relative z-10">
          {/* Top Header */}
          <header className="flex items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setViewMode('rides')}
                className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-800 active:scale-90 transition-transform shrink-0 cursor-pointer"
                aria-label="Back to rides"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-[#4F46E5] text-white shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0">
                <BusFront className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                    Kokan Tour
                  </h1>
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-[#4F46E5] font-extrabold text-[9px] uppercase tracking-wider">
                    Travel
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold tracking-wide mt-1 truncate">
                  Find Available Intercity Rides
                </p>
              </div>
            </div>

            {user ? (
              <Link
                href="/dashboard/profile"
                className="w-9 h-9 rounded-full bg-white text-[#4F46E5] border border-indigo-100 font-bold text-xs shadow-xs flex items-center justify-center active:scale-95 transition-transform shrink-0"
              >
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'KT'}
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4F46E5] text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all shrink-0"
              >
                <User className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Sign In</span>
              </Link>
            )}
          </header>

          {/* Search Card */}
          <div className="bg-white rounded-[26px] p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3.5">
            <div className="space-y-2 relative">
              {/* Pickup Input */}
              <div className="relative">
                <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-indigo-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mr-3 ring-2 ring-emerald-100" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Pickup location or ST stand"
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                  />
                  {origin && (
                    <button
                      type="button"
                      onClick={() => setOrigin('')}
                      className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="p-1 text-slate-400 hover:text-[#4F46E5]"
                    title="Current location"
                  >
                    <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-[#4F46E5]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Swap Button */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-[#4F46E5] active:scale-90 transition-all"
                  title="Swap locations"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
              </div>

              {/* Destination Input */}
              <div className="relative">
                <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 transition-all focus-within:bg-white focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-indigo-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mr-3 ring-2 ring-rose-100" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Where to? (e.g. Dadar, Pune, Thane)"
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                  />
                  {destination && (
                    <button
                      type="button"
                      onClick={() => setDestination('')}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Date & Passenger row */}
            <div className="pt-1">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-2">
                Travel Date
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1">
                {dateOptions.map((opt) => {
                  const isSelected = date === opt.iso;
                  return (
                    <button
                      key={opt.iso}
                      type="button"
                      onClick={() => setDate(opt.iso)}
                      className={cn(
                        'flex flex-col items-center justify-center min-w-[58px] py-2 px-1.5 rounded-2xl transition-all border shrink-0',
                        isSelected
                          ? 'bg-[#4F46E5] border-[#4F46E5] text-white shadow-md shadow-indigo-500/25 ring-2 ring-[#4F46E5]/20'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 shadow-2xs'
                      )}
                    >
                      <span className={cn('text-[10px] font-bold leading-none', isSelected ? 'text-indigo-100' : 'text-slate-500')}>
                        {opt.dayName}
                      </span>
                      <span className={cn('text-sm font-black mt-1 leading-none', isSelected ? 'text-white' : 'text-slate-900')}>
                        {opt.dayNum}
                      </span>
                      <span className={cn('text-[9px] font-semibold mt-0.5 leading-none', isSelected ? 'text-white/80' : 'text-slate-400')}>
                        {opt.monthName}
                      </span>
                    </button>
                  );
                })}

                <div className="shrink-0">
                  <DatePicker
                    value={parseLocalDate(date)}
                    onChange={(d) => setDate(formatLocalDate(d))}
                    onClear={() => setDate('')}
                    placeholder="Custom"
                    minDate={new Date()}
                    title="Select Travel Date"
                    subtitle="Intercity rides across Maharashtra"
                    triggerClassName="w-[58px] h-[64px] rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 shadow-2xs text-slate-700 text-[10px] font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Passenger Count */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">Passengers</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPassengerCount((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <span className="text-xs font-black text-slate-900 w-5 text-center">
                  {passengerCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPassengerCount((p) => Math.min(6, p + 1))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleExecuteSearch}
              disabled={isSearching}
              className="w-full h-[52px] rounded-[20px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Searching Fleet Departures...</span>
                </>
              ) : (
                <>
                  <Search className="w-4.5 h-4.5 stroke-[2.4]" />
                  <span>Search Available Rides</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════
           SCREEN 2: Available Rides & Interactive Route Bottom Sheet (Image 2 Match)
           ════════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col w-full animate-fadeIn min-h-[calc(100dvh-66px)]">
          {/* Map Header */}
          <div className="w-full h-[240px] sm:h-[260px] shrink-0 relative overflow-hidden bg-slate-100 rounded-b-[28px] shadow-sm">
            <MapView
              center={mapCenter}
              markers={mapMarkers}
              route={mapRoute}
              zoom={10}
              height="100%"
              className="w-full h-full"
            />

            {/* Back Button (Clean round card matching mockup) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/dashboard/passenger');
                }
              }}
              className="absolute top-3.5 left-3.5 z-[1001] w-11 h-11 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-90 transition-all cursor-pointer pointer-events-auto"
              aria-label="Back"
              title="Back"
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
              className="absolute bottom-4 right-3.5 z-20 w-11 h-11 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"
              title="Locate my position"
            >
              <Crosshair
                className={`w-5 h-5 text-slate-800 stroke-[2] ${
                  isLocating ? 'animate-spin text-[#4F46E5]' : ''
                }`}
              />
            </button>
          </div>

          {/* Native Bottom Sheet Drawer */}
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
                      ? `${filteredTrips.length} available trip${
                          filteredTrips.length > 1 ? 's' : ''
                        }`
                      : 'No direct trips on this route'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-indigo-100 text-[12px] font-bold text-[#4F46E5] transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 border border-indigo-200/60 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Category Filter Pills */}
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

              {/* Rides List or Empty State */}
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
                      onClick={() => setViewMode('edit')}
                      className="mt-3.5 px-6 py-2.5 rounded-full bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] text-[#4F46E5] text-xs font-bold shadow-2xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Change Route</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTrips.map((trip) => {
                      const isSelected = (selectedTripId || filteredTrips[0]?.id) === trip.id;
                      const tripImg = getTripVehicleImage(trip.vehicle || trip.vehicleType);
                      const priceVal = Number(trip.pricePerSeat || trip.price || trip.basePrice || 399);
                      const vName = formatVehicleName(
                        trip.vehicle ? `${trip.vehicle.brand} ${trip.vehicle.model}` : trip.vehicleName || 'Toyota Innova'
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
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                isSelected ? 'border-[#4F46E5] bg-white' : 'border-slate-300 bg-white'
                              )}
                            >
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />}
                            </div>

                            <img src={tripImg} alt={vName} className="w-14 h-10 object-contain shrink-0 drop-shadow-xs" />

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-slate-900 truncate">{vName}</h4>
                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                {trip.departureTime
                                  ? new Date(trip.departureTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Flexible Departure'}
                                {' • '}
                                <span className="text-emerald-600 font-bold">
                                  {trip.availableSeats || 4} seats left
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-[#4F46E5]">
                              ₹ {priceVal > 0 ? priceVal : 399}
                            </span>
                            <span className="text-[9px] text-slate-400 block leading-tight">per seat</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payment Row & Action Button */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-2xs">
                    <CreditCard className="w-4 h-4 text-emerald-600 stroke-[2] shrink-0" />
                    <span>Pay on Board / Cash</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none mb-1">
                      Total Fare
                    </span>
                    <span className="font-black text-[#4F46E5] text-xl sm:text-2xl leading-none whitespace-nowrap tracking-tight">
                      ₹ {selectedFare > 0 ? selectedFare : 399}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="w-full h-[54px] rounded-[20px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Car className="w-5 h-5 text-white stroke-[2.2] shrink-0" />
                  <span>
                    {user
                      ? `Confirm Booking • ₹${selectedFare > 0 ? selectedFare : 399}`
                      : `Sign In to Book a Ride ₹${selectedFare > 0 ? selectedFare : 399}`}
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
