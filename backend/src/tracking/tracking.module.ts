import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { LiveLocation } from '../database/entities/live-location.entity';
import { Trip } from '../database/entities/trip.entity';
import { Driver } from '../database/entities/driver.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { Booking } from '../database/entities/booking.entity';
import { RedisModule } from '../redis/redis.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveLocation, Trip, Driver, Vehicle, Booking]),
    RedisModule,
    WebsocketModule,
    NotificationsModule,
  ],
  providers: [TrackingService],
  controllers: [TrackingController],
  exports: [TrackingService],
})
export class TrackingModule {}