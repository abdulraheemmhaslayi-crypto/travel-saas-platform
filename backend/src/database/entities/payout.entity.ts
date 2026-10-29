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

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  STRIPE_CONNECT = 'stripe_connect',
  RAZORPAY_ROUTE = 'razorpay_route',
}

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  payoutNumber: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Column({ type: 'enum', enum: PayoutMethod, default: PayoutMethod.BANK_TRANSFER })
  method: PayoutMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankAccount: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ifscCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayPayoutId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failureReason: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
