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
  Compass,
} from 'lucide-react';

const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  // Hide on authentication screens so they remain focused
  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot-password')
  ) {
    return null;
  }

  const navItems = (() => {
    if (!isAuthenticated || !user) {
      return [
        { href: '/dashboard/passenger', label: 'Search', icon: Search },
        { href: '/dashboard/bookings', label: 'My Trips', icon: Calendar },
        { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
        { href: '/login', label: 'Sign In', icon: User },
      ];
    }

    const type = String(user.userType || '').toUpperCase();

    if (type === 'DRIVER') {
      return [
        { href: '/dashboard/driver', label: 'Home', icon: LayoutDashboard },
        { href: '/dashboard/trips', label: 'Trips', icon: Calendar },
        { href: '/dashboard/wallet', label: 'Earnings', icon: Wallet },
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

    // Default: Passenger
    return [
      { href: '/dashboard/passenger', label: 'Search', icon: Search },
      { href: '/dashboard/bookings', label: 'My Trips', icon: Calendar },
      { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
      { href: '/dashboard/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
      { href: '/dashboard/profile', label: 'Account', icon: User },
    ];
  })();

  const isCurrentActive = (href: string) => {
    if (href === '/dashboard/passenger') {
      return pathname === '/dashboard/passenger' || pathname === '/' || pathname === '/dashboard/trips/search';
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 z-50 md:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = isCurrentActive(item.href);
          const Icon = item.icon;
          const badge = (item as any).badge;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center py-1.5 transition-all duration-150 active:scale-95 select-none',
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    'w-10 h-7 flex items-center justify-center rounded-full transition-all duration-200',
                    isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-500'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.75]'
                    )}
                  />
                </div>
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[9px] font-extrabold text-white bg-danger-500 rounded-full flex items-center justify-center ring-2 ring-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  'text-[10px] mt-0.5 tracking-tight transition-colors',
                  isActive ? 'font-bold text-primary-600' : 'font-medium text-gray-500'
                )}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary-600 animate-fadeIn" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
