'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, Car, 
  Trash2, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function FleetOwnerTripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const { showToast } = useAppStore();

  const [trip, setTrip] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTripDetails = async () => {
    try {
      const tripRes = await apiClient.getTrip(tripId);
      setTrip(tripRes.data);
      if (tripRes.data?.driverId) {
        setSelectedDriverId(tripRes.data.driverId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve trip details');
    }
  };

  const fetchDrivers = async () => {
    try {
      const driversRes = await apiClient.getFleetDrivers();
      setDrivers(driversRes.data || []);
    } catch (err: any) {
      console.error('Failed to retrieve fleet drivers', err);
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchTripDetails(), fetchDrivers()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (tripId) {
      loadAll();
    }
  }, [tripId]);

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      showToast('Please select a driver first.', 'error');
      return;
    }
    setIsActionLoading(true);
    try {
      await apiClient.assignDriver(tripId, selectedDriverId);
      showToast('Driver assigned successfully.', 'success');
      await fetchTripDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign driver', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsActionLoading(true);
    try {
      await apiClient.updateTripStatus(tripId, { status: newStatus });
      showToast(`Trip status updated to ${newStatus}.`, 'success');
      await fetchTripDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (trip?.bookings?.length > 0) {
      showToast('Cannot cancel trip with existing bookings.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel and delete this trip?')) {
      return;
    }
    setIsActionLoading(true);
    try {
      await apiClient.deleteTrip(tripId);
      showToast('Trip cancelled and removed successfully.', 'success');
      router.push('/dashboard/fleet-owner/trips');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel trip', 'error');
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading trip details..." />;
  }

  if (error || !trip) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <Card className="border border-red-100 shadow-xl rounded-2xl p-8 text-center space-y-6 bg-white">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Trip Unavailable</h2>
            <p className="text-sm text-gray-500">{error || 'Unable to retrieve this trip.'}</p>
          </div>
          <Link href="/dashboard/fleet-owner/trips">
            <Button className="w-full">Back to Trips</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return <Badge variant="success">{s}</Badge>;
      case 'SCHEDULED':
        return <Badge variant="info">{s}</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">{s}</Badge>;
      default:
        return <Badge variant="default">{s}</Badge>;
    }
  };

  const bookingCount = trip.bookings?.length || 0;
  const isCancellable = bookingCount === 0 && trip.status !== 'CANCELLED' && trip.status !== 'COMPLETED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/fleet-owner/trips"
            className="p-2 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 shadow-sm bg-white"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trip.title || 'Trip Management'}</h1>
            <p className="text-sm text-gray-500">Manage route, driver assignment, and status updates.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadAll} disabled={isActionLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trip Info and Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Summary Card */}
          <Card className="bg-white p-6 shadow-sm border border-gray-100 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Trip Specifications</h3>
              {getStatusBadge(trip.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-700">Route</p>
                    <p className="text-gray-900 mt-0.5">{trip.source} to {trip.destination}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-700">Departure Time</p>
                    <p className="text-gray-900 mt-0.5">
                      {new Date(trip.departureTime || trip.departureDate).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <Users className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-700">Seating Capacity</p>
                    <p className="text-gray-900 mt-0.5">
                      {trip.bookedSeats} booked / {trip.totalSeats} total seats ({trip.availableSeats} available)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Car className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-700">Assigned Vehicle</p>
                    <p className="text-gray-900 mt-0.5">
                      {trip.vehicle ? `${trip.vehicle.registrationNumber} (${trip.vehicle.make || trip.vehicle.brand} ${trip.vehicle.model})` : 'None'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Booked Passengers List */}
          <Card className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Booked Passengers List</h3>
              <Badge variant="outline">{bookingCount} Bookings</Badge>
            </div>
            
            {bookingCount === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="font-medium">No passengers have booked this trip yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {trip.bookings.map((booking: any) => (
                  <div key={booking.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{booking.passengerName || booking.passenger?.firstName || 'Anonymous'}</p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>Phone: {booking.passengerPhone || 'N/A'}</span>
                        <span>Seats: {booking.seatNumbers?.join(', ') || booking.numberOfSeats}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-gray-400">{booking.bookingNumber}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Driver Assignment, Trip Status Actions, and Cancellation */}
        <div className="space-y-6">
          {/* Driver Assignment Card */}
          <Card className="bg-white p-6 shadow-sm border border-gray-100 rounded-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Driver Assignment</h3>
            <div className="space-y-4">
              <Select
                label="Assigned Driver"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                options={drivers.map((d: any) => ({
                  value: d.id,
                  label: `${d.user?.firstName} ${d.user?.lastName} (${d.licenseNumber || 'No License'})`,
                }))}
                placeholder="Choose a driver"
              />
              <Button
                onClick={handleAssignDriver}
                isLoading={isActionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Reassign Driver
              </Button>
            </div>
          </Card>

          {/* Trip Status Card */}
          <Card className="bg-white p-6 shadow-sm border border-gray-100 rounded-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Trip Status Actions</h3>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">Update this trip's current operational state:</p>
              
              {trip.status === 'SCHEDULED' && (
                <Button
                  onClick={() => handleStatusChange('ACTIVE')}
                  isLoading={isActionLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  Set Active / Start Trip
                </Button>
              )}

              {trip.status === 'ACTIVE' && (
                <Button
                  onClick={() => handleStatusChange('COMPLETED')}
                  isLoading={isActionLoading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                >
                  Mark Completed
                </Button>
              )}

              {trip.status !== 'CANCELLED' && trip.status !== 'COMPLETED' && (
                <Button
                  onClick={() => handleStatusChange('CANCELLED')}
                  isLoading={isActionLoading}
                  variant="secondary"
                  className="w-full text-red-600 hover:text-red-700 font-semibold border-red-200 hover:bg-red-50"
                >
                  Cancel Trip
                </Button>
              )}

              {trip.status === 'CANCELLED' && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This trip has been marked as cancelled. No further action can be taken.</span>
                </div>
              )}

              {trip.status === 'COMPLETED' && (
                <div className="p-3 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This trip is completed successfully.</span>
                </div>
              )}
            </div>
          </Card>

          {/* Cancellation/Delete Area */}
          {isCancellable && (
            <Card className="bg-red-50/50 border border-red-100 p-6 rounded-2xl">
              <h3 className="font-bold text-red-800 text-sm flex items-center gap-1.5 mb-2">
                <Trash2 className="w-4 h-4" /> Danger Zone
              </h3>
              <p className="text-xs text-red-700 mb-4">
                Since there are no bookings, you can delete this trip completely from the schedule.
              </p>
              <Button
                onClick={handleDeleteTrip}
                isLoading={isActionLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Delete Trip Route
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
