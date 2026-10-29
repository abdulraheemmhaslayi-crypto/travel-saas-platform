import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../database/entities/role.entity';
import { RateLimit } from '../rate-limiter/rate-limiter.guard';
import {
  CreateTripDto,
  UpdateTripDto,
  TripSearchDto,
  TripQueryDto,
  UpdateTripStatusDto,
  AssignDriverDto,
} from './dto/trip.dto';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new trip' })
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() createTripDto: CreateTripDto,
  ) {
    return this.tripsService.create(userId, createTripDto, userRole);
  }

  @Public()
  @RateLimit(30, 60)
  @Get('search')
  @ApiOperation({ summary: 'Search available trips' })
  @ApiQuery({ name: 'source', required: true })
  @ApiQuery({ name: 'destination', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'seats', required: false })
  async search(@Query() searchDto: TripSearchDto) {
    return this.tripsService.search(searchDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('my-trips')
  @ApiOperation({ summary: 'Get my trips (as owner)' })
  async getMyTrips(@CurrentUser('id') userId: string) {
    return this.tripsService.findByOwner(userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get trip by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripsService.findById(id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update trip' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    return this.tripsService.update(id, userId, updateTripDto, userRole);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update trip status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() statusDto: UpdateTripStatusDto,
  ) {
    return this.tripsService.updateStatus(id, userId, statusDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/assign-driver')
  @ApiOperation({ summary: 'Assign driver to trip' })
  async assignDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() assignDto: AssignDriverDto,
  ) {
    return this.tripsService.assignDriver(id, userId, assignDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete trip' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.tripsService.remove(id, userId, userRole);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all trips (Admin only)' })
  async findAll(@Query() query: TripQueryDto) {
    return this.tripsService.findAll(query);
  }
}