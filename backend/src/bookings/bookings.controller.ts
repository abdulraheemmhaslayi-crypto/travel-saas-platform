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
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../database/entities/role.entity';
import { RateLimit } from '../rate-limiter/rate-limiter.guard';
import {
  CreateBookingDto,
  BookingQueryDto,
  CancelBookingDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @RateLimit(10, 60)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, createBookingDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  @ApiOperation({ summary: 'Get my bookings' })
  async getMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.findByPassenger(userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.findById(id, userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() cancelDto: CancelBookingDto,
  ) {
    return this.bookingsService.cancel(id, userId, cancelDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status (Driver/Admin)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() statusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, userId, statusDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all bookings (Admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query() query: BookingQueryDto) {
    return this.bookingsService.findAll(query);
  }
}