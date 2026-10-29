import { Injectable, Logger, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Consumer, Kafka, EachMessagePayload } from 'kafkajs';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '@/redis/redis.service';
import { KafkaService } from './kafka.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumer.name);
  private consumer: Consumer;
  private readonly topics = [
    'booking.created',
    'booking.cancelled',
    'booking.completed',
    'payment.success',
    'payment.failed',
    'trip.started',
    'trip.completed',
    'user.registered',
    'user.profile_updated',
    'support.ticket.created',
    'support.ticket.escalated',
    'vehicle.location.updated',
    'driver.assigned',
  ];

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafka: Kafka,
    private readonly notificationsService: NotificationsService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.KAFKA_ENABLED === 'false') {
      this.logger.warn('Kafka is disabled (KAFKA_ENABLED=false). Skipping consumer connection.');
      return;
    }
    try {
      this.consumer = this.kafka.consumer({
        groupId: 'travel-saas-consumer-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await this.consumer.connect();

    for (const topic of this.topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      await this.consumer.subscribe({ topic: `${topic}.retry`, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
      autoCommit: true,
      autoCommitInterval: 5000,
    });

    this.logger.log(`Kafka consumer started, subscribed to ${this.topics.length} topics and retry queues`);
    } catch (error: any) {
      this.logger.warn(`Kafka consumer failed to connect: ${error?.message || error}. Continuing without Kafka consumer.`);
      this.consumer = null as any;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.consumer) {
      try {
        await this.consumer.disconnect();
        this.logger.log('Kafka consumer disconnected');
      } catch (err) {}
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const value = message.value?.toString();

    this.logger.debug(`Received message from ${topic}[${partition}]: ${value}`);

    // Message idempotency protection using Redis
    const eventId = message.key?.toString() || `${topic}:${message.offset}`;
    const idempotencyKey = `msg:idempotency:${eventId}`;

    try {
      const isDuplicate = await this.redisService.get(idempotencyKey);
      if (isDuplicate) {
        this.logger.warn(`Duplicate message detected: ${idempotencyKey}, skipping processing`);
        return;
      }

      const data = JSON.parse(value || '{}');
      const normalizedTopic = topic.endsWith('.retry') ? topic.slice(0, -6) : topic;

      switch (normalizedTopic) {
        case 'booking.created':
          await this.handleBookingCreated(data);
          break;
        case 'booking.cancelled':
          await this.handleBookingCancelled(data);
          break;
        case 'booking.completed':
          await this.handleBookingCompleted(data);
          break;
        case 'payment.success':
          await this.handlePaymentSuccess(data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(data);
          break;
        case 'trip.started':
          await this.handleTripStarted(data);
          break;
        case 'trip.completed':
          await this.handleTripCompleted(data);
          break;
        case 'user.registered':
          await this.handleUserRegistered(data);
          break;
        case 'user.profile_updated':
          await this.handleUserProfileUpdated(data);
          break;
        case 'support.ticket.created':
          await this.handleSupportTicketCreated(data);
          break;
        case 'support.ticket.escalated':
          await this.handleSupportTicketEscalated(data);
          break;
        case 'vehicle.location.updated':
          await this.handleVehicleLocationUpdated(data);
          break;
        case 'driver.assigned':
          await this.handleDriverAssigned(data);
          break;
        default:
          this.logger.warn(`No handler for topic: ${topic}`);
      }

      // Mark message as processed with a 24-hour expiration
      await this.redisService.setex(idempotencyKey, 86400, 'processed');

    } catch (error) {
      this.logger.error(`Error processing message from ${topic}`, error.stack || error.message);
      await this.handleFailure(topic, message, error);
    }
  }

  private async handleFailure(topic: string, message: any, error: Error): Promise<void> {
    try {
      const value = message.value?.toString();
      const data = JSON.parse(value || '{}');
      const retryCount = data._retryMetadata?.retryCount || 0;
      const baseTopic = topic.endsWith('.retry') ? topic.slice(0, -6) : topic;

      if (retryCount < 3) {
        const nextRetryCount = retryCount + 1;
        const updatedMessage = {
          ...data,
          _retryMetadata: {
            retryCount: nextRetryCount,
            lastError: error.message,
            originalTopic: data._retryMetadata?.originalTopic || baseTopic,
          },
        };

        // Exponential backoff delay: retry 1 = 2s, retry 2 = 4s, retry 3 = 8s
        const delayMs = Math.pow(2, nextRetryCount) * 1000;
        this.logger.warn(`Retrying message for topic ${topic} in ${delayMs}ms (attempt ${nextRetryCount}/3)`);

        await new Promise((resolve) => setTimeout(resolve, delayMs));

        await this.kafkaService.publish(
          `${baseTopic}.retry`,
          updatedMessage,
          message.key?.toString(),
        );
      } else {
        const dlqTopic = `${baseTopic}.DLQ`;
        const dlqMessage = {
          ...data,
          _dlqMetadata: {
            failedAt: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            originalTopic: data._retryMetadata?.originalTopic || baseTopic,
          },
        };

        this.logger.error(`Message processing exceeded max retries. Routing to DLQ topic: ${dlqTopic}`);
        await this.kafkaService.publish(
          dlqTopic,
          dlqMessage,
          message.key?.toString(),
        );
      }
    } catch (failError) {
      this.logger.error(`Critical error in DLQ routing/retry handler for topic ${topic}`, failError.stack || failError.message);
    }
  }

  private async invalidateCachesForBooking(tripId?: string): Promise<void> {
    try {
      if (tripId) {
        await this.redisService.del(`seats:trip:${tripId}`);
        await this.redisService.del(`trip:details:${tripId}`);
      }

      // Sweep search:trips:*
      const searchKeys = await this.redisService.keys('search:trips:*');
      for (const key of searchKeys) {
        await this.redisService.del(key);
      }

      // Sweep dashboard:*
      const dashboardKeys = await this.redisService.keys('dashboard:*');
      for (const key of dashboardKeys) {
        await this.redisService.del(key);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate booking/search caches', error);
    }
  }

  private async handleBookingCreated(data: any): Promise<void> {
    // Notify fleet manager
    if (data.fleetCompanyId) {
      await this.notificationsService.sendToUser(data.fleetManagerId, {
        title: 'New Booking Received',
        body: `New booking #${data.bookingId} for trip ${data.tripId}`,
        type: 'BOOKING',
        data,
      });
    }

    // Invalidate caches
    await this.invalidateCachesForBooking(data.tripId);

    // Update pre-aggregated metrics
    await this.analyticsService.handleEventMetrics({ type: 'booking', delta: 1 });
  }

  private async handleBookingCancelled(data: any): Promise<void> {
    await this.notificationsService.sendToUser(data.userId, {
      title: 'Booking Cancelled',
      body: `Your booking #${data.bookingId} has been cancelled. Refund will be processed shortly.`,
      type: 'BOOKING',
      data,
    });

    if (data.driverId) {
      await this.notificationsService.sendToUser(data.driverId, {
        title: 'Booking Cancelled',
        body: `Booking #${data.bookingId} has been cancelled by the passenger.`,
        type: 'BOOKING',
        data,
      });
    }

    // Invalidate caches
    await this.invalidateCachesForBooking(data.tripId);

    // Update pre-aggregated metrics
    await this.analyticsService.handleEventMetrics({ type: 'booking', delta: -1 });
  }

  private async handleBookingCompleted(data: any): Promise<void> {
    await this.notificationsService.sendToUser(data.userId, {
      title: 'Trip Completed',
      body: `Your trip has been completed. Please rate your experience.`,
      type: 'RATING',
      data: { bookingId: data.bookingId, tripId: data.tripId },
    });

    // Invalidate caches
    await this.invalidateCachesForBooking(data.tripId);
  }

  private async handlePaymentSuccess(data: any): Promise<void> {
    await this.notificationsService.sendToUser(data.userId, {
      title: 'Payment Successful',
      body: `Payment of ${data.amount} ${data.currency} for booking #${data.bookingId} was successful.`,
      type: 'PAYMENT',
      data,
    });

    // Invalidate caches
    await this.invalidateCachesForBooking(data.tripId);

    // Update pre-aggregated metrics
    await this.analyticsService.handleEventMetrics({ type: 'payment', amount: Number(data.amount) });
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    await this.notificationsService.sendToUser(data.userId, {
      title: 'Payment Failed',
      body: `Payment for booking #${data.bookingId} failed. Please try again or use a different payment method.`,
      type: 'PAYMENT',
      data,
    });
  }

  private async handleTripStarted(data: any): Promise<void> {
    await this.notificationsService.sendToUser(data.userId, {
      title: 'Trip Started',
      body: `Your trip #${data.tripId} has started. Track your journey in real-time.`,
      type: 'TRIP',
      data,
    });

    // Update pre-aggregated metrics
    await this.analyticsService.handleEventMetrics({ type: 'trip', delta: 1 });
  }

  private async handleTripCompleted(data: any): Promise<void> {
    // Analytics and Cache update
    await this.invalidateCachesForBooking(data.tripId);
  }

  private async handleUserRegistered(data: any): Promise<void> {
    await this.notificationsService.sendToUser(data.userId, {
      title: 'Welcome to Travel SaaS',
      body: 'Thank you for joining! Complete your profile to start booking trips.',
      type: 'SYSTEM',
      data,
    });

    if (data.userId) {
      await this.redisService.del(`user:profile:${data.userId}`);
    }

    // Update pre-aggregated metrics
    await this.analyticsService.handleEventMetrics({ type: 'user', delta: 1 });
  }

  private async handleUserProfileUpdated(data: any): Promise<void> {
    if (data.userId) {
      await this.redisService.del(`user:profile:${data.userId}`);
    }
  }

  private async handleSupportTicketCreated(data: any): Promise<void> {
    await this.notificationsService.sendBulkNotification(data.agentIds || [], {
      title: 'New Support Ticket',
      body: `Ticket #${data.ticketNumber} requires attention. Category: ${data.category}`,
      type: 'SUPPORT',
      data,
    });
  }

  private async handleSupportTicketEscalated(data: any): Promise<void> {
    await this.notificationsService.sendBulkNotification(data.adminIds || [], {
      title: 'Ticket Escalated',
      body: `Ticket #${data.ticketNumber} has been escalated to ${data.newPriority}. Reason: ${data.reason}`,
      type: 'SUPPORT',
      data,
    });
  }

  private async handleVehicleLocationUpdated(data: any): Promise<void> {
    await this.redisService.set(
      `vehicle:location:${data.vehicleId}`,
      JSON.stringify({
        lat: data.latitude,
        lng: data.longitude,
        timestamp: data.timestamp,
        speed: data.speed,
      }),
      300,
    );
  }

  private async handleDriverAssigned(data: any): Promise<void> {
    await this.notificationsService.sendToUser(data.driverId, {
      title: 'New Trip Assigned',
      body: `You have been assigned to trip #${data.tripId}. Departure: ${data.departureTime}`,
      type: 'TRIP',
      data,
    });
  }
}