'use client';

import React, { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import apiClient from '@/lib/api';
import LiveMap from '@/components/tracking/LiveMap';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/common/Loading';
import { MapPin, Compass, RefreshCcw } from 'lucide-react';

export default function FleetOwnerLiveTrackingPage() {
  const { latitude, longitude, error: geoError, startWatching, stopWatching } = useGeolocation();
  const [nearbyVehicles, setNearbyVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (latitude && longitude) {
      fetchNearbyVehicles();
    }
  }, [latitude, longitude]);

  const fetchNearbyVehicles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getNearbyVehicles({ lat: latitude, lng: longitude, radius: 10000 });
      setNearbyVehicles(Array.isArray(response.data) ? response.data : []);
    } catch {
      setNearbyVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchNearbyVehicles();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor nearby fleet vehicles in real time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={startWatching}>
            <Compass className="w-4 h-4 mr-2" />
            Share Location
          </Button>
        </div>
      </div>

      {geoError ? (
        <Card>
          <div className="p-6 text-sm text-red-600">{geoError}</div>
        </Card>
      ) : latitude && longitude ? (
        <LiveMap
          locations={nearbyVehicles.map((vehicle) => ({
            tripId: vehicle.id || vehicle.vehicleId || 'vehicle',
            latitude: vehicle.latitude || vehicle.lat,
            longitude: vehicle.longitude || vehicle.lng,
            timestamp: vehicle.updatedAt || new Date().toISOString(),
          }))}
          currentLocation={latitude && longitude ? { tripId: 'me', latitude, longitude, timestamp: new Date().toISOString() } : undefined}
          destination={{ lat: latitude, lng: longitude }}
        />
      ) : (
        <Loading text="Waiting for location..." />
      )}

      <Card>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>Your location: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-2">Loading nearby vehicles...</div>
            ) : nearbyVehicles.length === 0 ? (
              <div className="col-span-2 text-gray-500">No nearby vehicles found.</div>
            ) : nearbyVehicles.map((vehicle) => (
              <div key={vehicle.id || vehicle.driverId || `${vehicle.latitude}-${vehicle.longitude}`} className="rounded-xl border border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{vehicle.registrationNumber || vehicle.vehicleName || 'Vehicle'}</p>
                    <p className="text-xs text-gray-500">Driver: {vehicle.driverName || vehicle.driver || 'Unknown'}</p>
                  </div>
                  <span className="text-xs text-gray-500">{vehicle.distance ? `${vehicle.distance.toFixed(1)} km` : 'Nearby'}</span>
                </div>
                <p className="text-sm text-gray-600">{vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
