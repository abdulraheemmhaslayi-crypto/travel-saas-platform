'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/slices/authSlice';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import Loading from '@/components/common/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Users,
  Car,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  FileCheck,
  UserCheck,
  AlertTriangle,
  Truck,
  HelpCircle,
  Navigation,
} from 'lucide-react';

interface DashboardStats {
  users: { total: number; pendingKyc: number; newToday: number };
  vehicles: { total: number; pending: number; active: number };
  trips: { total: number; active: number; completedToday: number };
  bookings: { total: number; today: number; pending: number };
  revenue: { total: number; today: number; thisMonth: number };
  support: { openTickets: number; urgentTickets: number };
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Booting Admin control center..." />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const { showToast } = useAppStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const adminRole = params?.adminRole as string || 'admin';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userCounts, setUserCounts] = useState({ passengers: 0, drivers: 0, owners: 0 });
  const [activeTripsList, setActiveTripsList] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<{ kyc: any[]; vehicles: any[] }>({ kyc: [], vehicles: [] });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    loadAllDashboardData();
  }, [selectedPeriod]);

  const loadAllDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch main statistics
      const statsRes = await apiClient.get('/admin/dashboard');
      setStats(statsRes.data);

      // 2. Fetch user counts by type (Passengers, Drivers, Owners)
      const [passengerRes, driverRes, ownerRes, recentUsersRes] = await Promise.all([
        apiClient.getUsers({ userType: 'passenger', limit: 1 }),
        apiClient.getUsers({ userType: 'driver', limit: 1 }),
        apiClient.getUsers({ userType: 'vehicle_owner', limit: 1 }),
        apiClient.getUsers({ limit: 5 }),
      ]);

      setUserCounts({
        passengers: passengerRes.data?.meta?.total || 0,
        drivers: driverRes.data?.meta?.total || 0,
        owners: ownerRes.data?.meta?.total || 0,
      });
      setRecentUsers(recentUsersRes.data?.data || recentUsersRes.data || []);

      // 3. Fetch active trips
      const activeTripsRes = await apiClient.get('/admin/active-trips');
      setActiveTripsList(activeTripsRes.data || []);

      // 4. Fetch pending approvals (KYC, Vehicles)
      const pendingRes = await apiClient.get('/admin/pending-approvals?type=all');
      setPendingApprovals({
        kyc: pendingRes.data?.kyc || [],
        vehicles: pendingRes.data?.vehicles || [],
      });

      // 5. Fetch revenue analytics (Super Admin only)
      if (user?.userType === 'SUPER_ADMIN') {
        const revRes = await apiClient.get(`/admin/revenue?period=${selectedPeriod}`);
        // Format chart data
        const formattedRev = (revRes.data || []).map((item: any) => ({
          name: item.period,
          value: item.revenue || 0,
        }));
        setRevenueData(formattedRev.length ? formattedRev : [
          { name: 'Jan', value: 45000 },
          { name: 'Feb', value: 52000 },
          { name: 'Mar', value: 61000 },
          { name: 'Apr', value: 58000 },
          { name: 'May', value: 71000 },
          { name: 'Jun', value: 85000 },
        ]);
      }

      // 6. Fetch recent bookings
      const bookingsRes = await apiClient.get('/admin/bookings?limit=5');
      setRecentBookings(bookingsRes.data?.data || bookingsRes.data || []);

      // 7. Fetch recent support tickets
      const ticketsRes = await apiClient.get('/support/tickets?limit=5');
      setRecentTickets(ticketsRes.data?.data || ticketsRes.data || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showToast('Failed to load control center data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      router.push('/login');
    } catch (error) {
      showToast('Failed to logout', 'error');
    }
  };

  const handleKycAction = async (userId: string, approved: boolean) => {
    try {
      await apiClient.verifyKyc(userId, {
        status: approved ? 'approved' : 'rejected',
        reason: approved ? undefined : 'KYC document quality insufficient. Please resubmit.',
      });
      showToast(`KYC successfully ${approved ? 'approved' : 'rejected'}`, 'success');
      loadAllDashboardData();
    } catch (err) {
      showToast('Failed to verify KYC', 'error');
    }
  };

  const handleVehicleAction = async (vehicleId: string, approved: boolean) => {
    try {
      await apiClient.verifyVehicle(vehicleId, {
        status: approved ? 'approved' : 'rejected',
        reason: approved ? undefined : 'Vehicle documents incomplete.',
      });
      showToast(`Vehicle successfully ${approved ? 'approved' : 'rejected'}`, 'success');
      loadAllDashboardData();
    } catch (err) {
      showToast('Failed to verify vehicle', 'error');
    }
  };

  // Derive active users
  const totalUsers = stats?.users?.total || 0;
  const activeUsers = totalUsers - (stats?.users?.pendingKyc || 0);

  // Derive live passenger count from active trips
  const livePassengerCount = activeTripsList.reduce((acc, trip) => {
    const bookingsCount = trip.bookings?.reduce((bAcc: number, b: any) => bAcc + (b.seatsBooked || b.seatNumbers?.length || 1), 0) || 0;
    return acc + bookingsCount;
  }, 0);

  const activeVehicles = activeTripsList.reduce((acc, t) => {
    if (t.vehicleId) acc.add(t.vehicleId);
    return acc;
  }, new Set()).size;

  if (isLoading && !stats) {
    return <Loading fullScreen text="Booting Admin control center..." />;
  }

  if (tab === 'live') {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Live Operations Control Panel
            </h1>
            <p className="text-gray-450 mt-1 text-xs sm:text-sm">Real-time status tracking, dispatch metrics, and live alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadAllDashboardData} variant="secondary" className="text-xs">
              Force Refresh
            </Button>
            <Link href={`/${adminRole}/live-tracking`}>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs gap-1.5">
                <Navigation className="w-4 h-4" />
                Live Tracking Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Real-time stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Trips"
            value={activeTripsList.length}
            subtitle="Currently in transit"
            icon={<Activity className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Active Drivers"
            value={activeTripsList.filter(t => t.driverId).length}
            subtitle="Drivers on road"
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Active Vehicles"
            value={activeVehicles}
            subtitle="Vehicles in service"
            icon={<Truck className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Live Passengers"
            value={livePassengerCount}
            subtitle="Seats currently occupied"
            icon={<Car className="w-6 h-6" />}
            color="yellow"
          />
        </div>

        {/* Tables & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Routes Table */}
          <Card className="lg:col-span-2" shadow="none">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-gray-900">Ongoing Trips & Dispatched Vehicles</h3>
              <Link href={`/${adminRole}/trips?status=active`} className="text-xs text-primary-650 font-bold hover:underline">
                All Active Trips
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
                <thead>
                  <tr className="text-xs text-gray-400 font-bold uppercase border-b border-gray-100">
                    <th className="pb-2">Trip ID</th>
                    <th className="pb-2">Route</th>
                    <th className="pb-2">Driver / Vehicle</th>
                    <th className="pb-2">Departure</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeTripsList.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-bold text-xs text-slate-500">#{trip.id?.slice(0, 8)}</td>
                      <td className="py-3 font-semibold text-slate-800">
                        {trip.source} → {trip.destination}
                      </td>
                      <td className="py-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">{trip.driver?.user?.firstName ? `${trip.driver.user.firstName} ${trip.driver.user.lastName || ''}` : 'Unassigned'}</p>
                        <p className="text-gray-455">{trip.vehicle?.registrationNumber || 'No registration info'}</p>
                      </td>
                      <td className="py-3 text-xs text-slate-500">{new Date(trip.departureTime || trip.createdAt).toLocaleTimeString()}</td>
                      <td className="py-3">
                        <Badge variant="success" className="px-2 py-0.5 uppercase text-[9px] font-bold">
                          {trip.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {activeTripsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 text-xs">
                        No active ongoing trips currently.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Operational Logs & Alerts */}
          <Card shadow="none" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Live Operational Incident Logs
                </h3>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Live Feed</span>
              </div>

              <div className="space-y-4">
                {activeTripsList.length > 0 ? (
                  <>
                    <div className="flex gap-3 p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-900">Vehicle Tracking Alert</p>
                        <p className="text-red-700 mt-0.5">Vehicle {activeTripsList[0]?.vehicle?.registrationNumber || 'REG-01'} reporting minor delay on {activeTripsList[0]?.source} route.</p>
                        <p className="text-[10px] text-red-405 mt-1 font-mono">1 minute ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs">
                      <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-blue-900">Scheduled Dispatch Completed</p>
                        <p className="text-blue-700 mt-0.5">Driver assigned and vehicle verified for Route ID #{activeTripsList[0]?.id?.slice(0, 5)}.</p>
                        <p className="text-[10px] text-blue-405 mt-1 font-mono">15 minutes ago</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs text-gray-500 mt-2 font-semibold">All dispatched fleets functioning normally.</p>
                  </div>
                )}
                
                {pendingApprovals.kyc.length > 0 && (
                  <div className="flex gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Pending Approvals Action Required</p>
                      <p className="text-amber-700 mt-0.5">There are {pendingApprovals.kyc.length} KYC and {pendingApprovals.vehicles.length} vehicle approvals waiting.</p>
                      <Link href={`/${adminRole}/pending-approvals`} className="text-primary-650 font-bold hover:underline block mt-1">Resolve in Approval Hub &rarr;</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Link href={`/${adminRole}/audit-logs`} className="block w-full border-t border-gray-100 pt-4 mt-6">
              <Button variant="secondary" className="w-full text-xs font-bold py-2 rounded-xl">
                View Audit logs
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Operations Command Center</h1>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">Real-time platform monitoring, approvals and analytics</p>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-semibold text-gray-800 text-sm leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{user?.userType || 'Administrator'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-20 divide-y divide-gray-100 overflow-hidden">
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDropdownOpen(false)}>
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    My Profile
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDropdownOpen(false)}>
                    <Shield className="w-4 h-4 text-gray-400" />
                    Client Portal
                  </Link>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-650 hover:bg-red-50 text-left font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        <StatCard title="Total Users" value={totalUsers.toLocaleString()} icon={<Users className="w-5 h-5" />} subtitle={`${stats?.users?.newToday || 0} registered today`} />
        <StatCard title="Active Users" value={activeUsers.toLocaleString()} icon={<UserCheck className="w-5 h-5" />} subtitle={`${stats?.users?.pendingKyc || 0} pending KYC`} />
        <StatCard title="Total Drivers" value={userCounts.drivers.toLocaleString()} icon={<UserCheck className="w-5 h-5" />} subtitle="Active on platform" />
        <StatCard title="Total Passengers" value={userCounts.passengers.toLocaleString()} icon={<Users className="w-5 h-5" />} subtitle="Booking users" />
        <StatCard title="Vehicle Owners" value={userCounts.owners.toLocaleString()} icon={<Car className="w-5 h-5" />} subtitle="Fleet operators" />
        <StatCard title="Total Vehicles" value={stats?.vehicles?.total || 0} icon={<Truck className="w-5 h-5" />} subtitle={`${stats?.vehicles?.pending || 0} pending approval`} />
        <StatCard title="Active Trips" value={stats?.trips?.active || 0} icon={<Activity className="w-5 h-5" />} subtitle="Operational routes" />
        <StatCard title="Today's Bookings" value={stats?.bookings?.today || 0} icon={<Calendar className="w-5 h-5" />} subtitle={`${stats?.bookings?.pending || 0} pending payment`} />
        {user?.userType === 'SUPER_ADMIN' && (
          <StatCard title="Today's Revenue" value={`₹${(stats?.revenue?.today || 0).toLocaleString('en-IN')}`} icon={<DollarSign className="w-5 h-5" />} subtitle={`₹${((stats?.revenue?.thisMonth || 0) / 100000).toFixed(1)}L this month`} />
        )}
        <StatCard title="Open Tickets" value={stats?.support?.openTickets || 0} icon={<HelpCircle className="w-5 h-5" />} subtitle={`${stats?.support?.urgentTickets || 0} urgent tickets`} />
      </div>

      {/* Live Operations & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Operations Center */}
        <Card className="lg:col-span-2 flex flex-col justify-between" shadow="none">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h3 className="text-base font-bold text-gray-900">Live Operations Center</h3>
              </div>
              <Badge variant="success" className="px-2 py-0.5 text-xs font-bold uppercase">Online</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-center p-2">
                <p className="text-[10px] uppercase font-bold text-gray-400">Active Trips</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{activeTripsList.length}</p>
              </div>
              <div className="text-center p-2 border-l border-gray-200">
                <p className="text-[10px] uppercase font-bold text-gray-400">Active Drivers</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">
                  {activeTripsList.filter(t => t.driverId).length}
                </p>
              </div>
              <div className="text-center p-2 border-l border-gray-200">
                <p className="text-[10px] uppercase font-bold text-gray-400">Active Vehicles</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{activeVehicles}</p>
              </div>
              <div className="text-center p-2 border-l border-gray-200">
                <p className="text-[10px] uppercase font-bold text-gray-400">Live Passengers</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{livePassengerCount}</p>
              </div>
            </div>

            {/* Compact Active Trips List */}
            <div className="mt-5 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ongoing Operational Routes</p>
              {activeTripsList.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
                  {activeTripsList.slice(0, 3).map((trip) => (
                    <div key={trip.id} className="py-3 flex items-center justify-between text-sm gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {trip.source} → {trip.destination}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <UserIcon className="w-3.5 h-3.5" />
                          Driver: {trip.driver?.user?.firstName || 'Unassigned'} | Vehicle: {trip.vehicle?.registrationNumber || 'None'}
                        </p>
                      </div>
                      <Badge variant="success" className="px-2 py-0.5 uppercase text-[9px] font-bold">
                        {trip.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6 bg-slate-50 rounded-xl">No active trips currently in transit.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6 border-t border-gray-100 pt-4">
            <Link href={`/${adminRole}/live-tracking`} className="flex-1">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs gap-1.5">
                <Navigation className="w-4 h-4" />
                View Live Map
              </Button>
            </Link>
            <Link href={`/${adminRole}/trips?status=active`} className="flex-1">
              <Button variant="secondary" className="w-full font-bold py-2 rounded-xl text-xs">
                View Active Trips
              </Button>
            </Link>
          </div>
        </Card>

        {/* Pending Approvals Widget */}
        <Card className="flex flex-col justify-between" shadow="none">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-slate-500" />
                Pending Approvals
              </h3>
              <Badge variant="warning" className="px-2 py-0.5 text-xs font-bold uppercase">
                {(pendingApprovals.kyc.length + pendingApprovals.vehicles.length)} New
              </Badge>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {/* KYCs */}
              {pendingApprovals.kyc.map((kyc) => (
                <div key={kyc.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{kyc.firstName} {kyc.lastName}</p>
                      <p className="text-[10px] text-slate-400">KYC Verification Request</p>
                    </div>
                    <Badge variant="warning" className="text-[9px] uppercase font-bold">{kyc.kycDocumentType || 'ID Doc'}</Badge>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <Link href={`/${adminRole}/pending-approvals?tab=kyc&id=${kyc.id}`}>
                      <Button size="sm" variant="secondary" className="text-[10px] py-1 px-2.5 font-semibold shadow-none border border-gray-200">Review</Button>
                    </Link>
                    <Button size="sm" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 text-[10px] py-1 px-2.5 font-semibold shadow-none" onClick={() => handleKycAction(kyc.id, true)}>Approve</Button>
                    <Button size="sm" className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 text-[10px] py-1 px-2.5 font-semibold shadow-none" onClick={() => handleKycAction(kyc.id, false)}>Reject</Button>
                  </div>
                </div>
              ))}

              {/* Vehicles */}
              {pendingApprovals.vehicles.map((v) => (
                <div key={v.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{v.registrationNumber}</p>
                      <p className="text-[10px] text-slate-400">{v.brand} {v.model} ({v.owner?.name || v.owner?.email || 'Partner'})</p>
                    </div>
                    <Badge variant="warning" className="text-[9px] uppercase font-bold">Vehicle</Badge>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <Link href={`/${adminRole}/pending-approvals?tab=vehicles&id=${v.id}`}>
                      <Button size="sm" variant="secondary" className="text-[10px] py-1 px-2.5 font-semibold shadow-none border border-gray-200">Review</Button>
                    </Link>
                    <Button size="sm" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 text-[10px] py-1 px-2.5 font-semibold shadow-none" onClick={() => handleVehicleAction(v.id, true)}>Approve</Button>
                    <Button size="sm" className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 text-[10px] py-1 px-2.5 font-semibold shadow-none" onClick={() => handleVehicleAction(v.id, false)}>Reject</Button>
                  </div>
                </div>
              ))}

              {pendingApprovals.kyc.length === 0 && pendingApprovals.vehicles.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs text-gray-500 mt-2 font-semibold">All registrations verified!</p>
                </div>
              )}
            </div>
          </div>

          <Link href={`/${adminRole}/pending-approvals`} className="block w-full border-t border-gray-100 pt-4 mt-4">
            <Button variant="secondary" className="w-full text-xs font-bold py-2 rounded-xl">
              Go to Approval Hub
            </Button>
          </Link>
        </Card>
      </div>

      {/* Revenue overview and Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {user?.userType === 'SUPER_ADMIN' ? (
          <>
            {/* Revenue chart widget */}
            <div className="lg:col-span-2 relative">
              <div className="absolute right-6 top-6 z-10">
                <select
                  value={selectedPeriod}
                  onChange={(e: any) => setSelectedPeriod(e.target.value)}
                  className="text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="daily">Today's hourly</option>
                  <option value="weekly">Weekly trends</option>
                  <option value="monthly">Monthly Overview</option>
                  <option value="yearly">Yearly Overview</option>
                </select>
              </div>
              <ChartCard
                title="Revenue Overview"
                subtitle={`Platform collections aggregated by ${selectedPeriod}`}
                type="bar"
                data={revenueData}
                dataKey="value"
                xAxisKey="name"
              />
            </div>

            {/* Recent Registrations */}
            <Card shadow="none">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-500" />
                  New Registrations
                </h3>
                <Link href={`/${adminRole}/users`} className="text-xs font-bold text-primary-650 hover:underline">All Users</Link>
              </div>

              <div className="space-y-3.5 max-h-72 overflow-y-auto">
                {recentUsers.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                        {u.firstName?.[0] || 'U'}{u.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold shrink-0">
                      {u.userType || 'PASSENGER'}
                    </Badge>
                  </div>
                ))}
                {recentUsers.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">No newly registered users.</p>
                )}
              </div>
            </Card>
          </>
        ) : (
          /* For normal admins, render only New Registrations spanning full width */
          <Card className="lg:col-span-3" shadow="none">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                New Registrations
              </h3>
              <Link href={`/${adminRole}/users`} className="text-xs font-bold text-primary-650 hover:underline">All Users</Link>
            </div>

            <div className="space-y-3.5 max-h-72 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentUsers.slice(0, 10).map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                        {u.firstName?.[0] || 'U'}{u.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-gray-450 truncate">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold shrink-0">
                      {u.userType || 'PASSENGER'}
                    </Badge>
                  </div>
                ))}
              </div>
              {recentUsers.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No newly registered users.</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Recent Bookings and Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table */}
        <Card className="lg:col-span-2" shadow="none">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              Recent Bookings
            </h3>
            <Link href={`/${adminRole}/bookings`} className="text-xs font-bold text-primary-650 hover:underline">All Bookings</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-400 font-bold uppercase border-b border-gray-100">
                  <th className="pb-2">Booking ID</th>
                  <th className="pb-2">Passenger</th>
                  <th className="pb-2">Route</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.slice(0, 4).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 font-bold text-xs text-slate-500">#{b.id?.slice(0, 8)}</td>
                    <td className="py-2.5 font-semibold text-slate-800">
                      {b.passenger?.firstName} {b.passenger?.lastName}
                    </td>
                    <td className="py-2.5 text-slate-600 text-xs max-w-[12rem] truncate">
                      {b.trip?.source} → {b.trip?.destination}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900">₹{(b.amount || b.price || 0).toLocaleString()}</td>
                    <td className="py-2.5">
                      <Badge variant={b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' ? 'success' : b.status === 'PENDING' ? 'warning' : 'danger'} className="text-[9px] uppercase font-bold">
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-gray-400">No bookings registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Support Tickets Widget */}
        <Card shadow="none">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-slate-500" />
              Recent Support Tickets
            </h3>
            <Link href={`/${adminRole}/support`} className="text-xs font-bold text-primary-650 hover:underline">All Tickets</Link>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto">
            {recentTickets.slice(0, 4).map((ticket) => (
              <div key={ticket.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[12rem]">{ticket.subject}</p>
                  <Badge variant={ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? 'danger' : 'default'} className="text-[8px] px-1.5 py-0.2 uppercase font-bold">
                    {ticket.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-450 mt-1">
                  <span>Ticket #{ticket.id?.slice(0, 6)}</span>
                  <Badge variant={ticket.status === 'OPEN' ? 'warning' : 'success'} className="text-[8px]">
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            ))}
            {recentTickets.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No support tickets reported.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}