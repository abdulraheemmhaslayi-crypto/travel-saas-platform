import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Trip } from './trip.entity';
import { FleetCompany } from './fleet-company.entity';

export enum DriverStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_TRIP = 'on_trip',
  OFFLINE = 'offline',
  SUSPENDED = 'suspended',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.driverProfile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  licenseDocument: string;

  @Column({ type: 'date', nullable: true })
  licenseExpiry: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  licenseType: string;

  @Column({ type: 'int', default: 0 })
  drivingExperience: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  backgroundCheckDocument: string;

  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.PENDING })
  status: DriverStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalTrips: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @Column({ type: 'int', default: 0 })
  cancelledTrips: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  currentLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLongitude: number;

  @Column({ type: 'timestamp', nullable: true })
  locationUpdatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastOnlineAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  documents: Record<string, any>;

  @OneToMany(() => Trip, (trip) => trip.driver)
  trips: Trip[];

  @Column({ type: 'uuid', nullable: true })
  fleetCompanyId: string;

  @ManyToOne(() => FleetCompany, { nullable: true })
  @JoinColumn({ name: 'fleetCompanyId' })
  fleetCompany: FleetCompany;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}