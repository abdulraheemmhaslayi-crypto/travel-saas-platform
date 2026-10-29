'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/slices/authSlice';
import { useDriverStore } from '@/store/slices/driverSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import {
  Briefcase,
  MapPin,
  Bell,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Clock,
  Star,
  Car,
  Calendar,
  Users,
  Activity,
  Navigation,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  AlertTriangle,
  User as UserIcon,
  ShieldAlert,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/common/EmptyState';
import apiClient from '@/lib/api';

export default function DriverDashboardPage() {
  const { user } = useAuthStore();
  const {
    activeTrips,
    earnings,
    rating,
    isLoading,
    getDriverStats,
    updateTripStatus,
    updateBookingStatus,
  } = useDriverStore();
  const { unreadCount, getUnreadCount } = useNotificationStore();

  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingIntervalId, setTrackingIntervalId] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    getDriverStats();
    getUnreadCount();
  }, [getDriverStats, getUnreadCount]);

  useEffect(() => {
    // Determine current active trip (status is ACTIVE or IN_PROGRESS or DELAYED)
    if (activeTrips && activeTrips.length > 0) {
      const active = activeTrips.find(
        (t) =>
          t.status === 'ACTIVE' ||
          t.status === 'IN_PROGRESS' ||
          t.status === 'DELAYED'
      );
      // Fallback to first trip if none is in progress
      setActiveTrip(active || activeTrips[0]);
    } else {
      setActiveTrip(null);
    }
  }, [activeTrips]);

  // Handle live location tracking
  useEffect(() => {
    if (trackingActive && activeTrip) {
      // Simulate live location updates or use browser geolocation
      const startTracking = () => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          const watchId = navigator.geolocation.watchPosition(
            async (position) => {
              const { latitude, longitude, speed, heading, accuracy } = position.coords;
              setCurrentCoords({ lat: latitude, lng: longitude });
              try {
                await apiClient.post('/tracking/update', {
                  latitude,
                  longitude,
                  speed: speed || 0,
                  heading: heading || 0,
                  accuracy: accuracy || 0,
                  isOnline: true,
                });
                setStatusMsg('Location synced with server.');
              } catch (err) {
                console.error('Failed to sync location:', err);
              }
            },
            (error) => {
              setStatusMsg(`Geolocation error: ${error.message}. Simulating route points...`);
              simulateTracking();
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
          setTrackingIntervalId(watchId);
        } else {
          simulateTracking();
        }
      };

      const simulateTracking = () => {
        let step = 0;
        // Mock starting coordinates (near Source if latitude/longitude exist, otherwise default)
        const startLat = Number(activeTrip.sourceLat) || 12.9716;
        const startLng = Number(activeTrip.sourceLng) || 77.5946;
        const interval = setInterval(async () => {
          step += 1;
          const simulatedLat = startLat + step * 0.002;
          const simulatedLng = startLng + step * 0.002;
          setCurrentCoords({ lat: simulatedLat, lng: simulatedLng });
          try {
            await apiClient.post('/tracking/update', {
              latitude: simulatedLat,
              longitude: simulatedLng,
              speed: 45,
              heading: 90,
              accuracy: 10,
              isOnline: true,
            });
            setStatusMsg(`Simulating location: ${simulatedLat.toFixed(4)}, ${simulatedLng.toFixed(4)}`);
          } catch (err) {
            console.error('Failed to update mock location:', err);
          }
        }, 10000);
        setTrackingIntervalId(interval);
      };

      startTracking();
    } else {
      if (trackingIntervalId) {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.clearWatch(trackingIntervalId);
        } else {
          clearInterval(trackingIntervalId);
        }
        setTrackingIntervalId(null);
      }
      setCurrentCoords(null);
      setStatusMsg(null);
    }

    return () => {
      if (trackingIntervalId) {
        clearInterval(trackingIntervalId);
      }
    };
  }, [trackingActive, activeTrip]);

  const handleTripStatusChange = async (tripId: string, newStatus: string) => {
    setStatusMsg(`Updating trip to ${newStatus}...`);
    try {
      await updateTripStatus(tripId, newStatus.toLowerCase());
      if (newStatus === 'IN_PROGRESS') {
        setTrackingActive(true);
      } else if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
        setTrackingActive(false);
      }
      setStatusMsg(`Trip status updated to ${newStatus} successfully.`);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to update trip status.');
    }
  };

  const handlePassengerCheckIn = async (bookingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'CHECKED_IN' ? 'confirmed' : 'checked_in';
    try {
      await updateBookingStatus(bookingId, nextStatus);
      setStatusMsg('Passenger check-in updated successfully.');
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to update check-in status.');
    }
  };

  // Mock Compliance issues based on standard KYC status
  const complianceAlerts = [];
  if (user?.kycStatus === 'PENDING' || user?.kycStatus === 'SUBMITTED') {
    complianceAlerts.push({
      id: 'kyc',
      type: 'warning',
      message: 'KYC Verification is pending approval. You can view your status in your profile.',
      link: '/dashboard/profile?tab=kyc',
      actionLabel: 'Check KYC',
    });
  } else if (user?.kycStatus === 'REJECTED') {
    complianceAlerts.push({
      id: 'kyc-rejected',
      type: 'danger',
      message: 'KYC Verification rejected. Please resubmit valid identity documents.',
      link: '/dashboard/profile?tab=kyc',
      actionLabel: 'Resubmit Documents',
    });
  }

  // Simulate mock vehicle documents compliance alert
  complianceAlerts.push({
    id: 'insurance',
    type: 'warning',
    message: 'Assigned Vehicle insurance expires in 15 days. Please upload updated insurance copy.',
    link: '/dashboard/driver/vehicle?tab=documents',
    actionLabel: 'Upload Document',
  });

  return (
    <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary-50 p-3 rounded-xl border border-primary-100/50 text-primary-600">
                <Car className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="text-gray-400 mt-1 text-xs md:text-sm font-medium">
                  {user?.kycStatus === 'VERIFIED'
                    ? '✓ Verified Professional Driver'
                    : 'Account Verification Pending'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/dashboard/notifications">
                <Button variant="secondary" className="relative group rounded-xl">
                  <Bell className="w-4 h-4 mr-2 text-gray-500" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/dashboard/driver/trips">
                <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm rounded-xl">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Trip Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Compliance Alerts Section */}
        {complianceAlerts.length > 0 && (
          <div className="space-y-3">
            {complianceAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                  alert.type === 'danger'
                    ? 'bg-red-50/75 border-red-200 text-red-800'
                    : 'bg-amber-50/75 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {alert.type === 'danger' ? (
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
                <Link href={alert.link} className="mt-3 sm:mt-0 sm:ml-4 shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-700 hover:text-primary-800 transition-colors">
                    {alert.actionLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Today's Summary Dashboard Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-5 border border-gray-100 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Trips</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-100 bg-blue-50/50 text-blue-600">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">{activeTrips ? activeTrips.length : 0}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-[10px] md:text-xs">
              <Activity className="w-3.5 h-3.5 text-gray-400" />
              <span>Assigned schedule</span>
            </div>
          </Card>

          <Card className="p-5 border border-gray-100 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Passengers</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-100 bg-indigo-50/50 text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
              {activeTrips
                ? activeTrips.reduce((acc, t) => acc + (t.bookings || 0), 0)
                : 0}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-[10px] md:text-xs">
              <Star className="w-3.5 h-3.5 text-gray-400" />
              <span>Across active routes</span>
            </div>
          </Card>

          <Card className="p-5 border border-gray-100 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Earnings</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-100 bg-emerald-50/50 text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
              ₹{earnings?.today ? earnings.today.toLocaleString('en-IN') : '0'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-[10px] md:text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
              <span>Paid bookings</span>
            </div>
          </Card>

          <Card className="p-5 border border-gray-100 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Rating</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-100 bg-amber-50/50 text-amber-600">
                <Star className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
              {rating ? rating.toFixed(1) : '5.0'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-[10px] md:text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Excellent feedback</span>
            </div>
          </Card>
        </div>

        {statusMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="text-blue-500 hover:text-blue-700 ml-2">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Trip Hero Control Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-xs uppercase tracking-wider text-gray-200">Active Operational Trip</span>
                </div>
                {activeTrip && (
                  <Badge variant="success" className="px-3 py-1 font-semibold text-xs tracking-wider uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    {activeTrip.status}
                  </Badge>
                )}
              </div>

              {activeTrip ? (
                <div className="p-6 space-y-6">
                  {/* Trip details */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPin className="w-5 h-5 text-primary-500" />
                        <h4 className="font-bold text-gray-900 text-lg md:text-xl">
                          {activeTrip.source} → {activeTrip.destination}
                        </h4>
                      </div>
                      <p className="text-gray-500 text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Departure Scheduled: {new Date(activeTrip.departureTime).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {activeTrip.status === 'SCHEDULED' && (
                        <Button
                          onClick={() => handleTripStatusChange(activeTrip.id, 'ACTIVE')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                          Activate Trip
                        </Button>
                      )}

                      {activeTrip.status === 'ACTIVE' && (
                        <Button
                          onClick={() => handleTripStatusChange(activeTrip.id, 'IN_PROGRESS')}
                          className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2 px-4 shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5 mr-1.5" />
                          Start Trip
                        </Button>
                      )}

                      {activeTrip.status === 'IN_PROGRESS' && (
                        <>
                          <Button
                            onClick={() => handleTripStatusChange(activeTrip.id, 'DELAYED')}
                            variant="secondary"
                            className="text-xs font-bold py-2 px-4 border border-gray-200"
                          >
                            <Pause className="w-3.5 h-3.5 mr-1.5" />
                            Pause/Delay
                          </Button>
                          <Button
                            onClick={() => handleTripStatusChange(activeTrip.id, 'COMPLETED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            End Trip
                          </Button>
                        </>
                      )}

                      {activeTrip.status === 'DELAYED' && (
                        <Button
                          onClick={() => handleTripStatusChange(activeTrip.id, 'IN_PROGRESS')}
                          className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2 px-4 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                          Resume Trip
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Route Timeline stops */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-primary-500" />
                      Route Progress stops
                    </h5>
                    <div className="relative pl-6 border-l border-gray-200 space-y-4">
                      {/* Source */}
                      <div className="relative">
                        <div className="absolute -left-[30px] top-0.5 bg-primary-600 text-white w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]" />
                        <p className="text-xs font-bold text-gray-900">{activeTrip.source}</p>
                        <p className="text-[10px] text-gray-500">Departure origin</p>
                      </div>

                      {/* Intermediate Stops */}
                      {activeTrip.stops && activeTrip.stops.map((stop: any, index: number) => (
                        <div key={stop.id || index} className="relative">
                          <div className="absolute -left-[30px] top-0.5 bg-gray-400 text-white w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]" />
                          <p className="text-xs font-bold text-gray-700">{stop.stopName || stop.name}</p>
                          <p className="text-[10px] text-gray-500">Stop {index + 1}</p>
                        </div>
                      ))}

                      {/* Destination */}
                      <div className="relative">
                        <div className="absolute -left-[30px] top-0.5 bg-slate-900 text-white w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]" />
                        <p className="text-xs font-bold text-gray-950">{activeTrip.destination}</p>
                        <p className="text-[10px] text-gray-500">Final Destination</p>
                      </div>
                    </div>
                  </div>

                  {/* Live Tracking Controls */}
                  {activeTrip.status === 'IN_PROGRESS' && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-full ${trackingActive ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                          <Navigation className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Live GPS Location Sharing</p>
                          <p className="text-[10px] text-slate-500">
                            {trackingActive ? 'Sending telemetry to passengers and operations' : 'GPS sharing is offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setTrackingActive(!trackingActive)}
                          variant={trackingActive ? 'danger' : 'primary'}
                          className="text-xs py-1.5 px-3.5 font-semibold"
                        >
                          {trackingActive ? 'Stop Sharing' : 'Start Sharing'}
                        </Button>
                        <Link href={`/dashboard/driver/live-tracking`}>
                          <Button variant="secondary" className="text-xs py-1.5 px-3.5 font-semibold">
                            Open Map View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Passenger Manifest list */}
                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-4.5 h-4.5 text-primary-500" />
                        Passenger Manifest ({activeTrip.bookingsList?.length || 0})
                      </h5>
                    </div>

                    {activeTrip.bookingsList && activeTrip.bookingsList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                          <thead>
                            <tr className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                              <th className="pb-3 pl-2">Passenger</th>
                              <th className="pb-3">Seats</th>
                              <th className="pb-3">Pickup Location</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3 text-right">Check-In</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {activeTrip.bookingsList.map((booking: any) => (
                              <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 pl-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                                      {booking.passenger?.firstName?.[0] || 'P'}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {booking.passenger?.firstName} {booking.passenger?.lastName}
                                      </p>
                                      <p className="text-[10px] text-gray-500 font-medium">{booking.passenger?.phone}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 font-semibold text-gray-700">
                                  {booking.seatNumbers ? booking.seatNumbers.join(', ') : booking.seatNumber}
                                </td>
                                <td className="py-3 text-gray-600 text-xs max-w-[12rem] truncate">
                                  {booking.pickupLocation || 'Default Stop'}
                                </td>
                                <td className="py-3">
                                  <Badge
                                    variant={booking.status === 'CHECKED_IN' ? 'success' : 'default'}
                                    className="text-[10px] px-2 py-0.5 font-bold uppercase"
                                  >
                                    {booking.status}
                                  </Badge>
                                </td>
                                <td className="py-3 text-right">
                                  <input
                                    type="checkbox"
                                    checked={booking.status === 'CHECKED_IN'}
                                    onChange={() => handlePassengerCheckIn(booking.id, booking.status)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs text-center py-4 bg-slate-50 rounded-xl">No passengers booked on this trip yet.</p>
                    )}
                  </div>

                  {/* Seat Map occupied layout */}
                  <div className="border-t border-gray-100 pt-5">
                    <h5 className="text-sm font-bold text-gray-900 mb-3">Visual Seat Occupancy Map</h5>
                    <div className="flex flex-wrap items-center gap-6 bg-slate-50 p-4 rounded-xl">
                      {/* Seat Map visual */}
                      <div className="grid grid-cols-4 gap-2 bg-white p-3.5 rounded-lg shadow-sm border border-gray-150">
                        {Array.from({ length: activeTrip.totalSeats || 12 }, (_, i) => {
                          const seatNum = (i + 1).toString();
                          const isBooked = activeTrip.bookingsList?.some((b: any) =>
                            b.seatNumbers?.includes(seatNum) || b.seatNumber === seatNum
                          );
                          const isCheckedIn = activeTrip.bookingsList?.some((b: any) =>
                            (b.seatNumbers?.includes(seatNum) || b.seatNumber === seatNum) &&
                            b.status === 'CHECKED_IN'
                          );

                          return (
                            <div
                              key={seatNum}
                              className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs font-bold border transition-all ${
                                isCheckedIn
                                  ? 'bg-emerald-500 border-emerald-600 text-white'
                                  : isBooked
                                  ? 'bg-blue-500 border-blue-600 text-white'
                                  : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span>{seatNum}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-2 text-xs font-semibold text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 bg-slate-100 border border-slate-200 rounded" />
                          <span>Available Seats</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 bg-blue-500 border border-blue-600 rounded" />
                          <span>Booked Seats</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 bg-emerald-500 border border-emerald-600 rounded" />
                          <span>Checked In / Boarded</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8">
                  <EmptyState
                    title="No active trip found"
                    description="You are currently not on any active route. Check your upcoming trips below."
                    icon="briefcase"
                  />
                </div>
              )}
            </div>

            {/* Upcoming Trips List */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Upcoming Trips (Next 5)</h3>
                </div>
                <Link
                  href="/dashboard/driver/trips"
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider"
                >
                  View Schedule
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {activeTrips && activeTrips.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {activeTrips.slice(0, 5).map((trip) => (
                    <div key={trip.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-gray-900 text-sm md:text-base">
                          {trip.source} → {trip.destination}
                        </p>
                        <div className="flex items-center gap-3.5 mt-1.5 text-xs text-gray-500 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(trip.departureTime).toLocaleDateString()} {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            {trip.bookings || 0} / {trip.totalSeats || 12} Seats
                          </span>
                        </div>
                      </div>
                      <Badge variant={trip.status === 'SCHEDULED' ? 'default' : 'success'} className="px-2.5 py-0.5 uppercase text-[10px] font-extrabold">
                        {trip.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs text-center py-6 bg-slate-50 rounded-xl">No upcoming trips assigned to you.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Earnings Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Earnings Summary</h3>
                </div>
                <Link href="/dashboard/driver/earnings" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider">
                  Details
                </Link>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Today</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      ₹{earnings?.today ? earnings.today.toLocaleString('en-IN') : '0'}
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Paid</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">This Week</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      ₹{earnings?.thisWeek ? earnings.thisWeek.toLocaleString('en-IN') : '0'}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">This Month</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      ₹{earnings?.thisMonth ? earnings.thisMonth.toLocaleString('en-IN') : '0'}
                    </p>
                  </div>
                  <Calendar className="w-6 h-6 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                Recent Bookings
              </h3>

              {activeTrip && activeTrip.bookingsList && activeTrip.bookingsList.length > 0 ? (
                <div className="space-y-4">
                  {activeTrip.bookingsList.slice(0, 4).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {booking.passenger?.firstName} {booking.passenger?.lastName}
                          </p>
                          <p className="text-[10px] text-gray-500 font-semibold">{booking.pickupLocation || 'Origin stop'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900">{booking.seatNumbers ? booking.seatNumbers.length : 1} Seats</p>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                          {booking.paymentStatus || 'PAID'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs text-center py-6 bg-slate-50 rounded-xl">No recent bookings registered.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
