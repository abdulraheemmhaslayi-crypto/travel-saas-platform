'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTripStore } from '@/store/slices/tripSlice';
import SearchForm from '@/components/trips/SearchForm';
import TripList from '@/components/trips/TripList';
import TripFilter from '@/components/trips/TripFilter';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import {
  Search,
  Filter,
  Compass,
  Navigation,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

function TripSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    filters,
    totalCount,
    isLoading,
    error,
    exactMatches,
    partialMatches,
    nearbyDeparture,
    nearbyDestination,
    similarRoutes,
    searchTrips,
    setFilters,
    getPopularRoutes,
    popularRoutes,
  } = useTripStore();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const origin = searchParams.get('origin') || '';
    const originLat = searchParams.get('originLat') ? Number(searchParams.get('originLat')) : undefined;
    const originLng = searchParams.get('originLng') ? Number(searchParams.get('originLng')) : undefined;
    const destination = searchParams.get('destination') || '';
    const destLat = searchParams.get('destLat') ? Number(searchParams.get('destLat')) : undefined;
    const destLng = searchParams.get('destLng') ? Number(searchParams.get('destLng')) : undefined;
    const date = searchParams.get('date') || '';
    const seats = searchParams.get('seats') ? Number(searchParams.get('seats')) : undefined;

    const initialFilters = {
      ...(origin && { origin }),
      ...(originLat && { originLat }),
      ...(originLng && { originLng }),
      ...(destination && { destination }),
      ...(destLat && { destLat }),
      ...(destLng && { destLng }),
      ...(date && { date }),
      ...(seats && { seats }),
    };

    if (origin || destination || date) {
      setFilters(initialFilters);
      searchTrips(initialFilters);
    } else {
      getPopularRoutes();
    }
  }, [searchParams, setFilters, searchTrips, getPopularRoutes]);

  const handleSearch = (newFilters: typeof filters) => {
    setFilters(newFilters);
    searchTrips(newFilters);
  };

  const handleBookTrip = (tripId: string) => {
    router.push(`/dashboard/trips/${tripId}`);
  };

  const hasSearched = Boolean(filters.origin || filters.destination || filters.date);
  const hasExact = exactMatches && exactMatches.length > 0;
  const hasPartial = partialMatches && partialMatches.length > 0;
  const hasNearbyDeparture = nearbyDeparture && nearbyDeparture.length > 0;
  const hasNearbyDestination = nearbyDestination && nearbyDestination.length > 0;
  const hasSimilar = similarRoutes && similarRoutes.length > 0;
  const hasAnyResults = hasExact || hasPartial || hasNearbyDeparture || hasNearbyDestination || hasSimilar;

  const renderPopularRoutes = () => {
    return (
      <div className="max-w-2xl mx-auto pt-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
          <Compass className="w-4 h-4 text-blue-600" />
          <span>Popular Verified Corridors</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {popularRoutes.slice(0, 4).map((route) => (
            <button
              key={route.id}
              onClick={() =>
                handleSearch({
                  origin: route.origin,
                  destination: route.destination,
                })
              }
              className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-xs transition-all text-left flex items-center justify-between group active:scale-[0.99]"
            >
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {route.origin} → {route.destination}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fares from {formatCurrency(route.avgPrice)}
                </p>
              </div>
              <Navigation className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transform rotate-45 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-32 md:pb-16 w-full min-w-0">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/passenger"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-xs transition-all active:scale-95 shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Find Available Rides
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Search and book verified fleet seats across Konkan, Mumbai & Pune
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto pl-12 sm:pl-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Seat Booking
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            100% AC Fleet
          </span>
        </div>
      </div>

      {/* ── Search Form (Hero Variant) ── */}
      <SearchForm
        variant="hero"
        initialFilters={filters}
        onSearch={handleSearch}
      />

      {/* ── Search Summary & Filters Toggle ── */}
      {hasSearched && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
              <Compass className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {isLoading
                    ? 'Searching verified fleet routes...'
                    : hasExact
                    ? `${exactMatches.length} Direct Ride${exactMatches.length !== 1 ? 's' : ''} Available`
                    : 'Suggested Route Options'}
                </p>
                {hasExact && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                )}
              </div>
              {(filters.origin || filters.destination) && (
                <p className="text-[11px] text-slate-500 truncate max-w-[220px] sm:max-w-md">
                  {filters.origin ? filters.origin.split(',')[0] : 'Any'} →{' '}
                  {filters.destination ? filters.destination.split(',')[0] : 'Any'}
                  {filters.date ? ` • ${filters.date}` : ''}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border select-none shrink-0",
              showFilters
                ? "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/10"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs active:scale-95"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{showFilters ? 'Hide Filters' : 'More Filters'}</span>
          </button>
        </div>
      )}

      {/* ── Advanced Filters Drawer ── */}
      {showFilters && hasSearched && (
        <div className="animate-in fade-in-50 duration-200">
          <TripFilter
            filters={filters}
            onChange={setFilters}
            onReset={() => {
              setFilters({});
              searchTrips({});
            }}
            onApply={() => searchTrips(filters)}
          />
        </div>
      )}

      {/* ── Loading State ── */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-4 w-44 bg-slate-200 rounded animate-pulse" />
          <TripList trips={[]} isLoading={true} />
        </div>
      ) : hasSearched && !hasAnyResults ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">No direct trips scheduled yet</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
              We couldn't find a direct ride for this exact date and route. Try modifying your date or choose one of our verified daily corridors below.
            </p>
          </div>
          {popularRoutes.length > 0 && renderPopularRoutes()}
        </div>
      ) : hasSearched ? (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
          {/* Banner if only partial / alternative matches found */}
          {!hasExact && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm">Alternative Corridor Matches</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  While no 100% direct ride matched, we found verified rides that pass through or near your boarding points.
                </p>
              </div>
            </div>
          )}

          {/* 1. Direct/Exact Match */}
          {hasExact && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available Trips</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  {exactMatches.length} {exactMatches.length === 1 ? 'ride' : 'rides'} ready
                </span>
              </div>
              <TripList
                trips={exactMatches}
                onBook={handleBookTrip}
              />
            </div>
          )}

          {/* 2. Partial Route Match */}
          {hasPartial && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Suggested Trips: Partial Route Matches</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rides passing through stops on your desired path
                </p>
              </div>
              <TripList
                trips={partialMatches}
                onBook={handleBookTrip}
              />
            </div>
          )}

          {/* 3. Nearby Departure */}
          {hasNearbyDeparture && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Nearby Departure Locations</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rides departing near your requested pickup point
                </p>
              </div>
              <TripList
                trips={nearbyDeparture}
                onBook={handleBookTrip}
              />
            </div>
          )}

          {/* 4. Nearby Destination */}
          {hasNearbyDestination && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Nearby Destination Locations</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rides arriving close to your requested destination
                </p>
              </div>
              <TripList
                trips={nearbyDestination}
                onBook={handleBookTrip}
              />
            </div>
          )}

          {/* 5. Similar Routes */}
          {hasSimilar && !hasExact && !hasPartial && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Alternative Regional Routes</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Similar verified rides available in the same corridor
                </p>
              </div>
              <TripList
                trips={similarRoutes}
                onBook={handleBookTrip}
              />
            </div>
          )}

          {totalCount > 10 && (
            <Pagination
              currentPage={filters.page || 1}
              totalPages={Math.ceil(totalCount / 10)}
              onPageChange={(page) => searchTrips({ ...filters, page })}
              totalItems={totalCount}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Start your ride search</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
              Enter pickup, destination, and select date to view live available seats.
            </p>
          </div>
          {popularRoutes.length > 0 && renderPopularRoutes()}
        </div>
      )}
    </div>
  );
}

export default function TripSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Loading trip search...</span>
          </div>
        </div>
      }
    >
      <TripSearchContent />
    </Suspense>
  );
}
