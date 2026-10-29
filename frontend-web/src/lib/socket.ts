import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from './constants';
import { SOCKET_EVENTS } from './constants';

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  public connect(token: string): Socket {
    this.token = token;
    this.socket = io(`${WS_BASE_URL}/tracking`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Room management
  public joinTrip(tripId: string) {
    this.socket?.emit(SOCKET_EVENTS.JOIN_TRIP, { tripId });
  }

  public leaveTrip(tripId: string) {
    this.socket?.emit(SOCKET_EVENTS.LEAVE_TRIP, { tripId });
  }

  public subscribeToDriver(driverId: string) {
    this.socket?.emit(SOCKET_EVENTS.SUBSCRIBE_DRIVER, { driverId });
  }

  // Location updates
  public sendDriverLocation(data: {
    tripId: string;
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
    timestamp: string;
  }) {
    this.socket?.emit(SOCKET_EVENTS.DRIVER_LOCATION, data);
  }

  public sendPassengerLocation(data: {
    tripId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  }) {
    this.socket?.emit(SOCKET_EVENTS.PASSENGER_LOCATION, data);
  }

  public sendEmergencyAlert(data: {
    tripId: string;
    userId: string;
    message: string;
    latitude?: number;
    longitude?: number;
  }) {
    this.socket?.emit(SOCKET_EVENTS.EMERGENCY_ALERT, data);
  }

  // Event listeners
  public onLocationUpdate(callback: (data: unknown) => void) {
    this.socket?.on(SOCKET_EVENTS.LOCATION_UPDATE, callback);
  }

  public onTripUpdate(callback: (data: unknown) => void) {
    this.socket?.on(SOCKET_EVENTS.TRIP_UPDATE, callback);
  }

  public onEmergencyAlert(callback: (data: unknown) => void) {
    this.socket?.on(SOCKET_EVENTS.EMERGENCY_BROADCAST, callback);
  }

  public onPassengerNearby(callback: (data: unknown) => void) {
    this.socket?.on(SOCKET_EVENTS.PASSENGER_NEARBY, callback);
  }

  public onDriverOnline(callback: (data: unknown) => void) {
    this.socket?.on(SOCKET_EVENTS.DRIVER_ONLINE, callback);
  }

  public onDriverOffline(callback: (data: unknown) => void) {
    this.socket?.on(SOCKET_EVENTS.DRIVER_OFFLINE, callback);
  }

  public removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const socketClient = new SocketClient();
export default socketClient;