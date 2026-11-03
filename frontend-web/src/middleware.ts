import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

// Public routes accessible to guests without login (for browsing trips, schedules, prices)
const PUBLIC_GUEST_ROUTES = [
  '/',
  '/dashboard/passenger',
  '/dashboard/passenger/popular-routes',
  '/dashboard/passenger/nearby-trips',
  '/dashboard/trips',
];

const isPublicGuestRoute = (pathname: string) => {
  if (PUBLIC_GUEST_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith('/dashboard/trips/')) return true;
  return false;
};

// Truly protected dashboard prefixes requiring authentication
const PROTECTED_PREFIXES = [
  '/dashboard/driver',
  '/dashboard/fleet-owner',
  '/dashboard/vehicle-owner',
  '/dashboard/support',
  '/dashboard/passenger/payments',
  '/dashboard/passenger/settings',
  '/dashboard/passenger/emergency-contacts',
  '/super-admin',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;
  const rawUserType = request.cookies.get('userType')?.value;
  const rawUserRole = request.cookies.get('userRole')?.value;

  const userType = String(rawUserType || '').toUpperCase();
  const userRole = String(rawUserRole || '').toUpperCase();

  const getDashboardUrl = () => {
    if (userRole === 'SUPER_ADMIN') return '/super-admin/dashboard';
    if (userRole === 'ADMIN') return '/admin/dashboard';
    switch (userType) {
      case 'DRIVER':
        return '/dashboard/driver';
      case 'FLEET_OWNER':
      case 'VEHICLE_OWNER':
        return '/dashboard/vehicle-owner';
      case 'SUPPORT':
        return '/dashboard/support';
      case 'PASSENGER':
      default:
        return '/dashboard/passenger';
    }
  };

  // If opening the app at root (/) -> redirect immediately to the user's dashboard
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL(getDashboardUrl(), request.url));
    }
    // If not authenticated, open passenger dashboard directly for guest browsing
    return NextResponse.redirect(new URL('/dashboard/passenger', request.url));
  }

  // If user is already authenticated
  if (token) {
    // If accessing auth pages (login, register, etc.), redirect to their dashboard
    if (PUBLIC_AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL(getDashboardUrl(), request.url));
    }
  } else {
    // If guest is accessing a public guest route, allow immediately
    if (isPublicGuestRoute(pathname)) {
      return NextResponse.next();
    }

    // If not authenticated and attempting to access protected dashboard/admin routes
    if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/*, svg, png, jpg, etc.
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
