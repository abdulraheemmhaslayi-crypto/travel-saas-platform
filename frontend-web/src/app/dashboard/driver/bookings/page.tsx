'use client';

import React, { useEffect, useState } from 'react';
import { useDriverStore } from '@/store/slices/driverSlice';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import {
  Users,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  Phone,
  User as UserIcon,
} from 'lucide-react';

export default function DriverBookingsPage() {
  const { activeTrips, isLoading, getDriverStats, updateBookingStatus } = useDriverStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'requests' | 'history'>('upcoming');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    getDriverStats();
  }, [getDriverStats]);

  // Extract bookings from all assigned trips
  const allBookings = React.useMemo(() => {
    const list: any[] = [];
    if (!activeTrips) return list;

    activeTrips.forEach((trip) => {
      if (trip.bookingsList) {
        trip.bookingsList.forEach((booking: any) => {
          list.push({
            ...booking,
            tripSource: trip.source,
            tripDestination: trip.destination,
            departureTime: trip.departureTime,
            tripStatus: trip.status,
          });
        });
      }
    });
    return list;
  }, [activeTrips]);

  const filteredBookings = React.useMemo(() => {
    return allBookings.filter((booking) => {
      const isPastTrip = booking.tripStatus === 'COMPLETED' || booking.tripStatus === 'CANCELLED';
      if (activeTab === 'history') {
        return isPastTrip || booking.status === 'COMPLETED' || booking.status === 'CANCELLED';
      }
      if (activeTab === 'requests') {
        // Pending bookings or checked-in requests
        return booking.status === 'PENDING' || booking.paymentStatus === 'PENDING';
      }
      // upcoming (scheduled and confirmed/checked_in on active trips)
      return !isPastTrip && booking.status !== 'CANCELLED';
    });
  }, [allBookings, activeTab]);

  const handleStatusChange = async (bookingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'CHECKED_IN' ? 'confirmed' : 'checked_in';
    setStatusMsg('Updating status...');
    try {
      await updateBookingStatus(bookingId, nextStatus);
      setStatusMsg('Status updated successfully.');
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to update status.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Passenger Bookings</h1>
          <p className="text-sm text-gray-500">Track and manage booking lists for your routes</p>
        </div>

        {statusMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="text-blue-500 hover:text-blue-700 ml-2">Dismiss</button>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex border-b border-gray-200 overflow-x-auto space-x-6">
          {(['upcoming', 'requests', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize tracking-wide transition-all border-b-2 shrink-0 ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'requests' ? 'Pending Requests' : `${tab} List`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Loading text="Loading bookings..." />
        ) : filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-sm border border-gray-200/60 transition-shadow">
                <div className="p-5 space-y-4">
                  {/* Passenger profile header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                      {booking.passenger?.firstName?.[0] || 'P'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
                        {booking.passenger?.firstName} {booking.passenger?.lastName}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {booking.passenger?.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  {/* Route details */}
                  <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100 text-xs text-gray-600">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      {booking.tripSource} → {booking.tripDestination}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500 font-bold uppercase">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(booking.departureTime).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{booking.seatNumbers ? booking.seatNumbers.join(', ') : booking.seatNumber} Seat(s)</span>
                    </div>
                  </div>

                  {/* Booking details */}
                  <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Status</p>
                      <Badge variant={booking.status === 'CHECKED_IN' ? 'success' : 'default'} className="mt-0.5 uppercase text-[9px] font-bold">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Payment</p>
                      <span className={`text-[10px] font-bold uppercase ${booking.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {booking.paymentStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Checkin action */}
                  {booking.tripStatus !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                    <div className="flex items-center justify-end pt-2 border-t border-gray-50">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <span>Mark Boarded (Checked In)</span>
                        <input
                          type="checkbox"
                          checked={booking.status === 'CHECKED_IN'}
                          onChange={() => handleStatusChange(booking.id, booking.status)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No bookings found"
            description="You don't have any bookings matching this category status."
            customIcon={<Users className="w-8 h-8 text-gray-400" />}
          />
        )}
      </div>
    </div>
  );
}
