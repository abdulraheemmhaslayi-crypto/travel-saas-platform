import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum SubscriptionPlan {
  FREE = 'free',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  status: SubscriptionStatus;

  @Column({ type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'boolean', default: true })
  autoRenew: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSubscriptionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpaySubscriptionId: string;

  @Column({ type: 'simple-json', nullable: true })
  features: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  maxVehicles: number;

  @Column({ type: 'int', default: 0 })
  maxDrivers: number;

  @Column({ type: 'int', default: 0 })
  maxTripsPerMonth: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionDiscountPercent: number;

  @Column({ type: 'boolean', default: false })
  hasPrioritySupport: boolean;

  @Column({ type: 'boolean', default: false })
  hasAdvancedAnalytics: boolean;

  @Column({ type: 'boolean', default: false })
  hasWhiteLabel: boolean;

  @Column({ type: 'boolean', default: false })
  hasApiAccess: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}