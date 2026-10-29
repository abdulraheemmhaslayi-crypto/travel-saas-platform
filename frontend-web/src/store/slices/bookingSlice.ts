import { create } from 'zustand';
import { Booking, BookingFilters, CreateBookingDto } from '@/types/booking';
import apiClient from '@/lib/api';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  getMyBookings: (filters?: BookingFilters) => Promise<void>;
  getBooking: (id: string) => Promise<void>;
  createBooking: (data: CreateBookingDto) => Promise<Booking>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
  clearCurrentBooking: () => void;
  clearError: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
  totalCount: 0,

  getMyBookings: async (filters?: BookingFilters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getMyBookings(filters);
      set({ 
        bookings: response.data.data || response.data,
        totalCount: response.data.total || response.data.length,
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get bookings';
      set({ error: message, isLoading: false });
    }
  },

  getBooking: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getBooking(id);
      set({ currentBooking: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get booking';
      set({ error: message, isLoading: false });
    }
  },

  createBooking: async (data: CreateBookingDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.createBooking(data);
      const booking = response.data;
      set({ currentBooking: booking, isLoading: false });
      return booking;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  cancelBooking: async (id: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.cancelBooking(id, { reason: reason || 'Cancelled by user' });
      const bookings = get().bookings.map((b) =>
        b.id === id ? { ...b, status: 'CANCELLED' as const } : b
      );
      set({ bookings, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel booking';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearCurrentBooking: () => set({ currentBooking: null }),
  clearError: () => set({ error: null }),
}));