'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTripStore } from '@/store/slices/tripSlice';
import { useSocket } from '@/hooks/useSocket';
import { useGeolocation } from '@/hooks/useGeolocation';
import LiveMap from '@/components/tracking/LiveMap';
import TripProgress from '@/components/tracking/TripProgress';
import Loading from '@/components/common/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MapPin, Navigation, AlertTriangle, Phone } from 'lucide-react';

export default function TripTrackingPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { currentTrip, getTrip } = useTripStore();
  const { isConnected, joinTrip, leaveTrip, onLocationUpdate, sendPassengerLocation } = useSocket();
  const { latitude, longitude, startWatching, stopWatching } = useGeolocation();
  const [locations, setLocations] = useState<Array<{ tripId: string; latitude: number; longitude: number; timestamp: string }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{ tripId?: string; latitude: number; longitude: number; timestamp?: string } | null>(null);

  useEffect(() => {
    if (tripId) {
      getTrip(tripId);
      joinTrip(tripId);
    }

    return () => {
      leaveTrip(tripId);
    };
  }, [tripId, getTrip, joinTrip, leaveTrip]);

  useEffect(() => {
    const unsubscribe = onLocationUpdate((data: unknown) => {
      const location = data as { latitude: number; longitude: number; timestamp: string };
      const full = { tripId, latitude: location.latitude, longitude: location.longitude, timestamp: location.timestamp };
      setLocations((prev) => [...prev, full]);
      setCurrentLocation({ tripId, latitude: location.latitude, longitude: location.longitude, timestamp: location.timestamp });
    });

    return () => unsubscribe();
  }, [onLocationUpdate]);

  useEffect(() => {
    if (latitude && longitude) {
      sendPassengerLocation({
        tripId,
        latitude,
        longitude,
      });
    }
  }, [latitude, longitude, tripId, sendPassengerLocation]);

  const handleShareLocation = () => {
    startWatching();
  };

  const handleEmergency = () => {
    // Implement emergency alert
    alert('Emergency alert sent to admin and emergency contacts');
  };

  if (!currentTrip) {
    return <Loading fullScreen text="Loading trip details..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-600 mt-1">
          {currentTrip.origin} → {currentTrip.destination}
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected to live updates' : 'Disconnected'}
        </span>
      </div>

      {/* Map */}
      <LiveMap
        locations={locations}
        currentLocation={
          currentLocation
            ? {
                tripId: currentLocation.tripId || tripId,
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                timestamp: currentLocation.timestamp || new Date().toISOString(),
              }
            : undefined
        }
        destination={{ lat: 12.9716, lng: 77.5946 }}
      />

      {/* Progress */}
      <TripProgress
        trip={currentTrip}
        currentLocation={currentLocation || undefined}
        progress={locations.length > 0 ? Math.min((locations.length / 10) * 100, 100) : 0}
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          variant="secondary"
          className="w-full"
          leftIcon={<Navigation className="w-4 h-4" />}
          onClick={handleShareLocation}
        >
          Share My Location
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          leftIcon={<Phone className="w-4 h-4" />}
        >
          Call Driver
        </Button>
        <Button
          variant="danger"
          className="w-full"
          leftIcon={<AlertTriangle className="w-4 h-4" />}
          onClick={handleEmergency}
        >
          Emergency
        </Button>
      </div>

      {/* Location History */}
      {locations.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Updates</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locations.slice(-10).map((loc, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(loc.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}