import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Trip } from '../database/entities/trip.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { User } from '../database/entities/user.entity';
import { Booking } from '../database/entities/booking.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, Vehicle, User, Booking]),
    RedisModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}