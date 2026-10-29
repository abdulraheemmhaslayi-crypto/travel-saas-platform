import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { Trip } from './trip.entity';
import { Booking } from './booking.entity';

export enum SeatStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  RESERVED = 'reserved',
  BLOCKED = 'blocked',
  UNAVAILABLE = 'unavailable',
}

export enum SeatType {
  WINDOW = 'window',
  AISLE = 'aisle',
  MIDDLE = 'middle',
  PREMIUM = 'premium',
  RECLINER = 'recliner',
}

@Entity('trip_seats')
@Index(['tripId', 'status'])
export class TripSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.seats)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column({ type: 'varchar', length: 20 })
  seatNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  row: string;

  @Column({ type: 'enum', enum: SeatType, default: SeatType.WINDOW })
  seatType: SeatType;

  @Column({ type: 'enum', enum: SeatStatus, default: SeatStatus.AVAILABLE })
  status: SeatStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  bookingId: string;

  @OneToOne(() => Booking, (booking) => booking.seat)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'boolean', default: false })
  isReturnSeat: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reservedUntil: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}