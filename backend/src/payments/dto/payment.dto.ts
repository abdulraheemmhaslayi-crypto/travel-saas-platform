import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
  IsDecimal,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod } from '../../database/entities/payment.entity';

export class CreatePaymentDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ example: 1000.00 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'stripe', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class WalletTopupDto {
  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiProperty({ example: 'upi' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class WalletWithdrawDto {
  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  bankAccount: string;

  @ApiProperty({ example: 'HDFC0001234' })
  @IsString()
  ifscCode: string;
}

export class PaymentQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}