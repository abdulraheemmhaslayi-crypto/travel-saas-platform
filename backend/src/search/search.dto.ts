import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class TripSearchQueryDto {
  @ApiProperty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsString()
  destination: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  passengers?: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

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

  @ApiProperty({ enum: ['price', 'departureTime', 'duration', 'rating'], required: false })
  @IsOptional()
  @IsEnum(['price', 'departureTime', 'duration', 'rating'])
  sortBy?: 'price' | 'departureTime' | 'duration' | 'rating' = 'departureTime';

  @ApiProperty({ enum: ['asc', 'desc'], required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class TripSearchResult {
  @ApiProperty()
  id: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  destination: string;

  @ApiProperty()
  departureTime: Date;

  @ApiProperty()
  arrivalTime: Date;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  vehicleType: string;

  @ApiProperty()
  vehicleName: string;

  @ApiProperty({ type: [String] })
  amenities: string[];

  @ApiProperty()
  availableSeats: number;

  @ApiProperty()
  totalSeats: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  operatorName: string;

  @ApiProperty({ required: false })
  cancellationPolicy?: string;
}

export class SearchResultsDto {
  @ApiProperty({ type: [TripSearchResult] })
  data: TripSearchResult[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class AutocompleteDto {
  @ApiProperty()
  text: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  subtype?: string;

  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty({ required: false })
  subtitle?: string;
}

export class SearchFiltersDto {
  @ApiProperty({ type: [String] })
  vehicleTypes: string[];

  @ApiProperty()
  priceRange: { min: number; max: number };

  @ApiProperty({ type: [String] })
  amenities: string[];

  @ApiProperty({ type: [Object] })
  sortOptions: { value: string; label: string }[];
}

export class GlobalSearchQueryDto {
  @ApiProperty()
  @IsString()
  q: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  types?: string;
}