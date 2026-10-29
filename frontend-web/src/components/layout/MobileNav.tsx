'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import {
  LayoutDashboard,
  Search,
  Calendar,
  Wallet,
  Bell,
  User,
} from 'lucide-react';

const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const navItems = (() => {
    if (!user) {
      return [
        { href: '/dashboard/passenger', label: 'Home', icon: LayoutDashboard },
        { href: '/dashboard/trips/search', label: 'Search', icon: Search },
        { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
        { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
        { href: '/dashboard/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
      ];
    }

    const type = String(user.userType || '').toUpperCase();
    if (type === 'DRIVER') {
      return [
        { href: '/dashboard/driver', label: 'Home', icon: LayoutDashboard },
        { href: '/dashboard/trips', label: 'Trips', icon: Calendar },
        { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
        { href: '/dashboard/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
        { href: '/dashboard/profile', label: 'Profile', icon: User },
      ];
    }

    if (type === 'FLEET_OWNER' || type === 'VEHICLE_OWNER') {
      return [
        { href: '/dashboard/vehicle-owner', label: 'Home', icon: LayoutDashboard },
        { href: '/dashboard/trips', label: 'Trips', icon: Calendar },
        { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
        { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
        { href: '/dashboard/profile', label: 'Profile', icon: User },
      ];
    }

    if (type === 'SUPPORT') {
      return [
        { href: '/dashboard/support', label: 'Home', icon: LayoutDashboard },
        { href: '/dashboard/profile', label: 'Profile', icon: User },
      ];
    }

    // Passenger (default) — prioritized for mobile: Home, Search, Bookings, Wallet, Notifications
    return [
      { href: '/dashboard/passenger', label: 'Home', icon: LayoutDashboard },
      { href: '/dashboard/trips/search', label: 'Search', icon: Search },
      { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
      { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
      { href: '/dashboard/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    ];
  })();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 z-50 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badge = (item as any).badge;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center py-2 px-3 min-w-[4rem] transition-colors duration-200',
                isActive ? 'text-primary-600' : 'text-gray-400'
              )}
            >
              <div className="relative">
                <div className={cn(
                  'p-1 rounded-xl transition-all duration-200',
                  isActive ? 'bg-primary-50' : ''
                )}>
                  <Icon className={cn('w-5 h-5', isActive ? 'text-primary-600' : '')} />
                </div>
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] mt-0.5 font-semibold',
                isActive ? 'text-primary-600' : 'text-gray-400'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;