import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Trip } from './trip.entity';

@Entity('trip_stops')
export class TripStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.stops)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column({ type: 'varchar', length: 255 })
  stopName: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'int' })
  sequenceOrder: number;

  @Column({ type: 'timestamp', nullable: true })
  estimatedArrival: Date;

  @Column({ type: 'int', default: 0 })
  stopDuration: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}