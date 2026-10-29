'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams, usePathname } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/slices/authSlice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Loading from '@/components/common/Loading';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import { DollarSign, Users, Car, TrendingUp } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const getDaysFromPeriod = (period: string, startDate?: string, endDate?: string): number => {
  if (period === '7days') return 7;
  if (period === '30days') return 30;
  if (period === '3months') return 90;
  if (period === '6months') return 180;
  if (period === '12months') return 365;
  if (period === 'thisMonth') {
    const today = new Date();
    return today.getDate();
  }
  if (period === 'thisYear') {
    const start = new Date(new Date().getFullYear(), 0, 1);
    const diff = new Date().getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  if (period === 'custom' && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  return 30;
};

function AdminAnalyticsContent() {
  const { showToast } = useAppStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const adminRole = params?.adminRole as string || 'admin';
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN';
  const activeTab = searchParams.get('tab') || (isSuperAdmin ? 'revenue' : 'bookings');
  const period = searchParams.get('period') || '30days';
  const customStartDate = searchParams.get('startDate') || '';
  const customEndDate = searchParams.get('endDate') || '';
  const customGroupBy = searchParams.get('groupBy') || 'day';
  const [dashboard, setDashboard] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'revenue' && user && !isSuperAdmin) {
      router.replace(`/${adminRole}/analytics?tab=bookings`);
    }
  }, [activeTab, user, isSuperAdmin, adminRole, router]);

  const updateFilters = (newPeriod: string, start?: string, end?: string, groupBy?: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('period', newPeriod);
    if (newPeriod === 'custom') {
      if (start !== undefined) currentParams.set('startDate', start);
      if (end !== undefined) currentParams.set('endDate', end);
      if (groupBy !== undefined) currentParams.set('groupBy', groupBy);
    } else {
      currentParams.delete('startDate');
      currentParams.delete('endDate');
      currentParams.delete('groupBy');
    }
    router.push(`${pathname}?${currentParams.toString()}`);
  };

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = getDaysFromPeriod(period, customStartDate, customEndDate);
      const fetches: Array<Promise<any>> = [apiClient.getAnalyticsDashboard({ days })];
      if (isSuperAdmin && activeTab === 'revenue') {
        const revParams: any = {};
        if (period === 'custom') {
          revParams.startDate = customStartDate;
          revParams.endDate = customEndDate;
          revParams.groupBy = customGroupBy;
        } else {
          revParams.period = period;
        }
        fetches.push(apiClient.getRevenueAnalytics(revParams));
      }
      const results = await Promise.all(fetches);
      setDashboard(results[0].data);
      if (isSuperAdmin && results[1]) {
        setRevenue(results[1].data);
      }
    } catch (error: any) {
      showToast(error.message || 'Unable to load analytics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }
    loadAnalytics();
  }, [activeTab, period, customStartDate, customEndDate, customGroupBy]);

  const bookingData = dashboard?.dailyBookings || [];
  const userGrowthData = dashboard?.userGrowth || [];

  return (
    <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']} allowedUserTypes={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {activeTab === 'revenue' ? 'Revenue Reports & Analysis' : activeTab === 'bookings' ? 'Booking Reports & Analysis' : activeTab === 'drivers' ? 'Driver Reports & Performance' : activeTab === 'vehicles' ? 'Vehicle Performance & Utilization' : 'User Growth Reports'}
            </h1>
            <p className="text-gray-600 mt-1">Platform performance, bookings and resource insights</p>
          </div>
          <Button onClick={loadAnalytics}>Refresh</Button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-gray-150 p-5 flex flex-col md:flex-row md:items-end gap-4 shadow-sm">
          <div className="flex-1">
            <Select
              label="Time Period"
              options={[
                { value: '7days', label: 'Last 7 Days' },
                { value: '30days', label: 'Last 30 Days' },
                { value: '3months', label: 'Last 3 Months' },
                { value: '6months', label: 'Last 6 Months' },
                { value: '12months', label: 'Last 12 Months' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'thisYear', label: 'This Year' },
                { value: 'custom', label: 'Custom Date Range' },
              ]}
              value={period}
              onChange={(e) => updateFilters(e.target.value, customStartDate, customEndDate, customGroupBy)}
            />
          </div>

          {period === 'custom' && (
            <>
              <div className="w-full md:w-auto md:min-w-[160px]">
                <Input
                  label="Start Date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => updateFilters('custom', e.target.value, customEndDate, customGroupBy)}
                />
              </div>
              <div className="w-full md:w-auto md:min-w-[160px]">
                <Input
                  label="End Date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => updateFilters('custom', customStartDate, e.target.value, customGroupBy)}
                />
              </div>
              {activeTab === 'revenue' && (
                <div className="w-full md:w-auto md:min-w-[120px]">
                  <Select
                    label="Group By"
                    options={[
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                      { value: 'year', label: 'Year' },
                    ]}
                    value={customGroupBy}
                    onChange={(e) => updateFilters('custom', customStartDate, customEndDate, e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {isLoading ? (
          <Loading text="Loading analytics..." />
        ) : (
          <>
            {activeTab === 'revenue' && isSuperAdmin && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <StatCard
                    title="Total Revenue"
                    value={formatCurrency(revenue?.totalRevenue ?? dashboard?.totalRevenue ?? 0)}
                    subtitle="For Selected Period"
                    icon={<DollarSign className="w-6 h-6" />}
                    color="green"
                    trend={dashboard?.revenueChange >= 0 ? 'up' : 'down'}
                    trendValue={`${dashboard?.revenueChange ?? 0}%`}
                  />
                  <StatCard
                    title="Avg. Daily Revenue"
                    value={formatCurrency(revenue?.averageDaily ?? dashboard?.averageBookingValue ?? 0)}
                    subtitle="For Selected Period"
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="yellow"
                    trend={dashboard?.bookingValueChange >= 0 ? 'up' : 'down'}
                    trendValue={`${dashboard?.bookingValueChange ?? 0}%`}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard
                    title="Revenue Trends"
                    subtitle={`Revenue trends grouped by ${customGroupBy} (${period})`}
                    type="line"
                    data={revenue?.dataPoints || []}
                    dataKey="revenue"
                    xAxisKey="date"
                    colors={['#3b82f6']}
                  />
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
                    {revenue?.paymentMethodBreakdown?.length ? (
                      <div className="space-y-3">
                        {revenue.paymentMethodBreakdown.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-semibold text-gray-700 capitalize">{item.method}</span>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                              <p className="text-xs text-gray-500 font-medium">{item.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No payment method breakdown data available.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <StatCard
                    title="Completed Trips"
                    value={dashboard?.completedTrips ?? 0}
                    subtitle="Last 30 days"
                    icon={<Car className="w-6 h-6" />}
                    color="purple"
                    trend={dashboard?.tripCompletionChange >= 0 ? 'up' : 'down'}
                    trendValue={`${dashboard?.tripCompletionChange ?? 0}%`}
                  />
                  <StatCard
                    title="Avg. Booking Value"
                    value={formatCurrency(dashboard?.averageBookingValue ?? 0)}
                    subtitle="Last 30 days"
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="yellow"
                    trend={dashboard?.bookingValueChange >= 0 ? 'up' : 'down'}
                    trendValue={`${dashboard?.bookingValueChange ?? 0}%`}
                  />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <ChartCard
                    title="Bookings Overview"
                    subtitle={`Daily bookings overview`}
                    type="bar"
                    data={bookingData}
                    dataKey="count"
                    xAxisKey="date"
                    colors={['#22c55e']}
                  />
                </div>
              </div>
            )}

            {(activeTab === 'users' || activeTab === 'drivers') && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <StatCard
                    title="Active Users"
                    value={dashboard?.activeUsers ?? 0}
                    subtitle="Last 30 days"
                    icon={<Users className="w-6 h-6" />}
                    color="blue"
                    trend={dashboard?.userGrowthChange >= 0 ? 'up' : 'down'}
                    trendValue={`${dashboard?.userGrowthChange ?? 0}%`}
                  />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <ChartCard
                    title="User Registration Trends"
                    subtitle="New registrations overview"
                    type="area"
                    data={userGrowthData}
                    dataKey="count"
                    xAxisKey="week"
                    colors={['#8b5cf6']}
                  />
                </div>
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <StatCard
                    title="Completed Trips"
                    value={dashboard?.completedTrips ?? 0}
                    subtitle="Last 30 days"
                    icon={<Car className="w-6 h-6" />}
                    color="purple"
                    trend={dashboard?.tripCompletionChange >= 0 ? 'up' : 'down'}
                    trendValue={`${dashboard?.tripCompletionChange ?? 0}%`}
                  />
                  <StatCard
                    title="Avg. Booking Value"
                    value={formatCurrency(dashboard?.averageBookingValue ?? 0)}
                    subtitle="Last 30 days"
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="yellow"
                  />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Performance</h3>
                  {dashboard?.topRoutes?.length ? (
                    <div className="space-y-3">
                      {dashboard.topRoutes.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{item.route}</span>
                          <span className="text-sm font-semibold text-gray-900">{item.bookings} bookings completed</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No route statistics available.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']} allowedUserTypes={['ADMIN', 'SUPER_ADMIN']}>
      <Suspense fallback={<Loading text="Loading analytics panel..." />}>
        <AdminAnalyticsContent />
      </Suspense>
    </ProtectedRoute>
  );
}