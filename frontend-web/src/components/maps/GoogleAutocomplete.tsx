'use client';

import React, { useEffect, useRef } from 'react';
import { loadGooglePlaces } from './googleLoader';
import { googleMapsApiKey } from '@/lib/mapConfig';
import { Navigation, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OSMAutocompleteProps } from './OSMAutocomplete';

export default function GoogleAutocomplete({
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedRef = useRef(false);

  useEffect(() => {
    let autocomplete: any;
    const init = async () => {
      try {
        await loadGooglePlaces(googleMapsApiKey);
        if (!(window as any).google) return;
        if (!inputRef.current) return;
        autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, { types: ['geocode'] });
        autocomplete.setFields(['geometry', 'formatted_address', 'name']);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place || !place.geometry) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || inputRef.current?.value || '';
          selectedRef.current = true;
          onPlaceSelect(address, lat, lng);
        });
      } catch (err) {
        console.warn('Google Places failed to load', err);
      }
    };
    init();
  }, [onPlaceSelect]);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative w-full', className)}>
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

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            selectedRef.current = false;
            onChange(e.target.value);
          }}
          placeholder={placeholder || (isSource ? 'Pickup city or address' : 'Dropoff city or address')}
          required={required}
          className={cn(
            'w-full bg-white rounded-xl border border-gray-200/90 text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 py-2.5 transition-all shadow-2xs',
            'pl-3 sm:pl-3.5',
            onUseCurrentLocation ? 'pr-24' : value ? 'pr-9' : 'pr-3'
          )}
        />

        <div className="absolute right-2 flex items-center gap-1.5 z-10">
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
    </div>
  );
}
