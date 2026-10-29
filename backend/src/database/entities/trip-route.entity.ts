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

@Entity('trip_routes')
export class TripRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.routes)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column({ type: 'varchar', length: 255 })
  waypoint: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'int', nullable: true })
  sequenceOrder: number;

  @Column({ type: 'int', nullable: true })
  distanceFromStart: number;

  @Column({ type: 'int', nullable: true })
  estimatedArrival: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}