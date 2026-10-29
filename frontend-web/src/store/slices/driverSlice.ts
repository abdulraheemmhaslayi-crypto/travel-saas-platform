import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface DriverTrip {
  id: string;
  source: string;
  destination: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'ACTIVE' | 'IN_PROGRESS' | 'DELAYED';
  bookings: number;
  stops?: any[];
  bookingsList?: any[];
  vehicle?: any;
}

export interface DriverEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  rating: number;
  totalTrips: number;
  completedTrips: number;
}

interface DriverState {
  activeTrips: DriverTrip[];
  availableTrips: DriverTrip[];
  earnings: DriverEarnings | null;
  rating: number;
  isLoading: boolean;
  error: string | null;
  getActiveTrips: () => Promise<void>;
  getAvailableTrips: () => Promise<void>;
  getEarnings: () => Promise<void>;
  getDriverStats: () => Promise<void>;
  updateTripStatus: (tripId: string, status: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: string) => Promise<void>;
  clearError: () => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  activeTrips: [],
  availableTrips: [],
  earnings: null,
  rating: 0,
  isLoading: false,
  error: null,

  getActiveTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/driver/trips/active');
      set({ 
        activeTrips: response.data.data || response.data, 
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get active trips';
      set({ error: message, isLoading: false });
    }
  },

  getAvailableTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/driver/trips/available');
      set({ 
        availableTrips: response.data.data || response.data, 
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get available trips';
      set({ error: message, isLoading: false });
    }
  },

  getEarnings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/driver/earnings');
      set({ 
        earnings: response.data.data || response.data, 
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get earnings';
      set({ error: message, isLoading: false });
    }
  },

  getDriverStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const [tripsRes, earningsRes] = await Promise.all([
        apiClient.get('/driver/trips/active'),
        apiClient.get('/driver/earnings'),
      ]);
      
      set({ 
        activeTrips: tripsRes.data.data || tripsRes.data,
        earnings: earningsRes.data.data || earningsRes.data,
        rating: earningsRes.data.data?.rating || earningsRes.data?.rating || 0,
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get driver stats';
      set({ error: message, isLoading: false });
    }
  },

  updateTripStatus: async (tripId: string, status: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.patch(`/trips/${tripId}/status`, { status });
      // Refresh statistics & active trips
      const [tripsRes, earningsRes] = await Promise.all([
        apiClient.get('/driver/trips/active'),
        apiClient.get('/driver/earnings'),
      ]);
      set({ 
        activeTrips: tripsRes.data.data || tripsRes.data,
        earnings: earningsRes.data.data || earningsRes.data,
        rating: earningsRes.data.data?.rating || earningsRes.data?.rating || 0,
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update trip status';
      set({ error: message, isLoading: false });
    }
  },

  updateBookingStatus: async (bookingId: string, status: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status });
      // Refresh active trips so lists/manifests are updated
      const response = await apiClient.get('/driver/trips/active');
      set({ 
        activeTrips: response.data.data || response.data, 
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update booking status';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
