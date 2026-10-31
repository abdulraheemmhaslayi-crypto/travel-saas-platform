'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchFilters } from '@/types/trip';
import { Search, AlertCircle, ArrowUpDown, ArrowLeftRight, Calendar, Users, Sparkles } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/maps/SearchInput';
import { cn } from '@/lib/utils';

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

  const todayStr = formatLocalDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDate(tomorrow);

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
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-lg shadow-gray-200/50 p-4 sm:p-6 lg:p-7 relative">
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-red-700 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* ── Route Input Section (Connected Pickup & Destination) ── */}
            <div className="relative space-y-2 sm:space-y-0 sm:grid sm:grid-cols-11 sm:gap-3 sm:items-center">
              {/* Pickup Location */}
              <div className="sm:col-span-5 relative">
                <SearchInput
                  label="Pickup Location"
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

              {/* Swap Button (Floating neatly between inputs) */}
              <div className="flex justify-center sm:col-span-1 -my-1 sm:my-0 sm:pt-6 z-10">
                <button
                  type="button"
                  onClick={handleSwap}
                  tabIndex={-1}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 border border-blue-200 hover:bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs hover:shadow transition-all duration-200 active:scale-90"
                  title="Swap Locations"
                  aria-label="Swap Locations"
                >
                  <ArrowUpDown className="w-4 h-4 sm:hidden" />
                  <ArrowLeftRight className="hidden sm:block w-4 h-4" />
                </button>
              </div>

              {/* Destination Location */}
              <div className="sm:col-span-5 relative">
                <SearchInput
                  label="Destination / Where to?"
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
            </div>

            {/* ── Date & Passenger Details Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 sm:gap-4 pt-1">
              {/* Date Field with quick tap chips */}
              <div className="col-span-1 sm:col-span-7">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] sm:text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Departure Date</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleChange('date', todayStr)}
                      className={cn(
                        'px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all active:scale-95',
                        filters.date === todayStr
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('date', tomorrowStr)}
                      className={cn(
                        'px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all active:scale-95',
                        filters.date === tomorrowStr
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      Tmrw
                    </button>
                  </div>
                </div>
                <DatePicker
                  value={parseLocalDate(filters.date)}
                  onChange={(date) => handleChange('date', formatLocalDate(date))}
                  placeholder="Select Date"
                  minDate={new Date()}
                  className="w-full text-xs sm:text-sm h-10"
                />
              </div>

              {/* Seats Field */}
              <div className="col-span-1 sm:col-span-5">
                <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Passengers</span>
                </label>
                <select
                  value={filters.seats || 1}
                  onChange={(e) => handleChange('seats', Number(e.target.value))}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-gray-900 text-xs sm:text-sm cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Search Available Rides Action Button ── */}
            <div className="pt-1.5">
              <button
                type="submit"
                className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Search Available Rides</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── Compact Variant (For internal search headers) ──────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/90 shadow-xs">
      {errorMsg && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-end">
        {/* From */}
        <div className="md:col-span-4 relative">
          <SearchInput
            label="Pickup"
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

        {/* Swap */}
        <div className="md:col-span-1 flex justify-center -my-1 md:my-0 pb-1 md:pb-2 z-10">
          <button
            type="button"
            onClick={handleSwap}
            tabIndex={-1}
            className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 hover:bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs transition-all active:scale-90"
            title="Swap Locations"
          >
            <ArrowUpDown className="w-3.5 h-3.5 md:hidden" />
            <ArrowLeftRight className="hidden md:block w-3.5 h-3.5" />
          </button>
        </div>

        {/* To */}
        <div className="md:col-span-4 relative">
          <SearchInput
            label="Destination"
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

        {/* Date & Seats side-by-side on mobile */}
        <div className="grid grid-cols-2 gap-2 md:contents">
          {/* Date */}
          <div className="col-span-1 md:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] sm:text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Date</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleChange('date', todayStr)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold transition-all',
                    filters.date === todayStr ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('date', tomorrowStr)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold transition-all',
                    filters.date === tomorrowStr ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  Tmrw
                </button>
              </div>
            </div>
            <DatePicker
              value={parseLocalDate(filters.date)}
              onChange={(date) => handleChange('date', formatLocalDate(date))}
              placeholder="Date"
              minDate={new Date()}
              className="w-full text-xs h-10"
            />
          </div>

          {/* Seats */}
          <div className="col-span-1 md:col-span-3">
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>Seats</span>
            </label>
            <select
              value={filters.seats || 1}
              onChange={(e) => handleChange('seats', Number(e.target.value))}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-medium text-gray-900 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} seat{num !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="md:col-span-9 mt-1 md:mt-0">
          <Button type="submit" className="w-full h-10 rounded-xl shadow-none font-bold text-xs sm:text-sm active:scale-[0.98] bg-blue-600 hover:bg-blue-700">
            <Search className="w-3.5 h-3.5 mr-1.5 inline" />
            Search Trips
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchForm;
