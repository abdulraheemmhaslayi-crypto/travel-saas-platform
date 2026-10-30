'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Car, Clock, Navigation, Plus, Minus, Info, Layers } from 'lucide-react';

interface PassengerTripMapProps {
  origin: string;
  destination: string;
  duration?: string;
  distance?: string;
  estimatedFare?: string;
  onBookTrip: () => void;
}

export default function PassengerTripMap({
  origin,
  destination,
  duration = '35 min',
  distance = '18 km',
  estimatedFare = '₹450 - ₹550',
  onBookTrip,
}: PassengerTripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Leaflet map safely on client
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      try {
        // Inject Leaflet CSS if not already present
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const L = (await import('leaflet')).default;
        if (!isMounted || !mapContainerRef.current) return;

        // Cleanup existing map instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Mumbai center coordinates
        const map = L.map(mapContainerRef.current, {
          center: [19.015, 72.84],
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        });
        mapInstanceRef.current = map;

        // Tile layer
        const tileUrl =
          mapType === 'map'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

        L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

        // Realistic route points from Colaba to Airport via Worli & Western Express Highway
        const routeCoords: [number, number][] = [
          [18.9067, 72.8147], // Colaba
          [18.9322, 72.8264], // Churchgate
          [18.9553, 72.8122], // Marine Drive
          [18.9754, 72.8115], // Haji Ali
          [19.0068, 72.8166], // Worli Sea Face
          [19.0345, 72.8198], // Bandra-Worli Sea Link
          [19.0596, 72.8295], // Bandra West
          [19.0682, 72.8456], // Western Express Highway
          [19.0896, 72.8656], // Airport Terminal 2
        ];

        // Draw Route Polyline
        const routeLine = L.polyline(routeCoords, {
          color: '#2563eb',
          weight: 4.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        // 1. Origin Marker (Blue pulsing circle)
        const originIcon = L.divIcon({
          className: 'custom-origin-icon',
          html: `
            <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 22px; height: 22px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 14px; height: 14px; background: #2563eb; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker(routeCoords[0], { icon: originIcon }).addTo(map);

        // 2. Destination Marker (Red pin with airport label)
        const destIcon = L.divIcon({
          className: 'custom-dest-icon',
          html: `
            <div style="display: flex; align-items: center; gap: 6px; transform: translate(-8px, -24px);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="1.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
              <span style="background: white; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #1e293b; box-shadow: 0 2px 6px rgba(0,0,0,0.15); white-space: nowrap;">
                Chhatrapati Shivaji Maharaj International Airport
              </span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        });
        L.marker(routeCoords[routeCoords.length - 1], { icon: destIcon }).addTo(map);

        // 3. Car Marker along the route
        const carIcon = L.divIcon({
          className: 'custom-car-icon',
          html: `
            <div style="width: 28px; height: 28px; background: #0f172a; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        L.marker(routeCoords[4], { icon: carIcon }).addTo(map);

        // 4. Trip duration badge on route
        const badgeIcon = L.divIcon({
          className: 'custom-badge-icon',
          html: `
            <div style="background: white; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #0f172a; box-shadow: 0 2px 10px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 6px; border: 1px solid #e2e8f0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <span>${duration} • ${distance}</span>
            </div>
          `,
          iconSize: [110, 26],
          iconAnchor: [55, 13],
        });
        L.marker(routeCoords[5], { icon: badgeIcon }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
        setMapLoaded(true);
      } catch (err) {
        console.warn('Leaflet failed to load, using graceful fallback', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapType, duration, distance]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapInstanceRef.current?.setView([19.015, 72.84], 12);
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-100">
      {/* Map Canvas / Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Right Map Style Switcher (Map / Satellite) */}
      <div className="absolute top-4 right-4 z-10 flex bg-white/95 backdrop-blur-sm rounded-lg p-1 shadow-md border border-slate-200/80 text-xs font-semibold">
        <button
          onClick={() => setMapType('map')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            mapType === 'map'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setMapType('satellite')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            mapType === 'satellite'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Bottom Right Controls (Zoom + / -, Locate) */}
      <div className="absolute bottom-28 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/80 flex flex-col overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors border-b border-slate-100"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleRecenter}
          className="p-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center justify-center"
          title="Center Location"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Ride Preview Card (Bottom Right on map matching image) */}
      <div className="absolute bottom-4 right-4 z-10 w-[310px] bg-white rounded-2xl p-4 shadow-xl border border-slate-200/80">
        <div className="flex items-center gap-3 mb-2.5">
          {/* White Sedan Car Thumbnail */}
          <div className="w-16 h-12 bg-slate-50 rounded-xl flex items-center justify-center p-1 border border-slate-100 overflow-hidden flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80"
              alt="Standard Sedan"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">Standard</h4>
            <p className="text-[11px] text-slate-500 truncate">Comfortable for everyday travel</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-extrabold text-slate-900">{estimatedFare}</span>
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Duration & Distance Indicators */}
        <div className="flex items-center gap-4 text-xs text-slate-600 py-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{distance}</span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={onBookTrip}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          Book this trip
        </button>
      </div>
    </div>
  );
}

