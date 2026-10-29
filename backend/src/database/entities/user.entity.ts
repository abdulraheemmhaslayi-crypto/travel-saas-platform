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
import { Role } from './role.entity';
import { Vehicle } from './vehicle.entity';
import { Driver } from './driver.entity';
import { Booking } from './booking.entity';
import { Wallet } from './wallet.entity';
import { SupportTicket } from './support-ticket.entity';
import { Notification } from './notification.entity';
import { AuditLog } from './audit-log.entity';
import { FleetCompany } from './fleet-company.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_KYC = 'pending_kyc',
  KYC_VERIFIED = 'kyc_verified',
  KYC_REJECTED = 'kyc_rejected',
}

export enum UserType {
  PASSENGER = 'passenger',
  VEHICLE_OWNER = 'vehicle_owner',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SUPPORT = 'support',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.PASSENGER })
  userType: UserType;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_KYC })
  status: UserStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage: string;

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
  kycDocumentType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  kycDocumentNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  kycDocumentFront: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  kycDocumentBack: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  kycSelfie: string;

  @Column({ type: 'timestamp', nullable: true })
  kycSubmittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  kycVerifiedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  kycVerifiedBy: string;

  @Column({ type: 'text', nullable: true })
  kycRejectionReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emergencyContactName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergencyContactPhone: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastLoginIp: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fcmToken: string;

  @Column({ type: 'boolean', default: true })
  emailNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  pushNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  smsNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  promotionalEmails: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  quietHoursStart: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  quietHoursEnd: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isTwoFactorEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  preferredLanguage: string;

  @Column({ type: 'varchar', length: 50, default: 'INR' })
  currency: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ type: 'uuid', nullable: true })
  roleId: string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  vehicles: Vehicle[];

  @OneToOne(() => Driver, (driver) => driver.user)
  driverProfile: Driver;

  @OneToMany(() => Booking, (booking) => booking.passenger)
  bookings: Booking[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => SupportTicket, (ticket) => ticket.user)
  supportTickets: SupportTicket[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  @OneToMany(() => FleetCompany, (company) => company.owner)
  fleetCompanies: FleetCompany[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}