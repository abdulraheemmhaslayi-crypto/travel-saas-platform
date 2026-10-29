'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Loading from '@/components/common/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Clock, MapPin, Plus, RefreshCw } from 'lucide-react';

type TripTab = 'upcoming' | 'active' | 'completed' | 'cancelled';

const validTabs: TripTab[] = ['upcoming', 'active', 'completed', 'cancelled'];

// Map URL status param values to internal tab names
const statusToTab: Record<string, TripTab> = {
  scheduled: 'upcoming',
  upcoming: 'upcoming',
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

export default function FleetOwnerTripsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive activeTab from URL ?status= param
  const statusParam = searchParams.get('status')?.toLowerCase() || '';
  const activeTab: TripTab = statusToTab[statusParam] || 'upcoming';

  const setActiveTab = (tab: TripTab) => {
    const statusValue = tab === 'upcoming' ? 'scheduled' : tab;
    router.push(`/dashboard/fleet-owner/trips?status=${statusValue}`, { scroll: false });
  };

  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getMyTrips();
      setTrips(response.data.data || response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-1">Manage and track your scheduled or active routes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchTrips}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/fleet-owner/create-trip">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Trip
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['upcoming', 'active', 'completed', 'cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-semibold capitalize rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading text="Loading trips..." />
      ) : trips.length === 0 ? (
        <Card className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips created yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You haven't registered any trip routes yet. Click below to add your first route.
          </p>
          <Link href="/dashboard/fleet-owner/create-trip">
            <Button className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create a Trip
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {trips.filter(trip => {
            const status = String(trip.status || '').toLowerCase();
            if (activeTab === 'upcoming') return status === 'scheduled' || status === 'upcoming';
            return status === activeTab;
          }).map((trip) => (
            <Card key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{trip.title || `${trip.source} to ${trip.destination}`}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      trip.status === 'active' || trip.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : trip.status === 'scheduled' || trip.status === 'SCHEDULED' || trip.status === 'upcoming'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{trip.source} → {trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Depart: {new Date(trip.departureTime || trip.departureDate).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-700">Driver:</span>
                      <span>{trip.driver?.name || trip.driverName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-700">Vehicle:</span>
                      <span>{trip.vehicle?.registrationNumber || trip.vehicleNumber || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 justify-between md:justify-end">
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">₹{trip.pricePerSeat || trip.price || 0}</p>
                      <p className="text-xs text-gray-500">per seat</p>
                    </div>
                    <div className="border-l pl-4 border-gray-200">
                      <p className="text-sm font-medium text-gray-700">{trip.bookedSeats || trip.bookingCount || 0} / {trip.totalSeats || 0}</p>
                      <p className="text-xs text-gray-500">bookings</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/trips/${trip.id}`}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/dashboard/fleet-owner/trips/${trip.id}`}>
                      <Button variant="secondary" size="sm">
                        Manage Trip
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
