import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsInt, Min, IsString } from 'class-validator';

export enum AnalyticsTimeRange {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM = 'CUSTOM',
}

export class PeriodDto {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  days: number;
}

export class RevenueDataPoint {
  @ApiProperty()
  date: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  transactionCount: number;
}

export class PaymentMethodBreakdown {
  @ApiProperty()
  method: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  percentage: number;
}

export class RevenueAnalyticsDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  averageDaily: number;

  @ApiProperty({ type: [RevenueDataPoint] })
  dataPoints: RevenueDataPoint[];

  @ApiProperty({ type: [PaymentMethodBreakdown] })
  paymentMethodBreakdown: PaymentMethodBreakdown[];

  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;
}

export class BookingStatusBreakdown {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}

export class DailyBookingData {
  @ApiProperty()
  date: string;

  @ApiProperty()
  bookings: number;

  @ApiProperty()
  revenue: number;
}

export class TopRouteData {
  @ApiProperty()
  routeName: string;

  @ApiProperty()
  bookings: number;

  @ApiProperty()
  revenue: number;
}

export class BookingAnalyticsDto {
  @ApiProperty()
  totalBookings: number;

  @ApiProperty({ type: [BookingStatusBreakdown] })
  statusBreakdown: BookingStatusBreakdown[];

  @ApiProperty({ type: [DailyBookingData] })
  dailyBookings: DailyBookingData[];

  @ApiProperty({ type: [TopRouteData] })
  topRoutes: TopRouteData[];

  @ApiProperty()
  averageBookingValue: number;

  @ApiProperty()
  cancellationRate: number;

  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;
}

export class UserGrowthDataPoint {
  @ApiProperty()
  date: string;

  @ApiProperty()
  newUsers: number;
}

export class RoleDistribution {
  @ApiProperty()
  role: string;

  @ApiProperty()
  count: number;
}

export class UserAnalyticsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  newUsers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  retentionRate: number;

  @ApiProperty({ type: [UserGrowthDataPoint] })
  userGrowth: UserGrowthDataPoint[];

  @ApiProperty({ type: [RoleDistribution] })
  roleDistribution: RoleDistribution[];

  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;
}

export class VehicleUtilizationDto {
  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  registrationNumber: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  totalTrips: number;

  @ApiProperty()
  totalSeats: number;

  @ApiProperty()
  bookedSeats: number;

  @ApiProperty()
  utilizationRate: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  averageTripDuration: number;

  @ApiProperty()
  maintenanceDowntime: number;
}

export class TripPerformanceDto {
  @ApiProperty()
  tripId: string;

  @ApiProperty()
  routeName: string;

  @ApiProperty()
  departureTime: Date;

  @ApiProperty()
  arrivalTime: Date;

  @ApiProperty()
  vehicleRegistration: string;

  @ApiProperty()
  totalSeats: number;

  @ApiProperty()
  bookedSeats: number;

  @ApiProperty()
  occupancyRate: number;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  onTimePerformance: number;

  @ApiProperty()
  cancellationRate: number;

  @ApiProperty()
  averageRating: number;
}

export class DashboardMetricsDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  totalTrips: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  totalVehicles: number;

  @ApiProperty()
  activeVehicles: number;

  @ApiProperty()
  pendingTickets: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  revenueGrowth: number;

  @ApiProperty()
  bookingGrowth: number;

  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;
}

export class ServerLoadDto {
  @ApiProperty()
  cpu: number;

  @ApiProperty()
  memory: number;

  @ApiProperty()
  requestsPerMinute: number;
}

export class AnalyticsResponseDto {
  @ApiProperty()
  activeTrips: number;

  @ApiProperty()
  liveBookings: number;

  @ApiProperty()
  onlineUsers: number;

  @ApiProperty()
  pendingPayments: number;

  @ApiProperty()
  todayRevenue: number;

  @ApiProperty({ type: ServerLoadDto })
  serverLoad: ServerLoadDto;

  @ApiProperty()
  timestamp: Date;
}

export class ExportAnalyticsDto {
  @ApiProperty({ enum: ['revenue', 'bookings', 'users', 'trips'] })
  @IsEnum(['revenue', 'bookings', 'users', 'trips'])
  type: 'revenue' | 'bookings' | 'users' | 'trips';

  @ApiProperty({ enum: ['csv', 'json', 'xlsx'], required: false })
  @IsOptional()
  @IsEnum(['csv', 'json', 'xlsx'])
  format?: 'csv' | 'json' | 'xlsx';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AnalyticsQueryDto {
  @ApiProperty({ enum: AnalyticsTimeRange, required: false })
  @IsOptional()
  @IsEnum(AnalyticsTimeRange)
  timeRange?: AnalyticsTimeRange;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}

export class RevenueQueryDto {
  @ApiPropertyOptional({ example: '6months' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'month', enum: ['day', 'week', 'month', 'year'] })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: 'day' | 'week' | 'month' | 'year';
}