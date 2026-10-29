'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/slices/authSlice';
import { usePassengerStore } from '@/store/slices/passengerStore';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  Calendar,
  Wallet,
  User,
  HelpCircle,
  Settings,
  Car,
  ChevronRight,
  ChevronDown,
  Briefcase,
  DollarSign,
  Truck,
  Users,
  MapPin,
  Navigation,
  Route,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Receipt,
  RotateCcw,
  Bell,
  Heart,
  Star,
  LifeBuoy,
  Ticket,
  Shield,
  Phone,
  UserCog,
  Compass,
  TrendingUp,
  Activity,
  FileText,
  AlertTriangle,
  BarChart3,
  Building2,
  Wrench,
} from 'lucide-react';

interface SidebarProps {
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
  href?: string; // Direct link (no children)
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Passenger sidebar sections
  const getPassengerSections = (): MenuSection[] => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/dashboard/passenger',
    },
    {
      id: 'trip-discovery',
      label: 'Trip Discovery',
      icon: <Compass className="w-5 h-5" />,
      children: [
        { href: '/dashboard/trips/search', label: 'Search Trips', icon: <Search className="w-4 h-4" /> },
        { href: '/dashboard/passenger/nearby-trips', label: 'Nearby Trips', icon: <Navigation className="w-4 h-4" /> },
        { href: '/dashboard/passenger/popular-routes', label: 'Popular Routes', icon: <TrendingUp className="w-4 h-4" /> },
        { href: '/dashboard/passenger/saved-routes', label: 'Saved Routes', icon: <Heart className="w-4 h-4" /> },
      ],
    },
    {
      id: 'my-trips',
      label: 'My Trips',
      icon: <Route className="w-5 h-5" />,
      children: [
        { href: '/dashboard/bookings?status=CONFIRMED', label: 'Upcoming Trips', icon: <Clock className="w-4 h-4" /> },
        { href: '/dashboard/bookings?status=ON_TRIP', label: 'Ongoing Trips', icon: <PlayCircle className="w-4 h-4" /> },
        { href: '/dashboard/bookings?status=COMPLETED', label: 'Completed Trips', icon: <CheckCircle2 className="w-4 h-4" /> },
        { href: '/dashboard/bookings?status=CANCELLED', label: 'Cancelled Trips', icon: <XCircle className="w-4 h-4" /> },
      ],
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Calendar className="w-5 h-5" />,
      children: [
        { href: '/dashboard/bookings', label: 'My Bookings', icon: <Ticket className="w-4 h-4" /> },
        { href: '/dashboard/bookings?view=history', label: 'Booking History', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      children: [
        { href: '/dashboard/passenger/payments', label: 'Payment History', icon: <DollarSign className="w-4 h-4" /> },
        { href: '/dashboard/passenger/payments?tab=refunds', label: 'Refund History', icon: <RotateCcw className="w-4 h-4" /> },
      ],
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: <Wallet className="w-5 h-5" />,
      href: '/dashboard/wallet',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      href: '/dashboard/notifications',
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: <Heart className="w-5 h-5" />,
      children: [
        { href: '/dashboard/passenger/favorites/routes', label: 'Favorite Routes', icon: <MapPin className="w-4 h-4" /> },
        { href: '/dashboard/passenger/favorites/drivers', label: 'Favorite Drivers', icon: <Star className="w-4 h-4" /> },
      ],
    },
    {
      id: 'support',
      label: 'Support',
      icon: <LifeBuoy className="w-5 h-5" />,
      children: [
        { href: '/dashboard/support', label: 'Help Center', icon: <HelpCircle className="w-4 h-4" /> },
        { href: '/dashboard/support?tab=tickets', label: 'My Tickets', icon: <Ticket className="w-4 h-4" /> },
      ],
    },
    {
      id: 'profile-settings',
      label: 'Profile & Settings',
      icon: <UserCog className="w-5 h-5" />,
      children: [
        { href: '/dashboard/profile', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
        { href: '/dashboard/profile?tab=kyc', label: 'KYC Verification', icon: <Shield className="w-4 h-4" /> },
        { href: '/dashboard/passenger/emergency-contacts', label: 'Emergency Contacts', icon: <Phone className="w-4 h-4" /> },
        { href: '/dashboard/passenger/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  // Driver sidebar sections
  const getDriverSections = (): MenuSection[] => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/dashboard/driver',
    },
    {
      id: 'trips',
      label: 'Trips',
      icon: <Calendar className="w-5 h-5" />,
      children: [
        { href: '/dashboard/driver/trips?status=scheduled', label: 'Upcoming Trips', icon: <Clock className="w-4 h-4" /> },
        { href: '/dashboard/driver/trips?status=active', label: 'Active Trips', icon: <PlayCircle className="w-4 h-4" /> },
        { href: '/dashboard/driver/trips?status=completed', label: 'Completed Trips', icon: <CheckCircle2 className="w-4 h-4" /> },
        { href: '/dashboard/driver/trips?status=cancelled', label: 'Cancelled Trips', icon: <XCircle className="w-4 h-4" /> },
        { href: '/dashboard/driver/trips?status=history', label: 'Trip History', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      id: 'trip-management',
      label: 'Trip Management',
      icon: <Briefcase className="w-5 h-5" />,
      children: [
        { href: '/dashboard/driver/trip-management?action=create', label: 'Create Trip', icon: <PlayCircle className="w-4 h-4" /> },
        { href: '/dashboard/driver/trip-management', label: 'Manage Trips', icon: <Settings className="w-4 h-4" /> },
        { href: '/dashboard/driver/trip-management?tab=stops', label: 'Trip Stops', icon: <MapPin className="w-4 h-4" /> },
        { href: '/dashboard/driver/trip-management?tab=passengers', label: 'Passenger List', icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Ticket className="w-5 h-5" />,
      children: [
        { href: '/dashboard/driver/bookings?tab=upcoming', label: 'Upcoming Passengers', icon: <Users className="w-4 h-4" /> },
        { href: '/dashboard/driver/bookings?tab=requests', label: 'Booking Requests', icon: <Clock className="w-4 h-4" /> },
        { href: '/dashboard/driver/bookings?tab=history', label: 'Booking History', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      id: 'vehicle',
      label: 'Vehicle',
      icon: <Car className="w-5 h-5" />,
      children: [
        { href: '/dashboard/driver/vehicle?tab=assigned', label: 'Assigned Vehicle', icon: <Car className="w-4 h-4" /> },
        { href: '/dashboard/driver/vehicle?tab=documents', label: 'Vehicle Documents', icon: <Receipt className="w-4 h-4" /> },
        { href: '/dashboard/driver/vehicle?tab=status', label: 'Vehicle Status', icon: <Activity className="w-4 h-4" /> },
        { href: '/dashboard/driver/vehicle?tab=maintenance', label: 'Maintenance Records', icon: <Settings className="w-4 h-4" /> },
      ],
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: <DollarSign className="w-5 h-5" />,
      children: [
        { href: '/dashboard/driver/earnings', label: 'Earnings Overview', icon: <DollarSign className="w-4 h-4" /> },
        { href: '/dashboard/driver/earnings?tab=daily', label: 'Daily Earnings', icon: <Clock className="w-4 h-4" /> },
        { href: '/dashboard/driver/earnings?tab=weekly', label: 'Weekly Earnings', icon: <TrendingUp className="w-4 h-4" /> },
        { href: '/dashboard/driver/earnings?tab=monthly', label: 'Monthly Earnings', icon: <Calendar className="w-4 h-4" /> },
        { href: '/dashboard/driver/earnings?tab=transactions', label: 'Transaction History', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      id: 'navigation',
      label: 'Navigation',
      icon: <Navigation className="w-5 h-5" />,
      children: [
        { href: '/dashboard/driver/live-tracking', label: 'Live Route', icon: <Navigation className="w-4 h-4" /> },
        { href: '/dashboard/driver/live-tracking?tab=tracking', label: 'Trip Tracking', icon: <MapPin className="w-4 h-4" /> },
        { href: '/dashboard/driver/live-tracking?tab=history', label: 'Route History', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      id: 'passengers',
      label: 'Passengers',
      icon: <Users className="w-5 h-5" />,
      children: [
        { href: '/dashboard/driver/passengers', label: 'Passenger List', icon: <Users className="w-4 h-4" /> },
        { href: '/dashboard/driver/passengers?tab=reviews', label: 'Ratings & Reviews', icon: <Star className="w-4 h-4" /> },
      ],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      children: [
        { href: '/dashboard/notifications?tab=trip', label: 'Trip Alerts', icon: <Bell className="w-4 h-4" /> },
        { href: '/dashboard/notifications?tab=booking', label: 'Booking Alerts', icon: <Ticket className="w-4 h-4" /> },
        { href: '/dashboard/notifications?tab=payment', label: 'Payment Alerts', icon: <DollarSign className="w-4 h-4" /> },
      ],
    },
    {
      id: 'support',
      label: 'Support',
      icon: <LifeBuoy className="w-5 h-5" />,
      children: [
        { href: '/dashboard/support?tab=tickets', label: 'Support Tickets', icon: <Ticket className="w-4 h-4" /> },
        { href: '/dashboard/support', label: 'Help Center', icon: <HelpCircle className="w-4 h-4" /> },
      ],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      children: [
        { href: '/dashboard/profile', label: 'Driver Profile', icon: <User className="w-4 h-4" /> },
        { href: '/dashboard/profile?tab=kyc', label: 'KYC Verification', icon: <Shield className="w-4 h-4" /> },
        { href: '/dashboard/profile?tab=documents', label: 'Documents', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      href: '/dashboard/driver/settings',
    },
  ];

  // Fleet Owner sidebar sections
  const getFleetOwnerSections = (): MenuSection[] => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/dashboard/fleet-owner',
    },
    {
      id: 'fleet-management',
      label: 'Fleet Management',
      icon: <Truck className="w-5 h-5" />,
      children: [
        { href: '/dashboard/fleet-owner/vehicles', label: 'My Vehicles', icon: <Car className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/vehicles?tab=types', label: 'Vehicle Types', icon: <Briefcase className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/vehicles?tab=approval', label: 'Approval Status', icon: <Shield className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/documents', label: 'Vehicle Documents', icon: <FileText className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/vehicles?tab=maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
      ],
    },
    {
      id: 'driver-management',
      label: 'Driver Management',
      icon: <Users className="w-5 h-5" />,
      children: [
        { href: '/dashboard/fleet-owner/drivers', label: 'My Drivers', icon: <Users className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/drivers?tab=assignments', label: 'Driver Assignments', icon: <UserCog className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/drivers?tab=documents', label: 'Driver Documents', icon: <FileText className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/drivers?tab=performance', label: 'Driver Performance', icon: <Activity className="w-4 h-4" /> },
      ],
    },
    {
      id: 'trip-management',
      label: 'Trip Management',
      icon: <Route className="w-5 h-5" />,
      children: [
        { href: '/dashboard/fleet-owner/trips?status=active', label: 'Active Trips', icon: <PlayCircle className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/trips?status=scheduled', label: 'Scheduled Trips', icon: <Clock className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/trips?status=completed', label: 'Completed Trips', icon: <CheckCircle2 className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/trips?status=cancelled', label: 'Cancelled Trips', icon: <XCircle className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/trips', label: 'Trip History', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Ticket className="w-5 h-5" />,
      children: [
        { href: '/dashboard/fleet-owner/bookings', label: 'Vehicle Bookings', icon: <Ticket className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/bookings?tab=passengers', label: 'Passenger Lists', icon: <Users className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/analytics?tab=bookings', label: 'Booking Analytics', icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      id: 'revenue',
      label: 'Revenue & Earnings',
      icon: <DollarSign className="w-5 h-5" />,
      children: [
        { href: '/dashboard/fleet-owner/earnings', label: 'Earnings Overview', icon: <DollarSign className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/earnings?tab=revenue', label: 'Revenue Reports', icon: <BarChart3 className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/earnings?tab=payouts', label: 'Payout History', icon: <Receipt className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/earnings?tab=commission', label: 'Commission Reports', icon: <TrendingUp className="w-4 h-4" /> },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance Center',
      icon: <Shield className="w-5 h-5" />,
      children: [
        { href: '/dashboard/fleet-owner/vehicles?tab=verification', label: 'Vehicle Verification', icon: <Shield className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/documents?tab=insurance', label: 'Insurance Management', icon: <AlertTriangle className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/documents?tab=registration', label: 'Registration Documents', icon: <FileText className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/documents?tab=permits', label: 'Permit Management', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      id: 'live-ops',
      label: 'Live Operations',
      icon: <Navigation className="w-5 h-5" />,
      children: [
        { href: '/dashboard/fleet-owner/live-tracking', label: 'Live Vehicle Tracking', icon: <Navigation className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/live-tracking?tab=drivers', label: 'Active Drivers', icon: <Users className="w-4 h-4" /> },
        { href: '/dashboard/fleet-owner/live-tracking?tab=trips', label: 'Active Trips', icon: <MapPin className="w-4 h-4" /> },
      ],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      children: [
        { href: '/dashboard/notifications?tab=vehicle', label: 'Vehicle Alerts', icon: <Car className="w-4 h-4" /> },
        { href: '/dashboard/notifications?tab=driver', label: 'Driver Alerts', icon: <Users className="w-4 h-4" /> },
        { href: '/dashboard/notifications?tab=trip', label: 'Trip Alerts', icon: <Route className="w-4 h-4" /> },
        { href: '/dashboard/notifications?tab=approval', label: 'Approval Updates', icon: <Shield className="w-4 h-4" /> },
      ],
    },
    {
      id: 'support',
      label: 'Support',
      icon: <LifeBuoy className="w-5 h-5" />,
      children: [
        { href: '/dashboard/support?tab=tickets', label: 'Support Tickets', icon: <Ticket className="w-4 h-4" /> },
        { href: '/dashboard/support', label: 'Help Center', icon: <HelpCircle className="w-4 h-4" /> },
      ],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      children: [
        { href: '/dashboard/profile', label: 'Company Profile', icon: <Building2 className="w-4 h-4" /> },
        { href: '/dashboard/profile?tab=documents', label: 'Business Documents', icon: <FileText className="w-4 h-4" /> },
        { href: '/dashboard/profile?tab=kyc', label: 'KYC Verification', icon: <Shield className="w-4 h-4" /> },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      href: '/dashboard/passenger/settings',
    },
  ];

  // Other role menu items (kept as-is)
  const getOtherRoleMenuItems = (): MenuItem[] => {
    if (!user) return [];
    const userType = String(user.userType || '').toUpperCase();
    const normalizedUserType = userType === 'VEHICLE_OWNER' ? 'FLEET_OWNER' : userType;

    const menuItemsByType: Record<string, MenuItem[]> = {
      FLEET_OWNER: [
        { href: '/dashboard/vehicle-owner', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { href: '/dashboard/fleet-owner/trips', label: 'My Trips', icon: <Briefcase className="w-5 h-5" /> },
        { href: '/dashboard/fleet-owner/vehicles', label: 'Vehicles', icon: <Car className="w-5 h-5" /> },
        { href: '/dashboard/fleet-owner/drivers', label: 'Drivers', icon: <Users className="w-5 h-5" /> },
        { href: '/dashboard/trips/search', label: 'Search Trips', icon: <Search className="w-5 h-5" /> },
        { href: '/dashboard/bookings', label: 'Bookings', icon: <Calendar className="w-5 h-5" /> },
        { href: '/dashboard/wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
        { href: '/dashboard/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
        { href: '/dashboard/support', label: 'Support', icon: <HelpCircle className="w-5 h-5" /> },
      ],
      SUPPORT: [
        { href: '/dashboard/support', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { href: '/dashboard/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
      ],
    };

    return menuItemsByType[normalizedUserType] || [];
  };

  const userType = String(user?.userType || '').toUpperCase();
  const isPassenger = !user || userType === 'PASSENGER';
  const isDriver = userType === 'DRIVER';
  const isFleetOwner = userType === 'FLEET_OWNER' || userType === 'VEHICLE_OWNER';

  // ─── Render passenger sidebar ────────────────────────────────────────────
  if (isPassenger) {
    return (
      <RoleSidebar
        isOpen={isOpen}
        onClose={onClose}
        sections={getPassengerSections()}
        pathname={pathname}
        accountLabel="Passenger Account"
      />
    );
  }

  // ─── Render driver sidebar ────────────────────────────────────────────
  if (isDriver) {
    return (
      <RoleSidebar
        isOpen={isOpen}
        onClose={onClose}
        sections={getDriverSections()}
        pathname={pathname}
        accountLabel="Driver Account"
      />
    );
  }

  // ─── Render fleet owner sidebar ──────────────────────────────────────────
  if (isFleetOwner) {
    return (
      <RoleSidebar
        isOpen={isOpen}
        onClose={onClose}
        sections={getFleetOwnerSections()}
        pathname={pathname}
        accountLabel="Fleet Owner Account"
      />
    );
  }

  // ─── Render other roles (flat list) ──────────────────────────────────────
  const menuItems = getOtherRoleMenuItems();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:transform-none lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 lg:hidden">
            <span className="text-xl font-bold text-gray-900">Menu</span>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <span className={cn(isActive ? 'text-primary-600' : 'text-gray-400')}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {user?.userType === 'FLEET_OWNER' && 'Fleet Owner Account'}
              {user?.userType === 'SUPPORT' && 'Support Account'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

// ─── Collapsible Sidebar Component (Generalized) ────────────────────────────────────────────
interface RoleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sections: MenuSection[];
  pathname: string | null;
  accountLabel: string;
}

const RoleSidebar: React.FC<RoleSidebarProps> = ({
  isOpen,
  onClose,
  sections,
  pathname,
  accountLabel,
}) => {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  // Local state for expanded sections to keep it self-contained
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`expanded_sections_${user?.userType}`);
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

  // Automatically expand the section that contains the currently active route
  React.useEffect(() => {
    const activeSection = sections.find((section) => isSectionActive(section));
    if (activeSection && !activeSection.href) {
      setExpandedSections((prev) => {
        if (prev[activeSection.id]) return prev;
        const next = { [activeSection.id]: true };
        if (typeof window !== 'undefined') {
          localStorage.setItem(`expanded_sections_${user?.userType}`, JSON.stringify(next));
        }
        return next;
      });
    }
  }, [pathname, searchParams]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const isCurrentlyExpanded = prev[sectionId] ?? false;
      const next = isCurrentlyExpanded ? {} : { [sectionId]: true };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`expanded_sections_${user?.userType}`, JSON.stringify(next));
      }
      return next;
    });
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

    if (basePath === '/dashboard/bookings' || basePath === '/dashboard/driver/trips') {
      const hasStatus = searchParams.has('status');
      const hasView = searchParams.has('view');
      const hasTab = searchParams.has('tab');
      return !hasStatus && !hasView && !hasTab;
    }

    return true;
  };

  const isSectionActive = (section: MenuSection) => {
    if (section.href) return isItemActive(section.href);
    return section.children?.some((child) => isItemActive(child.href)) || false;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:transform-none lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">TravelFlow</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* User card (desktop) */}
          <div className="hidden lg:block px-4 pt-5 pb-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar space-y-0.5 animate-fadeIn">
            {sections.map((section) => {
              const sectionActive = isSectionActive(section);

              // Direct link (no children)
              if (section.href) {
                const isActive = isItemActive(section.href);
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 relative overflow-hidden',
                      isActive
                        ? 'bg-slate-50 text-primary-600 font-semibold'
                        : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary-600 rounded-r-full" />
                    )}
                    <span className={cn(
                      'transition-colors',
                      isActive ? 'text-primary-600' : 'text-gray-400'
                    )}>
                      {section.icon}
                    </span>
                    {section.label}
                    {section.id === 'notifications' && (
                      <NotificationBadge />
                    )}
                  </Link>
                );
              }

              // Collapsible section
              const isExpanded = expandedSections[section.id] ?? false;

              return (
                <div key={section.id} className="space-y-0.5">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150',
                      sectionActive
                        ? 'text-slate-900'
                        : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <span className={cn(
                      'transition-colors',
                      sectionActive ? 'text-primary-600' : 'text-gray-400'
                    )}>
                      {section.icon}
                    </span>
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-gray-400 transition-transform duration-200',
                        isExpanded ? 'rotate-180' : ''
                      )}
                    />
                  </button>

                  {/* Children */}
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200 ease-in-out',
                      isExpanded ? 'max-h-[30rem] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-0.5 py-0.5">
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
                                ? 'bg-slate-55 text-primary-650 font-semibold'
                                : 'text-gray-500 hover:bg-gray-50/50 hover:text-gray-700'
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary-600 rounded-r-full" />
                            )}
                            <span className={cn(
                              'transition-colors',
                              isActive ? 'text-primary-500' : 'text-gray-400'
                            )}>
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

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-gray-500 font-medium">{accountLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// ─── Notification Badge ─────────────────────────────────────────────────────
const NotificationBadge: React.FC = () => {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  if (!unreadCount || unreadCount === 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default Sidebar;
