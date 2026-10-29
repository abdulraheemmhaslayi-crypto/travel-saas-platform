'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useTripStore } from '@/store/slices/tripSlice';
import TripList from '@/components/trips/TripList';
import TripFilter from '@/components/trips/TripFilter';
import SearchForm from '@/components/trips/SearchForm';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { MapPin, Filter } from 'lucide-react';

export default function TripsPage() {
  const { trips, filters, totalCount, isLoading, searchTrips, setFilters } = useTripStore();
  const [showFilters, setShowFilters] = React.useState(false);

  useEffect(() => {
    searchTrips();
  }, [searchTrips]);

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    searchTrips({ ...filters, page });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Trips</h1>
          <p className="text-gray-600 mt-1">Find and book your next journey</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<Filter className="w-4 h-4" />}
        >
          Filters
        </Button>
      </div>

      <SearchForm
        initialFilters={filters}
        onSearch={(newFilters) => {
          setFilters(newFilters);
          searchTrips(newFilters);
        }}
      />

      {showFilters && (
        <TripFilter
          filters={filters}
          onChange={setFilters}
          onReset={() => {
            setFilters({});
            searchTrips({});
          }}
          onApply={() => searchTrips(filters)}
        />
      )}

      <TripList
        trips={trips}
        isLoading={isLoading}
        onBook={(tripId) => {
          window.location.href = `/dashboard/trips/${tripId}`;
        }}
      />

      {totalCount > 10 && (
        <Pagination
          currentPage={filters.page || 1}
          totalPages={Math.ceil(totalCount / 10)}
          onPageChange={handlePageChange}
          totalItems={totalCount}
        />
      )}
    </div>
  );
}