import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis, { Pipeline } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private subscribers = new Map<string, (message: string) => void>();

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('REDIS_PUBSUB') private readonly pubsub: Redis,
  ) {
    this.redis.on('error', (error: Error) => {
      this.logger.error('Redis client error', error.stack || error.message);
    });

    this.pubsub.on('error', (error: Error) => {
      this.logger.error('Redis pubsub error', error.stack || error.message);
    });

    this.pubsub.on('message', (channel: string, message: string) => {
      const handler = this.subscribers.get(channel);
      if (handler) {
        handler(message);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
    this.pubsub.disconnect();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}`, error);
    }
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    return this.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}`, error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Redis KEYS error for pattern ${pattern}`, error);
      return [];
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}`, error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redis.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Redis EXPIRE error for key ${key}`, error);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Redis TTL error for key ${key}`, error);
      return -1;
    }
  }

  async increment(key: string, amount = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      this.logger.error(`Redis INCR error for key ${key}`, error);
      return 0;
    }
  }

  async decrement(key: string, amount = 1): Promise<number> {
    try {
      return await this.redis.decrby(key, amount);
    } catch (error) {
      this.logger.error(`Redis DECR error for key ${key}`, error);
      return 0;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.redis.hset(key, field, value);
    } catch (error) {
      this.logger.error(`Redis HSET error for key ${key}`, error);
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      this.logger.error(`Redis HGET error for key ${key}`, error);
      return null;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      this.logger.error(`Redis HGETALL error for key ${key}`, error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.redis.hdel(key, field);
    } catch (error) {
      this.logger.error(`Redis HDEL error for key ${key}`, error);
    }
  }

  async lpush(key: string, value: string): Promise<void> {
    try {
      await this.redis.lpush(key, value);
    } catch (error) {
      this.logger.error(`Redis LPUSH error for key ${key}`, error);
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.redis.rpop(key);
    } catch (error) {
      this.logger.error(`Redis RPOP error for key ${key}`, error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Redis LRANGE error for key ${key}`, error);
      return [];
    }
  }

  async sadd(key: string, member: string): Promise<void> {
    try {
      await this.redis.sadd(key, member);
    } catch (error) {
      this.logger.error(`Redis SADD error for key ${key}`, error);
    }
  }

  async srem(key: string, member: string): Promise<void> {
    try {
      await this.redis.srem(key, member);
    } catch (error) {
      this.logger.error(`Redis SREM error for key ${key}`, error);
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(`Redis SMEMBERS error for key ${key}`, error);
      return [];
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.redis.publish(channel, message);
    } catch (error) {
      this.logger.error(`Redis PUBLISH error for channel ${channel}`, error);
    }
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    try {
      this.subscribers.set(channel, handler);
      await this.pubsub.subscribe(channel);
      this.logger.log(`Subscribed to Redis channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Redis SUBSCRIBE error for channel ${channel}`, error);
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      this.subscribers.delete(channel);
      await this.pubsub.unsubscribe(channel);
      this.logger.log(`Unsubscribed from Redis channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Redis UNSUBSCRIBE error for channel ${channel}`, error);
    }
  }

  async acquireLock(lockKey: string, ttlSeconds = 30): Promise<{ release: () => Promise<void> } | null> {
    const token = `${Date.now()}-${Math.random()}`;
    const acquired = await this.redis.set(lockKey, token, 'EX', ttlSeconds, 'NX');

    if (!acquired) {
      return null;
    }

    return {
      release: async () => {
        const current = await this.redis.get(lockKey);
        if (current === token) {
          await this.redis.del(lockKey);
        }
      },
    };
  }

  async acquireLockWithRetry(
    lockKey: string,
    ttlSeconds = 30,
    maxRetries = 5,
    initialDelayMs = 50,
  ): Promise<{ release: () => Promise<void> } | null> {
    let delay = initialDelayMs;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const lock = await this.acquireLock(lockKey, ttlSeconds);
      if (lock) {
        return lock;
      }
      const jitter = Math.random() * 20;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      delay *= 1.5;
    }
    return null;
  }

  async geoAdd(key: string, longitude: number, latitude: number, member: string): Promise<void> {
    try {
      await this.redis.geoadd(key, longitude, latitude, member);
    } catch (error) {
      this.logger.error(`Redis GEOADD error for key ${key}`, error);
    }
  }

  async geoRadius(key: string, longitude: number, latitude: number, radiusKm: number): Promise<any[]> {
    try {
      const results = await this.redis.georadius(key, longitude, latitude, radiusKm, 'km', 'WITHDIST', 'WITHCOORD', 'ASC');
      if (!results || !Array.isArray(results)) return [];
      return results.map(([member, distance, [lng, lat]]) => ({
        member,
        distance: parseFloat(distance),
        longitude: parseFloat(lng),
        latitude: parseFloat(lat),
      }));
    } catch (error) {
      this.logger.error(`Redis GEORADIUS error for key ${key}`, error);
      return [];
    }
  }

  async geoRemove(key: string, member: string): Promise<void> {
    try {
      await this.redis.zrem(key, member);
    } catch (error) {
      this.logger.error(`Redis ZREM error for key ${key}`, error);
    }
  }

  async pipeline(operations: (pipeline: any) => void): Promise<any[]> {
    try {
      const pipeline: any = this.redis.pipeline();
      operations(pipeline);
      return await pipeline.exec();
    } catch (error) {
      this.logger.error('Redis pipeline error', error);
      return [];
    }
  }

  async flushdb(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error('Redis FLUSHDB error', error);
    }
  }

  getClient(): Redis {
    return this.redis;
  }
}