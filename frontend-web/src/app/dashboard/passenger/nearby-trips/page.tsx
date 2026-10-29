'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import {
  Navigation,
  MapPin,
  ArrowRight,
  Locate,
  AlertTriangle,
  Car,
  Clock,
  Users,
} from 'lucide-react';

interface NearbyTrip {
  id: string;
  title: string;
  source: string;
  destination: string;
  departureTime: string;
  pricePerSeat: number;
  availableSeats: number;
  distanceKm?: number;
  vehicle?: { brand?: string; model?: string; type?: string };
}

export default function NearbyTripsPage() {
  const [trips, setTrips] = useState<NearbyTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchNearbyTrips = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      const res = await apiClient.getNearbyVehicles({ lat, lng, radius: 10000 });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setTrips(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to find nearby trips';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          fetchNearbyTrips(coords.lat, coords.lng);
        },
        () => {
          setError('Location access denied. Please enable location services to find nearby trips.');
          setIsLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setIsLoading(false);
    }
  }, [fetchNearbyTrips]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (location) {
      fetchNearbyTrips(location.lat, location.lng);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          fetchNearbyTrips(coords.lat, coords.lng);
        },
        () => {
          setError('Location access denied.');
          setIsLoading(false);
        }
      );
    }
  };

  if (isLoading) return <Loading text="Finding trips near you..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-100">
              <Navigation className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Nearby Trips</h1>
          </div>
          <p className="text-sm text-gray-500">
            Trips departing from locations near you
          </p>
        </div>
        {location && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <Locate className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Location Active</span>
          </div>
        )}
      </div>

      {error ? (
        <Card>
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Cannot Access Location</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">{error}</p>
            <Button size="sm" onClick={handleRetry}>
              <Locate className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </Button>
          </div>
        </Card>
      ) : trips.length === 0 ? (
        <EmptyState
          title="No nearby trips found"
          description="There are no trips departing from your area right now. Try searching for specific routes."
          customIcon={<MapPin className="w-8 h-8 text-gray-400" />}
          action={{
            label: 'Search Trips',
            href: '/dashboard/trips/search',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/dashboard/trips/${trip.id}`}>
              <div className="rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                      <div className="w-px h-5 bg-gray-200" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{trip.source}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate mt-1">{trip.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                    {trip.departureTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(trip.departureTime).toLocaleString()}</span>
                      </div>
                    )}
                    {trip.availableSeats > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{trip.availableSeats} seats</span>
                      </div>
                    )}
                    {trip.vehicle?.type && (
                      <div className="flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        <span>{trip.vehicle.type}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-base font-extrabold text-gray-900">
                    {formatCurrency(Number(trip.pricePerSeat) || 0)}
                  </p>
                  <span className="text-xs font-semibold text-primary-600 group-hover:text-primary-700 flex items-center gap-1">
                    View Details
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
