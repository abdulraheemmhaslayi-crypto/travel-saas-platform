import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum OutboxStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('outbox')
export class Outbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  topic: string;

  @Column('text')
  payload: string;

  @Column({ nullable: true })
  key: string;

  @Column({
    type: 'enum',
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
  })
  @Index()
  status: OutboxStatus;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true, type: 'text' })
  lastError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
