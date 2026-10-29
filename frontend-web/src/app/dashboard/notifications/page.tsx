'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import Loading from '@/components/common/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/common/EmptyState';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  MapPin,
  AlertCircle,
  Gift,
  LifeBuoy,
  Star,
  Wallet,
  Shield,
  Settings,
  Filter,
  BellOff,
  Car,
  Users,
  Route,
} from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  BOOKING: { icon: <Calendar className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-100' },
  PAYMENT: { icon: <CreditCard className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  TRIP: { icon: <MapPin className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-100' },
  SYSTEM: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-gray-600', bg: 'bg-gray-100' },
  PROMOTIONAL: { icon: <Gift className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-100' },
  SUPPORT: { icon: <LifeBuoy className="w-4 h-4" />, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  RATING: { icon: <Star className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-100' },
  WALLET: { icon: <Wallet className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  SAFETY: { icon: <Shield className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-100' },
  VEHICLE: { icon: <Car className="w-4 h-4" />, color: 'text-teal-600', bg: 'bg-teal-100' },
  DRIVER: { icon: <Users className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-100' },
  APPROVAL: { icon: <Shield className="w-4 h-4" />, color: 'text-rose-600', bg: 'bg-rose-100' },
};

const tabs = [
  { id: 'all', label: 'All', icon: <Bell className="w-3.5 h-3.5" /> },
  { id: 'TRIP', label: 'Trip Alerts', icon: <Route className="w-3.5 h-3.5" /> },
  { id: 'BOOKING', label: 'Booking Alerts', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'PAYMENT', label: 'Payment Alerts', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { id: 'VEHICLE', label: 'Vehicle Alerts', icon: <Car className="w-3.5 h-3.5" /> },
  { id: 'DRIVER', label: 'Driver Alerts', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'APPROVAL', label: 'Approval Updates', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'SYSTEM', label: 'System', icon: <AlertCircle className="w-3.5 h-3.5" /> },
];

// Map URL ?tab= values to internal tab IDs
const tabParamMap: Record<string, string> = {
  all: 'all',
  trip: 'TRIP',
  booking: 'BOOKING',
  payment: 'PAYMENT',
  vehicle: 'VEHICLE',
  driver: 'DRIVER',
  approval: 'APPROVAL',
  system: 'SYSTEM',
};

// Reverse map: internal tab ID → URL param value
const tabToParam: Record<string, string> = {
  all: 'all',
  TRIP: 'trip',
  BOOKING: 'booking',
  PAYMENT: 'payment',
  VEHICLE: 'vehicle',
  DRIVER: 'driver',
  APPROVAL: 'approval',
  SYSTEM: 'system',
};

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

  // Derive activeTab from URL ?tab= param
  const urlTabParam = (searchParams.get('tab') || '').toLowerCase();
  const activeTab = tabParamMap[urlTabParam] || 'all';

  const setActiveTab = (tabId: string) => {
    if (tabId === 'all') {
      router.push('/dashboard/notifications', { scroll: false });
    } else {
      const paramValue = tabToParam[tabId] || tabId.toLowerCase();
      router.push(`/dashboard/notifications?tab=${paramValue}`, { scroll: false });
    }
  };

  useEffect(() => {
    const params: any = { limit: 50 };
    if (activeTab !== 'all') params.type = activeTab;
    getNotifications(params);
  }, [getNotifications, activeTab]);

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter((n) => {
        const nType = (n.type || '').toUpperCase();
        // Also match related types for broader categories
        if (activeTab === 'VEHICLE') return nType === 'VEHICLE' || nType.includes('VEHICLE');
        if (activeTab === 'DRIVER') return nType === 'DRIVER' || nType.includes('DRIVER');
        if (activeTab === 'APPROVAL') return nType === 'APPROVAL' || nType.includes('APPROVAL') || nType.includes('VERIFICATION');
        return nType === activeTab;
      });

  const handleMarkRead = (id: string) => {
    markRead([id]);
  };

  if (isLoading && notifications.length === 0) {
    return <Loading text="Loading notifications..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllRead} className="gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Read
            </Button>
          )}
          <Link href="/dashboard/passenger/settings">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Preferences
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
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

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description={activeTab === 'all'
            ? 'You\'re all caught up! Notifications will appear here.'
            : `No ${tabs.find(t => t.id === activeTab)?.label?.toLowerCase() || ''} notifications.`}
          customIcon={<Bell className="w-8 h-8 text-gray-400" />}
        />
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const config = typeConfig[(notification.type || '').toUpperCase()] || typeConfig.SYSTEM;

            return (
              <div
                key={notification.id}
                className={`rounded-2xl border transition-all duration-200 ${
                  notification.isRead
                    ? 'bg-white border-gray-100'
                    : 'bg-blue-50/30 border-blue-100/60 shadow-sm'
                }`}
              >
                <div className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-bold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {notification.body}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(notification.createdAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                        {(notification.type || 'SYSTEM').toUpperCase()}
                      </span>

                      <div className="ml-auto flex items-center gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
