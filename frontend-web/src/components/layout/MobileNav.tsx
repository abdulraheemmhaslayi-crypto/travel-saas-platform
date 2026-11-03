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
  Home as HomeIcon,
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
        { href: '/dashboard/passenger', label: 'Home', icon: HomeIcon },
        { href: '/dashboard/bookings', label: 'My Trips', icon: Calendar },
        { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
        { href: '/dashboard/notifications', label: 'Alerts', icon: Bell },
        { href: '/login', label: 'Account', icon: User },
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
      { href: '/dashboard/passenger', label: 'Home', icon: HomeIcon },
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0]/80 rounded-t-[24px] z-50 md:hidden shadow-[0_-4px_24px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-[66px] px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = isCurrentActive(item.href);
          const Icon = item.icon;
          const badge = (item as any).badge;
          const showAlertDot = item.label === 'Alerts';

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 select-none"
            >
              <div className="relative flex items-center justify-center">
                {isActive ? (
                  <div className="w-[58px] h-[32px] rounded-full bg-[#E8F0FE] flex items-center justify-center transition-all duration-200 shadow-2xs">
                    <Icon
                      className={cn(
                        'w-[19px] h-[19px] text-[#2563EB] transition-transform duration-200',
                        item.label === 'Home' ? 'fill-[#2563EB]' : 'stroke-[2.2]'
                      )}
                    />
                  </div>
                ) : (
                  <div className="w-[58px] h-[32px] flex items-center justify-center">
                    <Icon className="w-[20px] h-[20px] text-[#64748B] stroke-[1.8] transition-colors" />
                  </div>
                )}

                {/* Vibrant Red Notification Dot (as seen on Alerts tab in production Ola/Uber apps) */}
                {showAlertDot && (
                  <span className="absolute top-1 right-3.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
                )}
                {!showAlertDot && badge > 0 && (
                  <span className="absolute top-1 right-3.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
                )}
              </div>

              <span
                className={cn(
                  'text-[11px] leading-tight tracking-tight transition-colors',
                  isActive
                    ? 'font-bold text-[#2563EB] mt-0.5'
                    : 'font-medium text-[#64748B] mt-1'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
