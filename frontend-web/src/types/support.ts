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

export interface TicketUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface TicketComment {
  id: string;
  message: string;
  user: TicketUser;
  createdAt: Date;
  isInternal: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  user: TicketUser;
  assignedTo?: TicketUser;
  bookingId?: string;
  tripId?: string;
  fleetCompanyId?: string;
  attachments?: string[];
  resolution?: string;
  resolvedAt?: Date;
  internalNotes?: Record<string, any>[];
  responseCount: number;
  isEscalated: boolean;
  escalationReason?: string;
  escalatedAt?: Date;
  reopenReason?: string;
  reopenedAt?: Date;
  satisfactionRating?: number;
  comments: TicketComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number;
  escalatedTickets: number;
  categoryBreakdown: Record<TicketCategory, number>;
  priorityBreakdown: Record<TicketPriority, number>;
}

export interface TicketCategoryInfo {
  id: string;
  name: string;
  description: string;
}
