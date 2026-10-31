'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import Loading from '@/components/common/Loading';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  MapPin,
  AlertCircle,
  Car,
  Users,
  RefreshCw,
  Clock,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper for human-readable relative time (e.g. 5m ago, 2h ago, Yesterday)
function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '—';
  }
}

// Icon and color mapping for notification types
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  BOOKING: { icon: <Calendar className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Booking' },
  PAYMENT: { icon: <CreditCard className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Payment' },
  TRIP: { icon: <Car className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Trip' },
  VEHICLE: { icon: <Car className="w-4 h-4" />, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Vehicle' },
  DRIVER: { icon: <Users className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Driver' },
  SAFETY: { icon: <Shield className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50', label: 'Safety' },
  SYSTEM: { icon: <Bell className="w-4 h-4" />, color: 'text-gray-600', bg: 'bg-gray-100', label: 'System' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'TRIP', label: 'Trips' },
  { id: 'BOOKING', label: 'Bookings' },
  { id: 'PAYMENT', label: 'Payments' },
  { id: 'SYSTEM', label: 'System' },
];

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    getNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotificationStore();

  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeTab = searchParams.get('tab') || 'all';

  const setActiveTab = (tabId: string) => {
    if (tabId === 'all') {
      router.push('/dashboard/notifications', { scroll: false });
    } else {
      router.push(`/dashboard/notifications?tab=${tabId}`, { scroll: false });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await getNotifications({ limit: 50 });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    getNotifications({ limit: 50 });
  }, [getNotifications]);

  // Filter based on active tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.isRead;
    const nType = (n.type || '').toUpperCase();
    return nType === activeTab;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0 pb-28 md:pb-12">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up! No unread notifications'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200/80 active:scale-95 transition-all shadow-2xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200/80 rounded-xl active:scale-95 transition-all shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Filter Pills (Smooth Mobile Horizontal Scroll) ────────── */}
      <div className="w-full min-w-0 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        <div className="inline-flex items-center gap-1.5 min-w-max py-0.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'all'
              ? notifications.length
              : tab.id === 'unread'
              ? unreadCount
              : notifications.filter(n => (n.type || '').toUpperCase() === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border',
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                )}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-black rounded-full',
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading Skeletons ───────────────────────────────────────── */}
      {isLoading && notifications.length === 0 && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-200/80 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded" />
                <div className="w-full h-3 bg-gray-200 rounded" />
                <div className="w-20 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────── */}
      {!isLoading && filteredNotifications.length === 0 && (
        <div className="py-14 px-4 text-center bg-white rounded-3xl border border-gray-200/90 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
            No notifications
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {activeTab === 'all'
              ? 'You are all caught up! Real-time ride and booking alerts will appear here.'
              : `No ${activeTab.toLowerCase()} notifications found.`}
          </p>
        </div>
      )}

      {/* ── Notification Items List ────────────────────────────────── */}
      {!isLoading && filteredNotifications.length > 0 && (
        <div className="space-y-2 sm:space-y-2.5">
          {filteredNotifications.map((notification) => {
            const typeKey = (notification.type || '').toUpperCase();
            const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG.SYSTEM;
            const timeAgo = formatRelativeTime(notification.createdAt);

            // Determine optional action link from notification metadata
            const data = notification.data as Record<string, any> | undefined;
            const linkHref = data?.bookingId
              ? `/dashboard/bookings`
              : data?.tripId
              ? `/dashboard/trips/${data.tripId}`
              : null;

            return (
              <div
                key={notification.id}
                className={cn(
                  'rounded-2xl border transition-all duration-200 relative overflow-hidden',
                  notification.isRead
                    ? 'bg-white border-gray-200/80 shadow-2xs'
                    : 'bg-blue-50/20 border-blue-200/90 shadow-xs ring-1 ring-blue-500/10'
                )}
              >
                <div className="p-3.5 sm:p-4 flex items-start gap-3">
                  {/* Category Icon */}
                  <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5', config.bg, config.color)}>
                    {config.icon}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className={cn('text-xs sm:text-sm font-bold truncate', notification.isRead ? 'text-gray-900' : 'text-blue-950 font-black')}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words">
                          {notification.body}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-colors shrink-0"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Footer Row: Timestamp, Tag, and Actions */}
                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100/80">
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{timeAgo}</span>
                        </span>
                        <span className="opacity-40">•</span>
                        <span className={cn('px-1.5 py-0.2 rounded font-bold text-[9px] uppercase tracking-wide', config.bg, config.color)}>
                          {config.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {linkHref && (
                          <Link
                            href={linkHref}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 px-2 py-0.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}

                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => markRead([notification.id])}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2 py-0.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
