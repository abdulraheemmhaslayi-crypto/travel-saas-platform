import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LiveLocation } from '../database/entities/live-location.entity';
import { Trip, TripStatus } from '../database/entities/trip.entity';
import { Driver } from '../database/entities/driver.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { Booking } from '../database/entities/booking.entity';
import { RedisService } from '../redis/redis.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateLocationDto, LocationQueryDto } from './dto/tracking.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(LiveLocation)
    private readonly locationRepository: Repository<LiveLocation>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebsocketGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async updateLocation(userId: string, locationDto: UpdateLocationDto) {
    const driver = await this.driverRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const trip = await this.tripRepository.findOne({
      where: {
        driverId: driver.id,
        status: In([TripStatus.ACTIVE, TripStatus.IN_PROGRESS, TripStatus.DELAYED]),
      },
    });

    if (!trip) {
      throw new NotFoundException('No active trip found for this driver');
    }

    const location = this.locationRepository.create({
      tripId: trip.id,
      driverId: driver.id,
      vehicleId: trip.vehicleId,
      latitude: locationDto.latitude,
      longitude: locationDto.longitude,
      accuracy: locationDto.accuracy,
      speed: locationDto.speed,
      heading: locationDto.heading,
      altitude: locationDto.altitude,
      address: locationDto.address,
      city: locationDto.city,
      isOnline: true,
      metadata: locationDto.metadata,
    });

    await this.locationRepository.save(location);

    // Update driver current location
    driver.currentLatitude = locationDto.latitude;
    driver.currentLongitude = locationDto.longitude;
    driver.currentLocation = `${locationDto.latitude},${locationDto.longitude}`;
    driver.locationUpdatedAt = new Date();
    driver.isOnline = true;
    await this.driverRepository.save(driver);

    // Cache latest location in Redis GEO index
    await this.redisService.geoAdd(
      'geo:locations:active',
      locationDto.longitude,
      locationDto.latitude,
      driver.id,
    );

    // Cache latest location in Redis
    await this.redisService.setex(
      `location:${trip.id}`,
      300,
      JSON.stringify({
        lat: locationDto.latitude,
        lng: locationDto.longitude,
        speed: locationDto.speed,
        heading: locationDto.heading,
        timestamp: new Date().toISOString(),
      }),
    );

    // Broadcast to passengers via WebSocket
    this.websocketGateway.broadcastToTrip(trip.id, 'locationUpdate', {
      tripId: trip.id,
      latitude: locationDto.latitude,
      longitude: locationDto.longitude,
      speed: locationDto.speed,
      heading: locationDto.heading,
      timestamp: new Date().toISOString(),
    });

    // Check for geofence alerts
    await this.checkGeofenceAlerts(trip, locationDto);

    // Check for route deviation
    await this.checkRouteDeviation(trip, locationDto);

    return location;
  }

  async getTripLocations(tripId: string, query: LocationQueryDto) {
    const { startTime, endTime, page = 1, limit = 100 } = query;

    const where: any = { tripId };

    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    }

    const [locations, total] = await this.locationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: locations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLiveLocation(tripId: string) {
    // First check Redis for cached location
    const cached = await this.redisService.get(`location:${tripId}`);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const location = await this.locationRepository.findOne({
      where: { tripId },
      order: { createdAt: 'DESC' },
    });

    if (!location) {
      throw new NotFoundException('No location data found for this trip');
    }

    return location;
  }

  async getAllLiveVehicles() {
    const drivers = await this.driverRepository.find({
      where: { isOnline: true },
      relations: ['user'],
    });

    const liveVehicles = [];

    for (const driver of drivers) {
      const cached = await this.redisService.get(`location:${driver.id}`);
      
      if (cached) {
        const location = JSON.parse(cached);
        liveVehicles.push({
          driverId: driver.id,
          driverName: `${driver.user.firstName} ${driver.user.lastName}`,
          latitude: location.lat,
          longitude: location.lng,
          speed: location.speed,
          heading: location.heading,
          lastUpdated: location.timestamp,
        });
      }
    }

    return liveVehicles;
  }

  async getDriverLocations(driverId: string, query: LocationQueryDto) {
    const { startTime, endTime, page = 1, limit = 100 } = query;

    const where: any = { driverId };

    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    }

    const [locations, total] = await this.locationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: locations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findNearbyVehicles(lat: number, lng: number, radius: number = 5000) {
    const nearby = await this.redisService.geoRadius('geo:locations:active', lng, lat, radius / 1000);
    if (!nearby || nearby.length === 0) {
      return [];
    }

    const driverIds = nearby.map((n) => n.member);

    const trips = await this.tripRepository.find({
      where: {
        driverId: In(driverIds),
        status: In([TripStatus.ACTIVE, TripStatus.IN_PROGRESS, TripStatus.SCHEDULED]),
      },
      relations: ['driver', 'driver.user', 'vehicle'],
    });

    const tripMap = new Map<string, Trip>();
    for (const trip of trips) {
      tripMap.set(trip.driverId, trip);
    }

    const results = [];
    for (const item of nearby) {
      const trip = tripMap.get(item.member);
      if (!trip) continue;

      results.push({
        driverId: item.member,
        driverName: `${trip.driver.user.firstName} ${trip.driver.user.lastName}`,
        latitude: item.latitude,
        longitude: item.longitude,
        distance: item.distance,
        trip: {
          source: trip.source,
          destination: trip.destination,
          departureTime: trip.departureTime,
        },
        vehicle: {
          brand: trip.vehicle.brand,
          model: trip.vehicle.model,
          type: trip.vehicle.type,
        },
      });
    }

    return results.slice(0, 50);
  }

  async getTripPlayback(tripId: string) {
    const locations = await this.locationRepository.find({
      where: { tripId },
      order: { createdAt: 'ASC' },
    });

    if (!locations.length) {
      throw new NotFoundException('No tracking data for this trip');
    }

    return {
      tripId,
      totalPoints: locations.length,
      duration: this.calculateDuration(locations),
      distance: this.calculateTotalDistance(locations),
      path: locations.map((loc) => ({
        lat: loc.latitude,
        lng: loc.longitude,
        speed: loc.speed,
        timestamp: loc.createdAt,
      })),
    };
  }

  private async checkGeofenceAlerts(trip: Trip, locationDto: UpdateLocationDto) {
    // Check if near destination
    if (trip.destLat && trip.destLng) {
      const distance = this.calculateDistance(
        locationDto.latitude,
        locationDto.longitude,
        trip.destLat,
        trip.destLng,
      );

      // If within 2km of destination
      if (distance <= 2) {
        const bookings = await this.bookingRepository.find({
          where: { tripId: trip.id },
        });

        for (const booking of bookings) {
          await this.notificationsService.sendNotification({
            userId: booking.passengerId,
            type: 'VEHICLE_ARRIVED',
            channel: 'PUSH',
            title: 'Almost There!',
            message: `Your vehicle is ${Math.round(distance * 1000)}m away from ${trip.destination}`,
            data: { tripId: trip.id, distance },
          });
        }
      }
    }
  }

  private async checkRouteDeviation(trip: Trip, locationDto: UpdateLocationDto) {
    // Simplified route deviation check
    // In production, compare against planned route polyline
    if (trip.routePolyline) {
      // Parse polyline and check deviation
      const deviation = this.calculateRouteDeviation(
        locationDto.latitude,
        locationDto.longitude,
        trip.routePolyline,
      );

      if (deviation > 500) { // 500 meters deviation
        await this.notificationsService.sendNotification({
          userId: trip.vehicle.ownerId,
          type: 'EMERGENCY',
          channel: 'PUSH',
          title: 'Route Deviation Alert',
          message: `Vehicle on trip ${trip.id} has deviated ${Math.round(deviation)}m from planned route`,
          data: { tripId: trip.id, deviation },
        });
      }
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private calculateRouteDeviation(lat: number, lng: number, polyline: string): number {
    // Simplified - in production decode polyline and find closest point
    return 0;
  }

  private calculateDuration(locations: LiveLocation[]): number {
    if (locations.length < 2) return 0;
    const first = locations[0].createdAt.getTime();
    const last = locations[locations.length - 1].createdAt.getTime();
    return Math.round((last - first) / 1000); // seconds
  }

  private calculateTotalDistance(locations: LiveLocation[]): number {
    let total = 0;
    for (let i = 1; i < locations.length; i++) {
      total += this.calculateDistance(
        locations[i - 1].latitude,
        locations[i - 1].longitude,
        locations[i].latitude,
        locations[i].longitude,
      );
    }
    return Math.round(total * 100) / 100; // km, 2 decimal places
  }
}

// Helper for In() operator
import { In } from 'typeorm';