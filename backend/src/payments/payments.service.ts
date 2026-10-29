import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { RedisService } from '../redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentType } from '../database/entities/payment.entity';
import { RoleName } from '../database/entities/role.entity';
import { Booking, BookingStatus, PaymentStatus as BookingPaymentStatus } from '../database/entities/booking.entity';
import { Trip } from '../database/entities/trip.entity';
import { TripSeat, SeatStatus } from '../database/entities/trip-seat.entity';
import { User } from '../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto, PaymentQueryDto } from './dto/payment.dto';
import { WalletService } from './wallet.service';
import { TransactionPurpose } from '../database/entities/wallet-transaction.entity';
import { Refund, RefundStatus } from '../database/entities/refund.entity';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';

import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => RazorpayService))
    private readonly razorpayService: RazorpayService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
    private readonly outboxService: OutboxService,
  ) {}

  async create(
    userId: string,
    createPaymentDto: CreatePaymentDto,
    paymentType: PaymentType = PaymentType.BOOKING,
  ) {
    const { bookingId, amount, method, currency = 'INR' } = createPaymentDto;

    let booking: Booking | null = null;
    if (bookingId) {
      booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.passengerId !== userId) {
        throw new ForbiddenException('You can only make payments for your own booking');
      }
    }

    const transactionId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const payment = this.paymentRepository.create({
      transactionId,
      userId,
      bookingId,
      paymentType,
      method,
      status: PaymentStatus.PENDING,
      amount,
      currency,
    });

    await this.paymentRepository.save(payment);

    return payment;
  }

  async findById(id: string, currentUserId?: string, currentUserRole?: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const isAdmin = [RoleName.ADMIN, RoleName.SUPER_ADMIN].includes(currentUserRole as RoleName);
    if (currentUserId && payment.userId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return payment;
  }

  async findByUser(userId: string, query: PaymentQueryDto) {
    const { page = 1, limit = 10, status } = query;

    const where: any = { userId };
    if (status) where.status = status;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ['booking'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    gatewayResponse?: any,
  ) {
    const lockKey = `lock:payment:confirm:${paymentId}`;
    const lock = await this.redisService.acquireLockWithRetry(lockKey, 15, 5, 50);
    if (!lock) {
      throw new ConflictException('Payment status is already being processed.');
    }

    try {
      return await this.paymentRepository.manager.transaction(async (manager) => {
        const payment = await manager.findOne(Payment, {
          where: { id: paymentId },
          relations: ['booking'],
        });

        if (!payment) {
          throw new NotFoundException('Payment not found');
        }

        if (payment.status === PaymentStatus.COMPLETED) {
          return payment;
        }

        payment.status = status;
        payment.paymentGatewayResponse = JSON.stringify(gatewayResponse);

        if (status === PaymentStatus.COMPLETED) {
          if (payment.booking) {
            payment.booking.paymentStatus = BookingPaymentStatus.PAID;
            payment.booking.status = BookingStatus.CONFIRMED;
            await manager.save(payment.booking);

            // Update seats to booked
            await manager.update(TripSeat, { bookingId: payment.booking.id }, {
              status: SeatStatus.BOOKED,
              reservedUntil: null,
            });

            // Recalculate seat count
            await this.recalculateTripSeats(payment.booking.tripId);
          }

          if (payment.paymentType === PaymentType.WALLET_TOPUP) {
            await this.walletService.creditToWallet(
              payment.userId,
              payment.amount,
              `Wallet topup via ${payment.method}`,
              payment.id,
              TransactionPurpose.TOPUP,
              'wallet_topup',
            );
          }

          await this.notificationsService.createNotification({
            userId: payment.userId,
            type: 'PAYMENT_SUCCESS',
            channel: 'PUSH',
            title: 'Payment Successful',
            message: `Your payment of ₹${payment.amount} was successful`,
            data: { paymentId: payment.id, amount: payment.amount },
          });

          // Publish Outbox Event
          await this.outboxService.saveEvent(manager, 'payment.success', {
            paymentId: payment.id,
            bookingId: payment.bookingId,
            userId: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
          });

        } else if (status === PaymentStatus.FAILED) {
          payment.failureReason = gatewayResponse?.error?.message || 'Payment failed';

          if (payment.booking) {
            payment.booking.paymentStatus = BookingPaymentStatus.FAILED;
            payment.booking.status = BookingStatus.CANCELLED;
            payment.booking.cancellationReason = 'Payment failed';
            await manager.save(payment.booking);

            // Release seats
            await manager.update(TripSeat, { bookingId: payment.booking.id }, {
              status: SeatStatus.AVAILABLE,
              bookingId: null,
              reservedUntil: null,
              gender: null,
            });

            // Recalculate seat count
            await this.recalculateTripSeats(payment.booking.tripId);
          }

          await this.notificationsService.createNotification({
            userId: payment.userId,
            type: 'PAYMENT_FAILED',
            channel: 'PUSH',
            title: 'Payment Failed',
            message: `Your payment of ₹${payment.amount} failed. Please try again.`,
            data: { paymentId: payment.id },
          });

          // Publish Outbox Event
          await this.outboxService.saveEvent(manager, 'payment.failed', {
            paymentId: payment.id,
            bookingId: payment.bookingId,
            userId: payment.userId,
            amount: payment.amount,
            failureReason: payment.failureReason,
          });
        }

        await manager.save(payment);
        return payment;
      });
    } finally {
      await lock.release();
    }
  }

  async processRefund(paymentId: string, amount: number, reason: string) {
    const lockKey = `lock:refund:${paymentId}`;
    const lock = await this.redisService.acquireLockWithRetry(lockKey, 15, 5, 50);
    if (!lock) {
      throw new ConflictException('A refund transaction is already in progress for this payment.');
    }

    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED && payment.status !== PaymentStatus.PARTIAL_REFUND) {
        throw new BadRequestException('Only completed or partially refunded payments can be refunded');
      }

      const currentRefundedAmount = Number(payment.refundAmount || 0);
      const totalPaymentAmount = Number(payment.amount);
      if (currentRefundedAmount + amount > totalPaymentAmount) {
        throw new BadRequestException('Refund amount exceeds the original payment amount');
      }

      let gatewayRefundId: string | null = null;
      let refundStatus = RefundStatus.COMPLETED;

      // Trigger actual gateway refund or credit back wallet
      try {
        if (payment.method === 'stripe') {
          if (!payment.stripePaymentIntentId) {
            throw new BadRequestException('Stripe payment intent ID is missing');
          }
          const stripeRefund = await this.stripeService.createRefund(payment.stripePaymentIntentId, amount);
          gatewayRefundId = stripeRefund.id;
        } else if (payment.method === 'razorpay') {
          if (!payment.razorpayPaymentId) {
            throw new BadRequestException('Razorpay payment ID is missing');
          }
          const razorpayRefund = await this.razorpayService.createRefund(payment.razorpayPaymentId, amount);
          gatewayRefundId = razorpayRefund.id;
        } else if (payment.method === 'wallet') {
          await this.walletService.creditToWallet(
            payment.userId,
            amount,
            `Refund for booking ${payment.bookingId || ''}`,
            payment.bookingId || payment.id,
            TransactionPurpose.REFUND,
            'refund',
          );
          gatewayRefundId = `WLT-REF-${Date.now()}`;
        } else {
          // Fallback for cash, upi, net_banking, etc. -> mark as manual / cash refund
          gatewayRefundId = `MANUAL-REF-${Date.now()}`;
        }
      } catch (err) {
        refundStatus = RefundStatus.FAILED;
        // Log failure in a new Refund record
        const failedRefund = this.refundRepository.create({
          refundNumber: `REF${Date.now()}${Math.floor(Math.random() * 1000)}`,
          paymentId: payment.id,
          userId: payment.userId,
          amount,
          currency: payment.currency,
          status: RefundStatus.FAILED,
          reason,
          failureReason: err.message,
        });
        await this.refundRepository.save(failedRefund);
        throw new BadRequestException(`Failed to process gateway refund: ${err.message}`);
      }

      // Save successful Refund record
      const refund = this.refundRepository.create({
        refundNumber: `REF${Date.now()}${Math.floor(Math.random() * 1000)}`,
        paymentId: payment.id,
        userId: payment.userId,
        amount,
        currency: payment.currency,
        status: RefundStatus.COMPLETED,
        gatewayRefundId,
        reason,
      });
      await this.refundRepository.save(refund);

      // Update payment record fields
      payment.refundAmount = currentRefundedAmount + amount;
      payment.refundedAt = new Date();
      payment.refundReason = reason;
      payment.refundId = refund.id;
      payment.status = (payment.refundAmount >= totalPaymentAmount) 
        ? PaymentStatus.REFUNDED 
        : PaymentStatus.PARTIAL_REFUND;

      await this.paymentRepository.save(payment);

      await this.notificationsService.createNotification({
        userId: payment.userId,
        type: 'REFUND_PROCESSED',
        channel: 'PUSH',
        title: 'Refund Processed',
        message: `A refund of ₹${amount} has been processed to your account`,
        data: { paymentId: payment.id, refundAmount: amount },
      });

      // Emit Kafka Event
      await this.kafkaService.publish('refund.completed', {
        refundId: refund.id,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        amount,
        gatewayRefundId,
      });

      return payment;
    } finally {
      await lock.release();
    }
  }

  async getRefundHistory(userId: string, userRole: string, query: any) {
    const { page = 1, limit = 10, status } = query;

    const isAdmin = [RoleName.ADMIN, RoleName.SUPER_ADMIN].includes(userRole as RoleName);
    const where: any = {};
    if (!isAdmin) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    const [refunds, total] = await this.refundRepository.findAndCount({
      where,
      relations: ['payment', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: refunds,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async recalculateTripSeats(tripId: string) {
    const manager = this.bookingRepository.manager;
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