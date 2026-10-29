import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { WalletService } from './wallet.service';
import { Payment } from '../database/entities/payment.entity';
import { Wallet } from '../database/entities/wallet.entity';
import { WalletTransaction } from '../database/entities/wallet-transaction.entity';
import { Booking } from '../database/entities/booking.entity';
import { User } from '../database/entities/user.entity';
import { Refund } from '../database/entities/refund.entity';
import { Payout } from '../database/entities/payout.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Wallet, WalletTransaction, Booking, User, Refund, Payout]),
    NotificationsModule,
  ],
  providers: [PaymentsService, StripeService, RazorpayService, WalletService],
  controllers: [PaymentsController],
  exports: [PaymentsService, StripeService, RazorpayService, WalletService, TypeOrmModule],
})
export class PaymentsModule {}