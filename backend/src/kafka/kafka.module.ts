import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { KafkaConsumer } from './kafka.consumer';
import { NotificationsModule } from '../notifications/notifications.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Global()
@Module({
  imports: [ConfigModule, forwardRef(() => NotificationsModule), AnalyticsModule],
  providers: [
    {
      provide: 'KAFKA_CLIENT',
      useFactory: (configService: ConfigService) => {
        const { Kafka } = require('kafkajs');
        return new Kafka({
          clientId: configService.get('KAFKA_CLIENT_ID', 'travel-saas'),
          brokers: (configService.get('KAFKA_BROKERS') || configService.get('KAFKA_BROKER') || 'localhost:9092').split(','),
          ssl: configService.get('KAFKA_SSL') === 'true',
          sasl: configService.get('KAFKA_SASL_USERNAME')
            ? {
                mechanism: 'plain',
                username: configService.get('KAFKA_SASL_USERNAME'),
                password: configService.get('KAFKA_SASL_PASSWORD'),
              }
            : undefined,
          retry: {
            initialRetryTime: 100,
            retries: 8,
          },
        });
      },
      inject: [ConfigService],
    },
    KafkaService,
    KafkaConsumer,
  ],
  exports: [KafkaService],
})
export class KafkaModule {}