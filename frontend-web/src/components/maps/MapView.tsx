import React, { useEffect, useRef } from 'react';
import { useGoogleMaps, googleMapsApiKey } from '@/lib/mapConfig';
import { loadGooglePlaces } from './googleLoader';

export type LatLng = { lat: number; lng: number };
export type MapMarker = {
  id?: string;
  position: LatLng;
  popup?: string;
  iconHtml?: string;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
};

type Props = {
  center?: LatLng;
  markers?: MapMarker[];
  route?: LatLng[];
  zoom?: number;
  height?: string;
  className?: string;
};

export default function MapView({
  center = { lat: 20, lng: 78 },
  markers = [],
  route = [],
  zoom = 13,
  height = '300px',
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any>({ markers: [], polyline: null });

  useEffect(() => {
    let mounted = true;

    const initGoogle = async () => {
      try {
        await loadGooglePlaces(googleMapsApiKey);
        if (!mounted || !(window as any).google) return;
        const g = (window as any).google;
        mapRef.current = new g.maps.Map(ref.current, {
          center,
          zoom,
          disableDefaultUI: true,
          zoomControl: false,
        });

        // add markers
        layersRef.current.markers = markers.map((m) => {
          const mk = new g.maps.Marker({ position: m.position, map: mapRef.current });
          if (m.popup) {
            const inf = new g.maps.InfoWindow({ content: m.popup });
            mk.addListener('click', () => inf.open(mapRef.current, mk));
          }
          return mk;
        });

        if (route && route.length >= 2) {
          layersRef.current.polyline = new g.maps.Polyline({
            path: route,
            geodesic: true,
            strokeColor: '#2563eb',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });
          layersRef.current.polyline.setMap(mapRef.current);

          const bounds = new g.maps.LatLngBounds();
          route.forEach((p) => bounds.extend(p));
          mapRef.current.fitBounds(bounds);
        }
      } catch (err) {
        console.warn('Google Maps init failed', err);
      }
    };

    const initLeaflet = async () => {
      try {
        const L = await import('leaflet');
        if (!mounted || !ref.current) return;

        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        mapRef.current = L.map(ref.current as HTMLElement, {
          zoomControl: false,
          attributionControl: false,
        }).setView([center.lat, center.lng], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(mapRef.current);

        layersRef.current.markers = markers.map((m) => {
          let opts: any = {};
          if (m.iconHtml) {
            opts.icon = L.divIcon({
              html: m.iconHtml,
              className: 'custom-map-icon',
              iconSize: m.iconSize || [36, 36],
              iconAnchor: m.iconAnchor || [18, 18],
            });
          }
          const mk = L.marker([m.position.lat, m.position.lng], opts).addTo(mapRef.current);
          if (m.popup) mk.bindPopup(m.popup);
          return mk;
        });

        if (route && route.length >= 2) {
          layersRef.current.polyline = L.polyline(
            route.map((p) => [p.lat, p.lng]),
            { color: '#2563eb', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }
          ).addTo(mapRef.current);

          mapRef.current.fitBounds(layersRef.current.polyline.getBounds(), {
            padding: [40, 40],
            maxZoom: 15,
          });
        }
      } catch (err) {
        console.warn('Leaflet init failed', err);
      }
    };

    if (useGoogleMaps) initGoogle();
    else initLeaflet();

    return () => {
      mounted = false;
      try {
        if (!mapRef.current) return;
        if (useGoogleMaps) {
          layersRef.current.markers?.forEach((m: any) => m.setMap(null));
          layersRef.current.polyline?.setMap(null);
          mapRef.current = null;
        } else {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (e) {}
    };
  }, []);

  // update markers/route when props change
  useEffect(() => {
    if (!mapRef.current) return;
    if (useGoogleMaps) {
      const g = (window as any).google;
      if (!g) return;
      layersRef.current.markers?.forEach((m: any) => m.setMap(null));
      layersRef.current.markers = markers.map((m) => new g.maps.Marker({ position: m.position, map: mapRef.current }));
      if (layersRef.current.polyline) layersRef.current.polyline.setMap(null);
      if (route && route.length >= 2) {
        layersRef.current.polyline = new g.maps.Polyline({
          path: route,
          geodesic: true,
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 5,
        });
        layersRef.current.polyline.setMap(mapRef.current);
        const bounds = new g.maps.LatLngBounds();
        route.forEach((p) => bounds.extend(p));
        mapRef.current.fitBounds(bounds);
      } else if (center) {
        mapRef.current.setCenter(center);
      }
    } else {
      (async () => {
        const L = await import('leaflet');
        if (!mapRef.current) return;
        layersRef.current.markers?.forEach((m: any) => mapRef.current.removeLayer(m));
        layersRef.current.markers = markers.map((m) => {
          let opts: any = {};
          if (m.iconHtml) {
            opts.icon = L.divIcon({
              html: m.iconHtml,
              className: 'custom-map-icon',
              iconSize: m.iconSize || [36, 36],
              iconAnchor: m.iconAnchor || [18, 18],
            });
          }
          const mk = L.marker([m.position.lat, m.position.lng], opts).addTo(mapRef.current);
          if (m.popup) mk.bindPopup(m.popup);
          return mk;
        });

        if (layersRef.current.polyline) mapRef.current.removeLayer(layersRef.current.polyline);
        if (route && route.length >= 2) {
          layersRef.current.polyline = L.polyline(
            route.map((p) => [p.lat, p.lng]),
            { color: '#2563eb', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }
          ).addTo(mapRef.current);

          mapRef.current.fitBounds(layersRef.current.polyline.getBounds(), {
            padding: [40, 40],
            maxZoom: 15,
          });
        } else if (center) {
          mapRef.current.setView([center.lat, center.lng], mapRef.current.getZoom());
        }
      })();
    }
  }, [markers, route, center]);

  return <div ref={ref} className={className} style={{ width: '100%', height }} />;
}
