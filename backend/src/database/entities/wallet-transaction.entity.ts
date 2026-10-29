import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TransactionPurpose {
  BOOKING_PAYMENT = 'booking_payment',
  REFUND = 'refund',
  TOPUP = 'topup',
  WITHDRAWAL = 'withdrawal',
  COMMISSION = 'commission',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({ type: 'varchar', length: 100, unique: true })
  transactionId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionPurpose })
  purpose: TransactionPurpose;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.COMPLETED })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}