import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { VehiclesModule } from '@vehicles/vehicles.module';
import { TripsModule } from '@trips/trips.module';
import { BookingsModule } from '@bookings/bookings.module';
import { PaymentsModule } from '@payments/payments.module';
import { TrackingModule } from '@tracking/tracking.module';
import { WebsocketModule } from '@websocket/websocket.module';
import { AdminModule } from '@admin/admin.module';
import { FleetModule } from '@fleet/fleet.module';
import { AnalyticsModule } from '@analytics/analytics.module';
import { SupportModule } from '@support/support.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { KafkaModule } from '@kafka/kafka.module';
import { RedisModule } from '@redis/redis.module';
import { SearchModule } from '@search/search.module';
import { DatabaseModule } from '@database/database.module';
import configuration from '@config/configuration';
import { UploadsModule } from './uploads/uploads.module';
import { OutboxModule } from './outbox/outbox.module';
import { SagaModule } from './saga/saga.module';
import { InventoryModule } from './inventory/inventory.module';
import { CoalesceModule } from './coalesce/coalesce.module';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module';
import { JobsModule } from './jobs/jobs.module';
import { ObservabilityModule } from './observability/observability.module';
import { RecoveryModule } from './recovery/recovery.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local', '.env.production'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        replication: {
          master: {
            host: configService.get<string>('database.host'),
            port: configService.get<number>('database.port'),
            username: configService.get<string>('database.username'),
            password: configService.get<string>('database.password'),
            database: configService.get<string>('database.name'),
          },
          slaves: [
            {
              host: configService.get<string>('database.replicaHost'),
              port: configService.get<number>('database.replicaPort'),
              username: configService.get<string>('database.replicaUsername'),
              password: configService.get<string>('database.replicaPassword'),
              database: configService.get<string>('database.name'),
            },
          ],
        },
        ssl: configService.get('database.ssl') ? { rejectUnauthorized: false } : false,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
        migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
        migrationsRun: true,
        extra: {
          max: 50,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
          query_timeout_ms: 10000,
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    TripsModule,
    BookingsModule,
    PaymentsModule,
    TrackingModule,
    WebsocketModule,
    AdminModule,
    FleetModule,
    AnalyticsModule,
    SupportModule,
    NotificationsModule,
    KafkaModule,
    RedisModule,
    SearchModule,
    UploadsModule,
    OutboxModule,
    SagaModule,
    InventoryModule,
    CoalesceModule,
    RateLimiterModule,
    JobsModule,
    ObservabilityModule,
    RecoveryModule,
  ],
})
export class AppModule {}