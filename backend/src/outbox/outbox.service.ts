import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Outbox, OutboxStatus } from '../database/entities/outbox.entity';
import { KafkaService } from '../kafka/kafka.service';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Stashes an event payload transactionally into the outbox table.
   * Must be passed the active transaction EntityManager to ensure atomic guarantees.
   */
  async saveEvent(
    entityManager: EntityManager,
    topic: string,
    payload: any,
    key?: string,
    version = 'v1',
  ): Promise<Outbox> {
    // Event versioning schema wrap
    const versionedPayload = {
      ...payload,
      _metadata: {
        ...payload._metadata,
        version,
        timestamp: new Date().toISOString(),
      },
    };

    const outbox = entityManager.create(Outbox, {
      topic,
      payload: JSON.stringify(versionedPayload),
      key: key || `${topic}-${Date.now()}`,
      status: OutboxStatus.PENDING,
    });

    return await entityManager.save(outbox);
  }

  /**
   * Outbox background processor running every 1 second.
   * Utilizes SELECT ... FOR UPDATE SKIP LOCKED to scale across multiple instances safely.
   */
  @Interval(1000)
  async processOutbox(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      await this.outboxRepository.manager.transaction(async (manager) => {
        const pendingEvents = await manager.createQueryBuilder(Outbox, 'outbox')
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .where('outbox.status = :status', { status: OutboxStatus.PENDING })
          .orderBy('outbox.createdAt', 'ASC')
          .take(50)
          .getMany();

        if (pendingEvents.length === 0) return;

        for (const event of pendingEvents) {
          try {
            await this.kafkaService.publish(
              event.topic,
              JSON.parse(event.payload),
              event.key,
            );
            event.status = OutboxStatus.COMPLETED;
          } catch (publishError) {
            event.retryCount += 1;
            event.lastError = publishError.stack || publishError.message;
            if (event.retryCount >= 5) {
              event.status = OutboxStatus.FAILED;
            }
            this.logger.error(`Outbox event publish failed (ID: ${event.id}, Topic: ${event.topic})`, publishError);
          }
          await manager.save(event);
        }
      });
    } catch (error) {
      this.logger.error('Error in outbox processor execution loop', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Periodic outbox table archival/cleanup worker (runs daily).
   */
  @Interval(86400000)
  async cleanupOutbox(): Promise<void> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 7); // Clean up events older than 7 days

    try {
      const result = await this.outboxRepository.createQueryBuilder()
        .delete()
        .where('status = :status AND createdAt < :date', {
          status: OutboxStatus.COMPLETED,
          date: thresholdDate,
        })
        .execute();

      this.logger.log(`Purged ${result.affected || 0} completed outbox events older than 7 days.`);
    } catch (error) {
      this.logger.error('Failed to cleanup completed outbox events', error);
    }
  }

  /**
   * Disaster recovery helper to replay failed outbox events.
   */
  async replayFailedEvents(): Promise<number> {
    const failedEvents = await this.outboxRepository.find({
      where: { status: OutboxStatus.FAILED },
    });

    if (failedEvents.length === 0) return 0;

    let successCount = 0;
    for (const event of failedEvents) {
      try {
        await this.kafkaService.publish(
          event.topic,
          JSON.parse(event.payload),
          event.key,
        );
        event.status = OutboxStatus.COMPLETED;
        event.retryCount = 0;
        event.lastError = null;
        successCount++;
      } catch (err) {
        event.lastError = `Replay fail: ${err.message}`;
      }
      await this.outboxRepository.save(event);
    }

    return successCount;
  }
}
