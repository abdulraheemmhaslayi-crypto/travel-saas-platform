import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Booking, BookingStatus, BookingType, PaymentStatus as BookingPaymentStatus } from '../database/entities/booking.entity';
import { Trip, TripStatus } from '../database/entities/trip.entity';
import { TripSeat, SeatStatus } from '../database/entities/trip-seat.entity';
import { User } from '../database/entities/user.entity';
import { Wallet } from '../database/entities/wallet.entity';
import { WalletTransaction, TransactionType, TransactionPurpose, TransactionStatus } from '../database/entities/wallet-transaction.entity';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '../database/entities/payment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { PaymentsService } from '../payments/payments.service';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';
import {
  CreateBookingDto,
  BookingQueryDto,
  CancelBookingDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';

import { OutboxService } from '../outbox/outbox.service';
import { SagaService } from '../saga/saga.service';
import { InventoryService } from '../inventory/inventory.service';
import { WalletService } from '../payments/wallet.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(TripSeat)
    private readonly seatRepository: Repository<TripSeat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly notificationsService: NotificationsService,
    private readonly websocketGateway: WebsocketGateway,
    private readonly paymentsService: PaymentsService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
    private readonly outboxService: OutboxService,
    private readonly sagaService: SagaService,
    private readonly inventoryService: InventoryService,
    private readonly walletService: WalletService,
  ) {}

  async create(passengerId: string, createBookingDto: CreateBookingDto) {
    await this.cleanupExpiredReservations();
    const { tripId, seatNumbers, bookingType, paymentMethod } = createBookingDto;

    // Acquire distributed lock for seats
    const sortedSeatNumbers = [...seatNumbers].sort();
    const locks = [];
    for (const seatNumber of sortedSeatNumbers) {
      const lockKey = `lock:seat:${tripId}:${seatNumber}`;
      const lock = await this.redisService.acquireLockWithRetry(lockKey, 10, 5, 50);
      if (!lock) {
        // Release any locks acquired so far to prevent deadlocks
        for (const activeLock of locks) {
          await activeLock.release();
        }
        throw new ConflictException(`Seat ${seatNumber} is currently being reserved by another passenger. Please try again.`);
      }
      locks.push(lock);
    }

    // 1. Redis Inventory reservation hold (prevent cache/DB double booking instantly)
    const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const holdsReserved = await this.inventoryService.reserveSeats(tripId, seatNumbers, bookingNumber, 900);
    if (!holdsReserved) {
      // Release distributed locks
      for (const activeLock of locks) {
        await activeLock.release();
      }
      throw new ConflictException('Selected seats are currently being reserved or are already booked. Please try again.');
    }

    let bookingId: string;
    let finalAmount: number;
    let trip: Trip;
    let walletTxnId: string;

    try {
      // Define Saga steps
      const steps = [
        {
          name: 'DB Seat Reservation',
          forward: async () => {
            await this.bookingRepository.manager.transaction(async (manager) => {
              trip = await manager.findOne(Trip, {
                where: { id: tripId },
                relations: ['vehicle', 'seats'],
              });

              if (!trip) {
                throw new NotFoundException('Trip not found');
              }

              if (trip.status !== TripStatus.SCHEDULED && trip.status !== TripStatus.ACTIVE) {
                throw new BadRequestException('Trip is not available for booking');
              }

              if (trip.availableSeats < seatNumbers.length) {
                throw new BadRequestException('Not enough seats available');
              }

              // Check SQL seats status
              const SQLseats = await manager.find(TripSeat, {
                where: { tripId, seatNumber: In(seatNumbers) },
              });

              const unavailableSeats = SQLseats.filter((s) => s.status !== SeatStatus.AVAILABLE);
              if (unavailableSeats.length > 0) {
                throw new ConflictException('Selected seats are already reserved or booked in the database.');
              }

              // Pricing
              const pricePerSeat = bookingType === 'return' && trip.returnPricePerSeat
                ? trip.returnPricePerSeat
                : trip.pricePerSeat;

              const totalAmount = pricePerSeat * seatNumbers.length;
              const platformFee = totalAmount * 0.10;
              const taxAmount = totalAmount * 0.18;
              finalAmount = totalAmount + platformFee + taxAmount;

              const booking = manager.create(Booking, {
                bookingNumber,
                passengerId,
                tripId,
                bookingType: bookingType as BookingType,
                status: BookingStatus.PENDING,
                paymentStatus: BookingPaymentStatus.PENDING,
                numberOfSeats: seatNumbers.length,
                seatNumbers,
                totalAmount,
                platformFee,
                taxAmount,
                finalAmount,
                pickupLocation: createBookingDto.pickupLocation,
                dropLocation: createBookingDto.dropLocation,
                passengerName: createBookingDto.passengerName,
                passengerPhone: createBookingDto.passengerPhone,
                passengerEmail: createBookingDto.passengerEmail,
              });

              await manager.save(booking);
              bookingId = booking.id;

              // Reserve SQL seats
              for (const seat of SQLseats) {
                seat.status = SeatStatus.RESERVED;
                seat.bookingId = booking.id;
                seat.reservedUntil = new Date(Date.now() + 15 * 60 * 1000);
                if (createBookingDto.passengerGenders && createBookingDto.passengerGenders[seat.seatNumber]) {
                  seat.gender = createBookingDto.passengerGenders[seat.seatNumber];
                }
                await manager.save(seat);
              }

              // Recalculate seats
              await this.recalculateTripSeats(tripId);

              // Stash event in Outbox within the transaction
              await this.outboxService.saveEvent(manager, 'booking.created', {
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                passengerId,
                tripId,
                seatNumbers,
                finalAmount,
                fleetCompanyId: trip.vehicle.fleetCompanyId || null,
                fleetManagerId: trip.vehicle.ownerId,
              });
            });
          },
          compensate: async () => {
            if (!bookingId) return;
            // Rollback DB reservation
            await this.bookingRepository.manager.transaction(async (manager) => {
              await manager.update(Booking, { id: bookingId }, {
                status: BookingStatus.CANCELLED,
                cancellationReason: 'Saga compensation: payment failed or seat hold aborted.',
              });

              await manager.update(TripSeat, { bookingId }, {
                status: SeatStatus.AVAILABLE,
                bookingId: null,
                reservedUntil: null,
                gender: null,
              });

              await this.recalculateTripSeats(tripId);

              // Stash cancellation event in outbox
              await this.outboxService.saveEvent(manager, 'booking.cancelled', {
                bookingId,
                tripId,
                passengerId,
                seatNumbers,
              });
            });
          }
        },
        {
          name: 'Payment Settlement',
          forward: async () => {
            if (paymentMethod === 'wallet') {
              // Deduct balance
              const txn = await this.walletService.deductFromWallet(
                passengerId,
                finalAmount,
                `Payment for booking ${bookingNumber}`,
                bookingId,
              );
              walletTxnId = txn.id;

              await this.bookingRepository.manager.transaction(async (manager) => {
                await manager.update(Booking, { id: bookingId }, {
                  status: BookingStatus.CONFIRMED,
                  paymentStatus: BookingPaymentStatus.PAID,
                });

                // Update seats to booked
                await manager.update(TripSeat, { bookingId }, {
                  status: SeatStatus.BOOKED,
                  reservedUntil: null,
                });

                // Confirm in Redis Inventory
                await this.inventoryService.confirmSeats(tripId, seatNumbers, bookingId);

                // Publish payment success event to outbox
                await this.outboxService.saveEvent(manager, 'payment.success', {
                  bookingId,
                  userId: passengerId,
                  amount: finalAmount,
                  currency: 'INR',
                  method: 'wallet',
                });
              });
            } else {
              // Gateway payment (Stripe/Razorpay) is processed asynchronously. We create a pending payment.
              await this.bookingRepository.manager.transaction(async (manager) => {
                const payment = manager.create(Payment, {
                  transactionId: `PAY${Date.now()}`,
                  userId: passengerId,
                  bookingId,
                  paymentType: PaymentType.BOOKING,
                  method: paymentMethod as PaymentMethod,
                  status: PaymentStatus.PENDING,
                  amount: finalAmount,
                  currency: 'INR',
                });
                await manager.save(payment);
              });
            }
          },
          compensate: async () => {
            if (paymentMethod === 'wallet' && walletTxnId) {
              // Refund wallet balance
              await this.walletService.creditToWallet(
                passengerId,
                finalAmount,
                `Refund for booking ${bookingNumber} (Saga compensation)`,
                bookingId,
              );
            }
          }
        }
      ];

      // 2. Execute Saga Distributed Transaction
      await this.sagaService.executeSaga('CREATE_BOOKING_SAGA', { tripId, seatNumbers, passengerId }, steps);

      // Notify owner and passenger
      await this.notificationsService.createNotification({
        userId: trip.vehicle.ownerId,
        type: 'BOOKING_CONFIRMED',
        channel: 'IN_APP',
        title: 'New Booking',
        message: `New booking ${bookingNumber} for ${seatNumbers.length} seats`,
        data: { bookingId, tripId },
      });

      await this.notificationsService.createNotification({
        userId: passengerId,
        type: 'BOOKING_CONFIRMED',
        channel: 'PUSH',
        title: 'Booking Confirmed',
        message: `Your booking ${bookingNumber} has been confirmed`,
        data: { bookingId, tripId },
      });

      return this.findById(bookingId, passengerId);
    } catch (sagaError) {
      // 3. Release Redis inventory holds if Saga execution triggers errors
      await this.inventoryService.releaseSeats(tripId, seatNumbers);
      throw sagaError;
    } finally {
      for (const activeLock of locks) {
        await activeLock.release();
      }
    }
  }

  async processWalletPayment(userId: string, booking: Booking, amount: number) {
    const wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    wallet.balance -= amount;
    await this.walletRepository.save(wallet);

    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      transactionId: `TXN${Date.now()}`,
      type: TransactionType.DEBIT,
      purpose: TransactionPurpose.BOOKING_PAYMENT,
      amount,
      balanceAfter: wallet.balance,
      description: `Payment for booking ${booking.bookingNumber}`,
      referenceId: booking.id,
      referenceType: 'booking',
    });

    await this.transactionRepository.save(transaction);

    booking.paymentStatus = BookingPaymentStatus.PAID;
    await this.bookingRepository.save(booking);

    // Create payment record
    const payment = this.paymentRepository.create({
      transactionId: `PAY${Date.now()}`,
      userId,
      bookingId: booking.id,
      paymentType: PaymentType.BOOKING,
      method: PaymentMethod.WALLET,
      status: PaymentStatus.COMPLETED,
      amount,
      currency: 'INR',
    });

    await this.paymentRepository.save(payment);
  }

  async findAll(query: BookingQueryDto) {
    await this.cleanupExpiredReservations();
    const { page = 1, limit = 10, status, passengerId, tripId } = query;

    const where: any = {};
    if (status) where.status = status;
    if (passengerId) where.passengerId = passengerId;
    if (tripId) where.tripId = tripId;

    const [bookings, total] = await this.bookingRepository.findAndCount({
      where,
      relations: ['trip', 'trip.vehicle', 'passenger', 'payments'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId?: string) {
    await this.cleanupExpiredReservations();
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['trip', 'trip.vehicle', 'trip.driver', 'passenger', 'payments', 'seat'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userId && booking.passengerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return booking;
  }

  async findByPassenger(passengerId: string) {
    return this.bookingRepository.find({
      where: { passengerId },
      relations: ['trip', 'trip.vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancel(id: string, userId: string, cancelDto: CancelBookingDto) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['trip', 'trip.vehicle'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.passengerId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed bookings');
    }

    // Calculate refund based on cancellation policy
    const now = new Date();
    const departureTime = new Date(booking.trip.departureTime);
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilDeparture > 24) {
      refundPercentage = 100;
    } else if (hoursUntilDeparture > 12) {
      refundPercentage = 75;
    } else if (hoursUntilDeparture > 6) {
      refundPercentage = 50;
    } else if (hoursUntilDeparture > 2) {
      refundPercentage = 25;
    }

    const refundAmount = (booking.finalAmount * refundPercentage) / 100;

    await this.bookingRepository.manager.transaction(async (manager) => {
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancelDto.reason;
      booking.refundAmount = refundAmount;
      booking.refundStatus = refundAmount > 0 ? 'pending' : 'not_applicable';

      await manager.save(booking);

      // Release SQL seats
      const seats = await manager.find(TripSeat, {
        where: { bookingId: id },
      });

      for (const seat of seats) {
        seat.status = SeatStatus.AVAILABLE;
        seat.bookingId = null;
        seat.reservedUntil = null;
        seat.gender = null;
        await manager.save(seat);
      }

      // Update trip seats dynamically
      await this.recalculateTripSeats(booking.tripId);

      // Release seats in Redis inventory
      await this.inventoryService.releaseSeats(booking.tripId, booking.seatNumbers);

      // Process refund if applicable
      if (refundAmount > 0) {
        await this.processRefund(booking, refundAmount);
      }

      // Notify
      await this.notificationsService.createNotification({
        userId: booking.passengerId,
        type: 'BOOKING_CANCELLED',
        channel: 'PUSH',
        title: 'Booking Cancelled',
        message: `Your booking ${booking.bookingNumber} has been cancelled. Refund: ₹${refundAmount}`,
        data: { bookingId: booking.id, refundAmount },
      });

      // Stash event in Outbox within the transaction
      await this.outboxService.saveEvent(manager, 'booking.cancelled', {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        userId: booking.passengerId,
        driverId: booking.trip.driverId || null,
        refundAmount,
      });
    });

    return {
      message: 'Booking cancelled successfully',
      refundAmount,
      refundPercentage,
    };
  }

  async processRefund(booking: Booking, amount: number) {
    const payment = await this.paymentRepository.findOne({
      where: { bookingId: booking.id, status: PaymentStatus.COMPLETED },
    });

    if (payment) {
      await this.paymentsService.processRefund(payment.id, amount, `Refund for cancelled booking ${booking.bookingNumber}`);
    } else {
      const wallet = await this.walletRepository.findOne({
        where: { userId: booking.passengerId },
      });

      if (wallet) {
        wallet.balance = Number(wallet.balance) + amount;
        await this.walletRepository.save(wallet);

        const transaction = this.transactionRepository.create({
          walletId: wallet.id,
          transactionId: `RFN${Date.now()}`,
          type: TransactionType.CREDIT,
          purpose: TransactionPurpose.REFUND,
          status: TransactionStatus.COMPLETED,
          amount,
          balanceAfter: wallet.balance,
          description: `Refund for cancelled booking ${booking.bookingNumber}`,
          referenceId: booking.id,
          referenceType: 'booking',
        });

        await this.transactionRepository.save(transaction);
      }
    }

    booking.paymentStatus = BookingPaymentStatus.REFUNDED;
    await this.bookingRepository.save(booking);
  }

  async updateStatus(id: string, userId: string, statusDto: UpdateBookingStatusDto) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['trip', 'trip.vehicle'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only driver or admin can update status
    const isDriver = booking.trip.driverId === userId;
    const isOwner = booking.trip.vehicle.ownerId === userId;

    if (!isDriver && !isOwner) {
      throw new ForbiddenException('Only driver or vehicle owner can update booking status');
    }

    booking.status = statusDto.status;

    if (statusDto.status === BookingStatus.CHECKED_IN) {
      booking.checkedInAt = new Date();
    } else if (statusDto.status === BookingStatus.ON_TRIP) {
      booking.boardedAt = new Date();
    } else if (statusDto.status === BookingStatus.COMPLETED) {
      booking.completedAt = new Date();
    }

    await this.bookingRepository.save(booking);

    // Notify passenger
    await this.notificationsService.createNotification({
      userId: booking.passengerId,
      type: 'TRIP_STATUS',
      channel: 'PUSH',
      title: 'Booking Status Updated',
      message: `Your booking is now ${statusDto.status}`,
      data: { bookingId: booking.id, status: statusDto.status },
    });

    return booking;
  }

  async recalculateTripSeats(tripId: string) {
    const totalSeats = await this.seatRepository.count({ where: { tripId } });
    const bookedSeats = await this.seatRepository.count({ where: { tripId, status: SeatStatus.BOOKED } });
    const availableSeats = await this.seatRepository.count({ where: { tripId, status: SeatStatus.AVAILABLE } });

    await this.tripRepository.update({ id: tripId }, {
      totalSeats,
      bookedSeats,
      availableSeats,
    });
  }

  async cleanupExpiredReservations() {
    const now = new Date();
    const expiredSeats = await this.seatRepository.find({
      where: {
        status: SeatStatus.RESERVED,
        reservedUntil: LessThan(now),
      },
    });

    if (expiredSeats.length === 0) {
      return;
    }

    const bookingIds = Array.from(new Set(expiredSeats.map((s) => s.bookingId).filter((id) => !!id)));
    const tripIds = Array.from(new Set(expiredSeats.map((s) => s.tripId)));

    // Release seats
    for (const seat of expiredSeats) {
      seat.status = SeatStatus.AVAILABLE;
      seat.bookingId = null;
      seat.reservedUntil = null;
      seat.gender = null;
      await this.seatRepository.save(seat);
    }

    // Cancel expired bookings
    if (bookingIds.length > 0) {
      await this.bookingRepository.update(
        {
          id: In(bookingIds),
          status: BookingStatus.PENDING,
        },
        {
          status: BookingStatus.CANCELLED,
          paymentStatus: BookingPaymentStatus.FAILED,
          cancellationReason: 'Payment session expired',
          cancelledAt: now,
        }
      );
    }

    // Recalculate trip seat counts
    for (const tripId of tripIds) {
      await this.recalculateTripSeats(tripId);
    }
  }
}