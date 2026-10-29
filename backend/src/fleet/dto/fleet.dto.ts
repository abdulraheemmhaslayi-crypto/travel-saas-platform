import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsDateString,
  IsDecimal,
  Min,
  IsArray,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FleetStatus } from '../../database/entities/fleet-company.entity';
import { FleetVehicleStatus } from '../../database/entities/fleet-vehicle.entity';
import { VehicleType } from '../../database/entities/vehicle.entity';

export class CreateFleetDto {
  @ApiProperty({ example: 'City Transport Solutions' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiPropertyOptional({ example: 'Leading transport provider in Mumbai' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: 'contact@citytransport.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '123 Business Park, Mumbai' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'REG123456' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'GST123456789' })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class UpdateFleetDto {
  @ApiPropertyOptional({ example: 'City Transport Solutions Pvt Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'contact@newemail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New Address' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class AddFleetVehicleDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'KA01AB1234' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Innova' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  seatingCapacity?: number;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

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
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ example: 15.00 })
  @IsOptional()
  @IsNumber()
  pricePerKm?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'FLT-001' })
  @IsOptional()
  @IsString()
  fleetNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: Date;

  @ApiPropertyOptional({ example: 1500000.00 })
  @IsOptional()
  @IsDecimal()
  purchasePrice?: number;
}

export class UpdateFleetVehicleDto {
  @ApiPropertyOptional({ enum: FleetVehicleStatus })
  @IsOptional()
  @IsEnum(FleetVehicleStatus)
  status?: FleetVehicleStatus;

  @ApiPropertyOptional({ example: '2024-06-15' })
  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: Date;

  @ApiPropertyOptional({ example: '2024-12-15' })
  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: Date;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  maintenanceIntervalKm?: number;
}

export class FleetQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: FleetStatus })
  @IsOptional()
  @IsEnum(FleetStatus)
  status?: FleetStatus;

  @ApiPropertyOptional({ example: 'City' })
  @IsOptional()
  @IsString()
  search?: string;
}