import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';

/**
   Custom decorator metadata helper for setting rate limits per handler.
 */
export const RateLimit = (limit: number, windowSeconds = 60) =>
  SetMetadata('rateLimitConfig', { limit, windowSeconds });

@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'] || '127.0.0.1';
    
    // Attempt to identify user, fallback to anonymous
    const userId = request.user?.sub || request.user?.id || 'anonymous';
    const path = request.route?.path || request.path;

    // Get config metadata if annotated, otherwise use defaults
    const config = this.reflector.get<{ limit: number; windowSeconds: number }>(
      'rateLimitConfig',
      context.getHandler(),
    ) || { limit: 100, windowSeconds: 60 }; // Default: 100 reqs/min

    const { limit, windowSeconds } = config;
    const client = this.redisService.getClient();
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    const keys = [
      `rate:ip:${ip}:${path}`,
      `rate:user:${userId}:${path}`,
    ];

    for (const key of keys) {
      if (key.startsWith('rate:user:anonymous:')) {
        continue; // Skip user rate limit if not authenticated (IP limit is active)
      }

      const score = now;
      const member = `${now}-${Math.random().toString(36).substring(2, 7)}`;

      // Sliding window logic:
      // 1. Push timestamp member
      await client.zadd(key, score, member);
      // 2. Remove members older than current window start
      await client.zremrangebyscore(key, 0, windowStart);
      // 3. Count members remaining in ZSET
      const count = await client.zcard(key);
      // 4. Set expiry TTL on ZSET
      await client.expire(key, windowSeconds);

      if (count > limit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Rate limit exceeded on '${path}'. Maximum allowed is ${limit} requests per ${windowSeconds}s.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }
}
