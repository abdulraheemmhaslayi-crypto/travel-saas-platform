import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/tracking',
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebsocketGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Subscribe to Redis Pub/Sub for cross-instance message sync
    this.redisService.subscribe('ws:trip', (message) => {
      try {
        const { tripId, event, data } = JSON.parse(message);
        this.server.to(`trip:${tripId}`).emit(event, data);
      } catch (err) {
        this.logger.error('Error in Redis ws:trip subscriber', err);
      }
    });

    this.redisService.subscribe('ws:user', (message) => {
      try {
        const { userId, event, data } = JSON.parse(message);
        this.server.to(`user:${userId}`).emit(event, data);
      } catch (err) {
        this.logger.error('Error in Redis ws:user subscriber', err);
      }
    });

    this.redisService.subscribe('ws:all', (message) => {
      try {
        const { event, data } = JSON.parse(message);
        this.server.emit(event, data);
      } catch (err) {
        this.logger.error('Error in Redis ws:all subscriber', err);
      }
    });
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      
      if (!token) {
        this.logger.warn('Client connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token as string, {
        secret: this.configService.get('jwt.secret'),
      });

      client.data.user = payload;
      client.data.userId = payload.sub;

      this.logger.log(`Client connected: ${client.id}, User: ${payload.sub}`);

      // Join user-specific room
      client.join(`user:${payload.sub}`);

      // Update online status
      await this.redisService.setex(`online:${payload.sub}`, 300, 'true');
    } catch (error) {
      this.logger.error(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    
    if (userId) {
      await this.redisService.del(`online:${userId}`);
      this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('joinTrip')
  async handleJoinTrip(client: Socket, tripId: string) {
    client.join(`trip:${tripId}`);
    this.logger.log(`User ${client.data.userId} joined trip room: ${tripId}`);
    
    // Send current location if available
    const cachedLocation = await this.redisService.get(`location:${tripId}`);
    if (cachedLocation) {
      client.emit('locationUpdate', JSON.parse(cachedLocation));
    }
    
    return { status: 'joined', tripId };
  }

  @SubscribeMessage('leaveTrip')
  handleLeaveTrip(client: Socket, tripId: string) {
    client.leave(`trip:${tripId}`);
    this.logger.log(`User ${client.data.userId} left trip room: ${tripId}`);
    return { status: 'left', tripId };
  }

  @SubscribeMessage('driverLocation')
  async handleDriverLocation(client: Socket, payload: {
    tripId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  }) {
    const { tripId, latitude, longitude, speed, heading } = payload;

    // Verify driver is assigned to this trip
    const cached = await this.redisService.get(`driver:trip:${client.data.userId}`);
    
    if (cached !== tripId) {
      return { error: 'Not authorized for this trip' };
    }

    const locationData = {
      tripId,
      latitude,
      longitude,
      speed,
      heading,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all passengers in trip room
    this.server.to(`trip:${tripId}`).emit('locationUpdate', locationData);

    // Cache location
    await this.redisService.setex(
      `location:${tripId}`,
      300,
      JSON.stringify(locationData),
    );

    return { status: 'broadcasted' };
  }

  @SubscribeMessage('passengerLocation')
  async handlePassengerLocation(client: Socket, payload: {
    tripId: string;
    latitude: number;
    longitude: number;
  }) {
    // Store passenger pickup location
    await this.redisService.setex(
      `passenger:location:${client.data.userId}`,
      3600,
      JSON.stringify(payload),
    );

    // Notify driver
    this.server.to(`trip:${payload.tripId}:driver`).emit('passengerNearby', {
      passengerId: client.data.userId,
      ...payload,
    });

    return { status: 'stored' };
  }

  @SubscribeMessage('subscribeToDriver')
  handleSubscribeToDriver(client: Socket, driverId: string) {
    client.join(`driver:${driverId}`);
    return { status: 'subscribed', driverId };
  }

  @SubscribeMessage('emergencyAlert')
  async handleEmergencyAlert(client: Socket, payload: {
    tripId: string;
    type: string;
    message: string;
    location: { lat: number; lng: number };
  }) {
    // Broadcast emergency to all in trip and to admins
    this.server.to(`trip:${payload.tripId}`).emit('emergencyAlert', {
      ...payload,
      triggeredBy: client.data.userId,
      timestamp: new Date().toISOString(),
    });

    this.server.to('admin:emergency').emit('emergencyAlert', {
      ...payload,
      triggeredBy: client.data.userId,
    });

    // Store in Redis for logging
    await this.redisService.setex(
      `emergency:${payload.tripId}`,
      86400,
      JSON.stringify(payload),
    );

    return { status: 'alert_sent' };
  }

  // Methods to be called from other services
  broadcastToTrip(tripId: string, event: string, data: any) {
    this.redisService.publish('ws:trip', JSON.stringify({ tripId, event, data }));
  }

  broadcastTripUpdate(tripId: string, data: any) {
    this.redisService.publish('ws:trip', JSON.stringify({ tripId, event: 'tripUpdate', data }));
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.redisService.publish('ws:user', JSON.stringify({ userId, event, data }));
  }

  broadcastToAll(event: string, data: any) {
    this.redisService.publish('ws:all', JSON.stringify({ event, data }));
  }

  async getOnlineUsers(): Promise<string[]> {
    const keys = await this.redisService.keys('online:*');
    return keys.map((key) => key.replace('online:', ''));
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const online = await this.redisService.get(`online:${userId}`);
    return !!online;
  }
}