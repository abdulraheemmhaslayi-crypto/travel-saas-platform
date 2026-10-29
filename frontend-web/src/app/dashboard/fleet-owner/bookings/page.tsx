'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import DataTable from '@/components/admin/DataTable';
import Loading from '@/components/common/Loading';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Calendar, RefreshCw, Ticket, Users, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store';

type BookingTab = 'all' | 'passengers';

export default function FleetOwnerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useAppStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive current tab from URL ?tab= param
  const tabParam = (searchParams.get('tab') || '').toLowerCase();
  const currentTab: BookingTab = tabParam === 'passengers' ? 'passengers' : 'all';

  const setCurrentTab = (tab: BookingTab) => {
    if (tab === 'all') {
      router.push('/dashboard/fleet-owner/bookings', { scroll: false });
    } else {
      router.push(`/dashboard/fleet-owner/bookings?tab=${tab}`, { scroll: false });
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getMyBookings();
      setBookings(response.data?.data || response.data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch bookings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return <Badge variant="success">{s}</Badge>;
      case 'PENDING':
        return <Badge variant="warning">{s}</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">{s}</Badge>;
      default:
        return <Badge variant="default">{s}</Badge>;
    }
  };

  // Stats
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => (b.status || '').toUpperCase() === 'CONFIRMED').length;
  const completedBookings = bookings.filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.totalAmount || b.amount || 0), 0);

  const bookingColumns = [
    {
      key: 'bookingId',
      header: 'Booking ID',
      render: (row: any) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
          {row.id.split('-')[0].toUpperCase()}
        </span>
      ),
    },
    {
      key: 'passenger',
      header: 'Passenger',
      render: (row: any) => (
        <div>
          <p className="font-medium text-gray-900">{row.passenger?.name || row.passengerName || 'Unknown'}</p>
          <p className="text-sm text-gray-500">{row.passenger?.email || row.passengerEmail}</p>
        </div>
      ),
    },
    {
      key: 'trip',
      header: 'Trip',
      render: (row: any) => (
        <div>
          <p className="font-medium text-gray-900">{row.trip?.source} → {row.trip?.destination}</p>
          <p className="text-sm text-gray-500">
            {row.trip?.departureTime ? new Date(row.trip.departureTime).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row: any) => (
        <span className="text-gray-700">{row.trip?.vehicle?.registrationNumber || 'Unassigned'}</span>
      ),
    },
    {
      key: 'seats',
      header: 'Seats',
      render: (row: any) => row.numberOfSeats || row.seats || 1,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: any) => <span className="font-semibold text-gray-900">₹{row.totalAmount || row.amount || 0}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => getStatusBadge(row.status),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row: any) => getStatusBadge(row.paymentStatus),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <Button size="sm" variant="secondary" onClick={() => router.push(`/dashboard/bookings/${row.id}`)}>
          View Details
        </Button>
      ),
    },
  ];

  const passengerColumns = [
    {
      key: 'passenger',
      header: 'Passenger',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {(row.passenger?.name || row.passengerName || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.passenger?.name || row.passengerName || 'Unknown'}</p>
            <p className="text-xs text-gray-500">{row.passenger?.phone || row.passengerPhone || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: any) => (
        <span className="text-sm text-gray-600">{row.passenger?.email || row.passengerEmail || 'N/A'}</span>
      ),
    },
    {
      key: 'trip',
      header: 'Route',
      render: (row: any) => (
        <span className="text-sm text-gray-700">{row.trip?.source} → {row.trip?.destination}</span>
      ),
    },
    {
      key: 'departureDate',
      header: 'Departure',
      render: (row: any) => (
        <span className="text-sm text-gray-700">
          {row.trip?.departureTime ? new Date(row.trip.departureTime).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'seats',
      header: 'Seats Booked',
      render: (row: any) => (
        <span className="text-sm font-semibold text-gray-800">{row.numberOfSeats || row.seats || 1}</span>
      ),
    },
    {
      key: 'status',
      header: 'Booking Status',
      render: (row: any) => getStatusBadge(row.status),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-blue-600" />
            Vehicle Bookings
          </h1>
          <p className="text-gray-600 mt-1">Manage passenger bookings across your fleet.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchBookings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalBookings}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Confirmed</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{confirmedBookings}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{completedBookings}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Revenue</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([
            { id: 'all' as const, label: 'Vehicle Bookings', icon: <Ticket className="w-3.5 h-3.5" /> },
            { id: 'passengers' as const, label: 'Passenger Lists', icon: <Users className="w-3.5 h-3.5" /> },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                currentTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <Loading text="Loading bookings..." />
      ) : (
        <DataTable
          title={currentTab === 'passengers' ? 'Passenger Lists' : 'Recent Bookings'}
          columns={currentTab === 'passengers' ? passengerColumns : bookingColumns}
          data={bookings}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          totalCount={bookings.length}
          page={1}
          onPageChange={() => {}}
          emptyMessage={currentTab === 'passengers' ? 'No passengers found.' : 'No bookings found for your fleet.'}
        />
      )}
    </div>
  );
}
