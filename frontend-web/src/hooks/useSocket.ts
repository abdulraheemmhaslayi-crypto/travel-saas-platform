'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import socketClient from '@/lib/socket';
import { useAuthStore } from '@/store/slices/authSlice';

export function useSocket() {
  const { isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketRef.current = socketClient.connect(token);
      }
    }

    return () => {
      if (!isAuthenticated) {
        socketClient.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const joinTrip = useCallback((tripId: string) => {
    socketClient.joinTrip(tripId);
  }, []);

  const leaveTrip = useCallback((tripId: string) => {
    socketClient.leaveTrip(tripId);
  }, []);

  const sendDriverLocation = useCallback((data: {
    tripId: string;
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
  }) => {
    socketClient.sendDriverLocation({
      ...data,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const sendPassengerLocation = useCallback((data: {
    tripId: string;
    latitude: number;
    longitude: number;
  }) => {
    socketClient.sendPassengerLocation({
      ...data,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const sendEmergencyAlert = useCallback((data: {
    tripId: string;
    userId: string;
    message: string;
    latitude?: number;
    longitude?: number;
  }) => {
    socketClient.sendEmergencyAlert(data);
  }, []);

  const onLocationUpdate = useCallback((callback: (data: unknown) => void) => {
    socketClient.onLocationUpdate(callback);
    return () => {
      socketClient.getSocket()?.off('locationUpdate', callback);
    };
  }, []);

  const onTripUpdate = useCallback((callback: (data: unknown) => void) => {
    socketClient.onTripUpdate(callback);
    return () => {
      socketClient.getSocket()?.off('tripUpdate', callback);
    };
  }, []);

  const onEmergencyAlert = useCallback((callback: (data: unknown) => void) => {
    socketClient.onEmergencyAlert(callback);
    return () => {
      socketClient.getSocket()?.off('emergencyAlert', callback);
    };
  }, []);

  return {
    isConnected: socketClient.isConnected(),
    joinTrip,
    leaveTrip,
    sendDriverLocation,
    sendPassengerLocation,
    sendEmergencyAlert,
    onLocationUpdate,
    onTripUpdate,
    onEmergencyAlert,
  };
}