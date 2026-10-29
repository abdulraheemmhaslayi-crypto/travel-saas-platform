import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  JoinColumn as OneToOneJoinColumn,
} from 'typeorm';
import { FleetCompany } from './fleet-company.entity';
import { Vehicle } from './vehicle.entity';

export enum FleetVehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  INACTIVE = 'inactive',
}

@Entity('fleet_vehicles')
export class FleetVehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  fleetCompanyId: string;

  @ManyToOne(() => FleetCompany, (company) => company.fleetVehicles)
  @JoinColumn({ name: 'fleetCompanyId' })
  fleetCompany: FleetCompany;

  @Column({ type: 'uuid' })
  vehicleId: string;

  @OneToOne(() => Vehicle, (vehicle) => vehicle.fleetDetails)
  @OneToOneJoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fleetNumber: string;

  @Column({ type: 'enum', enum: FleetVehicleStatus, default: FleetVehicleStatus.ACTIVE })
  status: FleetVehicleStatus;

  @Column({ type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  purchasePrice: number;

  @Column({ type: 'int', default: 0 })
  totalKmDriven: number;

  @Column({ type: 'date', nullable: true })
  lastMaintenanceDate: Date;

  @Column({ type: 'date', nullable: true })
  nextMaintenanceDate: Date;

  @Column({ type: 'int', default: 0 })
  maintenanceCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalMaintenanceCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fuelEfficiency: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fuelType: string;

  @Column({ type: 'simple-json', nullable: true })
  maintenanceHistory: Record<string, any>[];

  @Column({ type: 'simple-json', nullable: true })
  insuranceDetails: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  gpsDevice: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}