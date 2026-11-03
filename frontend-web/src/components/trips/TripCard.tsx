'use client';

import React from 'react';
import Link from 'next/link';
import { Trip } from '@/types/trip';
import { formatCurrency, cn } from '@/lib/utils';
import {
  MapPin,
  ArrowRight,
  Clock,
  Users,
  Car,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface TripCardProps {
  trip: Trip;
  variant?: 'default' | 'compact' | 'detailed';
  onBook?: (tripId: string) => void;
}

// Clean address into primary station name and secondary city/region
function parseLocation(address?: string): { station: string; city: string } {
  if (!address) return { station: 'Location', city: '' };

  // Remove trailing country and zip codes
  const parts = address
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !s.toLowerCase().includes('india') && !/^\d{6}$/.test(s));

  if (parts.length === 0) return { station: address, city: '' };
  if (parts.length === 1) return { station: parts[0], city: '' };

  const station = parts[0];
  const city = parts.slice(1, 3).join(', ');
  return { station, city };
}

// Calculate human-friendly duration
function calculateDuration(depTime?: string, arrTime?: string): string {
  if (!depTime || !arrTime) return '3h 45m';
  try {
    const dep = new Date(depTime).getTime();
    const arr = new Date(arrTime).getTime();
    const diffMs = arr - dep;
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
      if (hours > 0) return `${hours}h`;
      return `${mins}m`;
    }
  } catch {
    // Fallback
  }
  return '3h 45m';
}

const TripCard: React.FC<TripCardProps> = ({ trip, variant = 'default', onBook }) => {
  const isUpcoming = new Date(trip.departureTime || trip.departureDate) > new Date();

  const formatTimeOnly = (dateStr?: string) => {
    if (!dateStr) return '07:00 AM';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const originParsed = parseLocation(trip.origin || trip.source);
  const destParsed = parseLocation(trip.destination);

  // Vehicle display metadata
  const brand = trip.vehicle?.brand || '';
  const model = trip.vehicle?.model || '';
  const vehicleTitle =
    brand && model
      ? `${brand} ${model}`
      : trip.vehicleName || trip.vehicleType || 'Intercity Sedan';

  const typeUpper = (trip.vehicleType || '').toUpperCase();
  let vehicleCategory = 'AC Sedan';
  if (typeUpper.includes('SUV') || vehicleTitle.toLowerCase().includes('innova')) {
    vehicleCategory = 'AC Premium MPV';
  } else if (typeUpper.includes('BUS')) {
    vehicleCategory = 'Luxury Coach';
  } else if (typeUpper.includes('VAN')) {
    vehicleCategory = 'AC Travel Van';
  }

  // ─── Compact Variant ────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-4 transition-all shadow-xs hover:shadow-md">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 truncate">
                {originParsed.station}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-900 truncate">
                {destParsed.station}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>
                {formatDateOnly(trip.departureTime || trip.departureDate)} •{' '}
                {formatTimeOnly(trip.departureTime || trip.departureDate)}
              </span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-black text-blue-600">
              {formatCurrency(trip.pricePerSeat || trip.price || 0, trip.currency || 'INR')}
            </p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
              {trip.availableSeats} seats left
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Default / Detailed Modern Ride Card ────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400/80 transition-all duration-200 shadow-sm hover:shadow-md p-4 sm:p-5 space-y-4">
      {/* ── Top Header Row: Vehicle Pill & Fare ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Car className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {vehicleTitle}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                {vehicleCategory}
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md shrink-0">
                100% AC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Fleet Service</span>
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-right shrink-0">
          <div className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight">
            {formatCurrency(trip.pricePerSeat || trip.price || 0, trip.currency || 'INR')}
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block -mt-0.5">
            per seat
          </span>
        </div>
      </div>

      {/* ── Route Timeline Section ── */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 sm:p-4 space-y-3">
        {/* Origin / Boarding */}
        <div className="flex items-start gap-3">
          <div className="w-5 flex flex-col items-center pt-1 shrink-0">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <div className="w-0.5 h-9 bg-slate-200 border-l border-dashed border-slate-300 my-1" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {originParsed.station}
              </h4>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 shrink-0">
                {formatTimeOnly(trip.departureTime || trip.departureDate)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {originParsed.city || 'Starting Point'}
            </p>
          </div>
        </div>

        {/* Route Details Bar (Between Origin & Dest) */}
        <div className="flex items-center gap-3 -my-1 pl-1">
          <div className="w-3" />
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>{calculateDuration(trip.departureTime, trip.arrivalTime)}</span>
            <span className="text-slate-300">•</span>
            <span>Direct Express Corridor</span>
          </div>
        </div>

        {/* Destination / Dropoff */}
        <div className="flex items-start gap-3">
          <div className="w-5 flex flex-col items-center pt-1 shrink-0">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {destParsed.station}
              </h4>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 shrink-0">
                {trip.arrivalTime ? formatTimeOnly(trip.arrivalTime) : 'Est. Same Day'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {destParsed.city || 'Destination Point'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Route Match Badge (Cleaned of Long Addresses) ── */}
      {trip.matchDetails && (
        <div className="text-[11px] font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/60 px-3 py-2 rounded-xl flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">
            {trip.matchDetails.rank === 1 && 'Exact Corridor Match'}
            {trip.matchDetails.rank === 2 &&
              `Route Match: Boards at ${parseLocation(trip.matchDetails.sourceStop).station} • Drops at ${parseLocation(trip.matchDetails.destStop).station}`}
            {trip.matchDetails.rank === 3 &&
              `Nearby Departure: Boards at ${parseLocation(trip.matchDetails.sourceStop).station}`}
            {trip.matchDetails.rank === 4 &&
              `Nearby Destination: Drops at ${parseLocation(trip.matchDetails.destStop).station}`}
            {trip.matchDetails.rank >= 5 &&
              `Corridor Match: Boards at ${parseLocation(trip.matchDetails.sourceStop).station} • Drops at ${parseLocation(trip.matchDetails.destStop).station}`}
          </span>
        </div>
      )}

      {/* ── Bottom Section: Seats, Driver & CTA ── */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Live Seats & Driver Info */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seats Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
              trip.availableSeats > 2
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : trip.availableSeats > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {trip.availableSeats > 0
                ? `${trip.availableSeats} seat${trip.availableSeats !== 1 ? 's' : ''} left`
                : 'Sold Out'}
            </span>
          </span>

          {/* Driver Badge */}
          {trip.driver && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-medium">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                {(trip.driver.user?.firstName || 'D')[0]}
              </span>
              <span className="truncate max-w-[110px] sm:max-w-none">
                {trip.driver.user?.firstName || 'Verified Driver'}
              </span>
              <span className="text-amber-500 font-bold text-[11px] flex items-center">
                ★ 4.9
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link
            href={`/dashboard/trips/${trip.id}`}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Details
          </Link>
          {trip.availableSeats > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (onBook) onBook(trip.id);
                else window.location.href = `/dashboard/trips/${trip.id}`;
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <span>Book Seat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3.5 py-2.5 rounded-xl">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripCard;
