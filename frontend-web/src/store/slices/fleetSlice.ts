import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface Vehicle {
  id: string;
  fleetVehicleId?: string;
  registrationNumber: string;
  make: string;
  brand?: string;
  model: string;
  year: number;
  capacity: number;
  seatingCapacity?: number;
  type?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'PENDING';
  assignedDriver?: string;
}

export interface FleetDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  rating: number;
  totalTrips: number;
  assignedVehicle?: any;
  isVerified?: boolean;
  verificationStatus?: string;
  drivingLicense?: string;
  kycStatus?: string;
  activeTrips?: number;
  totalEarnings?: number;
  earnings?: number;
  vehicle?: any;
}

export interface FleetRevenue {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  activeTrips: number;
}

export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  activeTrips: number;
  totalRevenue: number;
}

interface FleetState {
  currentFleetId: string | null;
  currentFleetName?: string;
  vehicles: Vehicle[];
  drivers: FleetDriver[];
  revenue: FleetRevenue | null;
  stats: FleetStats | null;
  vehicleStats: { total: number; active: number; pending: number; approved: number; suspended: number; rejected: number } | null;
  isLoading: boolean;
  error: string | null;
  getMyFleets: () => Promise<void>;
  getVehicles: () => Promise<void>;
  getDrivers: () => Promise<void>;
  getRevenue: () => Promise<void>;
  getFleetStats: () => Promise<void>;
  getVehicleStats: () => Promise<void>;
  createFleet: (data: {
    companyName: string;
    email: string;
    phone: string;
    description?: string;
    logo?: string;
    address?: string;
    city?: string;
    state?: string;
    registrationNumber?: string;
    taxId?: string;
  }) => Promise<void>;
  addVehicle: (data: Partial<Vehicle>) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addDriver: (data: Partial<FleetDriver>) => Promise<void>;
  clearError: () => void;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  currentFleetId: null,
  currentFleetName: undefined,
  vehicles: [],
  drivers: [],
  revenue: null,
  stats: null,
  vehicleStats: null,
  isLoading: false,
  error: null,

  getMyFleets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getMyFleets();
      const fleets = response.data.data || response.data;
      const firstFleet = Array.isArray(fleets) && fleets.length > 0 ? fleets[0] : null;
      set({
        currentFleetId: firstFleet?.id ?? null,
        currentFleetName: firstFleet?.name,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load fleets';
      set({ error: message, isLoading: false });
    }
  },

  getVehicles: async () => {
    set({ isLoading: true, error: null });
    try {
      const { currentFleetId, getMyFleets } = get();
      let fleetId = currentFleetId;
      if (!fleetId) {
        await getMyFleets();
        fleetId = get().currentFleetId;
      }

      if (!fleetId) {
        throw new Error('No fleet found. Please create a fleet first.');
      }

      const response = await apiClient.getFleetVehicles(fleetId);
      set({ 
        vehicles: response.data.data || response.data, 
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get vehicles';
      set({ error: message, isLoading: false });
    }
  },

  getDrivers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/fleet/drivers');
      set({ 
        drivers: response.data.data || response.data, 
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get drivers';
      set({ error: message, isLoading: false });
    }
  },

  getRevenue: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/fleet/revenue');
      set({ 
        revenue: response.data.data || response.data, 
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get revenue';
      set({ error: message, isLoading: false });
    }
  },

  getFleetStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { currentFleetId, getMyFleets } = get();
      let fleetId = currentFleetId;
      if (!fleetId) {
        await getMyFleets();
        fleetId = get().currentFleetId;
      }

      if (!fleetId) {
        throw new Error('No fleet found. Please create a fleet first.');
      }

      const response = await apiClient.getFleetAnalytics(fleetId);
      set({ 
        stats: response.data.data || response.data,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get fleet stats';
      set({ error: message, isLoading: false });
    }
  },

  createFleet: async (data: {
    companyName: string;
    email: string;
    phone: string;
    description?: string;
    logo?: string;
    address?: string;
    city?: string;
    state?: string;
    registrationNumber?: string;
    taxId?: string;
  }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.createFleet(data);
      const fleet = response.data.data || response.data;
      set({
        currentFleetId: fleet.id,
        currentFleetName: fleet.name,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create fleet';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addVehicle: async (data: Partial<Vehicle>) => {
    set({ isLoading: true, error: null });
    try {
      const { currentFleetId, getMyFleets } = get();
      let fleetId = currentFleetId;
      if (!fleetId) {
        await getMyFleets();
        fleetId = get().currentFleetId;
      }

      if (!fleetId) {
        throw new Error('No fleet found. Please create a fleet first.');
      }

      const response = await apiClient.addVehicle(fleetId, data);
      const newVehicle = response.data.data || response.data;
      set((state) => ({
        vehicles: [...state.vehicles, newVehicle],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add vehicle';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getVehicleStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getVehicleOwnerStats();
      set({ 
        vehicleStats: response.data.data || response.data, 
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get vehicle stats';
      set({ error: message, isLoading: false });
    }
  },

  updateVehicle: async (id: string, data: Partial<Vehicle>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.updateVehicle(id, data);
      const updatedVehicle = response.data.data || response.data;
      set((state) => ({
        vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...updatedVehicle } : v)),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update vehicle';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteVehicle: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteVehicle(id);
      set((state) => ({
        vehicles: state.vehicles.filter((v) => v.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete vehicle';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addDriver: async (data: Partial<FleetDriver>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/fleet/drivers', data);
      const newDriver = response.data.data || response.data;
      set((state) => ({
        drivers: [...state.drivers, newDriver],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add driver';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
