'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/slices/tripSlice';
import { usePassengerStore } from '@/store/slices/passengerStore';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { useAppStore } from '@/store';
import { formatCurrency, cn } from '@/lib/utils';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
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
  X,
  Info,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  SlidersHorizontal,
  Flame,
  ChevronDown,
  Check,
  Compass,
  IndianRupee,
  BusFront,
  User,
  Bell,
  Crosshair,
} from 'lucide-react';

interface RouteDetails {
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

// Curated verified corridor metadata enriched with real Maharashtra & Konkan transit data
const CURATED_CORRIDORS: RouteDetails[] = [
  {
    id: 'corridor-mhasla-mumbai',
    origin: 'Mhasla Stand, Raigad',
    destination: 'Dadar T.T. Circle, Mumbai',
    avgPrice: 349,
    distanceKm: 168,
    duration: '3h 50m',
    frequency: 'Daily 8+ Departures',
    tag: '#1 Most Booked Express',
    tagColor: 'blue',
    category: 'konkan',
    popularVehicles: ['Toyota Innova Crysta', 'Maruti Ertiga', 'Toyota HyCross'],
    viaRoute: 'via NH66 • Mangaon • Panvel • Vashi',
    stops: [
      { name: 'Mhasla Bus Stand', landmark: 'Main Stand / ST Depot', km: 0 },
      { name: 'Mangaon Junction', landmark: 'NH66 Bypass Hotel Vithal', km: 32 },
      { name: 'Nagothane Bridge', landmark: 'Nagothane Flyover Point', km: 74 },
      { name: 'Panvel Highway', landmark: 'Palaspe Phata / Orion Mall', km: 128 },
      { name: 'Vashi Plaza', landmark: 'Navi Mumbai Highway Stop', km: 146 },
      { name: 'Dadar T.T. Circle', landmark: 'Pritam Hotel / Plaza Cinema', km: 168 },
    ],
    schedules: ['06:30 AM', '09:00 AM', '01:30 PM', '04:45 PM', '07:30 PM'],
  },
  {
    id: 'corridor-mhasla-pune',
    origin: 'Mhasla Stand, Raigad',
    destination: 'Swargate Bus Terminal, Pune',
    avgPrice: 349,
    distanceKm: 142,
    duration: '3h 15m',
    frequency: 'Daily 6+ Departures',
    tag: 'Scenic Tamhini Ghat Route',
    tagColor: 'emerald',
    category: 'pune',
    popularVehicles: ['Maruti Ertiga ZXi+', 'Toyota Innova'],
    viaRoute: 'via Mangaon • Tamhini Ghat • Kothrud',
    stops: [
      { name: 'Mhasla ST Stand', landmark: 'Main Passenger Bay', km: 0 },
      { name: 'Mangaon Bus Depot', landmark: 'Depot Gate NH66', km: 32 },
      { name: 'Tamhini Ghat Top', landmark: 'Scenic Valley Viewpoint Point', km: 78 },
      { name: 'Pirangut Chowk', landmark: 'Paud Road Cross', km: 118 },
      { name: 'Chandani Chowk Kothrud', landmark: 'Kothrud Flyover Base', km: 134 },
      { name: 'Swargate Terminal', landmark: 'Pune ST Depot Opp Metro', km: 142 },
    ],
    schedules: ['06:00 AM', '08:30 AM', '01:00 PM', '04:30 PM', '07:00 PM'],
  },
  {
    id: 'corridor-pune-mhasla',
    origin: 'Swargate Bus Terminal, Pune',
    destination: 'Mhasla Stand, Raigad',
    avgPrice: 349,
    distanceKm: 142,
    duration: '3h 15m',
    frequency: 'Daily 6+ Departures',
    tag: 'Top Weekend Route',
    tagColor: 'purple',
    category: 'pune',
    popularVehicles: ['Maruti Ertiga', 'Toyota Innova Crysta'],
    viaRoute: 'via Kothrud • Paud • Tamhini • Mangaon',
    stops: [
      { name: 'Swargate Bus Terminal', landmark: 'Gate 2 Passenger Shed', km: 0 },
      { name: 'Chandani Chowk, Kothrud', landmark: 'Bavdhan Flyover Bus Stop', km: 10 },
      { name: 'Mulshi / Tamhini Road', landmark: 'Quick Refreshment Rest Stop', km: 64 },
      { name: 'Mangaon Town', landmark: 'Mangaon Bazar Cross', km: 110 },
      { name: 'Mhasla Taluka', landmark: 'Mhasla Main ST Depot', km: 142 },
    ],
    schedules: ['07:30 AM', '10:30 AM', '02:30 PM', '05:45 PM', '08:30 PM'],
  },
  {
    id: 'corridor-shrivardhan-alibag',
    origin: 'Shrivardhan Beach, Raigad',
    destination: 'Alibag Bus Stand, Raigad',
    avgPrice: 349,
    distanceKm: 98,
    duration: '2h 30m',
    frequency: 'Daily 4+ Departures',
    tag: 'Coastal Direct Fastway',
    tagColor: 'blue',
    category: 'konkan',
    popularVehicles: ['Toyota Fortuner', 'Maruti Ertiga'],
    viaRoute: 'via Diveagar • Roha • Murud Coastline',
    stops: [
      { name: 'Shrivardhan Beach', landmark: 'Main Beach Stand', km: 0 },
      { name: 'Diveagar Cross', landmark: 'Suvarna Ganesh Point', km: 18 },
      { name: 'Murud Coastal Road', landmark: 'Janjira Jetty Approach', km: 54 },
      { name: 'Alibag Bus Stand', landmark: 'Town Center ST Bay', km: 98 },
    ],
    schedules: ['07:00 AM', '11:00 AM', '03:30 PM', '06:45 PM'],
  },
  {
    id: 'corridor-mumbai-mhasla',
    origin: 'Dadar T.T. Circle, Mumbai',
    destination: 'Mhasla Stand, Raigad',
    avgPrice: 399,
    distanceKm: 168,
    duration: '3h 50m',
    frequency: 'Daily 8+ Departures',
    tag: 'Popular Return Corridor',
    tagColor: 'amber',
    category: 'mumbai',
    popularVehicles: ['Toyota Innova Crysta', 'Maruti Ertiga'],
    viaRoute: 'via Chembur • Panvel • Mangaon',
    stops: [
      { name: 'Dadar T.T. Circle', landmark: 'Near Swami Narayan Temple', km: 0 },
      { name: 'Maitri Park Chembur', landmark: 'Sion-Panvel Highway Pick', km: 14 },
      { name: 'Panvel Bus Stand', landmark: 'Opp ST Stand / Highway Flyover', km: 40 },
      { name: 'Mangaon Phata', landmark: 'NH66 Junction', km: 136 },
      { name: 'Mhasla ST Stand', landmark: 'Town Center, Mhasla', km: 168 },
    ],
    schedules: ['07:00 AM', '11:00 AM', '03:00 PM', '06:00 PM', '09:15 PM'],
  },
  {
    id: 'corridor-mhasla-thane',
    origin: 'Mhasla Stand, Raigad',
    destination: 'Teen Hath Naka, Thane West',
    avgPrice: 380,
    distanceKm: 175,
    duration: '4h 00m',
    frequency: 'Daily 5+ Departures',
    tag: 'Spacious Group Travel',
    tagColor: 'amber',
    category: 'mumbai',
    popularVehicles: ['Tata Winger Luxury 12S', 'Innova Crysta'],
    viaRoute: 'via Mangaon • Pen Bypass • Panvel • Airoli',
    stops: [
      { name: 'Mhasla ST Stand', landmark: 'Raigad Mobility Counter', km: 0 },
      { name: 'Mangaon Junction', landmark: 'NH66 Central Bay', km: 32 },
      { name: 'Pen Express Bypass', landmark: 'Pen Toll Gate Point', km: 92 },
      { name: 'Panvel Kalamboli', landmark: 'Kalamboli Circle Pick', km: 135 },
      { name: 'Airoli Toll Naka', landmark: 'Thane-Belapur Road Hub', km: 162 },
      { name: 'Teen Hath Naka, Thane', landmark: 'Service Road Flyover Junction', km: 175 },
    ],
    schedules: ['07:00 AM', '11:30 AM', '03:30 PM', '07:15 PM'],
  },
];

function PopularRoutesContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { showToast } = useAppStore();
  const { popularRoutes, isLoading, getPopularRoutes } = useTripStore();
  const { addFavoriteRoute, removeFavoriteRoute, isFavoriteRoute } = usePassengerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'konkan' | 'mumbai' | 'pune' | 'budget'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'distance-asc'>('popular');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const mobileSortRef = useRef<HTMLDivElement>(null);
  const [activeModalRoute, setActiveModalRoute] = useState<RouteDetails | null>(null);

  // Search card state for mobile view
  const [pickupLocation, setPickupLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);

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
    setPickupLocation(destinationLocation);
    setDestinationLocation(pickupLocation);
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
      if (mobileSortRef.current && !mobileSortRef.current.contains(e.target as Node)) {
        setIsMobileSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    getPopularRoutes();
  }, [getPopularRoutes]);

  // Combine API routes with verified curated corridors for rich display
  const allRoutes = useMemo(() => {
    const list: RouteDetails[] = [...CURATED_CORRIDORS];

    // Merge any additional distinct routes from backend API
    if (Array.isArray(popularRoutes)) {
      popularRoutes.forEach((apiRoute, idx) => {
        const originClean = (apiRoute.origin || apiRoute.source || '').trim();
        const destClean = (apiRoute.destination || '').trim();
        if (!originClean || !destClean) return;

        const alreadyExists = list.some(
          (c) =>
            c.origin.toLowerCase().includes(originClean.toLowerCase().split(' ')[0]) &&
            c.destination.toLowerCase().includes(destClean.toLowerCase().split(' ')[0])
        );

        if (!alreadyExists) {
          list.push({
            id: apiRoute.id || `api-route-${idx}`,
            origin: originClean,
            destination: destClean,
            avgPrice: apiRoute.avgPrice > 0 ? apiRoute.avgPrice : 349,
            distanceKm: 150 + idx * 15,
            duration: '3h 30m',
            frequency: 'Daily 4+ Departures',
            tag: idx === 0 ? 'Trending Live' : 'Verified Route',
            tagColor: 'blue',
            category: originClean.toLowerCase().includes('mumbai')
              ? 'mumbai'
              : originClean.toLowerCase().includes('pune')
              ? 'pune'
              : 'konkan',
            popularVehicles: ['Toyota Innova Crysta', 'Maruti Ertiga'],
            viaRoute: 'Direct Intercity Highway',
            stops: [
              { name: originClean, landmark: 'Main Boarding Point', km: 0 },
              { name: destClean, landmark: 'Central Destination Point', km: 150 + idx * 15 },
            ],
            schedules: ['08:00 AM', '01:00 PM', '06:00 PM'],
          });
        }
      });
    }

    return list;
  }, [popularRoutes]);

  // Filter routes based on search and category
  const filteredRoutes = useMemo(() => {
    return allRoutes
      .filter((route) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          route.origin.toLowerCase().includes(q) ||
          route.destination.toLowerCase().includes(q) ||
          route.viaRoute.toLowerCase().includes(q);

        if (!matchesQuery) return false;

        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'budget') return route.avgPrice <= 370;
        return route.category === selectedCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.avgPrice - b.avgPrice;
        if (sortBy === 'distance-asc') return a.distanceKm - b.distanceKm;
        return 0; // Default popular
      });
  }, [allRoutes, searchQuery, selectedCategory, sortBy]);

  const handleSearchNavigation = (origin: string, destination: string) => {
    const originShort = origin.split(',')[0].trim();
    const destShort = destination.split(',')[0].trim();
    router.push(
      `/dashboard/trips/search?origin=${encodeURIComponent(originShort)}&destination=${encodeURIComponent(
        destShort
      )}`
    );
  };

  const handleToggleFavorite = (e: React.MouseEvent, origin: string, destination: string) => {
    e.stopPropagation();
    e.preventDefault();
    const isFav = isFavoriteRoute(origin, destination);
    if (isFav) {
      const stored = usePassengerStore
        .getState()
        .favoriteRoutes.find((r) => r.origin === origin && r.destination === destination);
      if (stored) removeFavoriteRoute(stored.id);
    } else {
      addFavoriteRoute(origin, destination);
    }
  };

  if (isLoading && allRoutes.length === 0) {
    return <Loading text="Loading popular corridors..." />;
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE SCREEN EXPERIENCE (Visible on screens < lg)                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="block lg:hidden w-full select-none pb-20 bg-[#F0F5FA] min-h-[calc(100dvh-66px)] animate-fadeIn">
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
          {/* Sort button */}
          <div ref={mobileSortRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileSortOpen(!isMobileSortOpen)}
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

            {isMobileSortOpen && (
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
                      setIsMobileSortOpen(false);
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP SCREEN EXPERIENCE (Visible on screens >= lg)                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block space-y-6 pb-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/dashboard/passenger"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Ride Search
                </Link>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span>Most Traveled Corridors</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Popular Intercity Routes
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                High-frequency verified passenger corridors connecting Mhasla, Raigad, Mumbai, and Pune.
                Guaranteed AC seats, upfront fixed pricing, and professional fleet.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl self-start sm:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{allRoutes.length} Verified Corridors Active</span>
            </div>
          </div>

          {/* Solid Feature Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Verified Fleet & Permits</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Car className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>100% AC MPVs & Vans</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Fixed Timetable Slots</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span>Fares from ₹349 / seat</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Live Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search origin or destination city (e.g. Mhasla, Mumbai, Pune, Thane)..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom Sort Dropdown */}
            <div ref={sortRef} className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                aria-expanded={isSortOpen}
                aria-haspopup="listbox"
                className={cn(
                  "h-10 px-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 select-none",
                  isSortOpen
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/10 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs active:scale-[0.98]"
                )}
              >
                <SlidersHorizontal className={cn("w-3.5 h-3.5", isSortOpen ? "text-blue-600" : "text-slate-500")} />
                <span>
                  {sortBy === 'popular' && 'Most Popular'}
                  {sortBy === 'price-asc' && 'Price: Low to High'}
                  {sortBy === 'distance-asc' && 'Distance: Shortest'}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    isSortOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                  )}
                />
              </button>

              {isSortOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort Corridors By</p>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { id: 'popular' as const, label: 'Most Popular', icon: Sparkles, desc: 'Highest rider volume' },
                      { id: 'price-asc' as const, label: 'Price: Low to High', icon: IndianRupee, desc: 'Cheapest fares first' },
                      { id: 'distance-asc' as const, label: 'Distance: Shortest', icon: Compass, desc: 'Quickest intercity transit' },
                    ].map((opt) => {
                      const isSelected = sortBy === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortOpen(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-colors select-none",
                            isSelected
                              ? "bg-blue-50 text-blue-700 font-bold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs truncate">{opt.label}</div>
                              <div className="text-[10px] text-slate-400 font-normal truncate">{opt.desc}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Corridors', count: allRoutes.length },
              {
                id: 'konkan',
                label: 'Konkan & Raigad',
                count: allRoutes.filter((r) => r.category === 'konkan').length,
              },
              {
                id: 'mumbai',
                label: 'Mumbai Express',
                count: allRoutes.filter((r) => r.category === 'mumbai').length,
              },
              {
                id: 'pune',
                label: 'Pune Express',
                count: allRoutes.filter((r) => r.category === 'pune').length,
              },
              {
                id: 'budget',
                label: 'Budget (≤ ₹370)',
                count: allRoutes.filter((r) => r.avgPrice <= 370).length,
              },
            ].map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Route Cards Grid */}
        {filteredRoutes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <EmptyState
              title="No matching routes found"
              description={`We couldn't find any popular corridor matching "${searchQuery}". Try searching for Mhasla, Dadar, Swargate, or Borivali.`}
              customIcon={<MapPin className="w-10 h-10 text-slate-300" />}
            />
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-xs text-slate-500 font-medium">Try searching:</span>
              {['Mhasla', 'Mumbai', 'Pune', 'Shrivardhan'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchQuery(suggestion)}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-3 py-1 rounded-lg bg-blue-100 text-xs font-bold text-blue-700 hover:bg-blue-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoutes.map((route) => {
              const isFav = isFavoriteRoute(route.origin, route.destination);
              const originCity = route.origin.split(',')[0].trim();
              const destCity = route.destination.split(',')[0].trim();

              return (
                <div
                  key={route.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header Tag Bar */}
                  <div className="p-4 pb-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
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
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {route.frequency}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(e, route.origin, route.destination)}
                      title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-red-500"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'text-red-500 fill-red-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Body: Route Path & Visuals */}
                  <div className="p-4 space-y-4">
                    {/* Origin & Destination Nodes */}
                    <div className="relative pl-6 space-y-3.5">
                      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />
                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-2 ring-emerald-100" />
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          Boarding From
                        </p>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {originCity}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {route.origin.replace(originCity + ',', '').trim() || 'Town Center / Depot'}
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm ring-2 ring-blue-100" />
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          Dropping At
                        </p>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {destCity}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {route.destination.replace(destCity + ',', '').trim() || 'Central Drop Point'}
                        </p>
                      </div>
                    </div>

                    {/* Route Corridor Info Pills */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{route.duration}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div>
                        <span>{route.distanceKm} km distance</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={() => handleSearchNavigation(destCity, originCity)}
                        title="Search return trip in opposite direction"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        Swap
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                      🛣️ {route.viaRoute}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {route.popularVehicles.map((veh) => (
                        <span
                          key={veh}
                          className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          {veh}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                        Fares From
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-slate-900">
                          {formatCurrency(route.avgPrice)}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">/ seat</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveModalRoute(route)}
                        title="View stops, landmarks & schedule"
                        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleSearchNavigation(route.origin, route.destination)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        <span>Find Rides</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Route Stops & Timetable Modal (Shared by Mobile & Desktop)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeModalRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1.5">
                  <Sparkles className="w-3 h-3" />
                  Corridor Timetable & Waypoints
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {activeModalRoute.origin.split(',')[0]} ⇄ {activeModalRoute.destination.split(',')[0]}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeModalRoute.distanceKm} km • {activeModalRoute.duration} typical travel time
                </p>
              </div>
              <button
                onClick={() => setActiveModalRoute(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Scheduled Daily Departure Slots</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeModalRoute.schedules.map((slot) => (
                    <div
                      key={slot}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5"
                    >
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{slot}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Route Stops & Landmark Boarding Points</span>
                </div>

                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />

                  {activeModalRoute.stops.map((stop, sIdx) => {
                    const isFirst = sIdx === 0;
                    const isLast = sIdx === activeModalRoute.stops.length - 1;

                    return (
                      <div key={stop.name} className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-2 ${
                            isFirst
                              ? 'bg-emerald-500 ring-emerald-100'
                              : isLast
                              ? 'bg-blue-600 ring-blue-100'
                              : 'bg-slate-400 ring-slate-100'
                          }`}
                        />
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900">{stop.name}</p>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {stop.km === 0 ? 'Start (0 km)' : `+${stop.km} km`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{stop.landmark}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700">Fleet Comfort & Inclusions:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Air Conditioned Fleet</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dedicated Luggage Boot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Live GPS Vehicle Tracking</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Clean Commercial Permits</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Fixed Fare
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  {formatCurrency(activeModalRoute.avgPrice)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalRoute(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSearchNavigation(activeModalRoute.origin, activeModalRoute.destination);
                    setActiveModalRoute(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>Search Live Rides</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PopularRoutesPage() {
  return (
    <Suspense fallback={<Loading text="Loading popular routes..." />}>
      <PopularRoutesContent />
    </Suspense>
  );
}
