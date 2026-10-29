import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';

export enum PaymentMethod {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
  WALLET = 'wallet',
  CASH = 'cash',
  UPI = 'upi',
  CARD = 'card',
  NET_BANKING = 'net_banking',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  BOOKING = 'booking',
  REFUND = 'refund',
  WALLET_TOPUP = 'wallet_topup',
  WALLET_WITHDRAWAL = 'wallet_withdrawal',
  COMMISSION = 'commission',
  SUBSCRIPTION = 'subscription',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  transactionId: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  bookingId: string;

  @ManyToOne(() => Booking, (booking) => booking.payments)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Index()
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpayOrderId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpayPaymentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpaySignature: string;

  @Column({ type: 'text', nullable: true })
  paymentGatewayResponse: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failureReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refundId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ type: 'text', nullable: true })
  refundReason: string;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}