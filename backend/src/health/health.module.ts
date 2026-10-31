import { Module } from '@nestjs/common';
import { HealthController, ApiHealthController } from './health.controller';
import { KeepAliveService } from './keep-alive.service';

@Module({
  controllers: [HealthController, ApiHealthController],
  providers: [KeepAliveService],
  exports: [KeepAliveService],
})
export class HealthModule {}

