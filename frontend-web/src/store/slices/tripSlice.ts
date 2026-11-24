import { create } from 'zustand';
import { Trip, SearchFilters, RouteSuggestion } from '@/types/trip';
import apiClient from '@/lib/api';

// Normalize raw API response to match frontend Trip interface
// Backend uses: source, pricePerSeat, departureTime
// Frontend uses: origin, price, departureDate
// Note: TypeORM decimal columns come back as strings from PostgreSQL, so Number() coercion is required
function normalizeTrip(raw: Record<string, any>): Trip {
  const bookingModeRaw = String(raw.bookingMode || raw.booking_mode || 'SEAT').toUpperCase();
  const bookingMode = (['SEAT', 'FULL_VEHICLE', 'BOTH'].includes(bookingModeRaw) ? bookingModeRaw : 'SEAT') as 'SEAT' | 'FULL_VEHICLE' | 'BOTH';
  const fullVehiclePrice = raw.fullVehiclePrice != null
    ? Math.round(Number(raw.fullVehiclePrice))
    : (raw.full_vehicle_price != null ? Math.round(Number(raw.full_vehicle_price)) : undefined);
  const rawPricePerSeat = raw.pricePerSeat !== undefined ? Math.round(Number(raw.pricePerSeat)) : undefined;
  const basePrice = raw.basePrice !== undefined ? Math.round(Number(raw.basePrice)) : undefined;

  const isFullVehicle = bookingMode === 'FULL_VEHICLE' || (typeof fullVehiclePrice === 'number' && fullVehiclePrice > 0);
  const effectivePrice = isFullVehicle && fullVehiclePrice ? fullVehiclePrice : (raw.price !== undefined ? Math.round(Number(raw.price)) : (rawPricePerSeat ?? 0));

  return {
    ...raw,
    bookingMode,
    fullVehiclePrice,
    origin: raw.origin ?? raw.source ?? '',
    price: effectivePrice,
    pricePerSeat: isFullVehicle && fullVehiclePrice ? fullVehiclePrice : (rawPricePerSeat ?? 0),
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

      if (data && typeof data === 'object' && ('allMatches' in data || 'exactMatches' in data)) {
        const combined = data.allMatches || [
          ...(data.exactMatches || []),
          ...(data.partialMatches || []),
          ...(data.nearbyDeparture || []),
          ...(data.nearbyDestination || []),
        ];
        set({ 
          trips: norm(combined), 
          exactMatches: norm(data.exactMatches || []),
          partialMatches: norm(data.partialMatches || []),
          nearbyDeparture: norm(data.nearbyDeparture || []),
          nearbyDestination: norm(data.nearbyDestination || []),
          similarRoutes: norm(data.similarRoutes || []),
          totalCount: combined.length,
          isLoading: false 
        });
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        const arrayData = norm(data.data);
        set({ 
          trips: arrayData, 
          exactMatches: arrayData,
          partialMatches: [],
          nearbyDeparture: [],
          nearbyDestination: [],
          similarRoutes: [],
          totalCount: data.total ?? arrayData.length,
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
      const raw = Array.isArray(response.data) ? response.data : [];
      const normalized: RouteSuggestion[] = raw.map((r: any, idx: number) => ({
        id: r.id || ('route-' + idx),
        origin: r.origin || r.source || '',
        source: r.source || r.origin || '',
        destination: r.destination || '',
        popularity: r.popularity || r.count || 0,
        count: r.count || r.popularity || 0,
        avgPrice: typeof r.avgPrice === 'number' ? r.avgPrice : parseFloat(r.avgPrice || '0') || 0,
      }));
      set({ popularRoutes: normalized, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get popular routes';
      set({ error: message, isLoading: false });
    }
  },

  clearCurrentTrip: () => set({ currentTrip: null }),
  clearError: () => set({ error: null }),
}));