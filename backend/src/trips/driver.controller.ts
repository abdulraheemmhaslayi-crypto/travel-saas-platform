import {
  Controller,
  Get,
  UseGuards,
  NotFoundException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Trip, TripStatus } from '../database/entities/trip.entity';
import { Driver } from '../database/entities/driver.entity';

@ApiTags('Driver')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('driver')
export class DriverController {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  @Get('trips/active')
  @ApiOperation({ summary: 'Get active trips for the logged-in driver' })
  async getActiveTrips(@CurrentUser('id') userId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }
    const trips = await this.tripRepository.find({
      where: {
        driverId: driver.id,
        status: In([TripStatus.SCHEDULED, TripStatus.ACTIVE, TripStatus.IN_PROGRESS, TripStatus.DELAYED]),
      },
      relations: ['vehicle', 'routes', 'stops', 'seats', 'bookings', 'bookings.passenger'],
      order: { departureTime: 'ASC' },
    });

    return trips.map((trip) => ({
      id: trip.id,
      source: trip.source,
      destination: trip.destination,
      departureTime: trip.departureTime,
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      pricePerSeat: Number(trip.pricePerSeat),
      status: trip.status.toUpperCase(),
      bookings: trip.bookings ? trip.bookings.length : 0,
      bookingsList: trip.bookings || [],
      vehicle: trip.vehicle,
      stops: trip.stops || [],
      seats: trip.seats || [],
    }));
  }

  @Get('trips/available')
  @ApiOperation({ summary: 'Get available trips (unassigned)' })
  async getAvailableTrips() {
    const trips = await this.tripRepository.find({
      where: {
        driverId: IsNull(),
        status: TripStatus.SCHEDULED,
      },
      relations: ['vehicle', 'routes', 'stops', 'seats', 'bookings'],
      order: { departureTime: 'ASC' },
    });

    return trips.map((trip) => ({
      id: trip.id,
      source: trip.source,
      destination: trip.destination,
      departureTime: trip.departureTime,
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      pricePerSeat: Number(trip.pricePerSeat),
      status: trip.status.toUpperCase(),
      bookings: trip.bookings ? trip.bookings.length : 0,
      vehicle: trip.vehicle,
    }));
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get earnings for the logged-in driver' })
  async getEarnings(@CurrentUser('id') userId: string) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }
    const trips = await this.tripRepository.find({
      where: {
        driverId: driver.id,
        status: TripStatus.COMPLETED,
      },
      relations: ['bookings'],
    });

    let today = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    let total = Number(driver.totalEarnings || 0);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfWeek = new Date(now.getTime() - now.getDay() * oneDay);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const trip of trips) {
      if (!trip.bookings) continue;
      const tripEarnings = trip.bookings.reduce((sum, booking) => {
        // status is lowercase in the entity, e.g. confirmed/completed/paid
        const bookingStatus = String(booking.status || '').toLowerCase();
        const pStatus = String(booking.paymentStatus || '').toLowerCase();
        if (pStatus === 'paid' || bookingStatus === 'confirmed' || bookingStatus === 'completed') {
          return sum + Number(booking.finalAmount || booking.totalAmount || 0);
        }
        return sum;
      }, 0);

      const tripDate = new Date(trip.completedAt || trip.updatedAt);
      if (tripDate >= startOfToday) {
        today += tripEarnings;
      }
      if (tripDate >= startOfWeek) {
        thisWeek += tripEarnings;
      }
      if (tripDate >= startOfMonth) {
        thisMonth += tripEarnings;
      }
    }

    return {
      today,
      thisWeek,
      thisMonth,
      total,
      rating: Number(driver.rating || 5),
      totalTrips: driver.totalTrips || trips.length,
      completedTrips: trips.length,
    };
  }
}
