import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardStatsQueryDto {
  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ApproveVehicleDto {
  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Documents incomplete' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class VerifyKycDto {
  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Photo unclear' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateCommissionDto {
  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  @Max(50)
  percentage: number;
}

export class GenerateReportDto {
  @ApiProperty({ example: 'bookings', enum: ['bookings', 'revenue', 'users', 'trips'] })
  @IsEnum(['bookings', 'revenue', 'users', 'trips'])
  reportType: string;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-05-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'pdf', enum: ['pdf', 'csv', 'excel'] })
  @IsOptional()
  @IsEnum(['pdf', 'csv', 'excel'])
  format?: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'support_agent' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Support Agent' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ example: 'Assists customers with ticket queries' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  hierarchyLevel?: number;
}

export class CreatePermissionDto {
  @ApiProperty({ example: 'ticket:write' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Create and edit support tickets' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Allows user to create or edit tickets' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Support' })
  @IsNotEmpty()
  @IsString()
  module: string;

  @ApiProperty({ example: 'write' })
  @IsNotEmpty()
  @IsString()
  action: string;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'] })
  @IsNotEmpty()
  @IsString({ each: true })
  permissionIds: string[];
}