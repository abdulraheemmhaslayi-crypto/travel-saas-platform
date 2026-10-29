import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../database/entities/support-ticket.entity';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ enum: TicketCategory })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiProperty({ enum: TicketPriority, required: false })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority = TicketPriority.MEDIUM;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  fleetCompanyId?: string;
}

export class UpdateTicketDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
    @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ enum: TicketCategory, required: false })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiProperty({ enum: TicketPriority, required: false })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  satisfactionRating?: number;
}

export class AssignTicketDto {
  @ApiProperty()
  @IsUUID()
  agentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class EscalateTicketDto {
  @ApiProperty({ enum: TicketPriority })
  @IsEnum(TicketPriority)
  newPriority: TicketPriority;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class TicketCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class TicketQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ enum: TicketStatus, required: false })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({ enum: TicketPriority, required: false })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ enum: TicketCategory, required: false })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  assignedToMe?: boolean;
}

export class TicketUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;
}

export class TicketCommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: TicketUserDto })
  user: TicketUserDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  isInternal: boolean;
}

export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketNumber: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: TicketUserDto, nullable: true })
  user: TicketUserDto | null;

  @ApiProperty({ type: TicketUserDto, nullable: true })
  assignedTo: TicketUserDto | null;

  @ApiProperty({ type: [TicketCommentResponseDto] })
  comments: TicketCommentResponseDto[];

  @ApiProperty({ required: false })
  resolution?: string;

  @ApiProperty({ required: false })
  satisfactionRating?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  resolvedAt?: Date;

  @ApiProperty({ required: false })
  reopenedAt?: Date;

  @ApiProperty({ required: false })
  escalationReason?: string;

  @ApiProperty({ required: false })
  reopenReason?: string;
}

export class CategoryStatDto {
  @ApiProperty()
  category: string;

  @ApiProperty()
  count: number;
}

export class PriorityStatDto {
  @ApiProperty()
  priority: string;

  @ApiProperty()
  count: number;
}

export class TicketStatsDto {
  @ApiProperty()
  totalTickets: number;

  @ApiProperty()
  openTickets: number;

  @ApiProperty()
  inProgressTickets: number;

  @ApiProperty()
  resolvedTickets: number;

  @ApiProperty()
  closedTickets: number;

  @ApiProperty()
  avgResolutionTime: number;

  @ApiProperty()
  satisfactionScore: number;

  @ApiProperty({ type: [CategoryStatDto] })
  ticketsByCategory: CategoryStatDto[];

  @ApiProperty({ type: [PriorityStatDto] })
  ticketsByPriority: PriorityStatDto[];

  @ApiProperty()
  period: { startDate: Date; endDate: Date; days: number };
}