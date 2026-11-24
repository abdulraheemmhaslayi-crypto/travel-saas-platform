'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Calendar, Users, Car, UserCheck, 
  Phone, Info, Trash2, Activity, CheckCircle2, 
  AlertTriangle, ChevronDown, ArrowLeftRight, Armchair, Bell 
} from 'lucide-react';
import { useAuthStore } from '@/store/slices/authSlice';
import { cn } from '@/lib/utils';

interface FleetTripDetailMobileProps {
  trip: any;
  drivers: any[];
  selectedDriverId: string;
  setSelectedDriverId: (id: string) => void;
  handleAssignDriver: () => Promise<void>;
  handleStatusChange: (status: string) => Promise<void>;
  handleDeleteTrip: () => Promise<void>;
  isActionLoading: boolean;
  isCancellable: boolean;
  assignedDriver: any;
}

export default function FleetTripDetailMobile({
  trip,
  drivers,
  selectedDriverId,
  setSelectedDriverId,
  handleAssignDriver,
  handleStatusChange,
  handleDeleteTrip,
  isActionLoading,
  isCancellable,
  assignedDriver,
}: FleetTripDetailMobileProps) {
  const { user } = useAuthStore();
  const initials = user?.firstName
    ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}`.toUpperCase()
    : 'RS';

  // Format trip date matching screenshot: "30 Nov 2026, 4:20 pm"
  const formatTripDate = (dateVal?: string | Date) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateVal);
    }
  };

  const getDriverInitials = (name?: string) => {
    if (!name) return 'RM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const statusStr = String(trip?.status || '').toUpperCase().trim();
  const isCompleted = ['COMPLETED', 'FINISHED', 'DONE'].includes(statusStr);
  const isScheduled = ['SCHEDULED', 'UPCOMING', 'PENDING', 'CREATED'].includes(statusStr);
  const isActive = ['ACTIVE', 'IN_PROGRESS', 'DELAYED', 'STARTED'].includes(statusStr);
  const isCancelled = ['CANCELLED', 'CANCELED', 'ABORTED'].includes(statusStr);

  // Exactly matching lowercase route title from screenshot: "mhasla to pune"
  const routeTitle = (trip?.title || `${trip?.source || trip?.origin || 'Source'} to ${trip?.destination || 'Destination'}`).toLowerCase();
  const bookedSeats = trip?.bookedSeats ?? trip?.bookings?.length ?? 0;
  const totalSeats = trip?.totalSeats ?? trip?.vehicle?.seatingCapacity ?? 8;
  const availableSeats = trip?.availableSeats ?? Math.max(0, totalSeats - bookedSeats);
  const vehicleName = trip?.vehicle ? `${trip.vehicle.brand || trip.vehicle.make || 'Toyota'} ${trip.vehicle.model || 'Innova'}` : 'Toyota Innova';
  const vehiclePlate = trip?.vehicle?.registrationNumber || trip?.vehicleNumber || 'MH1';
  const bookingCount = trip?.bookings?.length ?? bookedSeats;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      {/* ── 1. Top App Bar (Matching Screenshot) ────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        {/* Left: Circular Back Button & Kokan Travel Brand */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/fleet-owner/trips"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs active:scale-95 transition-all"
            aria-label="Back to Trips"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </Link>

          <Link href="/dashboard/fleet-owner" className="flex items-center gap-2 active:scale-95 transition-transform">
            <div className="w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center text-white shadow-xs shrink-0">
              <MapPin className="w-4 h-4 fill-white text-[#4F46E5]" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Kokan Travel</span>
          </Link>
        </div>

        {/* Right: Notification Bell + User Avatar */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className="relative w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-90 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              5
            </span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/90 flex items-center justify-center text-[11px] font-bold text-slate-700 active:scale-90 transition-all"
            aria-label="User Profile"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* ── 2. Hero Header Banner matching screenshot ────────────────────────── */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-100/50 p-4 border border-purple-100/60 shadow-xs">
          <div className="relative z-10 max-w-[70%]">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight lowercase truncate">
              {routeTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-normal">
              Manage route, driver assignment, and status updates.
            </p>
          </div>

                    {/* Decorative Modern Car Graphic */}
          <div className="absolute -right-2 bottom-0 opacity-95 pointer-events-none">
            <div className="relative w-32 h-14 flex items-end justify-end">
              <img
                src="/images/banner-car.png"
                alt="Fleet Vehicle"
                className="w-auto h-full max-h-13 object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Cards Body ─────────────────────────────────────────────────── */}
      <div className="px-4 space-y-4">
        {/* ── Card 1: Trip Specifications ──────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="text-base font-bold text-slate-900">Trip Specifications</h2>
            </div>

            {/* Status Pill Badge */}
            {isCompleted && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                COMPLETED
              </span>
            )}
            {isScheduled && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                SCHEDULED
              </span>
            )}
            {isActive && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                ACTIVE
              </span>
            )}
            {isCancelled && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                CANCELLED
              </span>
            )}
          </div>

          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Route */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Route</p>
                  <p className="text-slate-600 font-normal text-xs mt-0.5 leading-relaxed">
                    {trip?.source || trip?.origin || 'Source'},<br />
                    to {trip?.destination || 'Destination'}
                  </p>
                </div>
              </div>

              {/* Departure Time */}
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Departure Time</p>
                  <p className="text-slate-600 font-normal text-xs mt-0.5">
                    {formatTripDate(trip?.departureTime || trip?.departureDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3.5 border-l border-slate-100 pl-3">
              {/* Seating Capacity */}
              <div className="flex items-start gap-2">
                <Armchair className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Seating Capacity</p>
                  <p className="text-slate-600 font-normal text-xs mt-0.5">
                    {bookedSeats} booked / {totalSeats} Total seats
                  </p>
                  <p className="text-slate-500 font-normal text-xs">
                    ({availableSeats} available)
                  </p>
                </div>
              </div>

              {/* Assigned Vehicle */}
              <div className="flex items-start gap-2">
                <Car className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Assigned Vehicle</p>
                  <p className="text-slate-600 font-normal text-xs mt-0.5 truncate">
                    {vehiclePlate} ({vehicleName})
                  </p>
                </div>
              </div>

              {/* Assigned Driver */}
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-xs">Assigned Driver</p>
                  <p className="text-slate-600 font-normal text-xs mt-0.5 truncate">
                    {assignedDriver?.name || 'Unassigned'}
                  </p>
                  {assignedDriver?.phone && (
                    <p className="text-slate-600 font-normal text-xs truncate">
                      {assignedDriver.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 2: Driver Assignment ────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-2 pb-1">
            <svg className="w-5 h-5 text-[#4F46E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a10 10 0 0 0-7.07 17.07l4.95-4.95A3 3 0 0 1 12 15a3 3 0 0 1 2.12-.88l4.95 4.95A10 10 0 0 0 12 2z"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <h2 className="text-base font-bold text-slate-900">Driver Assignment</h2>
          </div>

          {/* Currently Assigned Driver Banner */}
          {assignedDriver ? (
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Initials Circle */}
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-base shrink-0 border border-purple-200">
                  {getDriverInitials(assignedDriver.name)}
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider block leading-none">
                    ASSIGNED DRIVER
                  </span>
                  <h4 className="font-bold text-slate-900 text-base truncate capitalize mt-1">
                    {assignedDriver.name}
                  </h4>
                  {assignedDriver.phone ? (
                    <a
                      href={`tel:${assignedDriver.phone}`}
                      className="text-xs text-slate-500 hover:text-[#4F46E5] flex items-center gap-1 mt-0.5 font-normal"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{assignedDriver.phone}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 font-normal">No contact phone</span>
                  )}
                </div>
              </div>

              {/* Status Pill & Info Button */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                </span>
                <button
                  type="button"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                  title="Driver details"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>No driver is assigned to this trip yet. Select one below.</span>
            </div>
          )}

          {/* Select Driver Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1.5">
              Select Driver
            </label>
            <div className="relative">
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full h-12 appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-normal text-slate-800 shadow-2xs focus:border-[#4F46E5] focus:outline-hidden focus:ring-1 focus:ring-[#4F46E5] transition-all cursor-pointer"
              >
                <option value="">Choose a driver</option>
                {drivers.map((d: any) => {
                  const dName = d.name || `${d.user?.firstName || ''} ${d.user?.lastName || ''}`.trim() || d.email || 'Driver';
                  const lic = d.licenseNumber ? `DL: ${d.licenseNumber}` : 'No License';
                  return (
                    <option key={d.id} value={d.id}>
                      {dName} ({lic})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Change Driver Button */}
          <button
            type="button"
            onClick={handleAssignDriver}
            disabled={isActionLoading || !selectedDriverId}
            className="w-full h-12 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <ArrowLeftRight className={cn('w-4 h-4', isActionLoading && 'animate-spin')} />
            <span>{assignedDriver ? 'Change Assigned Driver' : 'Assign Driver to Trip'}</span>
          </button>
        </div>

        {/* ── Card 3: Booked Passengers List ──────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="text-base font-bold text-slate-900">Booked Passengers List</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-[#4F46E5] border border-purple-200">
              {bookingCount} Bookings
            </span>
          </div>

          {/* Empty State or List */}
          {bookingCount === 0 ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Users className="w-8 h-8 stroke-[1.5]" />
              </div>
              <p className="text-xs text-slate-500 font-normal">
                No passengers have booked this trip yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {trip?.bookings?.map((b: any) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">
                      {b.passengerName || b.passenger?.firstName || 'Passenger'}
                    </p>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Seats: {b.seatNumbers?.join(', ') || b.numberOfSeats}
                      {b.passengerPhone ? ` • ${b.passengerPhone}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    {b.status || 'CONFIRMED'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Card 4: Trip Status Actions ──────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#4F46E5]" />
              <h2 className="text-base font-bold text-slate-900">Trip Status Actions</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-normal pl-7">
              Update the trip's current operational status.
            </p>
          </div>

          {/* Action Contents */}
          <div className="pt-1 space-y-2.5">
            {isCompleted && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>This trip is completed successfully.</span>
              </div>
            )}

            {isScheduled && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('active')}
                  disabled={isActionLoading}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>Set Active / Start Trip</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isActionLoading}
                  className="w-full h-11 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cancel Trip</span>
                </button>
              </div>
            )}

            {isActive && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('completed')}
                  disabled={isActionLoading}
                  className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Mark Completed</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isActionLoading}
                  className="w-full h-11 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cancel Trip</span>
                </button>
              </div>
            )}

            {isCancelled && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>This trip has been marked as cancelled. No further action can be taken.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Card 5: Danger Zone (If Cancellable/Deleteable) ────────────────── */}
        {isCancellable && (
          <div className="bg-[#FFF5F5] border border-rose-200/80 rounded-3xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-rose-700">Danger Zone</h2>
            </div>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Since there are no bookings, you can <strong className="text-rose-700 font-bold">delete</strong> this trip completely from the system.
            </p>
            <button
              type="button"
              onClick={handleDeleteTrip}
              disabled={isActionLoading}
              className="w-full h-12 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Trip Route</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
