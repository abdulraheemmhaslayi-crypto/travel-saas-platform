import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimiterGuard } from './rate-limiter.guard';

@Global()
@Module({
  providers: [
    RateLimiterGuard,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
  exports: [RateLimiterGuard],
})
export class RateLimiterModule {}
