import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Trip } from './trip.entity';
import { TripSeat } from './trip-seat.entity';
import { Payment } from './payment.entity';

export enum BookingType {
  ONE_WAY = 'one_way',
  RETURN = 'return',
  ROUND_TRIP = 'round_trip',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  ON_TRIP = 'on_trip',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  bookingNumber: string;

  @Index()
  @Column({ type: 'uuid' })
  passengerId: string;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'passengerId' })
  passenger: User;

  @Index()
  @Column({ type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.bookings)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column({ type: 'enum', enum: BookingType })
  bookingType: BookingType;

  @Index()
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Index()
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'int' })
  numberOfSeats: number;

  @Column({ type: 'simple-array', nullable: true })
  seatNumbers: string[];

  @Column({ type: 'uuid', nullable: true })
  outboundSeatId: string;

  @OneToOne(() => TripSeat, (seat) => seat.booking)
  @JoinColumn({ name: 'outboundSeatId' })
  seat: TripSeat;

  @Column({ type: 'uuid', nullable: true })
  returnSeatId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pickupLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  pickupLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  pickupLng: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dropLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  dropLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  dropLng: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode: string;

  @Column({ type: 'text', nullable: true })
  specialRequests: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  passengerName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  passengerPhone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  passengerEmail: string;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  boardedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  refundStatus: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}