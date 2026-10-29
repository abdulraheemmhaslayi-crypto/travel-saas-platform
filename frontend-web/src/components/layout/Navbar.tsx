'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { cn } from '@/lib/utils';
import { Menu, X, Bell, User, LogOut, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavLinks = () => {
    if (!user) return [];

    const type = String(user.userType || '').toUpperCase();

    if (type === 'DRIVER') {
      return [
        { href: '/dashboard/driver', label: 'Dashboard' },
        { href: '/dashboard/trips', label: 'Available Trips' },
        { href: '/dashboard/wallet', label: 'Earnings' },
      ];
    }

    if (type === 'FLEET_OWNER' || type === 'VEHICLE_OWNER') {
      return [
        { href: '/dashboard/vehicle-owner', label: 'Dashboard' },
        { href: '/dashboard/trips', label: 'Trips' },
        { href: '/dashboard/wallet', label: 'Wallet' },
      ];
    }

    return [
      { href: '/dashboard/passenger', label: 'Dashboard' },
      { href: '/dashboard/trips/search', label: 'Search Trips' },
      { href: '/dashboard/bookings', label: 'My Bookings' },
    ];
  };

  const navLinks = getNavLinks();
  const notificationsPath = '/dashboard/notifications';
  const profilePath = '/dashboard/profile';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">TravelFlow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

                {(String(user?.role || '').toUpperCase() === 'ADMIN' || String(user?.role || '').toUpperCase() === 'SUPER_ADMIN') && (
                  <Link
                    href={String(user?.role || '').toUpperCase() === 'SUPER_ADMIN' ? '/super-admin/dashboard' : '/admin/dashboard'}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}

                <div className="flex items-center gap-4 ml-4 border-l border-gray-200 pl-4">
                  <Link href={notificationsPath} className="relative">
                    <Bell className="w-5 h-5 text-gray-600 hover:text-primary-600 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  <div className="relative group">
                    <button className="flex items-center gap-2 focus:outline-none">
                      <Avatar
                        src={user?.profileImage}
                        name={`${user?.firstName} ${user?.lastName}`}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {user?.firstName}
                      </span>
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-md border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="py-1">
                        <Link
                          href={profilePath}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 font-medium"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          Profile
                        </Link>
                        <button
                          onClick={() => logout()}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger-600 hover:bg-slate-50 font-medium text-left"
                        >
                          <LogOut className="w-4 h-4 text-danger-400" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={profilePath}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-danger-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;