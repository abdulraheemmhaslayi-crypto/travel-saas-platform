'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  CreditCard,
  BarChart3,
  HelpCircle,
  Settings,
  Shield,
  ChevronRight,
  ChevronDown,
  Truck,
  Activity,
  Navigation,
  FileCheck,
  ClipboardList,
  DollarSign,
  Bell,
  Lock,
  UserCheck,
  Layers,
  History as HistoryIcon,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface MenuSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: MenuItem[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('expanded_sections_admin');
        // Ensure that in the loaded state only at most one key is true (sanitize old state)
        if (saved) {
          const parsed = JSON.parse(saved);
          const activeKey = Object.keys(parsed).find((k) => parsed[k]);
          return activeKey ? { [activeKey]: true } : {};
        }
        return {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const isCurrentlyExpanded = prev[sectionId] ?? false;
      const next = isCurrentlyExpanded ? {} : { [sectionId]: true };
      if (typeof window !== 'undefined') {
        localStorage.setItem('expanded_sections_admin', JSON.stringify(next));
      }
      return next;
    });
  };

  const getAdminSections = (): MenuSection[] => {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN';

    const sections: MenuSection[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        href: '/admin/dashboard',
      },
      {
        id: 'operations',
        label: 'Operations',
        icon: <Activity className="w-5 h-5" />,
        children: [
          { href: '/admin/dashboard?tab=live', label: 'Live Operations', icon: <Activity className="w-4 h-4" /> },
          { href: '/admin/trips?status=active', label: 'Active Trips', icon: <Car className="w-4 h-4" /> },
          { href: '/admin/users?userType=driver&status=active', label: 'Active Drivers', icon: <Users className="w-4 h-4" /> },
          { href: '/admin/vehicles?status=active', label: 'Active Vehicles', icon: <Truck className="w-4 h-4" /> },
          { href: '/admin/live-tracking', label: 'Live Tracking', icon: <Navigation className="w-4 h-4" /> },
        ],
      },
      {
        id: 'users',
        label: 'User Management',
        icon: <Users className="w-5 h-5" />,
        children: [
          { href: '/admin/users?userType=passenger', label: 'Passengers', icon: <Users className="w-4 h-4" /> },
          { href: '/admin/users?userType=driver', label: 'Drivers', icon: <UserCheck className="w-4 h-4" /> },
          { href: '/admin/users?userType=vehicle_owner', label: 'Vehicle Owners', icon: <Car className="w-4 h-4" /> },
        ],
      },
      {
        id: 'verification',
        label: 'Verification Center',
        icon: <FileCheck className="w-5 h-5" />,
        children: [
          { href: '/admin/pending-approvals?tab=kyc', label: 'KYC Approvals', icon: <UserCheck className="w-4 h-4" /> },
          { href: '/admin/pending-approvals?tab=drivers', label: 'Driver Verification', icon: <FileCheck className="w-4 h-4" /> },
          { href: '/admin/pending-approvals?tab=vehicles', label: 'Vehicle Verification', icon: <Car className="w-4 h-4" /> },
          { href: '/admin/pending-approvals?tab=documents', label: 'Document Verification', icon: <ClipboardList className="w-4 h-4" /> },
        ],
      },
      {
        id: 'fleet',
        label: 'Fleet Management',
        icon: <Truck className="w-5 h-5" />,
        children: [
          { href: '/admin/vehicles', label: 'Vehicles', icon: <Truck className="w-4 h-4" /> },
          { href: '/admin/vehicles?tab=types', label: 'Vehicle Types', icon: <Layers className="w-4 h-4" /> },
          { href: '/admin/vehicles?tab=documents', label: 'Vehicle Documents', icon: <ClipboardList className="w-4 h-4" /> },
          { href: '/admin/fleet', label: 'Fleet Companies', icon: <Shield className="w-4 h-4" /> },
          { href: '/admin/fleet?tab=vehicles', label: 'Fleet Vehicles', icon: <Car className="w-4 h-4" /> },
        ],
      },
      {
        id: 'trips',
        label: 'Trip Management',
        icon: <Car className="w-5 h-5" />,
        children: [
          { href: '/admin/trips', label: 'All Trips', icon: <Car className="w-4 h-4" /> },
          { href: '/admin/trips?status=scheduled', label: 'Scheduled Trips', icon: <Calendar className="w-4 h-4" /> },
          { href: '/admin/trips?status=active', label: 'Active Trips', icon: <Activity className="w-4 h-4" /> },
          { href: '/admin/trips?status=completed', label: 'Completed Trips', icon: <FileCheck className="w-4 h-4" /> },
          { href: '/admin/trips?status=cancelled', label: 'Cancelled Trips', icon: <HistoryIcon className="w-4 h-4" /> },
        ],
      },
      {
        id: 'bookings',
        label: 'Booking Management',
        icon: <Calendar className="w-5 h-5" />,
        children: [
          { href: '/admin/bookings', label: 'All Bookings', icon: <Calendar className="w-4 h-4" /> },
          { href: '/admin/bookings?status=pending', label: 'Pending Bookings', icon: <Activity className="w-4 h-4" /> },
          { href: '/admin/bookings?status=confirmed', label: 'Confirmed Bookings', icon: <FileCheck className="w-4 h-4" /> },
          { href: '/admin/bookings?status=cancelled', label: 'Cancelled Bookings', icon: <HistoryIcon className="w-4 h-4" /> },
          { href: '/admin/payments?tab=refunds', label: 'Refund Requests', icon: <DollarSign className="w-4 h-4" /> },
        ],
      },
      {
        id: 'financial',
        label: 'Financial Management',
        icon: <DollarSign className="w-5 h-5" />,
        children: [
          { href: '/admin/payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
          { href: '/admin/payments?tab=refunds', label: 'Refunds', icon: <DollarSign className="w-4 h-4" /> },
          { href: '/admin/payments?tab=wallet', label: 'Wallet Transactions', icon: <CreditCard className="w-4 h-4" /> },
          ...(isSuperAdmin ? [{ href: '/admin/analytics?tab=revenue', label: 'Revenue Analytics', icon: <BarChart3 className="w-4 h-4" /> }] : []),
        ],
      },
      {
        id: 'support',
        label: 'Support Center',
        icon: <HelpCircle className="w-5 h-5" />,
        children: [
          { href: '/admin/support', label: 'Support Tickets', icon: <HelpCircle className="w-4 h-4" /> },
          { href: '/admin/support?tab=escalated', label: 'Escalated Tickets', icon: <Shield className="w-4 h-4" /> },
          { href: '/admin/support?tab=complaints', label: 'User Complaints', icon: <Users className="w-4 h-4" /> },
        ],
      },
    ];

    if (!isSuperAdmin) {
      sections.push({
        id: 'notifications',
        label: 'Notifications',
        icon: <Bell className="w-5 h-5" />,
        children: [
          { href: '/admin/notifications', label: 'System Notifications', icon: <Bell className="w-4 h-4" /> },
          { href: '/admin/notifications?tab=broadcast', label: 'Broadcast Center', icon: <Activity className="w-4 h-4" /> },
          { href: '/admin/notifications?tab=announcements', label: 'Announcement Center', icon: <Layers className="w-4 h-4" /> },
        ],
      });
    }

    sections.push({
      id: 'reports',
      label: 'Reports & Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      children: [
        ...(isSuperAdmin ? [{ href: '/admin/analytics?tab=revenue', label: 'Revenue Reports', icon: <BarChart3 className="w-4 h-4" /> }] : []),
        { href: '/admin/analytics?tab=bookings', label: 'Booking Reports', icon: <Calendar className="w-4 h-4" /> },
        { href: '/admin/analytics?tab=drivers', label: 'Driver Reports', icon: <UserCheck className="w-4 h-4" /> },
        { href: '/admin/analytics?tab=vehicles', label: 'Vehicle Reports', icon: <Truck className="w-4 h-4" /> },
        { href: '/admin/analytics?tab=users', label: 'User Growth Reports', icon: <Users className="w-4 h-4" /> },
      ],
    });

    if (isSuperAdmin) {
      sections.push({
        id: 'rbac',
        label: 'RBAC',
        icon: <Lock className="w-5 h-5" />,
        children: [
          { href: '/admin/settings?tab=roles', label: 'Roles', icon: <Shield className="w-4 h-4" /> },
          { href: '/admin/settings?tab=permissions', label: 'Permissions', icon: <Lock className="w-4 h-4" /> },
          { href: '/admin/settings?tab=role-permissions', label: 'Role Permissions', icon: <Lock className="w-4 h-4" /> },
        ],
      });

      sections.push({
        id: 'administration',
        label: 'Administration',
        icon: <Shield className="w-5 h-5" />,
        children: [
          { href: '/admin/users?userType=admin', label: 'Admin Users', icon: <Shield className="w-4 h-4" /> },
          { href: '/admin/users?userType=super_admin', label: 'System Users', icon: <Shield className="w-4 h-4" /> },
          { href: '/admin/users?userType=support', label: 'Support Users', icon: <Users className="w-4 h-4" /> },
        ],
      });

      sections.push({
        id: 'system',
        label: 'System',
        icon: <Settings className="w-5 h-5" />,
        children: [
          { href: '/admin/settings', label: 'Platform Settings', icon: <Settings className="w-4 h-4" /> },
          { href: '/admin/audit-logs', label: 'Security Center', icon: <Lock className="w-4 h-4" /> },
          { href: '/admin/audit-logs?tab=logins', label: 'Audit Logs', icon: <HistoryIcon className="w-4 h-4" /> },
        ],
      });

      sections.push({
        id: 'subscriptions',
        label: 'Subscriptions',
        icon: <Layers className="w-5 h-5" />,
        children: [
          { href: '/admin/settings?tab=plans', label: 'Plans', icon: <Layers className="w-4 h-4" /> },
          { href: '/admin/users?tab=subscribers', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
        ],
      });

      sections.push({
        id: 'analytics',
        label: 'Analytics',
        icon: <BarChart3 className="w-5 h-5" />,
        children: [
          { href: '/admin/analytics', label: 'Global Analytics', icon: <BarChart3 className="w-4 h-4" /> },
        ],
      });
    }

    return sections;
  };

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    const [basePath, searchStr] = href.split('?');
    const matchesPath = pathname === basePath || pathname.startsWith(`${basePath}/`);
    if (!matchesPath) return false;

    if (searchStr) {
      const hrefParams = new URLSearchParams(searchStr);
      let match = true;
      hrefParams.forEach((val, key) => {
        if (searchParams.get(key) !== val) {
          match = false;
        }
      });
      return match;
    }

    const hasTab = searchParams.has('tab');
    const hasStatus = searchParams.has('status');
    const hasUserType = searchParams.has('userType');
    
    return !hasTab && !hasStatus && !hasUserType;
  };

  const isSectionActive = (section: MenuSection) => {
    if (section.href) return isItemActive(section.href);
    return section.children?.some((child) => isItemActive(child.href)) || false;
  };

  const rawSections = getAdminSections();
  const basePath = user?.userType === 'SUPER_ADMIN' ? '/super-admin' : '/admin';
  const resolveUrl = (url: string) => url.replace(/^\/admin/, basePath);

  const sections = rawSections.map(section => ({
    ...section,
    href: section.href ? resolveUrl(section.href) : undefined,
    children: section.children?.map(child => ({
      ...child,
      href: resolveUrl(child.href),
    })),
  }));

  // Automatically expand the section that contains the currently active route
  useEffect(() => {
    const activeSection = sections.find((section) => isSectionActive(section));
    if (activeSection && !activeSection.href) {
      setExpandedSections((prev) => {
        if (prev[activeSection.id]) return prev;
        const next = { [activeSection.id]: true };
        if (typeof window !== 'undefined') {
          localStorage.setItem('expanded_sections_admin', JSON.stringify(next));
        }
        return next;
      });
    }
  }, [pathname, searchParams]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 text-slate-100 transform transition-transform duration-300 ease-in-out lg:transform-none lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 shrink-0">
            <Link href={`${basePath}/dashboard`} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-md shadow-primary-500/10">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Control Panel
              </span>
            </Link>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white lg:hidden transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* User profile details */}
          <div className="px-4 py-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                {user?.firstName?.[0] || 'A'}{user?.lastName?.[0] || 'P'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/50 uppercase tracking-wider">
                    {user?.userType || 'Admin'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Sections */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 custom-scrollbar">
            {sections.map((section) => {
              const sectionActive = isSectionActive(section);

              if (section.href) {
                const isActive = isItemActive(section.href);
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden',
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary-500 rounded-r-full" />
                    )}
                    <span className={cn('transition-colors', isActive ? 'text-white' : 'text-slate-500')}>
                      {section.icon}
                    </span>
                    {section.label}
                  </Link>
                );
              }

              const isExpanded = expandedSections[section.id] ?? false;

              return (
                <div key={section.id} className="space-y-0.5">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                      sectionActive
                        ? 'bg-slate-800/40 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <span className={cn('transition-colors', sectionActive ? 'text-primary-400' : 'text-slate-500')}>
                      {section.icon}
                    </span>
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-500 transition-transform duration-200',
                        isExpanded ? 'rotate-180 text-white' : ''
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-350 ease-in-out',
                      isExpanded ? 'max-h-[30rem] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="ml-4 pl-4 border-l border-slate-800 space-y-0.5 py-0.5">
                      {section.children?.map((item) => {
                        const isActive = isItemActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative overflow-hidden',
                              isActive
                                ? 'bg-slate-800 text-white font-semibold'
                                : 'text-slate-550 hover:bg-slate-800/60 hover:text-slate-300'
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary-500 rounded-r-full" />
                            )}
                            <span className={cn('transition-colors', isActive ? 'text-primary-400' : 'text-slate-600')}>
                              {item.icon}
                            </span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer Back Link */}
          <div className="p-4 border-t border-slate-800 shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Client Portal
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;