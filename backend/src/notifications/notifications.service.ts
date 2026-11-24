import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Observable, Subject } from 'rxjs';
import { Notification } from '../database/entities/notification.entity';
import { PushSubscription } from '../database/entities/push-subscription.entity';
import * as webpush from 'web-push';
import { User } from '../database/entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';
import { JobsService } from '../jobs/jobs.service';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationQueryDto,
  MarkReadDto,
  NotificationPreferencesDto,
  UnreadCountDto,
  SubscribePushDto,
} from './notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly userSubscriptions = new Map<string, Subject<MessageEvent>>();
  private readonly vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BID0ExjDkQXy3onl3AKZtuX5j687y-gzIZ7_Qq6xi8spRVUaXjIjqEBgYbQUjqT-7Q14O7xmmjd4uvOTpM7Agls';
  private readonly vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'VD8-q7PrK_mc7NJODDpujk62xNsRGTjF0hOd80RLGfk';
  private readonly vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@kokantravel.com';

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PushSubscription)
    private readonly pushSubRepository: Repository<PushSubscription>,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
    @Inject(forwardRef(() => JobsService))
    private readonly jobsService: JobsService,
  ) {
    try {
      webpush.setVapidDetails(this.vapidSubject, this.vapidPublicKey, this.vapidPrivateKey);
    } catch (e) {
      this.logger.warn('Failed to configure webpush VAPID details: ' + (e as Error).message);
    }
  }

  async createNotification(
    dto: CreateNotificationDto,
    isBackground = false,
  ): Promise<NotificationResponseDto> {
    if (!isBackground) {
      await this.jobsService.dispatchNotification(
        dto.userId,
        dto.type,
        dto.title,
        dto.body ?? dto.message ?? '',
        dto.data,
      );
      
      return {
        id: 'queued',
        title: dto.title,
        body: dto.body ?? dto.message ?? '',
        type: dto.type,
        data: dto.data,
        isRead: false,
        createdAt: new Date(),
      };
    }

    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const notification = this.notificationRepository.create({
      user,
      title: dto.title,
      body: dto.body ?? dto.message,
      type: dto.type,
      channel: dto.channel,
      data: dto.data,
      isRead: false,
      createdAt: new Date(),
    });

    const saved = await this.notificationRepository.save(notification);

    // Send via WebSocket if user is online
    await this.sendToUser(dto.userId, {
      title: dto.title,
      body: dto.body ?? dto.message,
      type: dto.type,
      data: dto.data,
    });

    // Publish to Kafka for cross-service communication
    await this.kafkaService.publish('notification.created', {
      notificationId: saved.id,
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
    });

    // Update unread count in Redis
    await this.incrementUnreadCount(dto.userId);

    return this.mapToResponseDto(saved);
  }

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; type: string; data?: Record<string, any> },
  ): Promise<void> {
    // Check if user has SSE subscription
    const subscription = this.userSubscriptions.get(userId);
    if (subscription) {
      subscription.next({
        data: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
        }),
      } as MessageEvent);
    }

    // Push to Redis pub/sub for multi-instance support
    await this.redisService.publish(`notifications:${userId}`, JSON.stringify(payload));

    // Check user preferences before sending push/email
    const prefs = await this.getPreferences(userId);
    if (prefs.pushEnabled && payload.type !== 'SYSTEM') {
      // Trigger push notification via FCM/APNs
      await this.sendPushNotification(userId, payload);
    }
  }

  async sendBulkNotification(
    userIds: string[],
    payload: { title: string; body: string; type: string; data?: Record<string, any> },
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        user: { id: userId } as User,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data,
        isRead: false,
        createdAt: new Date(),
      }),
    );

    const saved = await this.notificationRepository.save(notifications);

    for (const notification of saved) {
      try {
        await this.sendToUser(notification.user.id, payload);
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send notification to ${notification.user.id}`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  async sendNotification(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.createNotification(dto);
  }

  async sendEmail(payload: { to: string; subject: string; template: string; data: Record<string, any> }): Promise<void> {
    this.logger.log(`Email to ${payload.to}: ${payload.subject}`);
    // TODO: implement actual email delivery using configured email provider
  }

  async sendSms(phone: string, message: string): Promise<void> {
    this.logger.log(`SMS to ${phone}: ${message}`);
    // TODO: implement actual SMS delivery using configured Twilio provider
  }

  async getNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{ data: NotificationResponseDto[]; total: number; unreadCount: number }> {
    const { page = 1, limit = 20, unreadOnly = false, type } = query;
    const skip = (page - 1) * limit;

    const qb = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (unreadOnly) {
      qb.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    if (type) {
      qb.andWhere('notification.type = :type', { type });
    }

    const [notifications, total] = await qb.getManyAndCount();
    const unreadCount = await this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });

    return {
      data: notifications.map((n) => this.mapToResponseDto(n)),
      total,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    const count = await this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });

    const cachedCount = await this.redisService.get(`unread:${userId}`);
    
    return {
      count,
      lastUpdated: new Date(),
      cachedCount: cachedCount ? parseInt(cachedCount) : null,
    };
  }

  async markAsRead(userId: string, dto: MarkReadDto): Promise<{ updated: number }> {
    let result;

    if (dto.notificationIds && dto.notificationIds.length > 0) {
      result = await this.notificationRepository.update(
        { id: In(dto.notificationIds), user: { id: userId } },
        { isRead: true, readAt: new Date() },
      );
    } else if (dto.all) {
      result = await this.notificationRepository.update(
        { user: { id: userId }, isRead: false },
        { isRead: true, readAt: new Date() },
      );
    }

    // Recalculate and cache unread count
    const unreadCount = await this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
    await this.redisService.set(`unread:${userId}`, unreadCount.toString(), 3600);

    return { updated: result?.affected || 0 };
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    return this.markAsRead(userId, { all: true });
  }

  async deleteNotification(id: string, userId: string): Promise<{ message: string }> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    await this.notificationRepository.delete(id);
    return { message: 'Notification deleted successfully' };
  }

  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const cached = await this.redisService.get(`prefs:${userId}`);
    if (cached) return JSON.parse(cached);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const prefs: NotificationPreferencesDto = {
      emailEnabled: user.emailNotifications !== false,
      pushEnabled: user.pushNotifications !== false,
      smsEnabled: user.smsNotifications || false,
      bookingAlerts: true,
      paymentAlerts: true,
      tripUpdates: true,
      promotionalEmails: user.promotionalEmails || false,
      supportReplies: true,
      quietHoursStart: user.quietHoursStart || null,
      quietHoursEnd: user.quietHoursEnd || null,
    };

    await this.redisService.set(`prefs:${userId}`, JSON.stringify(prefs), 3600);
    return prefs;
  }

  async updatePreferences(
    userId: string,
    dto: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Update user entity with preferences
    await this.userRepository.update(userId, {
      emailNotifications: dto.emailEnabled,
      pushNotifications: dto.pushEnabled,
      smsNotifications: dto.smsEnabled,
      promotionalEmails: dto.promotionalEmails,
      quietHoursStart: dto.quietHoursStart,
      quietHoursEnd: dto.quietHoursEnd,
    });

    // Invalidate cache
    await this.redisService.del(`prefs:${userId}`);

    return dto;
  }

  subscribeToUserEvents(userId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    this.userSubscriptions.set(userId, subject);

    // Also subscribe to Redis pub/sub for multi-instance support
    this.redisService.subscribe(`notifications:${userId}`, (message) => {
      subject.next({
        data: message,
      } as MessageEvent);
    });

    // Cleanup on unsubscribe
    return new Observable((observer) => {
      subject.subscribe(observer);
      return () => {
        this.userSubscriptions.delete(userId);
        this.redisService.unsubscribe(`notifications:${userId}`);
      };
    });
  }

  private async incrementUnreadCount(userId: string): Promise<void> {
    const key = `unread:${userId}`;
    const current = await this.redisService.get(key);
    const count = current ? parseInt(current) + 1 : 1;
    await this.redisService.set(key, count.toString(), 3600);
  }

  private async sendPushNotification(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, any> },
  ): Promise<void> {
    // Integration with Firebase Cloud Messaging or APNs
    this.logger.log(`Push notification to ${userId}: ${payload.title}`);
    // Implementation depends on FCM/APNs SDK
  }

  private mapToResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }


    

 



  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  async savePushSubscription(dto: SubscribePushDto, userId?: string): Promise<{ success: boolean; id: string }> {
    try {
      let sub = await this.pushSubRepository.findOne({ where: { endpoint: dto.endpoint } });
      if (!sub) {
        sub = this.pushSubRepository.create({
          endpoint: dto.endpoint,
          p256dh: dto.keys.p256dh,
          auth: dto.keys.auth,
          userId: userId || null,
          userAgent: dto.userAgent || null,
          isActive: true,
        });
      } else {
        sub.p256dh = dto.keys.p256dh;
        sub.auth = dto.keys.auth;
        if (userId) sub.userId = userId;
        if (dto.userAgent) sub.userAgent = dto.userAgent;
        sub.isActive = true;
      }
      const saved = await this.pushSubRepository.save(sub);
      this.logger.log(`Saved push subscription for endpoint: ${dto.endpoint.slice(0, 35)}...`);
      return { success: true, id: saved.id };
    } catch (err) {
      this.logger.error('Failed to save push subscription: ' + (err as Error).message);
      throw err;
    }
  }

  async broadcastNewTripNotification(trip: any): Promise<{ sent: number; failed: number }> {
    try {
      const activeSubs = await this.pushSubRepository.find({ where: { isActive: true } });
      if (!activeSubs || activeSubs.length === 0) {
        this.logger.log('No active push subscriptions found for new trip broadcast.');
        return { sent: 0, failed: 0 };
      }

      const origin = trip?.origin || trip?.fromCity || (trip?.routes && trip.routes[0]?.pickupLocation) || 'Kokan';
      const destination = trip?.destination || trip?.toCity || (trip?.routes && trip.routes[trip.routes.length - 1]?.dropoffLocation) || 'Maharashtra';
      const dateStr = trip?.departureTime
        ? new Date(trip.departureTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Scheduled';
      const price = trip?.pricePerSeat || trip?.basePrice || 399;

      const payload = JSON.stringify({
        title: `🚗 New Trip: ${origin} ➔ ${destination}`,
        body: `Departure: ${dateStr} • Seats starting at ₹${price}. Tap to view & book now!`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        image: '/images/banner-car.png',
        url: `/dashboard/bookings/${trip?.id || ''}`,
        tripId: trip?.id,
        tag: `new-trip-${trip?.id || Date.now()}`,
      });

      let sent = 0;
      let failed = 0;

      await Promise.allSettled(
        activeSubs.map(async (sub) => {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };
          try {
            await webpush.sendNotification(pushConfig, payload);
            sent++;
          } catch (err: any) {
            failed++;
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              // Expired or unsubscribed subscription, mark inactive
              sub.isActive = false;
              await this.pushSubRepository.save(sub);
            }
          }
        })
      );

      this.logger.log(`Broadcasted new trip push notification: ${sent} sent, ${failed} failed out of ${activeSubs.length} total subscribers.`);
      return { sent, failed };
    } catch (err) {
      this.logger.error('Error during new trip push broadcast: ' + (err as Error).message);
      return { sent: 0, failed: 0 };
    }
  }

}
