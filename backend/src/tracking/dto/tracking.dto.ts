import {
  IsString,
  IsOptional,
  IsNumber,
  IsDecimal,
  IsBoolean,
  IsDateString,
  IsJSON,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 19.0760 })
  @IsDecimal()
  latitude: number;

  @ApiProperty({ example: 72.8777 })
  @IsDecimal()
  longitude: number;

  @ApiPropertyOptional({ example: 10.5 })
  @IsOptional()
  @IsDecimal()
  accuracy?: number;

  @ApiPropertyOptional({ example: 60.5 })
  @IsOptional()
  @IsDecimal()
  speed?: number;

  @ApiPropertyOptional({ example: 180.0 })
  @IsOptional()
  @IsDecimal()
  heading?: number;

  @ApiPropertyOptional({ example: 15.2 })
  @IsOptional()
  @IsDecimal()
  altitude?: number;

  @ApiPropertyOptional({ example: 'Mumbai, Maharashtra' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ example: { batteryLevel: 85, networkType: '4G' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class LocationQueryDto {
  @ApiPropertyOptional({ example: '2026-05-23T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2026-05-23T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  limit?: number;
}

export class NearbyVehiclesQueryDto {
  @ApiProperty({ example: 19.0760 })
  @IsDecimal()
  lat: number;

  @ApiProperty({ example: 72.8777 })
  @IsDecimal()
  lng: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  radius?: number;
}