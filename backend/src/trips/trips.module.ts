import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { DriverController } from './driver.controller';
import { Trip } from '../database/entities/trip.entity';
import { TripRoute } from '../database/entities/trip-route.entity';
import { TripStop } from '../database/entities/trip-stop.entity';
import { TripSeat } from '../database/entities/trip-seat.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { Driver } from '../database/entities/driver.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripRoute, TripStop, TripSeat, Vehicle, Driver]),
    NotificationsModule,
    WebsocketModule,
  ],
  providers: [TripsService],
  controllers: [TripsController, DriverController],
  exports: [TripsService],
})
export class TripsModule {}