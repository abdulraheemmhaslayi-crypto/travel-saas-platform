import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../database/entities/wallet.entity';
import { WalletTransaction, TransactionType, TransactionPurpose, TransactionStatus } from '../database/entities/wallet-transaction.entity';
import { User } from '../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletTopupDto, WalletWithdrawDto } from './dto/payment.dto';
import { Booking, BookingStatus, PaymentStatus as BookingPaymentStatus } from '../database/entities/booking.entity';
import { Payment, PaymentMethod, PaymentType, PaymentStatus } from '../database/entities/payment.entity';
import { Trip } from '../database/entities/trip.entity';
import { TripSeat, SeatStatus } from '../database/entities/trip-seat.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {}

  async getWallet(userId: string) {
    let wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['transactions'],
    });

    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    return wallet;
  }

  async createWallet(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = this.walletRepository.create({
      userId,
      balance: 0,
      totalCredited: 0,
      totalDebited: 0,
      isActive: true,
      currency: 'INR',
    });

    await this.walletRepository.save(wallet);
    return wallet;
  }



  async withdraw(userId: string, withdrawDto: WalletWithdrawDto) {
    const { amount, bankAccount, ifscCode } = withdrawDto;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.balance -= amount;
    wallet.totalDebited += amount;
    await this.walletRepository.save(wallet);

    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      transactionId: `WDR${Date.now()}`,
      type: TransactionType.DEBIT,
      purpose: TransactionPurpose.WITHDRAWAL,
      status: TransactionStatus.COMPLETED,
      amount,
      balanceAfter: wallet.balance,
      description: `Wallet withdrawal to bank account`,
      referenceType: 'wallet_withdrawal',
      metadata: { bankAccount, ifscCode },
    });

    await this.transactionRepository.save(transaction);

    await this.notificationsService.sendNotification({
      userId,
      type: 'PAYMENT_SUCCESS',
      channel: 'PUSH',
      title: 'Withdrawal Successful',
      message: `₹${amount} has been withdrawn from your wallet`,
      data: { amount, balance: wallet.balance },
    });

    return {
      message: 'Withdrawal successful',
      balance: wallet.balance,
      transaction,
    };
  }

  async getTransactions(userId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query;

    const wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deductFromWallet(userId: string, amount: number, description: string, referenceId?: string) {
    const lockKey = `lock:wallet:${userId}`;
    const lock = await this.redisService.acquireLockWithRetry(lockKey, 5, 5, 50);
    if (!lock) {
      throw new ConflictException('A wallet transaction is already in progress for this account. Please try again.');
    }

    try {
      const transaction = await this.walletRepository.manager.transaction(async (manager) => {
        const wallet = await manager.findOne(Wallet, {
          where: { userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!wallet || Number(wallet.balance) < amount) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        wallet.balance = Number(wallet.balance) - amount;
        wallet.totalDebited = Number(wallet.totalDebited) + amount;
        await manager.save(wallet);

        const txn = manager.create(WalletTransaction, {
          walletId: wallet.id,
          transactionId: `DEB${Date.now()}`,
          type: TransactionType.DEBIT,
          purpose: TransactionPurpose.BOOKING_PAYMENT,
          status: TransactionStatus.COMPLETED,
          amount,
          balanceAfter: wallet.balance,
          description,
          referenceId,
          referenceType: 'booking',
        });

        await manager.save(txn);
        return txn;
      });

      // Emit Kafka Event
      await this.kafkaService.publish('wallet.debited', {
        userId,
        amount,
        purpose: TransactionPurpose.BOOKING_PAYMENT,
        description,
        referenceId,
      });

      return transaction;
    } finally {
      await lock.release();
    }
  }

  async creditToWallet(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    purpose: TransactionPurpose = TransactionPurpose.REFUND,
    referenceType = 'refund',
  ) {
    const lockKey = `lock:wallet:${userId}`;
    const lock = await this.redisService.acquireLockWithRetry(lockKey, 5, 5, 50);
    if (!lock) {
      throw new ConflictException('A wallet transaction is already in progress for this account. Please try again.');
    }

    try {
      const transaction = await this.walletRepository.manager.transaction(async (manager) => {
        let wallet = await manager.findOne(Wallet, {
          where: { userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!wallet) {
          // Create wallet if it doesn't exist
          const user = await manager.findOne(User, { where: { id: userId } });
          if (!user) {
            throw new NotFoundException('User not found');
          }
          wallet = manager.create(Wallet, {
            userId,
            balance: 0,
            totalCredited: 0,
            totalDebited: 0,
            isActive: true,
            currency: 'INR',
          });
          await manager.save(wallet);
        }

        wallet.balance = Number(wallet.balance) + amount;
        wallet.totalCredited = Number(wallet.totalCredited) + amount;
        await manager.save(wallet);

        const txn = manager.create(WalletTransaction, {
          walletId: wallet.id,
          transactionId: `CRD${Date.now()}`,
          type: TransactionType.CREDIT,
          purpose,
          status: TransactionStatus.COMPLETED,
          amount,
          balanceAfter: wallet.balance,
          description,
          referenceId,
          referenceType,
        });

        await manager.save(txn);
        return txn;
      });

      // Emit Kafka Event
      await this.kafkaService.publish('wallet.credited', {
        userId,
        amount,
        purpose,
        description,
        referenceId,
      });

      return transaction;
    } finally {
      await lock.release();
    }
  }

  async payBooking(userId: string, bookingId: string) {
    const booking = await this.walletRepository.manager.findOne(Booking, {
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.passengerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (booking.paymentStatus === BookingPaymentStatus.PAID) {
      throw new BadRequestException('Booking is already paid');
    }

    const amount = Number(booking.finalAmount);

    // Deduct balance securely
    await this.deductFromWallet(
      userId,
      amount,
      `Payment for booking ${booking.bookingNumber}`,
      booking.id,
    );

    booking.paymentStatus = BookingPaymentStatus.PAID;
    booking.status = BookingStatus.CONFIRMED;
    await this.walletRepository.manager.save(Booking, booking);

    // Update seats to booked
    await this.walletRepository.manager.update(TripSeat, { bookingId: booking.id }, {
      status: SeatStatus.BOOKED,
      reservedUntil: null,
    });

    // Recalculate seat count
    await this.recalculateTripSeats(booking.tripId);

    // Create payment record
    const payment = this.walletRepository.manager.create(Payment, {
      transactionId: `PAY${Date.now()}`,
      userId,
      bookingId: booking.id,
      paymentType: PaymentType.BOOKING,
      method: PaymentMethod.WALLET,
      status: PaymentStatus.COMPLETED,
      amount,
      currency: 'INR',
    });

    await this.walletRepository.manager.save(Payment, payment);

    return {
      success: true,
      message: 'Booking paid successfully using wallet',
      booking,
      payment,
    };
  }

  async recalculateTripSeats(tripId: string) {
    const manager = this.walletRepository.manager;
    const totalSeats = await manager.count(TripSeat, { where: { tripId } });
    const bookedSeats = await manager.count(TripSeat, { where: { tripId, status: SeatStatus.BOOKED } });
    const availableSeats = await manager.count(TripSeat, { where: { tripId, status: SeatStatus.AVAILABLE } });

    await manager.update(Trip, { id: tripId }, {
      totalSeats,
      bookedSeats,
      availableSeats,
    });
  }
}