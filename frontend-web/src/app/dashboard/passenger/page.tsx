'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAppStore } from '@/store';
import { useBookingStore } from '@/store/slices/bookingSlice';
import { useTripStore } from '@/store/slices/tripSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { usePassengerStore } from '@/store/slices/passengerStore';
import { formatCurrency, cn } from '@/lib/utils';
import MapView, { MapMarker } from '@/components/maps/MapView';
import SearchInput from '@/components/maps/SearchInput';
import Avatar from '@/components/ui/Avatar';
import PassengerDashboardMobile from '@/components/passenger/PassengerDashboardMobile';
import {
  MapPin,
  Bell,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  X,
  Plus,
  Home as HomeIcon,
  Briefcase,
  Plane,
  ChevronRight,
  ChevronDown,
  Clock,
  Car,
  Search,
  Check,
  CreditCard,
  Banknote,
  Crosshair,
  Navigation,
  Users,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';

// Distance calculation using Haversine formula (with ~1.3x road curvature factor)
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

// Clean short address formatter for mobile header
function formatShortAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return address;
  return parts[0];
}

// Format duration cleanly like Ola/Uber (e.g., "2h 45m" or "35 min")
function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs} hrs`;
}

// Helper to choose car image based on vehicle model/type
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

export default function PassengerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();
  const { bookings, getMyBookings } = useBookingStore();
  const {
    popularRoutes,
    getPopularRoutes,
    exactMatches,
    trips,
    searchTrips,
    isLoading: isSearching,
  } = useTripStore();
  const { unreadCount, getUnreadCount } = useNotificationStore();
  const { favoriteRoutes } = usePassengerStore();

  // ─── Booking State ────────────────────────────────────────────────────────
  const [origin, setOrigin] = useState('');
  const [originLat, setOriginLat] = useState<number | undefined>();
  const [originLng, setOriginLng] = useState<number | undefined>();

  const [destination, setDestination] = useState('');
  const [destLat, setDestLat] = useState<number | undefined>();
  const [destLng, setDestLng] = useState<number | undefined>();

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Wallet'>('Cash');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletCurrency, setWalletCurrency] = useState('INR');

  // Screen View Mode: 'home' (Search & Overview) vs 'available-rides' (Rides & Route Confirmation)
  const [viewMode, setViewMode] = useState<'home' | 'available-rides'>('home');

  // ─── User Coordinates ─────────────────────────────────────────────────────
  // Defaults to Maharashtra route center (matches real backend data)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.114,
    lng: 73.1592,
  });
  const [mapZoom, setMapZoom] = useState(11);
  const [isLocating, setIsLocating] = useState(false);

  // ─── Detect Current Location (GPS + Reverse Geocode) ──────────────────────
  const detectLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setOriginLat(coords.lat);
        setOriginLng(coords.lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          let addr = '';
          if (data.address) {
            const road =
              data.address.road ||
              data.address.suburb ||
              data.address.neighbourhood ||
              data.address.quarter;
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county;
            const state = data.address.state;
            const parts = [road, city, state].filter(Boolean);
            addr = parts.length > 0 ? parts.join(', ') : '';
          }
          if (!addr && data.display_name) {
            addr = data.display_name.split(',').slice(0, 3).join(', ');
          }

          const detectedAddress = addr || `Current Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
          setOrigin(detectedAddress);
          showToast('Current location detected successfully', 'success');

          // If destination is already set, update trip search
          if (destination) {
            searchTrips({
              origin: detectedAddress,
              originLat: coords.lat,
              originLng: coords.lng,
              destination,
              destLat: destLat || coords.lat + 0.94,
              destLng: destLng || coords.lng - 0.29,
            });
          }
        } catch {
          const fallback = `Current Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
          setOrigin(fallback);
          showToast('Location coordinates detected', 'info');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Failed to detect location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable. Please type your pickup address manually.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location detection timed out. Please try again or type your address manually.';
            break;
        }
        showToast(errorMsg, 'error');
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  }, [destination, destLat, destLng, searchTrips, showToast]);

  // ─── Handle Pickup Place Select ──────────────────────────────────────────
  const handlePickupSelect = (address: string, lat: number, lng: number) => {
    setOrigin(address);
    setOriginLat(lat);
    setOriginLng(lng);
    setUserCoords({ lat, lng });

    if (destination.trim()) {
      searchTrips({
        origin: address,
        originLat: lat,
        originLng: lng,
        destination,
        destLat: destLat || lat + 0.94,
        destLng: destLng || lng - 0.29,
      });
      setViewMode('available-rides');
    }
  };

  const loadWallet = useCallback(async () => {
    try {
      const walletRes = await apiClient.getWallet();
      setWalletBalance(walletRes.data.balance);
      setWalletCurrency(walletRes.data.currency || 'INR');
    } catch {
      setWalletBalance(null);
      setWalletCurrency('INR');
    }
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    if (isAuthenticated) {
      getMyBookings({ limit: 5 });
      getUnreadCount();
      loadWallet();
    }
    getPopularRoutes();
    // Load available trips without pre-filling origin or destination inputs
    searchTrips({});
  }, [isAuthenticated, getMyBookings, getPopularRoutes, getUnreadCount, loadWallet, searchTrips]);

  // ─── Real Available Trips from Backend ────────────────────────────────────
  const availableRealTrips = useMemo(() => {
    const combined = [...(exactMatches || []), ...(trips || [])];
    const unique = Array.from(new Map(combined.map((t) => [t.id, t])).values());
    return unique;
  }, [exactMatches, trips]);

  const primaryTrip = availableRealTrips[0] || null;

  // ─── Distance & ETA Calculation ───────────────────────────────────────────
  const pickupPoint = useMemo(() => {
    if (originLat && originLng) return { lat: originLat, lng: originLng };
    return userCoords;
  }, [originLat, originLng, userCoords]);

  const dropPoint = useMemo(() => {
    if (destLat && destLng) return { lat: destLat, lng: destLng };
    if (destination) {
      return { lat: pickupPoint.lat + 0.94, lng: pickupPoint.lng - 0.29 };
    }
    return null;
  }, [destLat, destLng, destination, pickupPoint]);

  const distanceKm = useMemo(() => {
    if (dropPoint) {
      return calculateDistanceKm(pickupPoint.lat, pickupPoint.lng, dropPoint.lat, dropPoint.lng);
    }
    return 145; // Real distance approx between Mhasla & Mumbai
  }, [pickupPoint, dropPoint]);

  const estimatedMins = useMemo(() => {
    return Math.max(10, Math.round((distanceKm / 48) * 60));
  }, [distanceKm]);

  // ─── Swap Locations ───────────────────────────────────────────────────────
  const handleSwap = () => {
    const tempO = origin;
    const tempLat = originLat;
    const tempLng = originLng;

    setOrigin(destination);
    setOriginLat(destLat);
    setOriginLng(destLng);

    setDestination(tempO);
    setDestLat(tempLat);
    setDestLng(tempLng);

    if (destination) {
      searchTrips({
        origin: destination,
        originLat: destLat,
        originLng: destLng,
        destination: tempO,
        destLat: tempLat,
        destLng: tempLng,
      });
    }
  };

  // ─── Place Select (Pickup / Destination) ──────────────────────────────────
  const handleDestinationSelect = (address: string, lat: number, lng: number) => {
    setDestination(address);
    setDestLat(lat);
    setDestLng(lng);
    if (origin.trim()) {
      searchTrips({
        origin,
        originLat: pickupPoint.lat,
        originLng: pickupPoint.lng,
        destination: address,
        destLat: lat,
        destLng: lng,
      });
      setViewMode('available-rides');
    }
  };

  const handleSelectRecentPlace = (src: string, dst: string, sLat?: number, sLng?: number, dLat?: number, dLng?: number) => {
    setOrigin(src);
    setDestination(dst);
    if (sLat && sLng) {
      setOriginLat(sLat);
      setOriginLng(sLng);
    }
    if (dLat && dLng) {
      setDestLat(dLat);
      setDestLng(dLng);
    }
    searchTrips({
      origin: src,
      originLat: sLat || pickupPoint.lat,
      originLng: sLng || pickupPoint.lng,
      destination: dst,
      destLat: dLat || (pickupPoint.lat + 0.94),
      destLng: dLng || (pickupPoint.lng - 0.29),
    });
    setViewMode('available-rides');
  };

  // ─── Search Button Click ──────────────────────────────────────────────────
  const handleSearchAvailableRides = () => {
    if (!origin.trim() || !destination.trim()) {
      showToast('Please select both pickup and destination locations', 'info');
      return;
    }
    searchTrips({
      origin,
      originLat: pickupPoint.lat,
      originLng: pickupPoint.lng,
      destination,
      destLat: destLat || pickupPoint.lat + 0.94,
      destLng: destLng || pickupPoint.lng - 0.29,
    });
    setViewMode('available-rides');
  };

  // ─── Fare Calculations based on Real API Prices ───────────────────────────
  const baseCurrencySymbol = walletCurrency === 'QAR' ? 'QAR' : '₹';

  // Current Selected Real Trip from API
  const selectedTrip = useMemo(() => {
    if (selectedTripId) {
      return availableRealTrips.find((t) => t.id === selectedTripId) || availableRealTrips[0] || null;
    }
    return availableRealTrips[0] || null;
  }, [selectedTripId, availableRealTrips]);

  const selectedFare = useMemo(() => {
    if (!selectedTrip) return 0;
    return Number(selectedTrip.pricePerSeat || selectedTrip.price || selectedTrip.basePrice || 0);
  }, [selectedTrip]);

  // ─── Confirm Booking Action ───────────────────────────────────────────────
  const handleConfirmBooking = () => {
    const targetTrip = selectedTrip || availableRealTrips[0];
    if (targetTrip) {
      router.push(`/dashboard/trips/${targetTrip.id}`);
    } else {
      showToast('No ride available for this route yet. Please choose another route.', 'info');
    }
  };

  // ─── Map Center and Markers ───────────────────────────────────────────────
  const mapCenter = useMemo(() => {
    if (viewMode === 'available-rides' && dropPoint) {
      return {
        lat: (pickupPoint.lat + dropPoint.lat) / 2,
        lng: (pickupPoint.lng + dropPoint.lng) / 2,
      };
    }
    return pickupPoint;
  }, [viewMode, pickupPoint, dropPoint]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];

    // Current location blue dot with translucent radar halo and text underneath (exact mockup match)
    list.push({
      id: 'current-user-pos',
      position: pickupPoint,
      popup: `📍 Pickup: ${origin || 'Current Location'}`,
      iconHtml: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -50%);">
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
            <div style="position:absolute;width:44px;height:44px;border-radius:9999px;background-color:#93c5fd;opacity:0.45;"></div>
            <div style="position:absolute;width:14px;height:14px;border-radius:9999px;background-color:#2563eb;border:2.5px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>
          </div>
          <span style="font-size:11px;font-weight:700;color:#1e293b;text-shadow:0 1px 3px rgba(255,255,255,0.95);white-space:nowrap;margin-top:-2px;">
            ${formatShortAddress(origin) || 'Mhasla Taluka'}
          </span>
        </div>
      `,
      iconSize: [80, 56],
      iconAnchor: [40, 22],
    });

    if (viewMode === 'available-rides' && dropPoint) {
      // Screen 2: Green Pickup pin
      list.push({
        id: 'pickup-pin',
        position: pickupPoint,
        popup: `🟢 Pickup: ${origin}`,
        iconHtml: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background-color:#16a34a;color:white;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:bold;margin-bottom:2px;box-shadow:0 2px 4px rgba(0,0,0,0.25);white-space:nowrap;">
              Pickup
            </div>
            <div style="width:14px;height:14px;border-radius:9999px;background-color:#16a34a;border:2.5px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [44, 38],
        iconAnchor: [22, 38],
      });

      // Screen 2: Red Destination pin
      list.push({
        id: 'dest-pin',
        position: dropPoint,
        popup: `🔴 Dropoff: ${destination}`,
        iconHtml: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background-color:#dc2626;color:white;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:bold;margin-bottom:2px;box-shadow:0 2px 4px rgba(0,0,0,0.25);white-space:nowrap;">
              Dropoff
            </div>
            <div style="width:14px;height:14px;border-radius:9999px;background-color:#dc2626;border:2.5px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [48, 38],
        iconAnchor: [24, 38],
      });
    }

    return list;
  }, [viewMode, pickupPoint, dropPoint, origin, destination]);

  const mapRoute = useMemo(() => {
    if (viewMode === 'available-rides' && dropPoint) {
      const midLat = (pickupPoint.lat + dropPoint.lat) / 2 + 0.05;
      const midLng = (pickupPoint.lng + dropPoint.lng) / 2 - 0.05;
      return [pickupPoint, { lat: midLat, lng: midLng }, dropPoint];
    }
    return [];
  }, [viewMode, pickupPoint, dropPoint]);

  return (
    <>
      {/* ── Dedicated Mobile App Screen (Visible only on mobile screens < lg) ── */}
      <div className="block lg:hidden w-full min-w-0">
        <PassengerDashboardMobile
          user={user}
          origin={origin}
          destination={destination}
          setOrigin={setOrigin}
          setDestination={setDestination}
          setOriginLat={setOriginLat}
          setOriginLng={setOriginLng}
          setDestLat={setDestLat}
          setDestLng={setDestLng}
          userCoords={userCoords}
          pickupPoint={pickupPoint}
          dropPoint={dropPoint}
          distanceKm={distanceKm}
          estimatedMins={estimatedMins}
          isLocating={isLocating}
          isSearching={isSearching}
          viewMode={viewMode}
          availableRealTrips={availableRealTrips}
          selectedTripId={selectedTripId}
          selectedTrip={selectedTrip}
          selectedFare={selectedFare}
          paymentMethod={paymentMethod}
          walletBalance={walletBalance}
          walletCurrency={walletCurrency}
          baseCurrencySymbol={baseCurrencySymbol}
          popularRoutes={popularRoutes}
          mapCenter={mapCenter}
          mapMarkers={mapMarkers}
          mapRoute={mapRoute}
          mapZoom={mapZoom}
          setMapZoom={setMapZoom}
          setViewMode={setViewMode}
          setSelectedTripId={setSelectedTripId}
          setPaymentMethod={setPaymentMethod}
          detectLocation={detectLocation}
          handlePickupSelect={handlePickupSelect}
          handleDestinationSelect={handleDestinationSelect}
          handleSwap={handleSwap}
          handleSelectRecentPlace={handleSelectRecentPlace}
          handleSearchAvailableRides={handleSearchAvailableRides}
          handleConfirmBooking={handleConfirmBooking}
          formatShortAddress={formatShortAddress}
          formatDuration={formatDuration}
          getTripVehicleImage={getTripVehicleImage}
        />
      </div>

      {/* ── Desktop Dashboard Experience (Visible only on desktop screens >= lg) ── */}
      <div className="hidden lg:flex flex-col justify-start relative bg-slate-50 overflow-x-hidden min-h-[calc(100vh-8.5rem)]">
      {/* ── Screen 2: Top Floating Route Status Bar (Back Arrow, Route Addresses) ── */}
      {viewMode === 'available-rides' && (
        <header className="bg-white/95 backdrop-blur-md px-3.5 sm:px-5 py-2.5 border-b border-gray-150 flex items-center justify-between gap-2.5 z-30 sticky top-0 shadow-xs animate-fadeIn">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setViewMode('home')}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 active:scale-90 transition-all flex items-center justify-center shrink-0 shadow-2xs"
            aria-label="Back to search"
          >
            <ArrowLeft className="w-4 h-4 text-gray-800" />
          </button>

          {/* Route Summary */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-100" />
              <span className="truncate max-w-[110px] sm:max-w-[160px]" title={origin}>
                {formatShortAddress(origin) || 'Pickup'}
              </span>
              <ArrowRight className="w-3 h-3 text-gray-400 shrink-0 mx-0.5" />
              <span className="w-2 h-2 rounded-sm bg-rose-500 shrink-0 ring-2 ring-rose-100" />
              <span className="truncate max-w-[110px] sm:max-w-[160px]" title={destination}>
                {formatShortAddress(destination) || 'Dropoff'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              {formatDuration(estimatedMins)} • {Math.round(distanceKm)} km trip
            </p>
          </div>

          {/* Swap Locations Button with clean ArrowUpDown icon */}
          <button
            type="button"
            onClick={handleSwap}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 active:scale-90 transition-all flex items-center justify-center shrink-0 shadow-2xs"
            title="Swap locations"
            aria-label="Swap locations"
          >
            <ArrowUpDown className="w-4 h-4 text-gray-700" />
          </button>
        </header>
      )}

      {/* ── Main Responsive Grid (Desktop Split / Mobile Stacked) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 relative min-h-0">
        {/* ── Interactive Map Section ── */}
        <div className="order-1 lg:order-2 lg:col-span-7 h-[30vh] sm:h-[36vh] lg:h-[calc(100vh-8.5rem)] relative overflow-hidden bg-slate-200 shrink-0">
          <MapView
            center={mapCenter}
            markers={mapMarkers}
            route={mapRoute}
            zoom={mapZoom}
            height="100%"
          />

          {/* Zoom controls on left */}
          <div className="absolute top-3 left-3 z-20 flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setMapZoom((z) => Math.min(18, z + 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-gray-50 text-gray-700 font-bold border-b border-gray-100 active:bg-gray-100 text-xs sm:text-sm"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setMapZoom((z) => Math.max(4, z - 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-gray-50 text-gray-700 font-bold active:bg-gray-100 text-xs sm:text-sm"
              aria-label="Zoom out"
            >
              −
            </button>
          </div>

          {/* Floating locate me crosshair button on bottom-right */}
          <button
            type="button"
            onClick={detectLocation}
            className="absolute bottom-4 right-3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-90 transition-all"
            title="Locate my position"
          >
            <Crosshair className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-800 ${isLocating ? 'animate-spin' : ''}`} />
          </button>

          {/* Screen 2: Floating Route ETA Bubble over the route */}
          {viewMode === 'available-rides' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-2.5 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xl flex items-center gap-1.5 animate-fadeIn pointer-events-none">
              <span>{formatDuration(estimatedMins)}</span>
              <span className="opacity-70">•</span>
              <span>{Math.round(distanceKm)} km</span>
            </div>
          )}
        </div>

        {/* ── Bottom Sheet / Left Booking Controller Panel (5 Cols on Desktop) ── */}
        <div className="order-2 lg:order-1 lg:col-span-5 relative z-20 -mt-3 lg:mt-0 bg-white rounded-t-3xl lg:rounded-none shadow-xl lg:shadow-none border-t lg:border-t-0 lg:border-r border-gray-150 flex flex-col min-h-0 flex-1">
          {viewMode === 'home' ? (
            /* ════════════════════════════════════════════════════════════════
               SCREEN 1: "Where to, {firstName}? 👋" Home Booking Screen
               ════════════════════════════════════════════════════════════════ */
            <div className="p-3.5 sm:p-5 space-y-3.5 animate-fadeIn pb-6 sm:pb-8">
              {/* Top Sheet Handle (Mobile pill) */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-1 lg:hidden" />

              {/* Greeting */}
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {isAuthenticated && user?.firstName
                    ? `Where to, ${user.firstName}? 👋`
                    : 'Where to? 👋'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {isAuthenticated
                    ? 'Book a ride to your destination'
                    : 'Search and compare intercity rides across Maharashtra'}
                </p>
              </div>

              {/* Guest Browsing Callout on Desktop */}
              {!isAuthenticated && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">Browsing as Guest</p>
                      <p className="text-[11px] text-gray-600 truncate">Sign in to book seats, view tickets & track rides live</p>
                    </div>
                  </div>
                  <Link
                    href={`/login?returnUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/dashboard/passenger')}`}
                  >
                    <button className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shrink-0 transition-colors">
                      Sign In
                    </button>
                  </Link>
                </div>
              )}

              {/* Pickup & Destination Box */}
              <div className="bg-slate-50/70 rounded-2xl border border-gray-200/80 p-3 sm:p-4 space-y-2.5 relative">
                {/* Pickup Row with Dedicated "Use Current Location" (GPS) Button */}
                <div>
                  <SearchInput
                    label="Pickup Location"
                    isSource={true}
                    value={origin}
                    placeholder="Enter pickup city or address"
                    onChange={(v) => {
                      setOrigin(v);
                      setOriginLat(undefined);
                      setOriginLng(undefined);
                    }}
                    onPlaceSelect={handlePickupSelect}
                    onUseCurrentLocation={detectLocation}
                    isLocating={isLocating}
                    onClear={() => {
                      setOrigin('');
                      setOriginLat(undefined);
                      setOriginLng(undefined);
                    }}
                  />
                </div>

                {/* Connector line with Swap Button */}
                <div className="flex justify-center -my-1 relative z-10">
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-blue-600 hover:bg-blue-50 active:scale-90 transition-transform"
                    title="Swap locations"
                    aria-label="Swap locations"
                  >
                    <Plus className="w-3.5 h-3.5 rotate-45" />
                  </button>
                </div>

                {/* Destination Row with Live Autocomplete */}
                <div>
                  <SearchInput
                    label="Where to? (Destination)"
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

              {/* Recent Places (Loaded from Real Popular Routes API) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Popular Routes</span>
                  </h3>
                  <Link
                    href="/dashboard/passenger/popular-routes"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    <span>See all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {/* Route 1: Mumbai */}
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
                    className="p-2 sm:p-2.5 rounded-2xl bg-white border border-gray-200 hover:border-primary-400 hover:shadow-xs text-left transition-all active:scale-95 group"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center mb-1 transition-colors">
                      <Briefcase className="w-3.5 h-3.5 text-gray-700 group-hover:text-primary-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {popularRoutes[0]?.destination?.split(',')[0] || 'Mumbai'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
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
                    className="p-2 sm:p-2.5 rounded-2xl bg-white border border-gray-200 hover:border-primary-400 hover:shadow-xs text-left transition-all active:scale-95 group"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center mb-1 transition-colors">
                      <HomeIcon className="w-3.5 h-3.5 text-gray-700 group-hover:text-primary-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {popularRoutes[1]?.destination?.split(',')[0] || 'Pune'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      {baseCurrencySymbol} {popularRoutes[1]?.avgPrice || 300} avg
                    </p>
                  </button>

                  {/* Route 3: Mhasla Origin */}
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectRecentPlace(
                        popularRoutes[0]?.destination || 'Mumbai, Maharashtra',
                        popularRoutes[0]?.source || 'Mhasla, Maharashtra'
                      )
                    }
                    className="p-2 sm:p-2.5 rounded-2xl bg-white border border-gray-200 hover:border-primary-400 hover:shadow-xs text-left transition-all active:scale-95 group"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center mb-1 transition-colors">
                      <Plane className="w-3.5 h-3.5 text-gray-700 group-hover:text-primary-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {popularRoutes[0]?.source?.split(',')[0] || 'Mhasla'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">Return Trip</p>
                  </button>
                </div>
              </div>

              {/* Search Available Rides Action Button */}
              <button
                type="button"
                onClick={handleSearchAvailableRides}
                disabled={isSearching}
                className="w-full h-11 sm:h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching Available Rides...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Available Rides</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════
               SCREEN 2: Available Rides & Confirm Booking Screen
               ════════════════════════════════════════════════════════════════ */
            <div className="flex flex-col flex-1 min-h-0 animate-fadeIn">
              {/* Sheet Header (Fixed at top of sheet) */}
              <div className="px-3.5 sm:px-5 pt-3 pb-2 shrink-0 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2 lg:hidden" />
                <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
                  Available Rides
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                  {isSearching
                    ? 'Searching available fleet rides...'
                    : availableRealTrips.length > 0
                    ? `${availableRealTrips.length} verified trip${availableRealTrips.length > 1 ? 's' : ''} available`
                    : 'Choose your preferred journey'}
                </p>
              </div>

              {/* Scrollable Rides List Area (Only Real Backend Trips) */}
              <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-2.5 space-y-2">
                {isSearching ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <p className="text-xs font-semibold text-gray-600">Searching active scheduled rides...</p>
                  </div>
                ) : availableRealTrips.length === 0 ? (
                  <div className="py-8 px-4 text-center space-y-3 bg-slate-50/80 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">No Direct Rides Found</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                        No fleet trips found for this route right now. Try picking a route from Popular Routes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('home')}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-blue-600 shadow-2xs active:scale-95 transition-all"
                    >
                      Change Locations
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableRealTrips.map((trip) => {
                      const isSelected = (selectedTripId || availableRealTrips[0]?.id) === trip.id;
                      const tripImg = getTripVehicleImage(trip.vehicle || trip.vehicleType);
                      const priceVal = Number(trip.pricePerSeat || trip.price || trip.basePrice || 0);

                      return (
                        <div
                          key={trip.id}
                          onClick={() => setSelectedTripId(trip.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.99] ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500/30 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Left: Radio + Real Vehicle Image + Details */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>

                            <img
                              src={tripImg}
                              alt={trip.vehicleName || 'Vehicle'}
                              className="w-14 h-9 sm:w-16 sm:h-10 object-contain drop-shadow-sm shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate capitalize leading-tight">
                                {trip.vehicle
                                  ? `${trip.vehicle.brand} ${trip.vehicle.model}`
                                  : trip.vehicleName || 'Toyota Innova'}
                              </h4>
                              <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                                {trip.driver?.user?.firstName
                                  ? `Capt. ${trip.driver.user.firstName}`
                                  : trip.operatorName || 'Verified Fleet'}{' '}
                                • {trip.availableSeats || 1} seats open
                              </p>
                              {trip.departureTime && (
                                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                                  Departure: {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Real Fare & Duration */}
                          <div className="text-right shrink-0 min-w-[70px] sm:min-w-[85px] pl-1">
                            <p className="text-xs sm:text-sm font-black text-gray-900 whitespace-nowrap">
                              {baseCurrencySymbol} {priceVal > 0 ? priceVal : 399}
                            </p>
                            <span className="text-[10px] text-gray-400 block whitespace-nowrap">per seat</span>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 whitespace-nowrap">
                              {formatDuration(estimatedMins)} • {Math.round(distanceKm)} km
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Fixed/Sticky Bottom Action Bar (Payment, Fare & Confirm Button) ── */}
              <div className="shrink-0 p-3 sm:p-4 border-t border-gray-150 bg-white/95 backdrop-blur-md pb-3 sm:pb-4 space-y-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                {/* Compact Payment Row & Estimated Fare */}
                <div className="flex items-center justify-between gap-2">
                  {/* Payment Pill Button */}
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod((p) => (p === 'Cash' ? 'Wallet' : 'Cash'))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/90 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-gray-800 transition-all active:scale-95 shadow-2xs"
                    >
                      <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{paymentMethod === 'Cash' ? 'Cash' : `Wallet (${baseCurrencySymbol} ${walletBalance || 0})`}</span>
                      <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/90 bg-slate-50 text-xs font-semibold text-gray-800 shadow-2xs">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Pay on Board / Cash</span>
                    </div>
                  )}

                  {/* Estimated Fare Display */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block leading-none mb-1">
                      Estimated Fare
                    </span>
                    <span className="font-black text-blue-600 text-sm sm:text-base leading-none whitespace-nowrap">
                      {baseCurrencySymbol} {selectedFare > 0 ? selectedFare : (availableRealTrips[0]?.pricePerSeat || availableRealTrips[0]?.price || 399)}
                    </span>
                  </div>
                </div>

                {/* Confirm Booking CTA Button (Full Width, Always Visible) */}
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isSearching || availableRealTrips.length === 0}
                  className="w-full h-11 sm:h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Car className="w-4 h-4" />
                  <span>{isAuthenticated ? 'Confirm Ticket' : `Sign In to Book • ${baseCurrencySymbol} ${selectedFare > 0 ? selectedFare : 399}`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);
}
