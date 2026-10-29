'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useFleetStore } from '@/store/slices/fleetSlice';
import Loading from '@/components/common/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Truck, Users, DollarSign, Clock, BarChart3, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function FleetOwnerAnalyticsPage() {
  const { stats, revenue, isLoading, getFleetStats, getRevenue } = useFleetStore();

  useEffect(() => {
    getFleetStats();
    getRevenue();
  }, [getFleetStats, getRevenue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics</h1>
          <p className="text-gray-600 mt-1">Track revenue, driver performance and vehicle utilization.</p>
        </div>
        <Button onClick={() => { getFleetStats(); getRevenue(); }}>Refresh</Button>
      </div>

      {isLoading || !stats ? (
        <Loading text="Loading analytics..." />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Vehicles</p>
                  <p className="text-3xl font-semibold text-gray-900">{stats.totalVehicles}</p>
                </div>
                <Truck className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-sm text-gray-500">Active vehicles: {stats.activeVehicles}</div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Active Drivers</p>
                  <p className="text-3xl font-semibold text-gray-900">{stats.activeDrivers}</p>
                </div>
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-sm text-gray-500">Total drivers: {stats.totalDrivers}</div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-3xl font-semibold text-gray-900">{formatCurrency(revenue?.total ?? 0)}</p>
                </div>
                <DollarSign className="w-7 h-7 text-yellow-600" />
              </div>
              <div className="text-sm text-gray-500">This week: {formatCurrency(revenue?.thisWeek ?? 0)}</div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Performance Snapshot</h2>
                <p className="text-sm text-gray-500">Revenue and vehicle usage insights.</p>
              </div>
              <Link href="/dashboard/fleet-owner/live-tracking" className="text-sm text-blue-600 hover:text-blue-700">
                Live tracking <ArrowRight className="w-4 h-4 inline-block" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-700">Highest Revenue Vehicle</p>
                <p className="mt-2 text-lg font-semibold text-blue-900 line-clamp-1">Bus A (₹34k)</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-green-700">Most Used Vehicle</p>
                <p className="mt-2 text-lg font-semibold text-green-900 line-clamp-1">Sedan X (120 Trips)</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Utilization & Trends</h2>
                <p className="text-sm text-gray-500">Fleet health and booking activity.</p>
              </div>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Utilization Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalVehicles ? Math.round((stats?.activeVehicles / stats?.totalVehicles) * 100) : 0}%
                </p>
                <p className="text-xs text-green-600 mt-1">+5% from last week</p>
              </div>
              <div className="rounded-xl bg-white p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Booking Trends</p>
                <p className="text-2xl font-semibold text-gray-900">1,240</p>
                <p className="text-xs text-green-600 mt-1">Bookings this month</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
