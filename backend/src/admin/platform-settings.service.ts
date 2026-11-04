import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting, CommissionConfig } from '../database/entities/platform-setting.entity';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';

const REDIS_COMMISSION_KEY = 'platform:commission_config';

export const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  commissionType: 'PERCENTAGE',
  commissionValue: 10,
  deductionTiming: 'INSTANT',
  minWalletBalance: 500,
  autoPauseTrips: true,
  gracePeriodHours: 24,
  freeCancellationHours: 4,
  lateCancellationRefundPercent: 50,
};

@Injectable()
export class PlatformSettingsService {
  private readonly logger = new Logger(PlatformSettingsService.name);

  constructor(
    @InjectRepository(PlatformSetting)
    private readonly settingsRepo: Repository<PlatformSetting>,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {}

  async getCommissionConfig(): Promise<CommissionConfig> {
    try {
      // 1. Try Redis cache
      const cached = await this.redisService.get(REDIS_COMMISSION_KEY);
      if (cached) {
        return JSON.parse(cached) as CommissionConfig;
      }
    } catch (e) {
      this.logger.warn('Failed to get commission settings from Redis cache', e);
    }

    // 2. Query Database
    let record = await this.settingsRepo.findOne({
      where: { key: 'commission_config' },
    });

    if (!record) {
      record = this.settingsRepo.create({
        key: 'commission_config',
        value: DEFAULT_COMMISSION_CONFIG,
        description: 'Dynamic Platform Commission & Cancellation Settings managed by Super Admin',
      });
      await this.settingsRepo.save(record);
    }

    const config = (record.value as CommissionConfig) || DEFAULT_COMMISSION_CONFIG;

    try {
      // 3. Cache in Redis for 1 hour (3600 seconds)
      await this.redisService.set(REDIS_COMMISSION_KEY, JSON.stringify(config), 3600);
    } catch (e) {
      this.logger.warn('Failed to cache commission settings to Redis', e);
    }

    return config;
  }

  async updateCommissionConfig(
    newConfig: Partial<CommissionConfig>,
    updatedBy?: string,
  ): Promise<CommissionConfig> {
    const current = await this.getCommissionConfig();
    const merged: CommissionConfig = {
      ...current,
      ...newConfig,
    };

    let record = await this.settingsRepo.findOne({
      where: { key: 'commission_config' },
    });

    if (!record) {
      record = this.settingsRepo.create({
        key: 'commission_config',
        value: merged,
        description: 'Dynamic Platform Commission & Cancellation Settings managed by Super Admin',
        updatedBy,
      });
    } else {
      record.value = merged;
      record.updatedBy = updatedBy;
    }

    await this.settingsRepo.save(record);

    // Invalidate & refresh Redis cache
    try {
      await this.redisService.set(REDIS_COMMISSION_KEY, JSON.stringify(merged), 3600);
    } catch (e) {
      this.logger.warn('Failed to update commission cache in Redis', e);
    }

    // Publish Kafka Event
    try {
      await this.kafkaService.publish('platform.settings_updated', {
        key: 'commission_config',
        value: merged,
        updatedBy,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      this.logger.warn('Failed to publish platform.settings_updated event to Kafka', e);
    }

    return merged;
  }

  calculateCommission(
    config: CommissionConfig,
    totalSeatPrice: number,
    numberOfSeats: number,
  ): number {
    switch (config.commissionType) {
      case 'FIXED_PER_SEAT':
        return Math.round(Number(config.commissionValue) * numberOfSeats);
      case 'FIXED_PER_TRIP':
        return Math.round(Number(config.commissionValue));
      case 'PERCENTAGE':
      default:
        return Math.round((Number(totalSeatPrice) * Number(config.commissionValue)) / 100);
    }
  }
}

