export interface Trip {
  id: string;
  title: string;
  origin: string;
  destination: string;
  departureDate: string;
  arrivalDate?: string;
  price: number;
  currency: string;
  availableSeats: number;
  totalSeats: number;
  status: TripStatus;
  vehicleType: string;
  vehicleId?: string;
  tripType?: string;
  source?: string;
  sourceLat?: number;
  sourceLng?: number;
  destLat?: number;
  destLng?: number;
  departureTime?: string;
  arrivalTime?: string;
  basePrice?: number;
  pricePerSeat?: number;
  distanceKm?: number;
  estimatedDuration?: number;
  isReturnTripAvailable?: boolean;
  allowBooking?: boolean;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnPricePerSeat?: number;
  driverId?: string;
  driver?: Driver | null;
  vehicle?: Vehicle | null;
  stops?: TripStop[];
  routes?: TripRoute[];
  seats?: TripSeat[];
  fleetId?: string;
  description?: string;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
  matchDetails?: {
    rank: number;
    sourceStop?: string;
    destStop?: string;
    sourceDist?: number;
    destDist?: number;
    isRouteBased?: boolean;
    isDepartureOnly?: boolean;
    isDestinationOnly?: boolean;
  };
}

export interface TripStop {
  id: string;
  tripId: string;
  stopName: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  estimatedArrival?: string;
  stopDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripRoute {
  id: string;
  tripId: string;
  waypoint: string;
  latitude: number;
  longitude: number;
  sequenceOrder?: number;
  distanceFromStart?: number;
  estimatedArrival?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripSeat {
  id: string;
  tripId: string;
  seatNumber: string;
  row?: string;
  seatType: 'window' | 'aisle' | 'middle' | 'premium' | 'recliner';
  status: 'available' | 'booked' | 'reserved' | 'blocked' | 'unavailable';
  price?: number;
  bookingId?: string;
  isReturnSeat?: boolean;
  reservedUntil?: string;
  gender?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  registrationNumber: string;
  brand: string;
  make?: string;
  model: string;
  year: number;
  type: string;
  color: string;
  seatingCapacity: number;
  fuelType?: string;
  transmission?: string;
  vehicleImage?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'maintenance' | 'suspended';
  hasAC?: boolean;
  hasWifi?: boolean;
  hasCharging?: boolean;
  hasEntertainment?: boolean;
  hasLuggageSpace?: boolean;
  amenities?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  user: UserSummary;
  licenseNumber?: string;
  licenseType?: string;
  drivingExperience?: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'on_trip' | 'offline' | 'suspended';
  rating: number;
  totalRatings: number;
  totalTrips: number;
  createdAt: string;
  updatedAt: string;
}

export type TripStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  phone: string;
}

export interface SearchFilters {
  origin?: string;
  destination?: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  date?: string;
  minPrice?: number;
  maxPrice?: number;
  vehicleType?: string;
  availableSeats?: number;
  seats?: number;
  page?: number;
}

export interface RouteSuggestion {
  id: string;
  origin: string;
  destination: string;
  popularity: number;
  avgPrice: number;
}

export interface LiveLocation {
  tripId: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  timestamp: string;
}

export interface TripLocationHistory {
  locations: LiveLocation[];
  tripId: string;
}