'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Loading from '@/components/common/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Clock, MapPin, Plus, RefreshCw, Car, UserCheck, AlertCircle, Play } from 'lucide-react';

type TripTab = 'all' | 'active' | 'upcoming' | 'completed' | 'cancelled';

const validTabs: TripTab[] = ['all', 'active', 'upcoming', 'completed', 'cancelled'];

// Map URL status param values to internal tab names
const statusToTab: Record<string, TripTab> = {
  all: 'all',
  scheduled: 'upcoming',
  upcoming: 'upcoming',
  active: 'active',
  in_progress: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

const normalizeTripStatus = (rawStatus: string): 'active' | 'upcoming' | 'completed' | 'cancelled' => {
  const s = String(rawStatus || '').toLowerCase().trim();
  if (['active', 'in_progress', 'in-progress', 'delayed', 'started', 'on_trip'].includes(s)) {
    return 'active';
  }
  if (['scheduled', 'upcoming', 'pending', 'created'].includes(s)) {
    return 'upcoming';
  }
  if (['completed', 'finished', 'done'].includes(s)) {
    return 'completed';
  }
  if (['cancelled', 'canceled', 'aborted'].includes(s)) {
    return 'cancelled';
  }
  return 'upcoming';
};

function FleetOwnerTripsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive activeTab from URL ?status= param
  const statusParam = searchParams.get('status')?.toLowerCase() || '';
  const activeTab: TripTab = statusToTab[statusParam] || 'all';

  const setActiveTab = (tab: TripTab) => {
    if (tab === 'all') {
      router.push('/dashboard/fleet-owner/trips', { scroll: false });
    } else {
      const statusValue = tab === 'upcoming' ? 'scheduled' : tab;
      router.push(`/dashboard/fleet-owner/trips?status=${statusValue}`, { scroll: false });
    }
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

  // Compute live counts
  const tabCounts = useMemo(() => {
    return {
      all: trips.length,
      active: trips.filter(t => normalizeTripStatus(t.status) === 'active').length,
      upcoming: trips.filter(t => normalizeTripStatus(t.status) === 'upcoming').length,
      completed: trips.filter(t => normalizeTripStatus(t.status) === 'completed').length,
      cancelled: trips.filter(t => normalizeTripStatus(t.status) === 'cancelled').length,
    };
  }, [trips]);

  // Active trips list
  const activeTrips = useMemo(() => {
    return trips.filter(t => normalizeTripStatus(t.status) === 'active');
  }, [trips]);

  // Filtered trips for current tab
  const filteredTrips = useMemo(() => {
    if (activeTab === 'all') return trips;
    return trips.filter(t => normalizeTripStatus(t.status) === activeTab);
  }, [trips, activeTab]);

  const renderStatusBadge = (status: string) => {
    const normalized = normalizeTripStatus(status);
    switch (normalized) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
            </span>
            {String(status || 'ACTIVE').toUpperCase()}
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {String(status || 'SCHEDULED').toUpperCase()}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            COMPLETED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            CANCELLED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-1">Manage, monitor, and track your scheduled or active routes.</p>
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

      {/* Prominent Live/Active Trip Banner if any active trip exists */}
      {activeTrips.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-transparent border-l-4 border-emerald-500 p-4 rounded-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>{activeTrips.length} Active Trip{activeTrips.length > 1 ? 's' : ''} in Progress</span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-semibold">LIVE</span>
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {activeTrips[0].source} → {activeTrips[0].destination}
                  {activeTrips[0].vehicle?.registrationNumber && (
                    <span className="font-mono ml-2 text-emerald-700 font-medium">
                      ({activeTrips[0].vehicle.registrationNumber})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {activeTab !== 'active' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  View Active Trips
                </button>
              )}
              <Link href={`/dashboard/fleet-owner/trips/${activeTrips[0].id}`}>
                <button
                  type="button"
                  className="text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Manage Live Trip
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tabs with live count badges */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-2">
        {([
          { id: 'all' as const, label: 'All Trips', count: tabCounts.all },
          { id: 'active' as const, label: 'Active', count: tabCounts.active, isLive: tabCounts.active > 0 },
          { id: 'upcoming' as const, label: 'Upcoming', count: tabCounts.upcoming },
          { id: 'completed' as const, label: 'Completed', count: tabCounts.completed },
          { id: 'cancelled' as const, label: 'Cancelled', count: tabCounts.cancelled },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.isLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
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
            You haven&apos;t registered any trip routes yet. Click below to add your first route.
          </p>
          <Link href="/dashboard/fleet-owner/create-trip">
            <Button className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create a Trip
            </Button>
          </Link>
        </Card>
      ) : filteredTrips.length === 0 ? (
        <Card className="bg-white rounded-xl shadow-xs border border-gray-100 p-10 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No {activeTab === 'all' ? '' : activeTab} trips found
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {activeTab === 'active'
              ? 'There are currently no active or in-progress trips. When a trip is started, it will appear here live.'
              : activeTab === 'upcoming'
              ? 'No upcoming scheduled trips. Click "Create Trip" to schedule a new route.'
              : `You have no ${activeTab} trips.`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTrips.map((trip) => (
            <Card key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{trip.title || `${trip.source} to ${trip.destination}`}</span>
                    {renderStatusBadge(trip.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{trip.source} → {trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Depart: {new Date(trip.departureTime || trip.departureDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <div className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-700">Driver:</span>
                      <span>
                        {trip.driver
                          ? (trip.driver.name || `${trip.driver.user?.firstName || ''} ${trip.driver.user?.lastName || ''}`.trim() || 'Assigned Driver')
                          : (trip.driverName || 'Unassigned')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-700">Vehicle:</span>
                      <span className="font-mono">{trip.vehicle?.registrationNumber || trip.vehicleNumber || 'Unassigned'}</span>
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


export default function FleetOwnerTripsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <p className="text-gray-500 font-medium animate-pulse">Loading fleet trips...</p>
        </div>
      }
    >
      <FleetOwnerTripsPageContent />
    </React.Suspense>
  );
}
