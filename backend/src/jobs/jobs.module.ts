import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { NotificationProcessor, ReportProcessor } from './jobs.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
    BullModule.registerQueue({
      name: 'report-queue',
    }),
    NotificationsModule,
  ],
  providers: [
    JobsService,
    NotificationProcessor,
    ReportProcessor,
  ],
  exports: [
    JobsService,
    BullModule,
  ],
})
export class JobsModule {}
