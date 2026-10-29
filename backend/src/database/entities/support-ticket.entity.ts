import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Booking } from './booking.entity';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  WAITING_THIRD_PARTY = 'WAITING_THIRD_PARTY',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
  ESCALATED = 'ESCALATED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum TicketCategory {
  BOOKING_ISSUE = 'BOOKING_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  REFUND_REQUEST = 'REFUND_REQUEST',
  DRIVER_COMPLAINT = 'DRIVER_COMPLAINT',
  VEHICLE_ISSUE = 'VEHICLE_ISSUE',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
  APP_TECHNICAL = 'APP_TECHNICAL',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
  EMERGENCY = 'EMERGENCY',
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  TRIP = 'TRIP',
  VEHICLE = 'VEHICLE',
  DRIVER = 'DRIVER',
  APP = 'APP',
  ACCOUNT = 'ACCOUNT',
  REFUND = 'REFUND',
  FEEDBACK = 'FEEDBACK',
  OTHER = 'OTHER',
}

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  ticketNumber: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.supportTickets)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ type: 'uuid', nullable: true })
  bookingId: string;

  @ManyToOne(() => Booking, (booking) => booking.id)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid', nullable: true })
  tripId: string;

  @Column({ type: 'uuid', nullable: true })
  fleetCompanyId: string;

  @Column({ type: 'enum', enum: TicketCategory })
  category: TicketCategory;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Index()
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'simple-json', nullable: true })
  attachments: string[];

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  internalNotes: Record<string, any>[];

  @Column({ type: 'int', default: 0 })
  responseCount: number;

  @Column({ type: 'boolean', default: false })
  isEscalated: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  escalationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  escalatedBy: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reopenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  reopenedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  reopenedBy: string;

  @Column({ type: 'int', nullable: true })
  satisfactionRating: number;

  @Column({ type: 'simple-json', nullable: true })
  comments: any[];

  @Column({ type: 'timestamp', nullable: true })
  lastResponseAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  slaStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  slaDeadline: Date;

  @Column({ type: 'uuid', nullable: true })
  escalatedTo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}