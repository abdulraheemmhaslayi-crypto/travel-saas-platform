import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseEnumPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingStatus } from '../database/entities/booking.entity';
import { RoleName } from '../database/entities/role.entity';

import {
  DashboardMetricsDto,
  RevenueAnalyticsDto,
  BookingAnalyticsDto,
  UserAnalyticsDto,
  VehicleUtilizationDto,
  TripPerformanceDto,
  AnalyticsResponseDto,
  RevenueQueryDto,
} from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(RoleName.SUPER_ADMIN, RoleName.VEHICLE_OWNER)
  @ApiOperation({ summary: 'Get dashboard overview metrics' })
  async getDashboardMetrics(
    @CurrentUser() user: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ): Promise<DashboardMetricsDto> {
    return this.analyticsService.getDashboardMetrics(days, user.fleetCompanyId);
  }

  @Get('revenue')
  @Roles(RoleName.SUPER_ADMIN, RoleName.VEHICLE_OWNER, RoleName.DRIVER)
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenueAnalytics(
    @CurrentUser() user: any,
    @Query() query: RevenueQueryDto,
  ): Promise<RevenueAnalyticsDto> {
    return this.analyticsService.getRevenueAnalytics(
      query,
      user.fleetCompanyId,
    );
  }

  @Get('bookings')
  @Roles(RoleName.SUPER_ADMIN, RoleName.VEHICLE_OWNER)
  @ApiOperation({ summary: 'Get booking analytics' })
  async getBookingAnalytics(
    @CurrentUser() user: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('status', new DefaultValuePipe(undefined)) status?: BookingStatus,
  ): Promise<BookingAnalyticsDto> {
    return this.analyticsService.getBookingAnalytics(days, status, user.fleetCompanyId);
  }

  @Get('users')
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user growth and activity analytics' })
  async getUserAnalytics(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ): Promise<UserAnalyticsDto> {
    return this.analyticsService.getUserAnalytics(days);
  }

  @Get('vehicles/utilization')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.VEHICLE_OWNER)
  @ApiOperation({ summary: 'Get vehicle utilization analytics' })
  async getVehicleUtilization(
    @CurrentUser() user: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ): Promise<VehicleUtilizationDto[]> {
    return this.analyticsService.getVehicleUtilization(days, user.fleetCompanyId);
  }

  @Get('trips/performance')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.VEHICLE_OWNER)
  @ApiOperation({ summary: 'Get trip performance analytics' })
  async getTripPerformance(
    @CurrentUser() user: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('routeId') routeId?: string,
  ): Promise<TripPerformanceDto[]> {
    return this.analyticsService.getTripPerformance(days, routeId, user.fleetCompanyId);
  }

  @Get('export')
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiQuery({ name: 'type', enum: ['revenue', 'bookings', 'users', 'trips'] })
  @ApiQuery({ name: 'format', enum: ['csv', 'json', 'xlsx'], required: false })
  async exportAnalytics(
    @Query('type', new ParseEnumPipe(['revenue', 'bookings', 'users', 'trips'] as const))
    type: 'revenue' | 'bookings' | 'users' | 'trips',
    @Query('format', new DefaultValuePipe('csv')) format: 'csv' | 'json' | 'xlsx',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    return this.analyticsService.exportAnalytics(
      type,
      format,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('realtime')
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get real-time platform metrics' })
  async getRealtimeMetrics(@CurrentUser() user: any): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getRealtimeMetrics(user.fleetCompanyId);
  }
}