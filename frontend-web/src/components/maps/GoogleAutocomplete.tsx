import React, { useEffect, useRef } from 'react';
import { loadGooglePlaces } from './googleLoader';
import { googleMapsApiKey } from '@/lib/mapConfig';

type Props = {
  label: string;
  value: string;
  onPlaceSelect: (address: string, lat: number, lng: number) => void;
  onChange: (v: string) => void;
  required?: boolean;
};

export default function GoogleAutocomplete({ label, value, onPlaceSelect, onChange, required }: Props) {
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
    return () => {
      // no-op
    };
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          selectedRef.current = false;
          onChange(e.target.value);
        }}
        onBlur={() => {
          if (!selectedRef.current) {
            onChange('');
          }
        }}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        required={required}
        placeholder={required ? 'Start typing and choose a suggestion' : 'Start typing and choose a suggestion'}
      />
    </div>
  );
}
