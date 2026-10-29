// ─── Passenger-specific type definitions ──────────────────────────────────

export interface FavoriteRoute {
  id: string;
  origin: string;
  destination: string;
  addedAt: string;
  lastSearchedAt?: string;
}

export interface FavoriteDriver {
  id: string;         // driver profile ID
  userId: string;     // user ID of the driver
  firstName: string;
  lastName: string;
  profileImage?: string;
  rating: number;
  totalTrips: number;
  addedAt: string;
  lastRodeAt?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
}

export interface PaymentHistoryItem {
  id: string;
  transactionId: string;
  bookingId?: string;
  paymentType: string;
  method: string;
  status: string;
  amount: number;
  currency: string;
  refundAmount?: number;
  refundStatus?: string;
  refundedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TripStatistics {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}
