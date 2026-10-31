'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  X,
  Loader2,
  Navigation,
  Crosshair,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type Suggestion = {
  place_id?: number | string;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  };
};

export type OSMAutocompleteProps = {
  label?: string;
  value: string;
  onPlaceSelect: (address: string, lat: number, lng: number) => void;
  onChange: (v: string) => void;
  required?: boolean;
  isSource?: boolean;
  placeholder?: string;
  className?: string;
  onUseCurrentLocation?: () => void;
  isLocating?: boolean;
  onClear?: () => void;
};

// In-memory cache to make repeated searches instantaneous
const suggestionsCache = new Map<string, Suggestion[]>();

// Format primary and secondary address line for clean mobile display
function formatSuggestion(item: Suggestion): { primary: string; secondary: string; full: string } {
  if (item.address) {
    const primary =
      item.address.road ||
      item.address.suburb ||
      item.address.neighbourhood ||
      item.address.city ||
      item.address.town ||
      item.address.village ||
      item.name ||
      item.display_name.split(',')[0];

    const secondaryParts = [
      item.address.city !== primary ? item.address.city : null,
      item.address.state_district,
      item.address.state,
    ].filter(Boolean);

    const secondary = secondaryParts.length > 0 ? secondaryParts.join(', ') : item.address.country || '';
    const full = secondary ? `${primary}, ${secondary}` : primary;
    return { primary, secondary, full };
  }

  const parts = (item.display_name || '').split(',').map((s) => s.trim()).filter(Boolean);
  const primary = parts[0] || item.display_name;
  const secondary = parts.slice(1, 3).join(', ');
  const full = secondary ? `${primary}, ${secondary}` : primary;
  return { primary, secondary, full };
}

export default function OSMAutocomplete({
  label,
  value,
  onPlaceSelect,
  onChange,
  required,
  isSource,
  placeholder,
  className,
  onUseCurrentLocation,
  isLocating = false,
  onClear,
}: OSMAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const isSelectingRef = useRef<boolean>(false);

  // ─── Click / Touch Outside Handler (Closes dropdown without interfering with touches) ───
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShow(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, []);

  // ─── Debounced Fetching of Location Suggestions ──────────────────────────
  useEffect(() => {
    // If value was changed due to selecting a suggestion, DO NOT search again!
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const trimmed = (value || '').trim();

    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setShow(false);
      setIsLoading(false);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    // Check fast cache first
    const cacheKey = trimmed.toLowerCase();
    if (suggestionsCache.has(cacheKey)) {
      setSuggestions(suggestionsCache.get(cacheKey)!);
      setShow(true);
      setIsLoading(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      const currentReqId = ++requestIdRef.current;
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);

      try {
        const q = encodeURIComponent(trimmed);
        // Query Nominatim with address details and limit 6
        const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=6&countrycodes=in`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();

        // Stale response guard
        if (currentReqId === requestIdRef.current) {
          if (Array.isArray(data) && data.length > 0) {
            suggestionsCache.set(cacheKey, data);
            setSuggestions(data);
            setShow(true);
            setSelectedIndex(-1);
          } else {
            // Fallback global search if country code yielded no matches
            try {
              const fbUrl = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=6`;
              const fbRes = await fetch(fbUrl, {
                signal: controller.signal,
                headers: { 'Accept-Language': 'en' },
              });
              const fbData = await fbRes.json();
              if (currentReqId === requestIdRef.current && Array.isArray(fbData) && fbData.length > 0) {
                suggestionsCache.set(cacheKey, fbData);
                setSuggestions(fbData);
                setShow(true);
                setSelectedIndex(-1);
              } else {
                setSuggestions([]);
              }
            } catch {
              setSuggestions([]);
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && currentReqId === requestIdRef.current) {
          setSuggestions([]);
        }
      } finally {
        if (currentReqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 350); // 350ms debounce to prevent API flooding

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value]);

  // ─── Select a Suggestion ──────────────────────────────────────────────────
  const handleSelect = (item: Suggestion) => {
    isSelectingRef.current = true;
    abortControllerRef.current?.abort();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const { full } = formatSuggestion(item);

    // Close and clear immediately
    setShow(false);
    setSuggestions([]);
    setIsLoading(false);
    setSelectedIndex(-1);

    // Notify parent immediately
    onChange(full);
    onPlaceSelect(full, lat, lon);
  };

  // ─── Keyboard Navigation ──────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShow(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    setSuggestions([]);
    setShow(false);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Optional Label */}
      {label && (
        <label className="block text-xs font-bold text-gray-800 flex items-center justify-between gap-1.5 mb-1.5">
          <span className="flex items-center gap-1.5">
            {isSource ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-100 shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block ring-2 ring-rose-100 shrink-0" />
            )}
            <span>{label}</span>
          </span>

          {/* Quick link button if onUseCurrentLocation is provided for label row */}
          {onUseCurrentLocation && (
            <button
              type="button"
              onClick={onUseCurrentLocation}
              disabled={isLocating}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
            >
              <Navigation className={`w-3 h-3 text-blue-600 transform rotate-45 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use Current'}</span>
            </button>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            isSelectingRef.current = false;
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0 && !isSelectingRef.current) {
              setShow(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (isSource ? 'Pickup city or address' : 'Dropoff city or address')}
          required={required}
          className={cn(
            'w-full bg-white rounded-xl border border-gray-200/90 text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 py-2.5 transition-all shadow-2xs',
            'pl-3 sm:pl-3.5',
            onUseCurrentLocation ? 'pr-24' : value ? 'pr-9' : 'pr-3'
          )}
        />

        {/* Action Buttons Right Inside Input Field */}
        <div className="absolute right-2 flex items-center gap-1.5 z-10">
          {/* Loading Indicator */}
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
          )}

          {/* Dedicated "Use Current Location" Button Inside Pickup Field */}
          {onUseCurrentLocation && (
            <button
              type="button"
              onClick={onUseCurrentLocation}
              disabled={isLocating}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 shadow-2xs',
                isLocating
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200/80'
              )}
              title="Detect current location"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                  <span className="hidden sm:inline">GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3 text-blue-600 transform rotate-45" />
                  <span>GPS</span>
                </>
              )}
            </button>
          )}

          {/* Clear Button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 active:scale-90 transition-colors"
              title="Clear text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Autocomplete Suggestions Dropdown ─────────────────────────── */}
      {show && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-gray-200/90 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-fadeIn divide-y divide-gray-100">
          {suggestions.length === 0 && !isLoading && value.trim().length >= 2 && (
            <div className="p-3.5 text-center text-xs text-gray-400">
              No matching places found. Try another city or area name.
            </div>
          )}

          {suggestions.map((item, idx) => {
            const { primary, secondary } = formatSuggestion(item);
            const isHovered = selectedIndex === idx;

            return (
              <div
                key={item.place_id || idx}
                onPointerDown={(e) => {
                  e.preventDefault(); // Prevents input blur on mobile touch!
                  handleSelect(item);
                }}
                className={cn(
                  'p-3 sm:p-3.5 flex items-start gap-2.5 cursor-pointer transition-colors text-left select-none',
                  isHovered ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-gray-800'
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {primary}
                  </p>
                  {secondary && (
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate mt-0.5 leading-tight">
                      {secondary}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
