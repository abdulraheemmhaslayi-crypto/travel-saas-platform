import { create } from 'zustand';
import { Trip, SearchFilters, RouteSuggestion } from '@/types/trip';
import apiClient from '@/lib/api';

// Normalize raw API response to match frontend Trip interface
// Backend uses: source, pricePerSeat, departureTime
// Frontend uses: origin, price, departureDate
// Note: TypeORM decimal columns come back as strings from PostgreSQL, so Number() coercion is required
function normalizeTrip(raw: Record<string, any>): Trip {
  const pricePerSeat = raw.pricePerSeat !== undefined ? Number(raw.pricePerSeat) : undefined;
  const basePrice = raw.basePrice !== undefined ? Number(raw.basePrice) : undefined;
  return {
    ...raw,
    origin: raw.origin ?? raw.source ?? '',
    // price is what the frontend uses for all calculations — map from pricePerSeat
    price: raw.price !== undefined ? Number(raw.price) : (pricePerSeat ?? 0),
    pricePerSeat: pricePerSeat ?? 0,
    basePrice: basePrice ?? 0,
    departureDate: raw.departureDate ?? raw.departureTime ?? '',
    departureTime: raw.departureTime ?? raw.departureDate ?? '',
    arrivalDate: raw.arrivalDate ?? raw.arrivalTime ?? undefined,
    arrivalTime: raw.arrivalTime ?? raw.arrivalDate ?? undefined,
  } as Trip;
}

interface TripState {
  trips: Trip[];
  exactMatches: Trip[];
  partialMatches: Trip[];
  nearbyDeparture: Trip[];
  nearbyDestination: Trip[];
  similarRoutes: Trip[];
  currentTrip: Trip | null;
  popularRoutes: RouteSuggestion[];
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  setFilters: (filters: SearchFilters) => void;
  searchTrips: (filters?: SearchFilters) => Promise<void>;
  getTrip: (id: string) => Promise<void>;
  getPopularRoutes: () => Promise<void>;
  clearCurrentTrip: () => void;
  clearError: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  exactMatches: [],
  partialMatches: [],
  nearbyDeparture: [],
  nearbyDestination: [],
  similarRoutes: [],
  currentTrip: null,
  popularRoutes: [],
  filters: {},
  isLoading: false,
  error: null,
  totalCount: 0,

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  searchTrips: async (filters?: SearchFilters) => {
    set({ isLoading: true, error: null });
    try {
      const searchFilters = filters || get().filters;
      const response = await apiClient.searchTrips(searchFilters);
      const data = response.data;

      const norm = (arr: any[]) => (arr || []).map((t) => normalizeTrip(t as Record<string, any>));

      if (data && typeof data === 'object' && 'allMatches' in data) {
        set({ 
          trips: norm(data.allMatches), 
          exactMatches: norm(data.exactMatches),
          partialMatches: norm(data.partialMatches),
          nearbyDeparture: norm(data.nearbyDeparture),
          nearbyDestination: norm(data.nearbyDestination),
          similarRoutes: norm(data.similarRoutes),
          totalCount: (data.exactMatches?.length || 0) + (data.partialMatches?.length || 0),
          isLoading: false 
        });
      } else {
        const arrayData = norm(Array.isArray(data) ? data : []);
        set({ 
          trips: arrayData, 
          exactMatches: arrayData,
          partialMatches: [],
          nearbyDeparture: [],
          nearbyDestination: [],
          similarRoutes: [],
          totalCount: arrayData.length,
          isLoading: false 
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search trips';
      set({ error: message, isLoading: false });
    }
  },

  getTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getTrip(id);
      const normalized = normalizeTrip(response.data as Record<string, any>);
      set({ currentTrip: normalized, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get trip';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getPopularRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getPopularRoutes();
      set({ popularRoutes: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get popular routes';
      set({ error: message, isLoading: false });
    }
  },

  clearCurrentTrip: () => set({ currentTrip: null }),
  clearError: () => set({ error: null }),
}));