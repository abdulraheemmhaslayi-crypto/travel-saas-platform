import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsObject,
  IsArray,
  IsNotEmpty,
  MaxLength,
  IsTimeZone,
} from 'class-validator';
export { NotificationType, NotificationChannel } from './notification.types';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  channel?: string = 'IN_APP';
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ required: false })
  type: string;

  @ApiProperty({ required: false })
  data?: Record<string, any>;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ required: false })
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class NotificationQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;
}

export class MarkReadDto {
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  notificationIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}

export class UnreadCountDto {
  @ApiProperty()
  count: number;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty({ required: false })
  cachedCount?: number | null;
}

export class NotificationPreferencesDto {
  @ApiProperty({ default: true })
  emailEnabled: boolean;

  @ApiProperty({ default: true })
  pushEnabled: boolean;

  @ApiProperty({ default: false })
  smsEnabled: boolean;

  @ApiProperty({ default: true })
  bookingAlerts: boolean;

  @ApiProperty({ default: true })
  paymentAlerts: boolean;

  @ApiProperty({ default: true })
  tripUpdates: boolean;

  @ApiProperty({ default: false })
  promotionalEmails: boolean;

  @ApiProperty({ default: true })
  supportReplies: boolean;

  @ApiProperty({ required: false })
  quietHoursStart?: string | null;

  @ApiProperty({ required: false })
  quietHoursEnd?: string | null;
}