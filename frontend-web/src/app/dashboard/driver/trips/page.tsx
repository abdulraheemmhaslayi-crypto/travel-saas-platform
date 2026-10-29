'use client';

import React, { useEffect, useState } from 'react';
import { useDriverStore } from '@/store/slices/driverSlice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Car,
  Filter,
  CheckCircle,
  XCircle,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function DriverTripsPage() {
  const { activeTrips, isLoading, getDriverStats, updateTripStatus } = useDriverStore();
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'active' | 'completed' | 'cancelled'>('all');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    getDriverStats();
  }, [getDriverStats]);

  const handleStartTrip = async (tripId: string) => {
    setStatusMsg('Starting trip...');
    try {
      await updateTripStatus(tripId, 'in_progress');
      setStatusMsg('Trip started successfully. Live location is now active.');
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to start trip.');
    }
  };

  const handleEndTrip = async (tripId: string) => {
    setStatusMsg('Completing trip...');
    try {
      await updateTripStatus(tripId, 'completed');
      setStatusMsg('Trip completed successfully.');
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to complete trip.');
    }
  };

  const filteredTrips = (activeTrips || []).filter((trip) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'scheduled') return trip.status === 'SCHEDULED';
    if (activeTab === 'active') return trip.status === 'ACTIVE' || trip.status === 'IN_PROGRESS' || trip.status === 'DELAYED';
    if (activeTab === 'completed') return trip.status === 'COMPLETED';
    if (activeTab === 'cancelled') return trip.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assigned Trips Schedule</h1>
          <p className="text-sm text-gray-500">Monitor and update status of your assigned trips</p>
        </div>

        {statusMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="text-blue-500 hover:text-blue-700 ml-2">Dismiss</button>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex border-b border-gray-200 overflow-x-auto space-x-6">
          {(['all', 'scheduled', 'active', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize tracking-wide transition-all border-b-2 shrink-0 ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'all' ? 'All Trips' : `${tab} Trips`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Loading text="Loading your trips..." />
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-md transition-shadow border border-gray-200/60 overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Route ID: {trip.id.substring(0, 8)}</span>
                      <h3 className="font-extrabold text-gray-900 text-lg mt-0.5">
                        {trip.source} → {trip.destination}
                      </h3>
                    </div>
                    <Badge
                      variant={
                        trip.status === 'COMPLETED'
                          ? 'success'
                          : trip.status === 'CANCELLED'
                          ? 'danger'
                          : trip.status === 'IN_PROGRESS'
                          ? 'success'
                          : 'default'
                      }
                      className="px-2.5 py-0.5 uppercase text-[10px] font-extrabold"
                    >
                      {trip.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-500 border-y border-gray-100 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Departure</p>
                        <p className="text-gray-700 mt-0.5">
                          {new Date(trip.departureTime).toLocaleDateString()} {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Bookings</p>
                        <p className="text-gray-700 mt-0.5">{trip.bookings || 0} / {trip.totalSeats || 12} Seats</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Price Per Seat</p>
                        <p className="text-gray-700 mt-0.5">₹{trip.pricePerSeat}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Vehicle</p>
                        <p className="text-gray-700 mt-0.5 truncate">{trip.vehicle?.brand} {trip.vehicle?.model} ({trip.vehicle?.registrationNumber || 'N/A'})</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <Link href="/dashboard/driver" className="text-xs text-primary-600 hover:text-primary-700 font-bold uppercase tracking-wider flex items-center gap-1">
                      Control center
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex gap-2">
                      {trip.status === 'ACTIVE' && (
                        <Button
                          onClick={() => handleStartTrip(trip.id)}
                          className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-1.5 px-3"
                        >
                          <PlayCircle className="w-3.5 h-3.5 mr-1" />
                          Start Trip
                        </Button>
                      )}
                      {trip.status === 'IN_PROGRESS' && (
                        <Button
                          onClick={() => handleEndTrip(trip.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          End Trip
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No trips found"
            description="You don't have any trips matching this status category."
            icon="calendar"
          />
        )}
      </div>
    </div>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);
