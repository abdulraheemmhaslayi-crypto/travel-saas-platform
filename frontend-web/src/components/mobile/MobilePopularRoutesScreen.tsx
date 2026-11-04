'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { useAppStore } from '@/store';
import SearchInput from '@/components/maps/SearchInput';
import {
  MapPin,
  ArrowRight,
  Heart,
  Search,
  Sparkles,
  Clock,
  Car,
  ShieldCheck,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowLeft,
  SlidersHorizontal,
  Flame,
  ChevronDown,
  Check,
  BusFront,
  User,
  Bell,
  Crosshair,
  Info,
} from 'lucide-react';

export interface RouteDetails {
  id: string;
  origin: string;
  destination: string;
  avgPrice: number;
  distanceKm: number;
  duration: string;
  frequency: string;
  tag: string;
  tagColor: 'blue' | 'amber' | 'emerald' | 'purple';
  category: 'konkan' | 'mumbai' | 'pune';
  popularVehicles: string[];
  viaRoute: string;
  stops: { name: string; landmark: string; km: number }[];
  schedules: string[];
}

export interface MobilePopularRoutesScreenProps {
  allRoutes: RouteDetails[];
  filteredRoutes: RouteDetails[];
  selectedCategory: 'all' | 'konkan' | 'mumbai' | 'pune' | 'budget';
  setSelectedCategory: (cat: 'all' | 'konkan' | 'mumbai' | 'pune' | 'budget') => void;
  sortBy: 'popular' | 'price-asc' | 'distance-asc';
  setSortBy: (sort: 'popular' | 'price-asc' | 'distance-asc') => void;
  isFavoriteRoute: (origin: string, destination: string) => boolean;
  handleToggleFavorite: (e: React.MouseEvent, origin: string, destination: string) => void;
  handleSearchNavigation: (origin: string, destination: string) => void;
  setActiveModalRoute: (route: RouteDetails | null) => void;
}

export default function MobilePopularRoutesScreen({
  allRoutes,
  filteredRoutes,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  isFavoriteRoute,
  handleToggleFavorite,
  handleSearchNavigation,
  setActiveModalRoute,
}: MobilePopularRoutesScreenProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { showToast } = useAppStore();

  const [pickupLocation, setPickupLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // User initials for circular badge (e.g., 'AR' for Arman)
  const userInitials = useMemo(() => {
    if (!user) return 'AR';
    const first = user.firstName ? user.firstName[0].toUpperCase() : '';
    const last = user.lastName ? user.lastName[0].toUpperCase() : '';
    return first + last || first || 'AR';
  }, [user]);

  const loginUrl = `/login?returnUrl=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.pathname : '/dashboard/passenger/popular-routes'
  )}`;

  // Detect GPS location for mobile search
  const detectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
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
          const detected = addr || `Current Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
          setPickupLocation(detected);
          showToast('Current location detected successfully', 'success');
        } catch {
          setPickupLocation(`Current Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
          showToast('Location coordinates detected', 'info');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        showToast('Unable to detect location. Please type manually.', 'error');
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  const handleSwapSearch = () => {
    const temp = pickupLocation;
    setPickupLocation(destinationLocation);
    setDestinationLocation(temp);
  };

  const handleSearchAvailableRides = () => {
    if (!pickupLocation.trim() || !destinationLocation.trim()) {
      showToast('Please select both pickup and destination locations', 'info');
      return;
    }
    const originShort = pickupLocation.split(',')[0].trim();
    const destShort = destinationLocation.split(',')[0].trim();
    router.push(
      `/dashboard/trips/search?origin=${encodeURIComponent(originShort)}&destination=${encodeURIComponent(
        destShort
      )}`
    );
  };

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full select-none pb-20 bg-[#F0F5FA] min-h-[calc(100dvh-66px)] animate-fadeIn">
      {/* ── Top Scenic Header ─────────────────────────────────────────── */}
      <div className="relative w-full h-[220px] sm:h-[240px] shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/kokan-dashboard-bg.jpg')`,
            backgroundPosition: 'center 35%',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-900/40 to-black/60 pointer-events-none" />

        {/* Top Bar: Brand Badge & Notification + User Profile */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0">
              <BusFront className="w-5 h-5 text-[#1D68F2] stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-white tracking-tight leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Kokan Travel
              </h1>
              <p className="text-[11px] text-white/95 font-medium tracking-wide mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                Intercity Rides Across Maharashtra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <Link
              href="/dashboard/notifications"
              className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </Link>

            {/* User Avatar Circle or Sign In button */}
            {user ? (
              <Link
                href="/dashboard/profile"
                className="w-9 h-9 rounded-full bg-white text-[#1D68F2] font-bold text-xs shadow-md flex items-center justify-center active:scale-95 transition-transform"
              >
                {userInitials}
              </Link>
            ) : (
              <Link
                href={loginUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#1D68F2] font-semibold text-xs shadow-md active:scale-95 transition-transform shrink-0"
              >
                <User className="w-3.5 h-3.5 stroke-[2]" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="relative z-10 px-4 pt-4 pb-8">
          <h2 className="text-[24px] sm:text-[26px] font-extrabold text-white tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-tight">
            Popular Intercity Routes
          </h2>
          <p className="text-xs sm:text-[13px] text-white/95 font-medium mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] max-w-sm leading-snug">
            High-frequency verified passenger corridors connecting Mhasla, Raigad, Mumbai, and Pune.
          </p>
        </div>
      </div>

      {/* ── Feature Pills Strip Overlapping Scenery ───────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2.5 mx-3.5 -mt-5 relative z-30 grid grid-cols-4 gap-1 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="leading-tight">Verified Fleet & Permits</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-700">
          <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="leading-tight">100% AC MPVs & Vans</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="leading-tight">Fixed Timetable</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span className="leading-tight">Fares from ₹349 / seat</span>
        </div>
      </div>

      {/* ── Action Buttons Row ────────────────────────────────────────── */}
      <div className="px-3.5 mt-3 flex items-center gap-2">
        <Link
          href="/dashboard/passenger"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs active:scale-95 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Back to Ride Search</span>
        </Link>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-bold text-[#1D68F2] shadow-2xs active:scale-95 transition-all flex-1"
        >
          <Flame className="w-3.5 h-3.5 fill-[#1D68F2] text-[#1D68F2]" />
          <span>Most Traveled Corridors</span>
        </button>
      </div>

      {/* ── Search Card ───────────────────────────────────────────────── */}
      <div className="mx-3.5 mt-3 bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2.5">
        {/* Pickup Row */}
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
                value={pickupLocation}
                placeholder="Enter pickup city or address"
                showSearchIcon={true}
                onChange={(v) => setPickupLocation(v)}
                onPlaceSelect={(addr) => setPickupLocation(addr)}
                onClear={() => setPickupLocation('')}
              />
            </div>

            {/* GPS Button */}
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

        {/* Centered Swap Button */}
        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <button
            type="button"
            onClick={handleSwapSearch}
            className="w-8 h-8 rounded-full bg-white border border-blue-200 shadow-xs flex items-center justify-center text-[#1D68F2] hover:bg-blue-50 active:scale-90 transition-transform relative z-10"
            title="Swap locations"
            aria-label="Swap locations"
          >
            <ArrowUpDown className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>

        {/* Destination Row */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shrink-0" />
            <span className="text-xs font-bold text-slate-900">Where to? (Destination)</span>
          </div>
          <SearchInput
            isSource={false}
            value={destinationLocation}
            placeholder="Enter dropoff city or address"
            showSearchIcon={true}
            onChange={(v) => setDestinationLocation(v)}
            onPlaceSelect={(addr) => setDestinationLocation(addr)}
            onClear={() => setDestinationLocation('')}
          />
        </div>

        {/* Big CTA Button */}
        <button
          type="button"
          onClick={handleSearchAvailableRides}
          className="w-full h-12 rounded-xl bg-[#1D68F2] hover:bg-blue-700 text-white font-bold text-sm shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-3"
        >
          <Search className="w-4 h-4 stroke-[2.5]" />
          <span>Search Available Rides</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* ── Filter Pills & Sort Bar ───────────────────────────────────── */}
      <div className="px-3.5 mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {/* Sort Popover Button */}
        <div ref={sortRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {sortBy === 'popular' && 'Most Popular'}
              {sortBy === 'price-asc' && 'Price: Low'}
              {sortBy === 'distance-asc' && 'Shortest'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isSortOpen && (
            <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {[
                { id: 'popular' as const, label: 'Most Popular' },
                { id: 'price-asc' as const, label: 'Price: Low to High' },
                { id: 'distance-asc' as const, label: 'Distance: Shortest' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id);
                    setIsSortOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between ${
                    sortBy === opt.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        {[
          { id: 'all', label: 'All Corridors', count: allRoutes.length },
          { id: 'konkan', label: 'Konkan & Raigad', count: allRoutes.filter((r) => r.category === 'konkan').length },
          { id: 'mumbai', label: 'Mumbai Express', count: allRoutes.filter((r) => r.category === 'mumbai').length },
          { id: 'pune', label: 'Pune Express', count: allRoutes.filter((r) => r.category === 'pune').length },
          { id: 'budget', label: 'Budget (≤ ₹370)', count: allRoutes.filter((r) => r.avgPrice <= 370).length },
        ].map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-[#1D68F2] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Route Cards List ──────────────────────────────────────────── */}
      <div className="px-3.5 mt-3 space-y-3">
        {filteredRoutes.map((route) => {
          const isFav = isFavoriteRoute(route.origin, route.destination);
          return (
            <div
              key={route.id}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              {/* Top Row: Tag Badge + Departures + Favorite Heart */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      route.tagColor === 'blue'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : route.tagColor === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : route.tagColor === 'amber'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {route.tag}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {route.frequency}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveModalRoute(route)}
                    title="View stops & timetable"
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, route.origin, route.destination)}
                    title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-red-500 shrink-0"
                  >
                    <Heart
                      className={`w-4.5 h-4.5 transition-colors ${
                        isFav ? 'text-red-500 fill-red-500' : 'text-slate-300 stroke-[1.8]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Middle Row: Left Origin/Destination + Right Price/Button */}
              <div className="flex items-center justify-between gap-3">
                {/* Left: Origin & Destination */}
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Origin */}
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {route.origin}
                    </span>
                  </div>
                  {/* Destination */}
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {route.destination}
                    </span>
                  </div>
                  {/* Duration & Distance & Swap */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {route.duration}
                    </span>
                    <span>•</span>
                    <span>{route.distanceKm} km</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleSearchNavigation(route.destination, route.origin)}
                      className="text-[#1D68F2] hover:underline font-bold flex items-center gap-0.5"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Swap</span>
                    </button>
                  </div>
                </div>

                {/* Right: Fares from & Find Rides */}
                <div className="text-right shrink-0 flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">
                    Fares from
                  </span>
                  <span className="text-[15px] font-extrabold text-slate-900 leading-tight">
                    ₹{route.avgPrice}.00
                  </span>
                  <span className="text-[10px] text-slate-400 leading-none mb-1.5">
                    / seat
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSearchNavigation(route.origin, route.destination)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1D68F2] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                  >
                    <span>Find Rides</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
