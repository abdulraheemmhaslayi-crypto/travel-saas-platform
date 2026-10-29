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
import { Trip } from './trip.entity';
import { Booking } from './booking.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking, (booking) => booking.id)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.id)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column({ type: 'uuid' })
  raterId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'raterId' })
  rater: User;

  @Column({ type: 'uuid' })
  rateeId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'rateeId' })
  ratee: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string;

  @Column({ type: 'simple-json', nullable: true })
  categories: {
    punctuality?: number;
    cleanliness?: number;
    behavior?: number;
    driving?: number;
    comfort?: number;
  };

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isReported: boolean;

  @Column({ type: 'text', nullable: true })
  reportReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}