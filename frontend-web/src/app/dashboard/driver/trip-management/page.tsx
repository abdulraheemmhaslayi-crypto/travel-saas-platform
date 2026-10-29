'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDriverStore } from '@/store/slices/driverSlice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import apiClient from '@/lib/api';
import {
  Briefcase,
  MapPin,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react';

export default function DriverTripManagementPage() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get('action');
  const tabParam = searchParams.get('tab');

  const { activeTrips, isLoading, getDriverStats } = useDriverStore();
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'stops' | 'passengers'>('manage');

  // Form states for creating trip
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [newStop, setNewStop] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    getDriverStats();
    fetchVehicles();
  }, [getDriverStats]);

  useEffect(() => {
    if (actionParam === 'create') {
      setActiveTab('create');
    } else if (tabParam === 'stops') {
      setActiveTab('stops');
    } else if (tabParam === 'passengers') {
      setActiveTab('passengers');
    } else {
      setActiveTab('manage');
    }
  }, [actionParam, tabParam]);

  const fetchVehicles = async () => {
    try {
      const resp = await apiClient.get('/vehicles/my-vehicles');
      const payload = resp.data || resp;
      const list = Array.isArray(payload) ? payload : payload.data || [];
      setVehiclesList(list);
      if (list.length > 0) {
        setSelectedVehicleId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load vehicles list:', e);
    }
  };

  const handleAddStop = () => {
    if (newStop.trim()) {
      setStops([...stops, newStop.trim()]);
      setNewStop('');
    }
  };

  const handleRemoveStop = (idx: number) => {
    setStops(stops.filter((_, i) => i !== idx));
  };

  const handleCreateTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedVehicleId) {
      setErrorMsg('No approved vehicle found. Drivers must have an approved vehicle to schedule trips.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedStops = stops.map((s, index) => ({
        stopName: s,
        latitude: 12.9716 + index * 0.01, // Mock coordinates
        longitude: 77.5946 + index * 0.01,
      }));

      await apiClient.post('/trips', {
        vehicleId: selectedVehicleId,
        title: `${source} to ${destination} Shuttle`,
        tripType: 'one_way',
        source,
        destination,
        sourceLat: 12.9716, // Default mock coords
        sourceLng: 77.5946,
        destLat: 13.0827,
        destLng: 80.2707,
        departureTime: new Date(departureTime).toISOString(),
        basePrice: Number(pricePerSeat),
        pricePerSeat: Number(pricePerSeat),
        stops: formattedStops,
      });

      setSuccessMsg('Shuttle trip scheduled successfully!');
      setSource('');
      setDestination('');
      setDepartureTime('');
      setPricePerSeat('');
      setStops([]);
      getDriverStats(); // Refresh trips list
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-sm text-gray-500">Create, edit, and organize intermediate stops for your routes</p>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-gray-200 overflow-x-auto space-x-6">
          {(['manage', 'create', 'stops', 'passengers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize tracking-wide transition-all border-b-2 shrink-0 ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'manage' ? 'Manage Schedule' : tab === 'create' ? 'Create Route' : tab === 'stops' ? 'Intermediate Stops' : 'Passenger List'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Loading text="Loading schedule..." />
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {activeTab === 'manage' && (
              activeTrips && activeTrips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeTrips.map((trip) => (
                    <Card key={trip.id} className="p-6 space-y-4 border border-gray-200/60">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Route ID: {trip.id.substring(0, 8)}</span>
                        <h3 className="font-extrabold text-gray-900 text-lg mt-0.5">{trip.source} → {trip.destination}</h3>
                        <Badge variant="default" className="mt-1.5 uppercase text-[9px] font-bold">{trip.status}</Badge>
                      </div>

                      <div className="text-xs font-semibold text-gray-500 space-y-2 border-t border-gray-100 pt-3">
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400" />
                          Departure: {new Date(trip.departureTime).toLocaleString()}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-400" />
                          Booked: {trip.bookings || 0} / {trip.totalSeats || 12} Seats
                        </p>
                        {trip.stops && trip.stops.length > 0 && (
                          <div className="pl-5 pt-1 space-y-1">
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Stops:</p>
                            {trip.stops.map((stop: any, i: number) => (
                              <p key={stop.id || i} className="text-gray-600">• {stop.stopName || stop.name}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState title="No scheduled routes" description="You do not have any upcoming routes scheduled." icon="briefcase" />
              )
            )}

            {activeTab === 'create' && (
              <Card className="p-6 max-w-2xl mx-auto">
                <h3 className="text-base font-bold text-gray-900 mb-4">Schedule New Route</h3>
                <form onSubmit={handleCreateTripSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {vehiclesList.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Select Assigned Vehicle</label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {vehiclesList.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.brand} {v.model} ({v.registrationNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Starting Source</label>
                      <input
                        type="text"
                        placeholder="e.g. Bangalore Airport"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Electronic City"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Departure Date & Time</label>
                      <input
                        type="datetime-local"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Price Per Seat (INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={pricePerSeat}
                        onChange={(e) => setPricePerSeat(e.target.value)}
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Add stops */}
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Intermediate Stops</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter stop name"
                        value={newStop}
                        onChange={(e) => setNewStop(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button
                        type="button"
                        onClick={handleAddStop}
                        className="bg-gray-800 hover:bg-gray-900 text-white font-bold"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {stops.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {stops.map((stop, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800">
                            <span>{idx + 1}. {stop}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveStop(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold"
                    >
                      {isSubmitting ? 'Scheduling Shuttle...' : 'Schedule Shuttle Route'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'stops' && (
              activeTrips && activeTrips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeTrips.map((trip) => (
                    <Card key={trip.id} className="p-6 space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-900">{trip.source} → {trip.destination}</h4>
                        <span className="text-[10px] text-gray-400">Total stops: {trip.stops ? trip.stops.length : 0}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <span>Origin: {trip.source}</span>
                        </div>
                        {trip.stops && trip.stops.map((stop: any, index: number) => (
                          <div key={stop.id || index} className="flex items-center gap-2 text-xs font-semibold text-gray-600 pl-4 border-l border-gray-200">
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold">{index + 1}</span>
                            <span>Stop: {stop.stopName || stop.name}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                          <MapPin className="w-4 h-4 text-slate-800" />
                          <span>Destination: {trip.destination}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState title="No active routes" description="You must have active routes to manage intermediate stops." icon="briefcase" />
              )
            )}

            {activeTab === 'passengers' && (
              activeTrips && activeTrips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeTrips.map((trip) => (
                    <Card key={trip.id} className="p-6 space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-900">{trip.source} → {trip.destination}</h4>
                        <span className="text-[10px] text-gray-400">Scheduled: {new Date(trip.departureTime).toLocaleDateString()}</span>
                      </div>

                      {trip.bookingsList && trip.bookingsList.length > 0 ? (
                        <div className="space-y-3">
                          {trip.bookingsList.map((booking: any) => (
                            <div key={booking.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                              <div className="text-xs">
                                <p className="font-bold text-slate-800">{booking.passenger?.firstName} {booking.passenger?.lastName}</p>
                                <p className="text-[10px] text-slate-500">Seat {booking.seatNumbers ? booking.seatNumbers.join(', ') : booking.seatNumber} • {booking.passenger?.phone}</p>
                              </div>
                              <Badge variant={booking.status === 'CHECKED_IN' ? 'success' : 'default'} className="text-[9px] uppercase font-bold">
                                {booking.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-xs text-center py-4 bg-slate-50 rounded-xl">No passengers boarded.</p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState title="No active routes" description="You must have active routes to manage passenger lists." customIcon={<Users className="w-8 h-8 text-gray-400" />} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
