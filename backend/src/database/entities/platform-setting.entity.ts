import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface CommissionConfig {
  commissionType: 'PERCENTAGE' | 'FIXED_PER_SEAT' | 'FIXED_PER_TRIP';
  commissionValue: number;
  deductionTiming: 'INSTANT' | 'DAILY' | 'WEEKLY';
  minWalletBalance: number;
  autoPauseTrips: boolean;
  gracePeriodHours: number;
  freeCancellationHours: number;
  lateCancellationRefundPercent: number;
}

@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'jsonb' })
  value: CommissionConfig | Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
