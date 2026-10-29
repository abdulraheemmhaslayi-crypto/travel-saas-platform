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
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { VehicleDocument } from './vehicle-document.entity';
import { Trip } from './trip.entity';
import { FleetCompany } from './fleet-company.entity';
import { FleetVehicle } from './fleet-vehicle.entity';

export enum VehicleType {
  SEDAN = 'sedan',
  SUV = 'suv',
  HATCHBACK = 'hatchback',
  MPV = 'mpv',
  VAN = 'van',
  MINIBUS = 'minibus',
  BUS = 'bus',
  LUXURY = 'luxury',
  ELECTRIC = 'electric',
}

export enum VehicleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  SUSPENDED = 'suspended',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.vehicles)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'varchar', length: 50 })
  registrationNumber: string;

  @Column({ type: 'varchar', length: 100 })
  brand: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'enum', enum: VehicleType })
  type: VehicleType;

  @Column({ type: 'varchar', length: 50 })
  color: string;

  @Column({ type: 'int' })
  seatingCapacity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fuelType: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  transmission: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vehicleImage: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rcNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rcDocument: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  insuranceNumber: string;

  @Column({ type: 'date', nullable: true })
  insuranceExpiry: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  insuranceDocument: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  permitNumber: string;

  @Column({ type: 'date', nullable: true })
  permitExpiry: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  permitDocument: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fitnessCertificate: string;

  @Column({ type: 'date', nullable: true })
  fitnessExpiry: Date;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.PENDING })
  status: VehicleStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  rejectedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  suspendedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date;

  @Column({ type: 'text', nullable: true })
  suspensionReason: string;

  @Column({ type: 'int', default: 0 })
 maintenanceDowntime: number;

  @Column({ type: 'boolean', default: false })
  hasAC: boolean;

  @Column({ type: 'boolean', default: false })
  hasWifi: boolean;

  @Column({ type: 'boolean', default: false })
  hasCharging: boolean;

  @Column({ type: 'boolean', default: false })
  hasEntertainment: boolean;

  @Column({ type: 'boolean', default: false })
  hasLuggageSpace: boolean;

  @Column({ type: 'simple-json', nullable: true })
  amenities: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pricePerKm: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'uuid', nullable: true })
  fleetCompanyId: string;

  @ManyToOne(() => FleetCompany, (company) => company.vehicles)
  @JoinColumn({ name: 'fleetCompanyId' })
  fleetCompany: FleetCompany;

  @OneToMany(() => VehicleDocument, (doc) => doc.vehicle)
  documents: VehicleDocument[];

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips: Trip[];

  @OneToOne(() => FleetVehicle, (fleetVehicle) => fleetVehicle.vehicle)
  fleetDetails: FleetVehicle;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}