import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Driver } from './driver.entity';
import { TripRoute } from './trip-route.entity';
import { TripStop } from './trip-stop.entity';
import { TripSeat } from './trip-seat.entity';
import { Booking } from './booking.entity';
import { Rating } from './rating.entity';

export enum TripType {
  ONE_WAY = 'one_way',
  ROUND_TRIP = 'round_trip',
  RETURN_ONLY = 'return_only',
}

export enum TripStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DELAYED = 'delayed',
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, (driver) => driver.trips)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TripType })
  tripType: TripType;

  @Index()
  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.SCHEDULED })
  status: TripStatus;

  @Column({ type: 'varchar', length: 255 })
  source: string;

  @Column({ type: 'varchar', length: 255 })
  destination: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  sourceLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  sourceLng: number;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  destLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  destLng: number;

  @Index()
  @Column({ type: 'timestamp' })
  departureTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  arrivalTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnDepartureTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnArrivalTime: Date;

  @Column({ type: 'int' })
  totalSeats: number;

  @Column({ type: 'int', default: 0 })
  availableSeats: number;

  @Column({ type: 'int', default: 0 })
  bookedSeats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerSeat: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  returnPricePerSeat: number;

  @Column({ type: 'int', nullable: true })
  distanceKm: number;

  @Column({ type: 'int', nullable: true })
  estimatedDuration: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  routePolyline: string;

  @Column({ type: 'boolean', default: false })
  isReturnTripAvailable: boolean;

  @Column({ type: 'boolean', default: true })
  allowBooking: boolean;

  @Column({ type: 'timestamp', nullable: true })
  bookingCloseTime: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cancellationPolicy: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurrencePattern: string;

  @Column({ type: 'timestamp', nullable: true })
  recurrenceEndDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recurrenceGroupId: string;

  @OneToMany(() => TripRoute, (route) => route.trip)
  routes: TripRoute[];

  @OneToMany(() => Rating, (rating) => rating.trip)
  ratings: Rating[];

  @OneToMany(() => TripStop, (stop) => stop.trip)
  stops: TripStop[];

  @OneToMany(() => TripSeat, (seat) => seat.trip)
  seats: TripSeat[];

  @OneToMany(() => Booking, (booking) => booking.trip)
  bookings: Booking[];

  @Column({ type: 'timestamp', nullable: true })
  estimatedArrivalTime: Date;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}