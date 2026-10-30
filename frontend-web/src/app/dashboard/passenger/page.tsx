'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { useTripStore } from '@/store/slices/tripSlice';
import PassengerTripMap from '@/components/passenger/PassengerTripMap';
import {
  Home,
  Compass,
  Calendar,
  Wallet,
  LifeBuoy,
  Settings,
  MapPin,
  Bell,
  ChevronDown,
  ArrowUpDown,
  Search,
  Crosshair,
  Users,
  Plane,
  Car,
  Clock,
  ChevronRight,
  Mountain,
  Milestone,
  Check,
  LogOut,
  FileText,
} from 'lucide-react';

export default function PassengerDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount, getUnreadCount } = useNotificationStore();
  const { popularRoutes, getPopularRoutes } = useTripStore();

  // Selected City / Location
  const [currentCity, setCurrentCity] = useState('Mumbai, India');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Search parameters matching mockup
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP' | 'HOURLY'>('ONE_WAY');
  const [origin, setOrigin] = useState('Mumbai, India');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('Thu, 30 Oct 2026');
  const [departureTime, setDepartureTime] = useState('10:30 AM');
  const [passengerCount, setPassengerCount] = useState(1);
  const [isPassengerDropdownOpen, setIsPassengerDropdownOpen] = useState(false);

  // Active route preview details
  const [routeDuration, setRouteDuration] = useState('35 min');
  const [routeDistance, setRouteDistance] = useState('18 km');
  const [routeFare, setRouteFare] = useState('₹450 - ₹550');

  useEffect(() => {
    getUnreadCount();
    getPopularRoutes();
  }, [getUnreadCount, getPopularRoutes]);

  // Real user details fallback to mockup
  const displayName = useMemo(() => {
    if (user?.firstName) return user.firstName;
    return 'Arman';
  }, [user]);

  const initials = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) return user.firstName.slice(0, 2).toUpperCase();
    return 'AK';
  }, [user]);

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination || 'Mumbai, India');
    setDestination(temp);
  };

  // Detect GPS Location
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setOrigin('Current location (Mumbai)');
        },
        () => {
          setOrigin('Mumbai, India');
        }
      );
    }
  };

  // Category quick selects
  const handleCategorySelect = (category: string) => {
    if (category === 'Airport') {
      setDestination('Chhatrapati Shivaji Maharaj International Airport');
      setRouteDuration('35 min');
      setRouteDistance('18 km');
      setRouteFare('₹450 - ₹550');
    } else if (category === 'Nearby') {
      setDestination('Bandra Kurla Complex (BKC), Mumbai');
      setRouteDuration('25 min');
      setRouteDistance('12 km');
      setRouteFare('₹320 - ₹400');
    } else if (category === 'Weekend getaway') {
      setDestination('Lonavala, Maharashtra');
      setRouteDuration('2 h');
      setRouteDistance('83 km');
      setRouteFare('₹1,800');
    } else if (category === 'Outstation') {
      setDestination('Pune, Maharashtra');
      setRouteDuration('3 h');
      setRouteDistance('150 km');
      setRouteFare('₹2,500');
    }
  };

  // Search trips navigation
  const handleSearchTrips = () => {
    const targetDest = destination.trim() || 'Chhatrapati Shivaji Maharaj International Airport';
    router.push(
      `/dashboard/trips/search?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(
        targetDest
      )}&type=${tripType}&passengers=${passengerCount}`
    );
  };

  // Book trip CTA
  const handleBookTrip = () => {
    const targetDest = destination.trim() || 'Chhatrapati Shivaji Maharaj International Airport';
    router.push(
      `/dashboard/trips/search?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(
        targetDest
      )}&autoSelect=standard`
    );
  };

  // Popular destination card select
  const handleSelectPopular = (name: string, dist: string, time: string, fare: string) => {
    setDestination(`${name}, Maharashtra`);
    setRouteDistance(dist);
    setRouteDuration(time);
    setRouteFare(fare);
  };

  // Available cities in dropdown
  const cities = ['Mumbai, India', 'Pune, India', 'Delhi NCR, India', 'Bengaluru, India', 'Goa, India'];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR (Matching mockup exact layout & styling)
      ───────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-slate-200/80 min-h-screen flex flex-col justify-between p-6 flex-shrink-0 z-20">
        <div>
          {/* Brand Logo */}
          <Link href="/dashboard/passenger" className="flex items-center gap-2.5 mb-8 group">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <MapPin className="w-5 h-5 fill-white text-blue-600" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              TravelFlow
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {/* Home (Active state matching mockup) */}
            <Link
              href="/dashboard/passenger"
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm transition-all"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            {/* Explore */}
            <Link
              href="/dashboard/trips/search"
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition-all"
            >
              <Compass className="w-5 h-5" />
              <span>Explore</span>
            </Link>

            {/* My Trips */}
            <Link
              href="/dashboard/bookings?status=CONFIRMED"
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition-all"
            >
              <Calendar className="w-5 h-5" />
              <span>My Trips</span>
            </Link>

            {/* Bookings */}
            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition-all"
            >
              <FileText className="w-5 h-5" />
              <span>Bookings</span>
            </Link>

            {/* Wallet */}
            <Link
              href="/dashboard/wallet"
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition-all"
            >
              <Wallet className="w-5 h-5" />
              <span>Wallet</span>
            </Link>

            {/* Support */}
            <Link
              href="/dashboard/support"
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition-all"
            >
              <LifeBuoy className="w-5 h-5" />
              <span>Support</span>
            </Link>

            {/* Profile & Settings */}
            <Link
              href="/dashboard/passenger/settings"
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition-all"
            >
              <Settings className="w-5 h-5" />
              <span>Profile & Settings</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Banner Promo Card (Matching mockup image) */}
        <div className="relative rounded-2xl p-4 bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100/70 border border-blue-100/90 shadow-sm overflow-hidden mt-6">
          <div className="relative z-10">
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              Travel anywhere with TravelFlow
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">Safe • Reliable • Comfortable</p>
          </div>

          {/* Car Artwork container */}
          <div className="mt-4 flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=350&auto=format&fit=crop&q=80"
              alt="Travel Blue Car"
              className="h-16 w-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Topbar + 2-Column Upper + Popular Lower)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-18 px-8 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between z-10">
          {/* Location Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-800 transition-colors"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{currentCity}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </button>

            {isCityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setCurrentCity(city);
                      setOrigin(city);
                      setIsCityDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                  >
                    <span>{city}</span>
                    {currentCity === city && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Header Controls (Notifications & Profile) */}
          <div className="flex items-center gap-4">
            {/* Notification Bell with Red Badge */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount || '0'}
              </span>
            </Link>

            {/* User Profile Avatar & Name */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                  {initials}
                </div>
                <span className="text-sm font-semibold text-slate-800 hidden sm:inline">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email || 'user@travelflow.com'}</p>
                  </div>
                  <Link
                    href="/dashboard/passenger/settings"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard/wallet"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Wallet Balance
                  </Link>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="p-8 space-y-8 overflow-y-auto max-w-[1400px]">
          {/* ─────────────────────────────────────────────────────────
              UPPER SECTION: 2 COLUMNS (Search Form vs. Interactive Map)
          ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Booking Form (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Where would you like to go?
                </h1>
                <p className="text-slate-500 text-sm mt-1">Your next journey starts here.</p>
              </div>

              {/* Main Booking Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
                {/* Trip Type Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-100 pb-3 mb-5 text-sm font-semibold">
                  <button
                    onClick={() => setTripType('ONE_WAY')}
                    className={`flex items-center gap-2 pb-2 transition-all relative ${
                      tripType === 'ONE_WAY'
                        ? 'text-blue-600 font-bold after:content-[""] after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>One Way</span>
                  </button>

                  <button
                    onClick={() => setTripType('ROUND_TRIP')}
                    className={`flex items-center gap-2 pb-2 transition-all relative ${
                      tripType === 'ROUND_TRIP'
                        ? 'text-blue-600 font-bold after:content-[""] after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Round Trip</span>
                  </button>

                  <button
                    onClick={() => setTripType('HOURLY')}
                    className={`flex items-center gap-2 pb-2 transition-all relative ${
                      tripType === 'HOURLY'
                        ? 'text-blue-600 font-bold after:content-[""] after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Hourly Rental</span>
                  </button>
                </div>

                {/* Origin & Destination Container with Connector and Swap */}
                <div className="relative bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3 space-y-2 mb-4">
                  {/* Origin */}
                  <div className="flex items-center gap-3 px-2 py-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Current location
                      </label>
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Enter pickup point"
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none truncate"
                      />
                    </div>
                    <button
                      onClick={handleDetectLocation}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Detect GPS"
                    >
                      <Crosshair className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Vertical dotted connecting line */}
                  <div className="absolute left-[21px] top-[34px] bottom-[34px] w-0.5 border-l-2 border-dotted border-slate-300 pointer-events-none" />

                  {/* Absolute Swap Button */}
                  <button
                    onClick={handleSwapLocations}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-md border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all z-10"
                    title="Swap Pickup and Destination"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>

                  <div className="h-px bg-slate-200/80 my-1 mx-2" />

                  {/* Destination */}
                  <div className="flex items-center gap-3 px-2 py-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Search destination
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Enter city, airport, or landmark"
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none truncate"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time + Passengers Selector */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {/* Date & Time Box */}
                  <div className="border border-slate-200/90 rounded-xl p-2.5 bg-white flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-800 truncate">{departureDate}</div>
                        <div className="text-[11px] text-slate-500">{departureTime}</div>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                  </div>

                  {/* Passengers Dropdown */}
                  <div className="relative">
                    <div
                      onClick={() => setIsPassengerDropdownOpen(!isPassengerDropdownOpen)}
                      className="border border-slate-200/90 rounded-xl p-2.5 bg-white flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors h-full"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800">
                          {passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                    </div>

                    {isPassengerDropdownOpen && (
                      <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20">
                        {[1, 2, 3, 4, 6].map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              setPassengerCount(num);
                              setIsPassengerDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-1.5 text-xs font-medium hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between"
                          >
                            <span>
                              {num} {num === 1 ? 'Passenger' : 'Passengers'}
                            </span>
                            {passengerCount === num && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button: Search trips -> */}
                <button
                  onClick={handleSearchTrips}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 group"
                >
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Search trips</span>
                  <span className="text-base leading-none">→</span>
                </button>
              </div>

              {/* Quick Category Buttons matching mockup */}
              <div className="grid grid-cols-4 gap-2.5 pt-1">
                {/* 1. Airport */}
                <button
                  onClick={() => handleCategorySelect('Airport')}
                  className="bg-white hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-200 p-2.5 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Airport</div>
                    <div className="text-[10px] text-slate-400 truncate">To & from airport</div>
                  </div>
                </button>

                {/* 2. Nearby */}
                <button
                  onClick={() => handleCategorySelect('Nearby')}
                  className="bg-white hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-200 p-2.5 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Nearby</div>
                    <div className="text-[10px] text-slate-400 truncate">Places around you</div>
                  </div>
                </button>

                {/* 3. Weekend getaway */}
                <button
                  onClick={() => handleCategorySelect('Weekend getaway')}
                  className="bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 p-2.5 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <Mountain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Weekend getaway</div>
                    <div className="text-[10px] text-slate-400 truncate">Short trips</div>
                  </div>
                </button>

                {/* 4. Outstation */}
                <button
                  onClick={() => handleCategorySelect('Outstation')}
                  className="bg-white hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-200 p-2.5 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Outstation</div>
                    <div className="text-[10px] text-slate-400 truncate">Intercity travel</div>
                  </div>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Leaflet Map & Floating Ride Card (7 Cols) */}
            <div className="lg:col-span-7">
              <PassengerTripMap
                origin={origin}
                destination={destination || 'Chhatrapati Shivaji Maharaj International Airport'}
                duration={routeDuration}
                distance={routeDistance}
                estimatedFare={routeFare}
                onBookTrip={handleBookTrip}
              />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              LOWER SECTION: Popular destinations from Mumbai (4 Cards)
          ───────────────────────────────────────────────────────── */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Popular destinations from Mumbai
              </h2>
              <Link
                href="/dashboard/trips/search"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                <span>View all</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Lonavala */}
              <div
                onClick={() => handleSelectPopular('Lonavala', '83 km', '2 h', '₹1,800')}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-32 w-full rounded-xl overflow-hidden mb-3 relative">
                  <img
                    src="https://images.unsplash.com/photo-1626014303757-646734d58852?w=500&auto=format&fit=crop&q=80"
                    alt="Lonavala"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Lonavala</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      83 km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      2 h
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">₹1,800</span>
                      <span className="text-[10px] text-slate-400 ml-1">One way</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Pune */}
              <div
                onClick={() => handleSelectPopular('Pune', '150 km', '3 h', '₹2,500')}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-32 w-full rounded-xl overflow-hidden mb-3 relative">
                  <img
                    src="https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=500&auto=format&fit=crop&q=80"
                    alt="Pune"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Pune</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      150 km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      3 h
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">₹2,500</span>
                      <span className="text-[10px] text-slate-400 ml-1">One way</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Goa */}
              <div
                onClick={() => handleSelectPopular('Goa', '590 km', '10 h', '₹7,500')}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-32 w-full rounded-xl overflow-hidden mb-3 relative">
                  <img
                    src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&auto=format&fit=crop&q=80"
                    alt="Goa"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Goa</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      590 km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      10 h
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">₹7,500</span>
                      <span className="text-[10px] text-slate-400 ml-1">One way</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Nashik */}
              <div
                onClick={() => handleSelectPopular('Nashik', '166 km', '3.5 h', '₹2,800')}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-32 w-full rounded-xl overflow-hidden mb-3 relative">
                  <img
                    src="https://images.unsplash.com/photo-1566837945700-30057527ade0?w=500&auto=format&fit=crop&q=80"
                    alt="Nashik"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Nashik</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      166 km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      3.5 h
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">₹2,800</span>
                      <span className="text-[10px] text-slate-400 ml-1">One way</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
