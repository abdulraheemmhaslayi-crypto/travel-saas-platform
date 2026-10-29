'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { API_BASE_URL } from '@/lib/constants';

export function useNotificationSSE() {
  const { addNotification, getUnreadCount } = useNotificationStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API_BASE_URL}/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addNotification(data);
        getUnreadCount();
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      // Reconnect after 5 seconds
      setTimeout(() => connect(), 5000);
    };

    eventSourceRef.current = eventSource;
  }, [addNotification, getUnreadCount]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}