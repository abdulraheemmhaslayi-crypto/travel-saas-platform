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
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { FleetVehicle } from './fleet-vehicle.entity';

export enum FleetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Entity('fleet_companies')
export class FleetCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.fleetCompanies)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pincode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  registrationNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  taxId: string;

  @Column({ type: 'enum', enum: FleetStatus, default: FleetStatus.PENDING })
  status: FleetStatus;

  @Column({ type: 'int', default: 0 })
  totalVehicles: number;

  @Column({ type: 'int', default: 0 })
  totalDrivers: number;

  @Column({ type: 'int', default: 0 })
  totalTrips: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'simple-json', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  documents: Record<string, any>;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.fleetCompany)
  vehicles: Vehicle[];

  @OneToMany(() => FleetVehicle, (fleetVehicle) => fleetVehicle.fleetCompany)
  fleetVehicles: FleetVehicle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}