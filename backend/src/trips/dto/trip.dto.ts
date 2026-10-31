import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsDateString,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TripType, TripStatus } from '../../database/entities/trip.entity';

export class CreateRouteDto {
  @ApiProperty({ example: 'Mumbai Central' })
  @IsString()
  @IsNotEmpty()
  waypoint: string;

  @ApiProperty({ example: 19.0760 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 72.8777 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distanceFromStart?: number;
}

export class CreateStopDto {
  @ApiProperty({ example: 'Thane' })
  @IsString()
  @IsNotEmpty()
  stopName: string;

  @ApiProperty({ example: 19.2183 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 72.9781 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: '2026-05-23T10:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  estimatedArrival?: Date;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stopDuration?: number;
}

export class CreateTripDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 'Mumbai to Pune Daily Service' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Comfortable AC bus service' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TripType, example: TripType.ONE_WAY })
  @IsEnum(TripType)
  tripType: TripType;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: 'Pune' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ example: 19.0760 })
  @Type(() => Number)
  @IsNumber()
  sourceLat: number;

  @ApiProperty({ example: 72.8777 })
  @Type(() => Number)
  @IsNumber()
  sourceLng: number;

  @ApiProperty({ example: 18.5204 })
  @Type(() => Number)
  @IsNumber()
  destLat: number;

  @ApiProperty({ example: 73.8567 })
  @Type(() => Number)
  @IsNumber()
  destLng: number;

  @ApiProperty({ example: '2026-05-23T06:00:00Z' })
  @Type(() => Date)
  @IsDate()
  departureTime: Date;

  @ApiPropertyOptional({ example: '2026-05-23T10:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  arrivalTime?: Date;

  @ApiPropertyOptional({ example: '2026-05-23T18:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  returnDepartureTime?: Date;

  @ApiPropertyOptional({ example: '2026-05-23T22:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  returnArrivalTime?: Date;

  @ApiProperty({ example: 500.00 })
  @Type(() => Number)
  @IsNumber()
  basePrice: number;

  @ApiProperty({ example: 250.00 })
  @Type(() => Number)
  @IsNumber()
  pricePerSeat: number;

  @ApiPropertyOptional({ example: 200.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  returnPricePerSeat?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isReturnTripAvailable?: boolean;

  @ApiPropertyOptional({ example: '2026-05-23T05:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  bookingCloseTime?: Date;

  @ApiPropertyOptional({ type: [CreateRouteDto] })
  @IsOptional()
  @IsArray()
  routes?: CreateRouteDto[];

  @ApiPropertyOptional({ type: [CreateStopDto] })
  @IsOptional()
  @IsArray()
  stops?: CreateStopDto[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: 'daily' })
  @IsOptional()
  @IsString()
  recurrencePattern?: string;

  @ApiPropertyOptional({ example: '2026-06-23T06:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  recurrenceEndDate?: Date;
}

export class UpdateTripDto {
  @ApiPropertyOptional({ example: 'Mumbai to Pune - Updated' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '2026-05-23T07:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  departureTime?: Date;

  @ApiPropertyOptional({ example: 550.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ example: 275.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pricePerSeat?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allowBooking?: boolean;
}

export class TripSearchDto {
  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'Pune' })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({ example: 19.0760 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceLat?: number;

  @ApiPropertyOptional({ example: 72.8777 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceLng?: number;

  @ApiPropertyOptional({ example: 18.5204 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  destLat?: number;

  @ApiPropertyOptional({ example: 73.8567 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  destLng?: number;

  @ApiPropertyOptional({ example: '2026-05-23' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;

  @ApiPropertyOptional({ enum: TripType })
  @IsOptional()
  @IsEnum(TripType)
  tripType?: TripType;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;
}

export class TripQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: TripStatus })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class UpdateTripStatusDto {
  @ApiProperty({ enum: TripStatus, example: TripStatus.ACTIVE })
  @IsEnum(TripStatus)
  status: TripStatus;

  @ApiPropertyOptional({ example: 'Traffic delay' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignDriverDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  driverId: string;
}