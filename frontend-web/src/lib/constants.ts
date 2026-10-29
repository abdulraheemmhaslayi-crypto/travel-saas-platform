export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

export const APP_NAME = 'TravelFlow';
export const APP_DESCRIPTION = 'Your trusted travel companion';

export const USER_TYPES = {
  PASSENGER: 'PASSENGER',
  DRIVER: 'DRIVER',
  FLEET_OWNER: 'FLEET_OWNER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUPPORT: 'SUPPORT',
} as const;

export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const TRIP_STATUS = {
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const KYC_STATUS = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export const VEHICLE_TYPES = [
  'Sedan',
  'SUV',
  'Hatchback',
  'Minivan',
  'Bus',
  'Luxury',
  'Electric',
] as const;

export const SEAT_LAYOUTS = {
  SEDAN: 4,
  SUV: 6,
  HATCHBACK: 4,
  MINIVAN: 8,
  BUS: 40,
  LUXURY: 4,
  ELECTRIC: 4,
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const TOAST_DURATION = 5000;

export const SOCKET_EVENTS = {
  JOIN_TRIP: 'joinTrip',
  LEAVE_TRIP: 'leaveTrip',
  DRIVER_LOCATION: 'driverLocation',
  PASSENGER_LOCATION: 'passengerLocation',
  SUBSCRIBE_DRIVER: 'subscribeToDriver',
  EMERGENCY_ALERT: 'emergencyAlert',
  LOCATION_UPDATE: 'locationUpdate',
  TRIP_UPDATE: 'tripUpdate',
  EMERGENCY_BROADCAST: 'emergencyAlert',
  PASSENGER_NEARBY: 'passengerNearby',
  DRIVER_ONLINE: 'driverOnline',
  DRIVER_OFFLINE: 'driverOffline',
} as const;

export const NOTIFICATION_TYPES = {
  BOOKING: 'BOOKING',
  PAYMENT: 'PAYMENT',
  TRIP: 'TRIP',
  SYSTEM: 'SYSTEM',
  PROMOTIONAL: 'PROMOTIONAL',
} as const;