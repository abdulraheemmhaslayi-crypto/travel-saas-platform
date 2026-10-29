import React, { useEffect, useRef } from 'react';
import { useGoogleMaps, googleMapsApiKey } from '@/lib/mapConfig';
import { loadGooglePlaces } from './googleLoader';

type LatLng = { lat: number; lng: number };
type Marker = { id?: string; position: LatLng; popup?: string };

type Props = {
  center?: LatLng;
  markers?: Marker[];
  route?: LatLng[];
  zoom?: number;
  height?: string;
};

export default function MapView({ center = { lat: 20, lng: 78 }, markers = [], route = [], zoom = 6, height = '300px' }: Props) {
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
        mapRef.current = new g.maps.Map(ref.current, { center, zoom });
        // add markers
        layersRef.current.markers = markers.map((m) => {
          const mk = new g.maps.Marker({ position: m.position, map: mapRef.current });
          if (m.popup) {
            const inf = new g.maps.InfoWindow({ content: m.popup });
            mk.addListener('click', () => inf.open(mapRef.current, mk));
          }
          return mk;
        });
        if (route && route.length) {
          layersRef.current.polyline = new g.maps.Polyline({ path: route, geodesic: true, strokeColor: '#FF0000', strokeOpacity: 1.0, strokeWeight: 2 });
          layersRef.current.polyline.setMap(mapRef.current);
        }
      } catch (err) {
        console.warn('Google Maps init failed', err);
      }
    };

    const initLeaflet = async () => {
      try {
        const L = await import('leaflet');
        if (!mounted) return;
        // ensure leaflet css is present — user should import in global css, but we try to inject minimal
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        mapRef.current = L.map(ref.current as HTMLElement).setView([center.lat, center.lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current);
        layersRef.current.markers = markers.map((m) => {
          const mk = L.marker([m.position.lat, m.position.lng]).addTo(mapRef.current);
          if (m.popup) mk.bindPopup(m.popup);
          return mk;
        });
        if (route && route.length) {
          layersRef.current.polyline = L.polyline(route.map((p) => [p.lat, p.lng]), { color: 'red' }).addTo(mapRef.current);
        }
      } catch (err) {
        console.warn('Leaflet init failed', err);
      }
    };

    // initialize appropriate provider
    if (useGoogleMaps) initGoogle(); else initLeaflet();

    return () => {
      mounted = false;
      try {
        if (!mapRef.current) return;
        if (useGoogleMaps) {
          // clear google map overlays
          layersRef.current.markers?.forEach((m: any) => m.setMap(null));
          layersRef.current.polyline?.setMap(null);
          mapRef.current = null;
        } else {
          // leaflet
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
      layersRef.current.markers?.forEach((m: any) => m.setMap(null));
      layersRef.current.markers = markers.map((m) => new g.maps.Marker({ position: m.position, map: mapRef.current }));
      if (layersRef.current.polyline) layersRef.current.polyline.setMap(null);
      if (route && route.length) {
        layersRef.current.polyline = new g.maps.Polyline({ path: route, geodesic: true, strokeColor: '#FF0000', strokeOpacity: 1.0, strokeWeight: 2 });
        layersRef.current.polyline.setMap(mapRef.current);
      }
      if (center) mapRef.current.setCenter(center);
    } else {
      (async () => {
        const L = await import('leaflet');
        layersRef.current.markers?.forEach((m: any) => mapRef.current.removeLayer(m));
        layersRef.current.markers = markers.map((m) => L.marker([m.position.lat, m.position.lng]).addTo(mapRef.current));
        if (layersRef.current.polyline) mapRef.current.removeLayer(layersRef.current.polyline);
        if (route && route.length) layersRef.current.polyline = L.polyline(route.map((p) => [p.lat, p.lng]), { color: 'red' }).addTo(mapRef.current);
        if (center) mapRef.current.setView([center.lat, center.lng], mapRef.current.getZoom());
      })();
    }
  }, [markers, route, center]);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
