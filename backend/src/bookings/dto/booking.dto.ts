import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsArray,
  Min,
  IsDecimal,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, BookingType } from '../../database/entities/booking.entity';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  tripId: string;

  @ApiProperty({ example: ['1', '2'] })
  @IsArray()
  @IsString({ each: true })
  seatNumbers: string[];

  @ApiProperty({ enum: BookingType, example: BookingType.ONE_WAY })
  @IsEnum(BookingType)
  bookingType: BookingType;

  @ApiProperty({ example: 'wallet', enum: ['wallet', 'stripe', 'razorpay', 'cash'] })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'Mumbai Central' })
  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @ApiPropertyOptional({ example: 'Pune Station' })
  @IsOptional()
  @IsString()
  dropLocation?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  passengerName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  passengerPhone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  passengerEmail?: string;

  @ApiPropertyOptional({ example: 'COUPON10' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: { '1': 'female', '2': 'male' } })
  @IsOptional()
  passengerGenders?: Record<string, string>;
}

export class BookingQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  passengerId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  tripId?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'user@okhdfcbank' })
  @IsOptional()
  @IsString()
  refundUpiId?: string;

  @ApiProperty({ example: 'Change of plans' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CHECKED_IN })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
export class SubmitUpiPaymentDto {
  @ApiProperty({ example: '123456789012' })
  @IsString()
  @IsNotEmpty()
  utrNumber: string;

  @ApiPropertyOptional({ example: 'https://storage.../receipt.jpg' })
  @IsOptional()
  @IsString()
  paymentReceiptUrl?: string;
}

export class VerifyUpiPaymentDto {
  @ApiProperty({ example: 'APPROVE', enum: ['APPROVE', 'REJECT'] })
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ example: 'Payment not credited to bank account' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class ProcessRefundDto {
  @ApiProperty({ example: '123456789012' })
  @IsString()
  @IsNotEmpty()
  refundUtr: string;
}
