'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/slices/authSlice';
import { useBookingStore } from '@/store/slices/bookingSlice';
import { useTripStore } from '@/store/slices/tripSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { usePassengerStore } from '@/store/slices/passengerStore';
import { formatDateTime, formatCurrency, cn } from '@/lib/utils';
import { Booking } from '@/types/booking';
import {
  Calendar,
  MapPin,
  Bell,
  Wallet,
  TrendingUp,
  ArrowRight,
  Clock,
  Star,
  Search,
  Navigation,
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  Upload,
  AlertTriangle,
  Zap,
  ChevronRight,
  Car,
  User as UserIcon,
  Phone,
  Share2,
  Eye,
  Plus,
  Sparkles,
  Route,
  PlayCircle,
  Ban,
  Heart,
  Ticket,
  LifeBuoy,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function PassengerDashboardPage() {
  const { user } = useAuthStore();
  const { bookings, getMyBookings } = useBookingStore();
  const { popularRoutes, getPopularRoutes } = useTripStore();
  const { unreadCount, notifications, getUnreadCount, getNotifications } = useNotificationStore();
  const { favoriteRoutes } = usePassengerStore();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletCurrency, setWalletCurrency] = useState('INR');

  const loadWallet = useCallback(async () => {
    try {
      const walletRes = await apiClient.getWallet();
      setWalletBalance(walletRes.data.balance);
      setWalletCurrency(walletRes.data.currency || 'INR');
    } catch {
      setWalletBalance(null);
      setWalletCurrency('INR');
    }
  }, []);

  useEffect(() => {
    getMyBookings({ limit: 10 });
    getPopularRoutes();
    getUnreadCount();
    getNotifications({ limit: 3 });
    loadWallet();
  }, [getMyBookings, getPopularRoutes, getUnreadCount, getNotifications, loadWallet]);

  // ─── Computed Data ────────────────────────────────────────────────────────
  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING'),
    [bookings]
  );
  const ongoingBookings = useMemo(
    () => bookings.filter((b) => (b.status as string) === 'ON_TRIP' || (b.status as string) === 'CHECKED_IN'),
    [bookings]
  );
  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'COMPLETED'),
    [bookings]
  );
  const cancelledBookings = useMemo(
    () => bookings.filter((b) => b.status === 'CANCELLED'),
    [bookings]
  );
  const nextTrip = upcomingBookings[0] || ongoingBookings[0];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // ─── KYC Status ───────────────────────────────────────────────────────────
  const kycStatus = user?.kycStatus || 'PENDING';
  const showKycBanner = kycStatus === 'PENDING' || kycStatus === 'REJECTED';

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {greeting}, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Here&apos;s what&apos;s happening with your trips today.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/notifications">
            <Button variant="secondary" className="relative !py-2.5 !px-3">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/dashboard/trips/search">
            <Button className="!py-2.5 gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Book a Trip</span>
              <span className="sm:hidden">Search</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KYC Banner ──────────────────────────────────────────────────── */}
      {showKycBanner && (
        <div className={`rounded-2xl p-4 flex items-start gap-3 ${
          kycStatus === 'REJECTED'
            ? 'bg-red-50 border border-red-100'
            : 'bg-amber-50 border border-amber-100'
        }`}>
          <div className={`p-2 rounded-xl ${
            kycStatus === 'REJECTED' ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            {kycStatus === 'REJECTED' ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Shield className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold ${
              kycStatus === 'REJECTED' ? 'text-red-800' : 'text-amber-800'
            }`}>
              {kycStatus === 'REJECTED' ? 'KYC Verification Rejected' : 'Complete Your KYC'}
            </h3>
            <p className={`text-xs mt-0.5 ${
              kycStatus === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {kycStatus === 'REJECTED'
                ? 'Your KYC documents were rejected. Please re-submit with valid documents.'
                : 'Verify your identity to unlock all features and start booking trips.'}
            </p>
          </div>
          <Link href="/dashboard/profile?tab=kyc">
            <Button size="sm" variant={kycStatus === 'REJECTED' ? 'danger' : 'primary'} className="shrink-0">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {kycStatus === 'REJECTED' ? 'Re-submit' : 'Complete KYC'}
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { href: '/dashboard/trips/search', icon: Search, label: 'Search', iconColor: 'text-gray-700 bg-slate-50 border border-slate-100' },
          { href: '/dashboard/bookings', icon: Ticket, label: 'Bookings', iconColor: 'text-gray-700 bg-slate-50 border border-slate-100' },
          { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet', iconColor: 'text-gray-700 bg-slate-50 border border-slate-100' },
          { href: '/dashboard/support', icon: LifeBuoy, label: 'Support', iconColor: 'text-gray-700 bg-slate-50 border border-slate-100' },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-pointer group">
              <div className={cn('p-2 rounded-xl border border-transparent transition-colors', action.iconColor)}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-gray-500 group-hover:text-gray-900">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Upcoming Trip Hero Card ─────────────────────────────────────── */}
      {nextTrip && (
        <UpcomingTripCard booking={nextTrip} />
      )}

      {/* ── Trip Statistics ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Trips"
          value={bookings.length}
          icon={<Route className="w-4 h-4" />}
          iconColor="text-gray-500 border-gray-200/40"
          iconBg="bg-gray-50/50"
        />
        <StatCard
          label="Upcoming"
          value={upcomingBookings.length}
          icon={<Clock className="w-4 h-4" />}
          iconColor="text-blue-600 border-blue-200/40"
          iconBg="bg-blue-50/50"
        />
        <StatCard
          label="Completed"
          value={completedBookings.length}
          icon={<CheckCircle className="w-4 h-4" />}
          iconColor="text-emerald-600 border-emerald-200/40"
          iconBg="bg-emerald-50/50"
        />
        <StatCard
          label="Cancelled"
          value={cancelledBookings.length}
          icon={<Ban className="w-4 h-4" />}
          iconColor="text-rose-600 border-rose-200/40"
          iconBg="bg-rose-50/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2/3) ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Recent Bookings</h2>
              <Link
                href="/dashboard/bookings"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-2.5">
                {bookings.slice(0, 5).map((booking) => (
                  <RecentBookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <Card>
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">No bookings yet</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Search for trips and book your first ride
                  </p>
                  <Link href="/dashboard/trips/search">
                    <Button size="sm">
                      <Search className="w-3.5 h-3.5 mr-1.5" />
                      Search Trips
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Recommended Trips (Popular Routes) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Recommended Trips</h2>
              <Link
                href="/dashboard/passenger/popular-routes"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Explore
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {popularRoutes.slice(0, 4).map((route) => (
                <Link
                  key={route.id}
                  href={`/dashboard/trips/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`}
                >
                  <div className="p-3.5 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
                        <MapPin className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {route.origin} → {route.destination}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          From {formatCurrency(route.avgPrice)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column (1/3) ─────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Wallet Overview */}
          <Card className="p-5 border border-gray-150 shadow-sm relative overflow-hidden bg-white">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet Balance</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {walletBalance !== null
                  ? formatCurrency(walletBalance, walletCurrency)
                  : '₹0.00'}
              </p>
              <div className="flex gap-2 mt-4">
                <Link href="/dashboard/wallet" className="flex-1">
                  <Button className="w-full !py-2 rounded-lg text-xs font-semibold shadow-none" size="sm">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Money
                  </Button>
                </Link>
                <Link href="/dashboard/wallet" className="flex-1">
                  <Button variant="secondary" className="w-full !py-2 rounded-lg text-xs font-medium" size="sm">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    History
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Notifications Summary */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className={`p-2.5 rounded-xl text-xs ${n.isRead ? 'bg-gray-50' : 'bg-blue-50/50 border border-blue-100/50'}`}>
                    <p className={`font-semibold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                    <p className="text-gray-500 mt-0.5 line-clamp-1">{n.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-3">No notifications</p>
            )}

            <Link href="/dashboard/notifications">
              <button className="w-full mt-3 py-2 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors">
                View All Notifications →
              </button>
            </Link>
          </div>

          {/* Saved Routes */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900">Saved Routes</h3>
              </div>
              <Link href="/dashboard/passenger/favorites/routes" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                Manage
              </Link>
            </div>

            {favoriteRoutes.length > 0 ? (
              <div className="space-y-2">
                {favoriteRoutes.slice(0, 3).map((route) => (
                  <Link
                    key={route.id}
                    href={`/dashboard/trips/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`}
                  >
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {route.origin} → {route.destination}
                        </span>
                      </div>
                      <Search className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-gray-400 mb-2">No saved routes yet</p>
                <Link href="/dashboard/passenger/saved-routes">
                  <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                    + Add a Route
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming Trip Hero Card ────────────────────────────────────────────────
function UpcomingTripCard({ booking }: { booking: Booking }) {
  const trip = booking.trip;
  const origin = trip?.origin || trip?.source || 'TBD';
  const destination = trip?.destination || 'TBD';
  const departure = trip?.departureDate || trip?.departureTime || '';
  const isOngoing = (booking.status as string) === 'ON_TRIP' || (booking.status as string) === 'CHECKED_IN';

  const departureDate = departure ? new Date(departure) : null;
  const now = new Date();
  const hoursUntil = departureDate ? Math.max(0, Math.floor((departureDate.getTime() - now.getTime()) / (1000 * 60 * 60))) : null;
  const minutesUntil = departureDate ? Math.max(0, Math.floor(((departureDate.getTime() - now.getTime()) / (1000 * 60)) % 60)) : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 sm:p-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isOngoing ? (
              <Badge variant="success" className="!bg-emerald-500/10 !text-emerald-700 !border-emerald-500/20">
                <PlayCircle className="w-3 h-3 mr-1" />
                Trip In Progress
              </Badge>
            ) : (
              <Badge variant="info" className="!bg-blue-500/10 !text-blue-700 !border-blue-500/20">
                <Clock className="w-3 h-3 mr-1" />
                Next Trip
              </Badge>
            )}
          </div>
          {hoursUntil !== null && !isOngoing && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Departing in</p>
              <p className="text-lg font-bold text-gray-900">
                {hoursUntil > 24 ? `${Math.floor(hoursUntil / 24)}d ${hoursUntil % 24}h` : `${hoursUntil}h ${minutesUntil}m`}
              </p>
            </div>
          )}
        </div>

        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border-2 border-slate-300" />
            <div className="w-0.5 h-8 bg-slate-100" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">From</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{origin}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-2.5">To</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{destination}</p>
          </div>
        </div>

        {/* Details Row */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-gray-500 mb-5 border-t border-gray-50 pt-4">
          {departure && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{formatDateTime(departure)}</span>
            </div>
          )}
          {trip?.driver?.user && (
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>{trip.driver.user.firstName} {trip.driver.user.lastName}</span>
            </div>
          )}
          {trip?.vehicle && (
            <div className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-gray-400" />
              <span>{trip.vehicle.brand} {trip.vehicle.model}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5">
          <Link href={`/dashboard/bookings/${booking.id}`}>
            <Button size="sm" className="gap-1.5 shadow-none rounded-xl">
              <Eye className="w-3.5 h-3.5" />
              View Trip
            </Button>
          </Link>
          {trip?.driver?.user?.phone && (
            <a href={`tel:${trip.driver.user.phone}`}>
              <Button size="sm" variant="secondary" className="gap-1.5 rounded-xl shadow-none">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Contact Driver
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Trip: ${origin} → ${destination}`,
                  text: `I'm traveling from ${origin} to ${destination}${departure ? ` on ${formatDateTime(departure)}` : ''}`,
                });
              }
            }}
            className="gap-1.5 rounded-xl"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  iconColor = 'text-gray-500',
  iconBg = 'bg-gray-50',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', iconBg, iconColor)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight mt-1">{value}</p>
    </div>
  );
}

// ─── Recent Booking Card ────────────────────────────────────────────────────
function RecentBookingCard({ booking }: { booking: Booking }) {
  const trip = booking.trip;
  const origin = trip?.origin || trip?.source || 'Unknown';
  const destination = trip?.destination || 'Unknown';
  const departure = trip?.departureDate || trip?.departureTime || '';

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
    CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Confirmed' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
    NO_SHOW: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'No Show' },
    ON_TRIP: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'On Trip' },
    CHECKED_IN: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Checked In' },
  };

  const status = statusConfig[(booking.status || '').toUpperCase()] || statusConfig.PENDING;

  return (
    <Link href={`/dashboard/bookings/${booking.id}`}>
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all duration-200 cursor-pointer group">
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-primary-50 transition-colors">
          <MapPin className="w-4 h-4 text-gray-500 group-hover:text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {origin} → {destination}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {departure ? formatDateTime(departure) : 'Date TBD'}
            {booking.seats ? ` · ${booking.seats} seat${booking.seats > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500" />
        </div>
      </div>
    </Link>
  );
}
