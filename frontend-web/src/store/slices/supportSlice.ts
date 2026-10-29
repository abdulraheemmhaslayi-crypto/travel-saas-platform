import { create } from 'zustand';
import apiClient from '@/lib/api';
import { SupportTicket, TicketStats } from '@/types/support';

interface TicketFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  assignedToMe?: boolean;
  search?: string;
}

interface SupportState {
  tickets: SupportTicket[];
  currentTicket: SupportTicket | null;
  stats: TicketStats | null;
  filters: TicketFilters;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  categories: Array<{ id: string; name: string; description: string }>;

  // Actions
  setFilters: (filters: TicketFilters) => void;
  getTickets: (filters?: TicketFilters) => Promise<void>;
  getTicket: (id: string) => Promise<void>;
  createTicket: (data: unknown) => Promise<void>;
  updateTicket: (id: string, data: unknown) => Promise<void>;
  assignTicket: (id: string, data: unknown) => Promise<void>;
  escalateTicket: (id: string, data: unknown) => Promise<void>;
  resolveTicket: (id: string, data: unknown) => Promise<void>;
  reopenTicket: (id: string, data: unknown) => Promise<void>;
  addComment: (id: string, data: unknown) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  getStats: (params?: unknown) => Promise<void>;
  getCategories: () => Promise<void>;
  clearCurrentTicket: () => void;
  clearError: () => void;
}

export const useSupportStore = create<SupportState>((set, get) => ({
  tickets: [],
  currentTicket: null,
  stats: null,
  filters: { page: 1, limit: 20 },
  isLoading: false,
  error: null,
  totalCount: 0,
  categories: [],

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  getTickets: async (filters?: TicketFilters) => {
    set({ isLoading: true, error: null });
    try {
      const searchFilters = filters || get().filters;
      const response = await apiClient.getTickets(searchFilters);
      set({
        tickets: response.data.data || response.data,
        totalCount: response.data.total || response.data.length,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load tickets';
      set({ error: message, isLoading: false });
    }
  },

  getTicket: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getTicket(id);
      set({ currentTicket: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load ticket';
      set({ error: message, isLoading: false });
    }
  },

  createTicket: async (data: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.createTicket(data);
      set((state) => ({
        tickets: [response.data, ...state.tickets],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create ticket';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTicket: async (id: string, data: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.updateTicket(id, data);
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? response.data : t)),
        currentTicket: state.currentTicket?.id === id ? response.data : state.currentTicket,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update ticket';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  assignTicket: async (id: string, data: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.assignTicket(id, data);
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? response.data : t)),
        currentTicket: state.currentTicket?.id === id ? response.data : state.currentTicket,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign ticket';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  escalateTicket: async (id: string, data: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.escalateTicket(id, data);
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? response.data : t)),
        currentTicket: state.currentTicket?.id === id ? response.data : state.currentTicket,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to escalate ticket';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  resolveTicket: async (id: string, data: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.resolveTicket(id, data);
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? response.data : t)),
        currentTicket: state.currentTicket?.id === id ? response.data : state.currentTicket,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve ticket';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  reopenTicket: async (id: string, data: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.reopenTicket(id, data);
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? response.data : t)),
        currentTicket: state.currentTicket?.id === id ? response.data : state.currentTicket,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reopen ticket';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addComment: async (id: string, data: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.addTicketComment(id, data);
      set((state) => ({
        currentTicket: state.currentTicket?.id === id ? response.data : state.currentTicket,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteTicket: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteTicket(id);
      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete ticket';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getStats: async (params?: unknown) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getTicketStats(params);
      set({ stats: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load stats';
      set({ error: message, isLoading: false });
    }
  },

  getCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getTicketCategories();
      set({ categories: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load categories';
      set({ error: message, isLoading: false });
    }
  },

  clearCurrentTicket: () => set({ currentTicket: null }),
  clearError: () => set({ error: null }),
}));
