import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum SagaStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  FAILED = 'FAILED',
}

@Entity('saga_state')
export class SagaState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sagaType: string;

  @Column({
    type: 'enum',
    enum: SagaStatus,
    default: SagaStatus.STARTED,
  })
  @Index()
  status: SagaStatus;

  @Column('text')
  payload: string;

  @Column('text', { default: '[]' })
  steps: string; // JSON string of steps executed: e.g. [{ name: string, status: string }]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
