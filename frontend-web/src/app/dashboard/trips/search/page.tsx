'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTripStore } from '@/store/slices/tripSlice';
import SearchForm from '@/components/trips/SearchForm';
import TripList from '@/components/trips/TripList';
import TripFilter from '@/components/trips/TripFilter';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { Search, Filter, Compass, Navigation, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function TripSearchPage() {
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

  const hasSearched = filters.origin || filters.destination || filters.date;
  const hasExact = exactMatches && exactMatches.length > 0;
  const hasPartial = partialMatches && partialMatches.length > 0;
  const hasNearbyDeparture = nearbyDeparture && nearbyDeparture.length > 0;
  const hasNearbyDestination = nearbyDestination && nearbyDestination.length > 0;
  const hasSimilar = similarRoutes && similarRoutes.length > 0;
  const hasAnyResults = hasExact || hasPartial || hasNearbyDeparture || hasNearbyDestination || hasSimilar;

  const renderPopularRoutes = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-center gap-1.5">
          <Compass className="w-4 h-4 text-blue-500" />
          Popular Routes
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popularRoutes.slice(0, 4).map((route) => (
            <button
              key={route.id}
              onClick={() =>
                handleSearch({
                  origin: route.origin,
                  destination: route.destination,
                })
              }
              className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 text-left flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-sm text-gray-900">
                  {route.origin} → {route.destination}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  From {formatCurrency(route.avgPrice)}
                </p>
              </div>
              <Navigation className="w-4 h-4 text-blue-500 transform rotate-45" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Find Your Trip</h1>
        <p className="text-gray-400 mt-1 text-xs sm:text-sm">Simple, fast, and secure route bookings</p>
      </div>

      <SearchForm
        variant="hero"
        initialFilters={filters}
        onSearch={handleSearch}
      />

      {hasSearched && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            {isLoading 
              ? 'Searching for matching rides...' 
              : hasExact 
              ? `${exactMatches.length} direct ride${exactMatches.length !== 1 ? 's' : ''} found`
              : 'Showing alternative route matches'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'More Filters'}
          </Button>
        </div>
      )}

      {showFilters && hasSearched && (
        <div className="animate-slideDown">
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

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <TripList trips={[]} isLoading={true} />
        </div>
      ) : hasSearched && !hasAnyResults ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No trips found</h3>
          <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto">
            We couldn't find any trips for this route on this date. Try broadening your filter parameters, or look at our popular destinations.
          </p>
          {popularRoutes.length > 0 && renderPopularRoutes()}
        </div>
      ) : hasSearched ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Banner if no exact matches found */}
          {!hasExact && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">We couldn't find an exact trip for your route.</h4>
                <p className="text-xs text-amber-700 mt-1">
                  However, we have found alternative routes, nearby departure options, or partial stop matches.
                </p>
              </div>
            </div>
          )}

          {/* 1. Direct/Exact Match */}
          {hasExact && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Available Trips
              </h3>
              <TripList
                trips={exactMatches}
                onBook={(tripId) => {
                  window.location.href = `/dashboard/trips/${tripId}`;
                }}
              />
            </div>
          )}

          {/* 2. Partial Route Match */}
          {hasPartial && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Suggested Trips: Partial Route Matches
              </h3>
              <p className="text-xs text-gray-400 -mt-2">Rides passing through stops on your desired path</p>
              <TripList
                trips={partialMatches}
                onBook={(tripId) => {
                  window.location.href = `/dashboard/trips/${tripId}`;
                }}
              />
            </div>
          )}

          {/* 3. Nearby Departure */}
          {hasNearbyDeparture && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Suggested Trips: Nearby Departure Locations
              </h3>
              <p className="text-xs text-gray-400 -mt-2">Rides departing near your requested origin</p>
              <TripList
                trips={nearbyDeparture}
                onBook={(tripId) => {
                  window.location.href = `/dashboard/trips/${tripId}`;
                }}
              />
            </div>
          )}

          {/* 4. Nearby Destination */}
          {hasNearbyDestination && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Suggested Trips: Nearby Destination Locations
              </h3>
              <p className="text-xs text-gray-400 -mt-2">Rides arriving close to your requested destination</p>
              <TripList
                trips={nearbyDestination}
                onBook={(tripId) => {
                  window.location.href = `/dashboard/trips/${tripId}`;
                }}
              />
            </div>
          )}

          {/* 5. Similar Routes */}
          {hasSimilar && !hasExact && !hasPartial && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Suggested Trips: Alternative Routes
              </h3>
              <p className="text-xs text-gray-400 -mt-2">Similar rides available in the same region</p>
              <TripList
                trips={similarRoutes}
                onBook={(tripId) => {
                  window.location.href = `/dashboard/trips/${tripId}`;
                }}
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
        <div className="text-center py-12 animate-fadeIn bg-white rounded-2xl border border-gray-100 p-8">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Start your search</h3>
          <p className="text-gray-500 mb-6 text-sm">
            Enter your origin, destination, and departure date to find matching trips.
          </p>
          {popularRoutes.length > 0 && renderPopularRoutes()}
        </div>
      )}
    </div>
  );
}