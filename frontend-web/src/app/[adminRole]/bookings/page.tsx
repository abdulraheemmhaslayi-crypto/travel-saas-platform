'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import { Booking } from '@/types/booking';
import { formatDateTime, formatCurrency } from '@/lib/utils';

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Loading bookings hub..." />}>
      <AdminBookingsContent />
    </Suspense>
  );
}

function AdminBookingsContent() {
  const { showToast } = useAppStore();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadBookings();
  }, [page, statusParam]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getAdminBookings({
        page,
        limit: 10,
        status: statusParam || undefined
      });
      setBookings(response.data.data || response.data);
      setTotalCount(response.data.total || response.data.length);
    } catch (error) {
      showToast('Failed to load bookings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Booking ID',
      render: (booking: Booking) => (
        <span className="font-mono text-sm text-gray-600">#{booking.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'trip',
      header: 'Trip',
      render: (booking: Booking) => (
        <div>
          {booking.trip ? (
            <>
              <p className="font-medium text-gray-900">{booking.trip.origin} → {booking.trip.destination}</p>
              <p className="text-sm text-gray-500">{formatDateTime(booking.trip.departureDate)}</p>
            </>
          ) : (
            <span className="text-gray-400">Trip details unavailable</span>
          )}
        </div>
      ),
    },
    {
      key: 'seats',
      header: 'Seats',
      render: (booking: Booking) => (
        <span className="text-sm text-gray-600">{booking.seats}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (booking: Booking) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(booking.totalAmount, booking.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (booking: Booking) => (
        <Badge
          variant={
            booking.status === 'CONFIRMED'
              ? 'success'
              : booking.status === 'PENDING'
              ? 'warning'
              : booking.status === 'CANCELLED'
              ? 'danger'
              : 'default'
          }
          size="sm"
        >
          {booking.status}
        </Badge>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (booking: Booking) => (
        <Badge
          variant={
            booking.paymentStatus === 'PAID'
              ? 'success'
              : booking.paymentStatus === 'FAILED'
              ? 'danger'
              : 'warning'
          }
          size="sm"
        >
          {booking.paymentStatus}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {statusParam ? `${statusParam.charAt(0).toUpperCase() + statusParam.slice(1)} Bookings` : 'Bookings'}
        </h1>
        <p className="text-gray-600 mt-1">Manage all platform bookings</p>
      </div>

      <DataTable
        title={statusParam ? `${statusParam.charAt(0).toUpperCase() + statusParam.slice(1)} Bookings` : 'All Bookings'}
        columns={columns}
        data={bookings}
        keyExtractor={(booking) => booking.id}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        emptyMessage={statusParam ? `No ${statusParam} bookings found.` : 'No bookings found.'}
      />
    </div>
  );
}