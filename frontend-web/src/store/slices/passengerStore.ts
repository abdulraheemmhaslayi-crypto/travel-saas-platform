import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FavoriteRoute,
  FavoriteDriver,
  EmergencyContact,
  PaymentHistoryItem,
} from '@/types/passenger';
import apiClient from '@/lib/api';

interface PassengerState {
  // Favorite routes (localStorage persisted)
  favoriteRoutes: FavoriteRoute[];
  addFavoriteRoute: (origin: string, destination: string) => void;
  removeFavoriteRoute: (id: string) => void;
  isFavoriteRoute: (origin: string, destination: string) => boolean;
  updateRouteLastSearched: (origin: string, destination: string) => void;

  // Favorite drivers (localStorage persisted)
  favoriteDrivers: FavoriteDriver[];
  addFavoriteDriver: (driver: Omit<FavoriteDriver, 'id' | 'addedAt'>) => void;
  removeFavoriteDriver: (id: string) => void;
  isFavoriteDriver: (driverId: string) => boolean;

  // Emergency contacts (localStorage persisted until backend support)
  emergencyContacts: EmergencyContact[];
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  updateEmergencyContact: (id: string, contact: Partial<EmergencyContact>) => void;
  removeEmergencyContact: (id: string) => void;

  // Payment history (API-driven)
  payments: PaymentHistoryItem[];
  paymentsLoading: boolean;
  paymentsError: string | null;
  getMyPayments: (params?: Record<string, unknown>) => Promise<void>;

  // Recently viewed trips
  recentlyViewedTrips: string[];
  addRecentlyViewedTrip: (tripId: string) => void;

  // Sidebar state
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  setSectionExpanded: (section: string, expanded: boolean) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const usePassengerStore = create<PassengerState>()(
  persist(
    (set, get) => ({
      // ── Favorite Routes ──────────────────────────────────────────────
      favoriteRoutes: [],

      addFavoriteRoute: (origin: string, destination: string) => {
        const existing = get().favoriteRoutes.find(
          (r) => r.origin === origin && r.destination === destination
        );
        if (existing) return;
        set({
          favoriteRoutes: [
            ...get().favoriteRoutes,
            {
              id: generateId(),
              origin,
              destination,
              addedAt: new Date().toISOString(),
            },
          ],
        });
      },

      removeFavoriteRoute: (id: string) => {
        set({
          favoriteRoutes: get().favoriteRoutes.filter((r) => r.id !== id),
        });
      },

      isFavoriteRoute: (origin: string, destination: string) => {
        return get().favoriteRoutes.some(
          (r) => r.origin === origin && r.destination === destination
        );
      },

      updateRouteLastSearched: (origin: string, destination: string) => {
        set({
          favoriteRoutes: get().favoriteRoutes.map((r) =>
            r.origin === origin && r.destination === destination
              ? { ...r, lastSearchedAt: new Date().toISOString() }
              : r
          ),
        });
      },

      // ── Favorite Drivers ─────────────────────────────────────────────
      favoriteDrivers: [],

      addFavoriteDriver: (driver) => {
        const existing = get().favoriteDrivers.find(
          (d) => d.userId === driver.userId
        );
        if (existing) return;
        set({
          favoriteDrivers: [
            ...get().favoriteDrivers,
            {
              ...driver,
              id: generateId(),
              addedAt: new Date().toISOString(),
            },
          ],
        });
      },

      removeFavoriteDriver: (id: string) => {
        set({
          favoriteDrivers: get().favoriteDrivers.filter((d) => d.id !== id),
        });
      },

      isFavoriteDriver: (driverId: string) => {
        return get().favoriteDrivers.some((d) => d.userId === driverId);
      },

      // ── Emergency Contacts ───────────────────────────────────────────
      emergencyContacts: [],

      addEmergencyContact: (contact) => {
        set({
          emergencyContacts: [
            ...get().emergencyContacts,
            { ...contact, id: generateId() },
          ],
        });
      },

      updateEmergencyContact: (id, contact) => {
        set({
          emergencyContacts: get().emergencyContacts.map((c) =>
            c.id === id ? { ...c, ...contact } : c
          ),
        });
      },

      removeEmergencyContact: (id: string) => {
        set({
          emergencyContacts: get().emergencyContacts.filter((c) => c.id !== id),
        });
      },

      // ── Payment History ──────────────────────────────────────────────
      payments: [],
      paymentsLoading: false,
      paymentsError: null,

      getMyPayments: async (params?: Record<string, unknown>) => {
        set({ paymentsLoading: true, paymentsError: null });
        try {
          const response = await apiClient.get('/payments/my-payments', {
            params,
          });
          const data = response.data;
          set({
            payments: Array.isArray(data) ? data : data?.data || [],
            paymentsLoading: false,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to load payments';
          set({ paymentsError: message, paymentsLoading: false });
        }
      },

      // ── Recently Viewed Trips ────────────────────────────────────────
      recentlyViewedTrips: [],

      addRecentlyViewedTrip: (tripId: string) => {
        const current = get().recentlyViewedTrips.filter((id) => id !== tripId);
        set({
          recentlyViewedTrips: [tripId, ...current].slice(0, 20),
        });
      },

      // ── Sidebar State ────────────────────────────────────────────────
      expandedSections: {
        'trip-discovery': false,
        'my-trips': false,
        'bookings': true,
        'payments': false,
        'favorites': false,
        'support': false,
        'profile-settings': false,
      },

      toggleSection: (section: string) => {
        set({
          expandedSections: {
            ...get().expandedSections,
            [section]: !get().expandedSections[section],
          },
        });
      },

      setSectionExpanded: (section: string, expanded: boolean) => {
        set({
          expandedSections: {
            ...get().expandedSections,
            [section]: expanded,
          },
        });
      },
    }),
    {
      name: 'passenger-storage',
      partialize: (state) => ({
        favoriteRoutes: state.favoriteRoutes,
        favoriteDrivers: state.favoriteDrivers,
        emergencyContacts: state.emergencyContacts,
        recentlyViewedTrips: state.recentlyViewedTrips,
        expandedSections: state.expandedSections,
      }),
    }
  )
);
