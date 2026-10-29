import React, { useEffect, useRef, useState } from 'react';

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  label: string;
  value: string;
  onPlaceSelect: (address: string, lat: number, lng: number) => void;
  onChange: (v: string) => void;
  required?: boolean;
};

export default function OSMAutocomplete({ label, value, onPlaceSelect, onChange, required }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [show, setShow] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!value) {
      setSuggestions([]);
      return;
    }
    controllerRef.current?.abort();
    const c = new AbortController();
    controllerRef.current = c;
    const q = encodeURIComponent(value);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=5`;
    fetch(url, { signal: c.signal, headers: { 'Accept-Language': 'en' } })
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data || []);
        setShow(true);
      })
      .catch(() => {
        setSuggestions([]);
      });
  }, [value]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onBlur={() => {
          // hide suggestions shortly after blur to allow click
          setTimeout(() => setShow(false), 150);
        }}
        onFocus={() => {
          if (suggestions.length) setShow(true);
        }}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        required={required}
        placeholder={required ? 'Start typing and choose a suggestion' : 'Start typing and choose a suggestion'}
      />

      {show && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 bg-white border border-gray-200 max-h-60 overflow-auto mt-1 rounded shadow">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPlaceSelect(s.display_name, parseFloat(s.lat), parseFloat(s.lon));
                setShow(false);
              }}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
