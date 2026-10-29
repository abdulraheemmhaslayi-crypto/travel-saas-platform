import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../database/entities/role.entity';
import { UpdateLocationDto, LocationQueryDto } from './dto/tracking.dto';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update driver location' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() locationDto: UpdateLocationDto,
  ) {
    return this.trackingService.updateLocation(userId, locationDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('trip/:tripId')
  @ApiOperation({ summary: 'Get trip location history' })
  async getTripLocations(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Query() query: LocationQueryDto,
  ) {
    return this.trackingService.getTripLocations(tripId, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('trip/:tripId/live')
  @ApiOperation({ summary: 'Get live trip location' })
  async getLiveLocation(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.trackingService.getLiveLocation(tripId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get('live-vehicles')
  @ApiOperation({ summary: 'Get all live vehicles (Admin)' })
  async getAllLiveVehicles() {
    return this.trackingService.getAllLiveVehicles();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Get driver location history' })
  async getDriverLocations(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query() query: LocationQueryDto,
  ) {
    return this.trackingService.getDriverLocations(driverId, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby vehicles' })
  async findNearbyVehicles(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5000,
  ) {
    return this.trackingService.findNearbyVehicles(lat, lng, radius);
  }
}