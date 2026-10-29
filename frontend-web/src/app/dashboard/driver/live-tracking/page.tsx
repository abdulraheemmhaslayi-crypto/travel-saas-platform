'use client';

import React, { useEffect, useState } from 'react';
import LiveMap from '@/components/tracking/LiveMap';
import DriverLocationSender from '@/components/tracking/DriverLocationSender';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/slices/authSlice';
import Loading from '@/components/common/Loading';
import Card from '@/components/ui/Card';

export default function DriverLiveTrackingPage() {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchLocations();
    const timer = setInterval(() => fetchLocations(), 8000);
    return () => clearInterval(timer);
  }, [user]);

  const fetchLocations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const resp = await apiClient.getDriverLocations(user.id, { limit: 100 });
      const payload = resp.data || resp;
      setLocations(Array.isArray(payload) ? payload : payload.data || []);
    } catch (e) {
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const current = locations.length ? locations[locations.length - 1] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Driver Live Tracking</h1>
          <p className="text-sm text-gray-500">Share and monitor your live location</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Loading text="Loading locations..." />
          ) : (
            <LiveMap
              locations={locations.map((l: any) => ({
                tripId: l.tripId || l.id || 'loc',
                latitude: l.latitude,
                longitude: l.longitude,
                timestamp: l.timestamp || l.createdAt,
                speed: l.speed,
              }))}
              currentLocation={current ? {
                tripId: current.tripId || current.id,
                latitude: current.latitude,
                longitude: current.longitude,
                timestamp: current.timestamp || current.createdAt,
                speed: current.speed,
              } : undefined}
            />
          )}
        </div>

        <div>
          <DriverLocationSender />

          <Card>
            <div className="p-4 text-sm text-gray-600">
              <div>Last points: {locations.length}</div>
              {current && (
                <div className="mt-2">
                  <div>Lat: {current.latitude}</div>
                  <div>Lng: {current.longitude}</div>
                  <div>Speed: {current.speed ?? 'N/A'}</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
