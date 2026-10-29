'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchFilters } from '@/types/trip';
import { Search, AlertCircle, ArrowLeftRight, Calendar, Users, MapPin } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/maps/SearchInput';

interface SearchFormProps {
  initialFilters?: SearchFilters;
  onSearch?: (filters: SearchFilters) => void;
  variant?: 'hero' | 'compact';
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

const SearchForm: React.FC<SearchFormProps> = ({
  initialFilters = {},
  onSearch,
  variant = 'compact',
}) => {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({
    origin: '',
    destination: '',
    date: '',
    seats: 1,
    ...initialFilters,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...initialFilters,
    }));
  }, [initialFilters]);

  const handleChange = (field: keyof SearchFilters, value: unknown) => {
    setErrorMsg(null);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSwap = () => {
    setErrorMsg(null);
    setFilters((prev) => ({
      ...prev,
      origin: prev.destination,
      originLat: prev.destLat,
      originLng: prev.destLng,
      destination: prev.origin,
      destLat: prev.originLat,
      destLng: prev.originLng,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (filters.origin && (!filters.originLat || !filters.originLng)) {
      setErrorMsg('Please select your starting location (From) from the suggestions.');
      return;
    }

    if (filters.destination && (!filters.destLat || !filters.destLng)) {
      setErrorMsg('Please select your destination (To) from the suggestions.');
      return;
    }

    if (onSearch) {
      onSearch(filters);
    } else {
      const params = new URLSearchParams();
      if (filters.origin) params.set('origin', filters.origin);
      if (filters.originLat) params.set('originLat', String(filters.originLat));
      if (filters.originLng) params.set('originLng', String(filters.originLng));
      if (filters.destination) params.set('destination', filters.destination);
      if (filters.destLat) params.set('destLat', String(filters.destLat));
      if (filters.destLng) params.set('destLng', String(filters.destLng));
      if (filters.date) params.set('date', filters.date);
      if (filters.seats) params.set('seats', String(filters.seats));
      router.push(`/dashboard/trips/search?${params.toString()}`);
    }
  };

  if (variant === 'hero') {
    return (
      <Card className="max-w-5xl mx-auto border border-gray-100 bg-white/95 backdrop-blur-sm overflow-visible relative" shadow="none">
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl" />
        <form onSubmit={handleSubmit} className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Where is your next adventure?
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Discover reliable trips, booked in seconds. Enforced location security checks apply.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end relative">
            {/* From Field */}
            <div className="lg:col-span-4 relative group">
              <SearchInput
                label="From"
                value={filters.origin || ''}
                required
                isSource
                onChange={(v) => {
                  handleChange('origin', v);
                  handleChange('originLat', undefined);
                  handleChange('originLng', undefined);
                }}
                onPlaceSelect={(address, lat, lng) => {
                  setFilters((prev) => ({
                    ...prev,
                    origin: address,
                    originLat: lat,
                    originLng: lng,
                  }));
                  setErrorMsg(null);
                }}
              />
            </div>

            {/* Swap Button */}
            <div className="flex justify-center lg:col-span-1 py-2 lg:py-0 lg:mb-2">
              <button
                type="button"
                onClick={handleSwap}
                tabIndex={-1}
                className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 hover:bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm hover:shadow transition-all duration-200 hover:rotate-180 transform"
                title="Swap Locations"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* To Field */}
            <div className="lg:col-span-4 relative group">
              <SearchInput
                label="To"
                value={filters.destination || ''}
                required
                onChange={(v) => {
                  handleChange('destination', v);
                  handleChange('destLat', undefined);
                  handleChange('destLng', undefined);
                }}
                onPlaceSelect={(address, lat, lng) => {
                  setFilters((prev) => ({
                    ...prev,
                    destination: address,
                    destLat: lat,
                    destLng: lng,
                  }));
                  setErrorMsg(null);
                }}
              />
            </div>

            {/* Date Field */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Date
              </label>
              <DatePicker
                value={parseLocalDate(filters.date)}
                onChange={(date) => handleChange('date', formatLocalDate(date))}
                placeholder="When?"
                minDate={new Date()}
                className="w-full"
              />
            </div>

            {/* Seats Field */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                Seats
              </label>
              <select
                value={filters.seats || 1}
                onChange={(e) => handleChange('seats', Number(e.target.value))}
                className="input-field cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} seat{num !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="lg:col-span-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl text-white shadow-none font-semibold">
                <Search className="w-5 h-5 mr-2 inline" />
                Find Available Trips
              </Button>
            </div>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full bg-white p-5 rounded-2xl border border-gray-100">
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-sm text-red-700 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* From */}
        <div className="md:col-span-4 relative">
          <SearchInput
            label="From"
            value={filters.origin || ''}
            required
            isSource
            onChange={(v) => {
              handleChange('origin', v);
              handleChange('originLat', undefined);
              handleChange('originLng', undefined);
            }}
            onPlaceSelect={(address, lat, lng) => {
              setFilters((prev) => ({
                ...prev,
                origin: address,
                originLat: lat,
                originLng: lng,
              }));
              setErrorMsg(null);
            }}
          />
        </div>

        {/* Swap (In between on desktop, stacked on mobile) */}
        <div className="md:col-span-1 flex justify-center pb-2">
          <button
            type="button"
            onClick={handleSwap}
            tabIndex={-1}
            className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 hover:bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-all duration-200 hover:rotate-180 transform"
            title="Swap Locations"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* To */}
        <div className="md:col-span-4 relative">
          <SearchInput
            label="To"
            value={filters.destination || ''}
            required
            onChange={(v) => {
              handleChange('destination', v);
              handleChange('destLat', undefined);
              handleChange('destLng', undefined);
            }}
            onPlaceSelect={(address, lat, lng) => {
              setFilters((prev) => ({
                ...prev,
                destination: address,
                destLat: lat,
                destLng: lng,
              }));
              setErrorMsg(null);
            }}
          />
        </div>

        {/* Date */}
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            Date
          </label>
          <DatePicker
            value={parseLocalDate(filters.date)}
            onChange={(date) => handleChange('date', formatLocalDate(date))}
            placeholder="Date"
            minDate={new Date()}
            className="w-full"
          />
        </div>

        {/* Seats */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            Seats
          </label>
          <select
            value={filters.seats || 1}
            onChange={(e) => handleChange('seats', Number(e.target.value))}
            className="input-field cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} seat{num !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="md:col-span-10">
          <Button type="submit" className="w-full h-11 rounded-xl shadow-none font-semibold">
            <Search className="w-4 h-4 mr-2 inline" />
            Search
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchForm;