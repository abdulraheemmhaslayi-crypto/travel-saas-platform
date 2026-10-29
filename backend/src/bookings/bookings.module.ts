import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from '../database/entities/booking.entity';
import { Trip } from '../database/entities/trip.entity';
import { TripSeat } from '../database/entities/trip-seat.entity';
import { User } from '../database/entities/user.entity';
import { Wallet } from '../database/entities/wallet.entity';
import { WalletTransaction } from '../database/entities/wallet-transaction.entity';
import { Payment } from '../database/entities/payment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Trip, TripSeat, User, Wallet, WalletTransaction, Payment]),
    NotificationsModule,
    WebsocketModule,
    PaymentsModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}