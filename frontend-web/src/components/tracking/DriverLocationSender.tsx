 'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGeolocation } from '@/hooks/useGeolocation';
import apiClient from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function DriverLocationSender({ interval = 5000 }: { interval?: number }) {
  const { user } = useAuthStore();
  const { latitude, longitude, accuracy, speed, heading, error, isWatching, startWatching, stopWatching } = useGeolocation();
  const [isSharing, setIsSharing] = useState(false);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    async function sendLocation() {
      if (!latitude || !longitude) return;
      const now = Date.now();
      if (now - lastSentRef.current < interval) return;
      lastSentRef.current = now;

      try {
        await apiClient.updateLocation({
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          metadata: { driverId: user?.id },
        });
      } catch (e) {
        // swallow; UI can show errors elsewhere
      }
    }

    if (isSharing && latitude && longitude) {
      sendLocation();
    }

    return () => {
      mounted = false;
    };
  }, [latitude, longitude, accuracy, speed, heading, isSharing, interval, user]);

  const handleToggle = () => {
    if (isSharing) {
      stopWatching();
      setIsSharing(false);
    } else {
      startWatching();
      setIsSharing(true);
    }
  };

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Share Location</h3>
            <p className="text-xs text-gray-500">Send live GPS updates to the platform</p>
          </div>
          <div>
            <Button size="sm" onClick={handleToggle} variant={isSharing ? 'danger' : 'primary'}>
              {isSharing ? 'Stop Sharing' : 'Start Sharing'}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <div>Status: {isSharing ? 'Sharing' : 'Idle'}</div>
          <div>Watch: {isWatching ? 'Active' : 'Inactive'}</div>
          <div>Coords: {latitude?.toFixed(5) ?? '--'}, {longitude?.toFixed(5) ?? '--'}</div>
          {error && <div className="text-xs text-red-600">Error: {error}</div>}
        </div>
      </div>
    </Card>
  );
}
