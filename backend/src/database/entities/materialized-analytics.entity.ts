import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index } from 'typeorm';

export enum PeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('materialized_analytics')
@Index(['periodType', 'dateKey'], { unique: true })
export class MaterializedAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PeriodType,
  })
  periodType: PeriodType;

  @Column()
  dateKey: string; // e.g. "2026-06-08", "2026-W24", "2026-06"

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ default: 0 })
  totalBookings: number;

  @Column({ default: 0 })
  totalTrips: number;

  @Column({ default: 0 })
  activeUsers: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
