import { create } from 'zustand';
import { NotificationResponse, NotificationPreferencesDto } from '@/types/user';
import apiClient from '@/lib/api';

interface NotificationState {
  notifications: NotificationResponse[];
  unreadCount: number;
  preferences: NotificationPreferencesDto | null;
  isLoading: boolean;
  error: string | null;
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean; type?: string }) => Promise<void>;
  getUnreadCount: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getPreferences: () => Promise<void>;
  updatePreferences: (data: NotificationPreferencesDto) => Promise<void>;
  addNotification: (notification: NotificationResponse) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  error: null,

  getNotifications: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getNotifications(params);
      set({ 
        notifications: response.data.data || response.data,
        isLoading: false 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get notifications';
      set({ error: message, isLoading: false });
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await apiClient.getUnreadCount();
      set({ unreadCount: response.data.count });
    } catch (error) {
      console.error('Failed to get unread count:', error);
    }
  },

  markRead: async (ids: string[]) => {
    try {
      await apiClient.markRead(ids);
      const notifications = get().notifications.map(n => 
        ids.includes(n.id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      );
      const unreadCount = Math.max(0, get().unreadCount - ids.length);
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  },

  markAllRead: async () => {
    try {
      await apiClient.markAllRead();
      const notifications = get().notifications.map(n => ({ 
        ...n, 
        isRead: true, 
        readAt: new Date().toISOString() 
      }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await apiClient.deleteNotification(id);
      const notifications = get().notifications.filter(n => n.id !== id);
      const deleted = get().notifications.find(n => n.id === id);
      const unreadCount = deleted && !deleted.isRead 
        ? Math.max(0, get().unreadCount - 1) 
        : get().unreadCount;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  getPreferences: async () => {
    try {
      const response = await apiClient.getNotificationPreferences();
      set({ preferences: response.data });
    } catch (error) {
      console.error('Failed to get preferences:', error);
    }
  },

  updatePreferences: async (data: NotificationPreferencesDto) => {
    try {
      await apiClient.updateNotificationPreferences(data);
      set({ preferences: data });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  },

  addNotification: (notification: NotificationResponse) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  clearError: () => set({ error: null }),
}));