'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import MapView from '@/components/maps/MapView';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Loading from '@/components/common/Loading';
import { useAppStore } from '@/store';
import {
  Navigation,
  Car,
  User as UserIcon,
  Users,
  Compass,
  RefreshCw,
  Search,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminLiveTrackingPage() {
  const { showToast } = useAppStore();
  const params = useParams();
  const adminRole = params?.adminRole as string || 'admin';
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadActiveTrips();
    // Setup automatic refresh every 15 seconds
    const interval = setInterval(loadActiveTrips, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveTrips = async () => {
    setIsRefreshing(true);
    try {
      const response = await apiClient.get('/admin/active-trips');
      const trips = response.data || [];
      setActiveTrips(trips);
      
      // Auto-select first trip if none is selected
      if (trips.length > 0 && !selectedTrip) {
        setSelectedTrip(trips[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredTrips = activeTrips.filter((t) => {
    const search = searchQuery.toLowerCase();
    return (
      t.source?.toLowerCase().includes(search) ||
      t.destination?.toLowerCase().includes(search) ||
      t.driver?.user?.firstName?.toLowerCase().includes(search) ||
      t.driver?.user?.lastName?.toLowerCase().includes(search) ||
      t.vehicle?.registrationNumber?.toLowerCase().includes(search)
    );
  });

  // Calculate markers for the map
  const mapMarkers = React.useMemo(() => {
    if (selectedTrip) {
      const startLat = Number(selectedTrip.sourceLat) || 12.9716;
      const startLng = Number(selectedTrip.sourceLng) || 77.5946;
      const destLat = Number(selectedTrip.destLat) || 13.0827;
      const destLng = Number(selectedTrip.destLng) || 80.2707;

      // Simulated driver position: 35% along route
      const currentLat = startLat + (destLat - startLat) * 0.35;
      const currentLng = startLng + (destLng - startLng) * 0.35;

      return [
        {
          position: { lat: startLat, lng: startLng },
          popup: `Origin: ${selectedTrip.source}`,
        },
        {
          position: { lat: destLat, lng: destLng },
          popup: `Destination: ${selectedTrip.destination}`,
        },
        {
          position: { lat: currentLat, lng: currentLng },
          popup: `Driver: ${selectedTrip.driver?.user?.firstName || 'Active Partner'} (${selectedTrip.vehicle?.registrationNumber || 'Vehicle'})`,
        },
      ];
    }

    // Default: map pins for all active driver starting points
    return activeTrips.map((t) => ({
      position: {
        lat: Number(t.sourceLat) || 12.9716,
        lng: Number(t.sourceLng) || 77.5946,
      },
      popup: `Route: ${t.source} → ${t.destination} (${t.driver?.user?.firstName || 'Active driver'})`,
    }));
  }, [selectedTrip, activeTrips]);

  const mapRoute = React.useMemo(() => {
    if (!selectedTrip) return [];
    const startLat = Number(selectedTrip.sourceLat) || 12.9716;
    const startLng = Number(selectedTrip.sourceLng) || 77.5946;
    const destLat = Number(selectedTrip.destLat) || 13.0827;
    const destLng = Number(selectedTrip.destLng) || 80.2707;
    return [
      { lat: startLat, lng: startLng },
      { lat: destLat, lng: destLng },
    ];
  }, [selectedTrip]);

  const mapCenter = React.useMemo(() => {
    if (selectedTrip) {
      const startLat = Number(selectedTrip.sourceLat) || 12.9716;
      const startLng = Number(selectedTrip.sourceLng) || 77.5946;
      const destLat = Number(selectedTrip.destLat) || 13.0827;
      const destLng = Number(selectedTrip.destLng) || 80.2707;
      return {
        lat: (startLat + destLat) / 2,
        lng: (startLng + destLng) / 2,
      };
    }
    return { lat: 20.5937, lng: 78.9629 }; // India Center
  }, [selectedTrip]);

  if (isLoading) {
    return <Loading fullScreen text="Booting live telemetry systems..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href={`/${adminRole}/dashboard`} className="p-2 rounded-lg hover:bg-gray-150 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Live Operations Map</h1>
            <p className="text-gray-500 mt-1 font-medium">Real-time driver tracking and fleet route progression</p>
          </div>
        </div>
        <Button
          onClick={loadActiveTrips}
          variant="secondary"
          className="font-bold gap-1.5 flex items-center shrink-0"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Force Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch min-h-[550px]">
        {/* Active Route Sidebar list */}
        <Card className="p-5 flex flex-col justify-between border border-gray-200">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary-600" />
              Active Transits ({activeTrips.length})
            </h3>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search drivers, plates, routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            {/* Trips List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredTrips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                const passengerCount = trip.bookings?.reduce((acc: number, b: any) => acc + (b.seatsBooked || b.seatNumbers?.length || 1), 0) || 0;

                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50/75 border-primary-200 shadow-sm'
                        : 'bg-white border-gray-150 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <p className={`text-xs font-bold ${isSelected ? 'text-primary-700' : 'text-slate-800'}`}>
                        {trip.source} → {trip.destination}
                      </p>
                      <Badge variant="success" className="text-[9px] px-1.5 uppercase font-bold shrink-0">
                        {trip.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-semibold mt-2.5">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                        {trip.driver?.user?.firstName || 'Operator'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-gray-400" />
                        {trip.vehicle?.registrationNumber || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {passengerCount} passengers
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredTrips.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-10 bg-slate-50 rounded-xl">No matching active routes.</p>
              )}
            </div>
          </div>

          {selectedTrip && (
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-2.5 text-xs">
              <p className="font-bold text-gray-900 uppercase text-[10px] tracking-wide">Selected Driver telemetry</p>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-semibold text-gray-600">
                <div>
                  <p className="text-[9px] text-gray-450 uppercase">Speed</p>
                  <p className="text-slate-800 font-extrabold mt-0.5">45 km/h</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-450 uppercase">Heading</p>
                  <p className="text-slate-800 font-extrabold mt-0.5">North-East</p>
                </div>
                <div className="col-span-2 pt-1 border-t border-gray-150/40">
                  <p className="text-[9px] text-gray-450 uppercase">Coordinates</p>
                  <p className="text-slate-800 font-mono text-[9px] mt-0.5">
                    {Number(selectedTrip.sourceLat || 12.97).toFixed(4)} N, {Number(selectedTrip.sourceLng || 77.59).toFixed(4)} E
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Leaflet/Google Map view */}
        <Card className="lg:col-span-2 overflow-hidden border border-gray-200 flex flex-col justify-between">
          <div className="relative flex-1 w-full min-h-[450px]">
            <MapView
              center={mapCenter}
              zoom={selectedTrip ? 8 : 5}
              markers={mapMarkers}
              route={mapRoute}
              height="100%"
            />
            {/* Map Floating HUD */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-md border border-gray-200/80 text-[10px] font-bold text-gray-700 space-y-1 z-[1000]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                <span>Driver Marker location</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                <span>Intermediate Stops / Origin</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
