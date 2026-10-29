import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VehicleType, VehicleStatus } from '../../database/entities/vehicle.entity';
import { DocumentType } from '../../database/entities/vehicle-document.entity';

export class VehicleDocumentInputDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ example: 'https://example.com/doc.pdf' })
  @IsString()
  documentUrl: string;

  @ApiPropertyOptional({ example: 'DOC123456' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'MH12AB1234' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  registrationNumber: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'Innova Crysta' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(1990)
  @Max(2030)
  year: number;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({ example: 'White' })
  @IsString()
  color: string;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(100)
  seatingCapacity: number;

  @ApiPropertyOptional({ example: 'Diesel' })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({ example: 'Manual' })
  @IsOptional()
  @IsString()
  transmission?: string;

  @ApiPropertyOptional({ example: 'https://example.com/vehicle.jpg' })
  @IsOptional()
  @IsString()
  vehicleImage?: string;

  @ApiPropertyOptional({ example: 'RC123456789' })
  @IsOptional()
  @IsString()
  rcNumber?: string;

  @ApiPropertyOptional({ example: 'https://example.com/rc.pdf' })
  @IsOptional()
  @IsString()
  rcDocument?: string;

  @ApiPropertyOptional({ example: 'INS123456' })
  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  insuranceExpiry?: string;

  @ApiPropertyOptional({ example: 'https://example.com/insurance.pdf' })
  @IsOptional()
  @IsString()
  insuranceDocument?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasAC?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasCharging?: boolean;

  @ApiPropertyOptional({ example: 500.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ example: 15.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pricePerKm?: number;

  @ApiPropertyOptional({ type: [VehicleDocumentInputDto] })
  @IsOptional()
  @IsArray()
  documents?: VehicleDocumentInputDto[];
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Innova Crysta' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 500.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ example: 15.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pricePerKm?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasAC?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasCharging?: boolean;
}

export class VehicleQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class VehicleDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ example: 'https://example.com/doc.pdf' })
  @IsString()
  documentUrl: string;

  @ApiPropertyOptional({ example: 'DOC123456' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class VerifyVehicleDto {
  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected'] })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Vehicle details are incorrect' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SuspendVehicleDto {
  @ApiProperty({ example: 'Vehicle failed safety inspection' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReactivateVehicleDto {
  @ApiPropertyOptional({ example: 'Safety issues resolved' })
  @IsOptional()
  @IsString()
  reason?: string;
}



