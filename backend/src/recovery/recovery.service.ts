import { Injectable, Logger } from '@nestjs/common';
import { OutboxService } from '../outbox/outbox.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RecoveryService {
  private readonly logger = new Logger(RecoveryService.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Replays failed Outbox items.
   */
  async replayFailedOutbox(): Promise<number> {
    this.logger.log('Starting manual replay of failed outbox events...');
    return await this.outboxService.replayFailedEvents();
  }

  /**
   * Disaster recovery tool to rebuild or invalidate specific caches.
   */
  async rebuildCache(pattern: string): Promise<string[]> {
    this.logger.log(`Performing cache sweep for pattern: ${pattern}`);
    const keys = await this.redisService.keys(pattern);
    for (const key of keys) {
      await this.redisService.del(key);
    }
    return keys;
  }
}
