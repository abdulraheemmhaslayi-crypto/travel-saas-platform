'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { Menu, X, Bell, User, LogOut, MapPin, Shield } from 'lucide-react';
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
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN' || String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-150 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard/passenger" className="flex items-center gap-2 active:scale-95 transition-transform">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              <span className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">TravelFlow</span>
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

                {isAdmin && (
                  <Link
                    href={isSuperAdmin ? '/super-admin/dashboard' : '/admin/dashboard'}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}

                <div className="flex items-center gap-4 ml-4 border-l border-gray-200 pl-4">
                  <Link href={notificationsPath} className="relative">
                    <Bell className="w-5 h-5 text-gray-600 hover:text-primary-600 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
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

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
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

          {/* Mobile Right Controls: Bell + Avatar (if auth) or Quick Sign In button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated ? (
              <>
                <Link href={notificationsPath} className="relative p-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-transform">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-danger-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1 rounded-full text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
                  aria-label="Toggle user menu"
                >
                  <Avatar
                    src={user?.profileImage}
                    name={`${user?.firstName} ${user?.lastName}`}
                    size="sm"
                  />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-bold text-primary-600 bg-primary-50 px-3.5 py-1.5 rounded-full hover:bg-primary-100 active:scale-95 transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile user drawer / slideover */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-150 bg-white shadow-xl animate-fadeIn">
          {isAuthenticated && (
            <div className="px-4 pt-3 pb-4 space-y-3">
              {/* User profile snippet */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-gray-100">
                <Avatar
                  src={user?.profileImage}
                  name={`${user?.firstName} ${user?.lastName}`}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                    {user?.userType || 'Passenger'}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:text-primary-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAdmin && (
                  <Link
                    href={isSuperAdmin ? '/super-admin/dashboard' : '/admin/dashboard'}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}

                <Link
                  href={profilePath}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-gray-400" />
                  My Profile
                </Link>
              </div>

              {/* Logout button */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-danger-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-danger-500" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
