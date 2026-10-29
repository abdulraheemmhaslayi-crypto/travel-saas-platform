import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { Booking } from "../database/entities/booking.entity";
import { Trip } from "../database/entities/trip.entity";
import { User } from "../database/entities/user.entity";
import { Vehicle } from "../database/entities/vehicle.entity";
import { Payment } from "../database/entities/payment.entity";
import { WalletTransaction } from "../database/entities/wallet-transaction.entity";
import { SupportTicket } from "../database/entities/support-ticket.entity";
import { RedisModule } from "../redis/redis.module";
import { Driver } from "@/database/entities/driver.entity";
import { TripSeat } from "@/database/entities/trip-seat.entity";
import { MaterializedAnalytics } from "../database/entities/materialized-analytics.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Trip,
      User,
      Vehicle,
      Payment,
      Driver,
      WalletTransaction,
      SupportTicket,
      TripSeat,
      MaterializedAnalytics,
    ]),
    RedisModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
