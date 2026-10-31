
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, Like, LessThan, In } from 'typeorm';
import { Trip, TripStatus, TripType } from '../database/entities/trip.entity';
import { TripRoute } from '../database/entities/trip-route.entity';
import { TripStop } from '../database/entities/trip-stop.entity';
import { TripSeat, SeatStatus } from '../database/entities/trip-seat.entity';
import { Booking, BookingStatus, PaymentStatus as BookingPaymentStatus } from '../database/entities/booking.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { Driver } from '../database/entities/driver.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  CreateTripDto,
  UpdateTripDto,
  TripSearchDto,
  TripQueryDto,
  UpdateTripStatusDto,
  AssignDriverDto,
} from './dto/trip.dto';
import { KafkaService } from '../kafka/kafka.service';
import { RedisService } from '../redis/redis.service';
import { randomUUID } from 'crypto';

import { OutboxService } from '../outbox/outbox.service';
import { CoalescingService } from '../coalesce/coalesce.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(TripRoute)
    private readonly routeRepository: Repository<TripRoute>,
    @InjectRepository(TripStop)
    private readonly stopRepository: Repository<TripStop>,
    @InjectRepository(TripSeat)
    private readonly seatRepository: Repository<TripSeat>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly notificationsService: NotificationsService,
    private readonly websocketGateway: WebsocketGateway,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly outboxService: OutboxService,
    private readonly coalescingService: CoalescingService,
  ) {}

  async create(userId: string, createTripDto: CreateTripDto, userRole?: string) {
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(userRole || '');
    
    const vehicle = await this.vehicleRepository.findOne({
      where: isAdmin ? { id: createTripDto.vehicleId } : { id: createTripDto.vehicleId, ownerId: userId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found or access denied');
    }

    if (vehicle.status !== 'approved') {
      throw new BadRequestException('Vehicle must be approved before creating trips');
    }

    const departureDates: Date[] = [new Date(createTripDto.departureTime)];
    if (createTripDto.isRecurring && createTripDto.recurrencePattern) {
      const pattern = createTripDto.recurrencePattern.toLowerCase();
      const initialTime = new Date(createTripDto.departureTime).getTime();
      const endLimit = createTripDto.recurrenceEndDate ? new Date(createTripDto.recurrenceEndDate) : new Date(initialTime + 30 * 24 * 60 * 60 * 1000);
      
      const maxEndLimit = new Date(initialTime + 30 * 24 * 60 * 60 * 1000);
      const actualEndLimit = endLimit > maxEndLimit ? maxEndLimit : endLimit;

      let currentDate = new Date(createTripDto.departureTime);
      let count = 1;

      while (count < 30) {
        let nextDate = new Date(currentDate);
        if (pattern === 'daily') {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (pattern === 'weekdays') {
          do {
            nextDate.setDate(nextDate.getDate() + 1);
          } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        } else if (pattern === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (pattern === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
          break;
        }

        if (nextDate > actualEndLimit) {
          break;
        }
        departureDates.push(nextDate);
        currentDate = nextDate;
        count++;
      }
    }

    const createdTrips: Trip[] = [];
    const recurrenceGroupId = createTripDto.isRecurring ? randomUUID() : null;

    for (const depTime of departureDates) {
      let arrTime: Date | null = null;
      if (createTripDto.arrivalTime) {
        const offset = new Date(createTripDto.arrivalTime).getTime() - new Date(createTripDto.departureTime).getTime();
        arrTime = new Date(depTime.getTime() + offset);
      }

      let returnDepTime: Date | null = null;
      if (createTripDto.returnDepartureTime) {
        const offset = new Date(createTripDto.returnDepartureTime).getTime() - new Date(createTripDto.departureTime).getTime();
        returnDepTime = new Date(depTime.getTime() + offset);
      }

      let returnArrTime: Date | null = null;
      if (createTripDto.returnArrivalTime) {
        const offset = new Date(createTripDto.returnArrivalTime).getTime() - new Date(createTripDto.departureTime).getTime();
        returnArrTime = new Date(depTime.getTime() + offset);
      }

      let bookingClose: Date | null = null;
      if (createTripDto.bookingCloseTime) {
        const offset = new Date(createTripDto.bookingCloseTime).getTime() - new Date(createTripDto.departureTime).getTime();
        bookingClose = new Date(depTime.getTime() + offset);
      }

      const trip = this.tripRepository.create({
        ...createTripDto,
        departureTime: depTime,
        arrivalTime: arrTime,
        returnDepartureTime: returnDepTime,
        returnArrivalTime: returnArrTime,
        bookingCloseTime: bookingClose,
        totalSeats: vehicle.seatingCapacity,
        availableSeats: vehicle.seatingCapacity,
        bookedSeats: 0,
        status: TripStatus.SCHEDULED,
        isRecurring: createTripDto.isRecurring || false,
        recurrencePattern: createTripDto.recurrencePattern || null,
        recurrenceEndDate: createTripDto.recurrenceEndDate || null,
        recurrenceGroupId,
      });

      await this.tripRepository.save(trip);

      if (createTripDto.routes?.length) {
        const routes = createTripDto.routes.map((route, index) =>
          this.routeRepository.create({
            ...route,
            tripId: trip.id,
            sequenceOrder: index,
          }),
        );
        await this.routeRepository.save(routes);
      }

      if (createTripDto.stops?.length) {
        const stops = createTripDto.stops.map((stop, index) => {
          let stopEstArr: Date | null = null;
          if (stop.estimatedArrival) {
            const offset = new Date(stop.estimatedArrival).getTime() - new Date(createTripDto.departureTime).getTime();
            stopEstArr = new Date(depTime.getTime() + offset);
          }
          return this.stopRepository.create({
            ...stop,
            estimatedArrival: stopEstArr,
            tripId: trip.id,
            sequenceOrder: index,
          });
        });
        await this.stopRepository.save(stops);
      }

      const seats = [];
      for (let i = 1; i <= vehicle.seatingCapacity; i++) {
        seats.push(
          this.seatRepository.create({
            tripId: trip.id,
            seatNumber: i.toString(),
            status: SeatStatus.AVAILABLE,
            price: createTripDto.pricePerSeat,
          }),
        );
      }
      await this.seatRepository.save(seats);

      createdTrips.push(trip);
    }

    return this.findById(createdTrips[0].id);
  }

  async search(searchDto: TripSearchDto) {
    await this.cleanupExpiredReservations();
    const { source, destination, date, seats = 1, tripType, radius = 20 } = searchDto;
    const sourceLat = searchDto.sourceLat ? Number(searchDto.sourceLat) : undefined;
    const sourceLng = searchDto.sourceLng ? Number(searchDto.sourceLng) : undefined;
    const destLat = searchDto.destLat ? Number(searchDto.destLat) : undefined;
    const destLng = searchDto.destLng ? Number(searchDto.destLng) : undefined;

    const cacheKey = `search:trips:${source || ''}:${destination || ''}:${date}:${seats}:${tripType || 'all'}:${radius}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        // Fallback to DB
      }
    }

    const where: any = {
      availableSeats: MoreThanOrEqual(seats),
      status: TripStatus.SCHEDULED,
      allowBooking: true,
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.departureTime = Between(startOfDay, endOfDay);
    }

    if (tripType) {
      where.tripType = tripType;
    }

    const trips = await this.tripRepository.find({
      where,
      relations: ['vehicle', 'vehicle.owner', 'routes', 'stops', 'seats'],
      order: { departureTime: 'ASC' },
    });

    const isTextMatch = (name1: string, name2: string): boolean => {
      if (!name1 || !name2) return false;
      const n1 = name1.toLowerCase();
      const n2 = name2.toLowerCase();
      return n1.includes(n2) || n2.includes(n1);
    };

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const getClosestPointOnSegment = (
      latQ: number, lngQ: number,
      lat1: number, lng1: number,
      lat2: number, lng2: number
    ) => {
      const dx = lng2 - lng1;
      const dy = lat2 - lat1;
      if (dx === 0 && dy === 0) {
        return { lat: lat1, lng: lng1, t: 0 };
      }
      const t = ((lngQ - lng1) * dx + (latQ - lat1) * dy) / (dx * dx + dy * dy);
      const tClamped = Math.max(0, Math.min(1, t));
      return {
        lat: lat1 + tClamped * dy,
        lng: lng1 + tClamped * dx,
        t: tClamped
      };
    };

    const matchThreshold = 2.0; // km
    const queryRadius = Number(radius);

    const exactMatches: any[] = [];
    const partialMatches: any[] = [];
    const nearbyDeparture: any[] = [];
    const nearbyDestination: any[] = [];
    const similarRoutes: any[] = [];

    for (const trip of trips) {
      const pathPoints = [
        { name: trip.source, lat: Number(trip.sourceLat), lng: Number(trip.sourceLng) },
        ...(trip.routes || [])
          .sort((a, b) => Number(a.sequenceOrder) - Number(b.sequenceOrder))
          .map(r => ({ name: r.waypoint, lat: Number(r.latitude), lng: Number(r.longitude) })),
        { name: trip.destination, lat: Number(trip.destLat), lng: Number(trip.destLng) }
      ];

      const numSegments = pathPoints.length - 1;
      let bestSrcDist = Infinity;
      let bestDstDist = Infinity;
      let bestSrcIndex = -1;
      let bestDstIndex = -1;
      let bestSrcT = 0;
      let bestDstT = 0;
      let matchedPairFound = false;

      // Loop over segment pairs (i, j) with i <= j
      for (let i = 0; i < numSegments; i++) {
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1];

        let srcMatch = { lat: p1.lat, lng: p1.lng, t: 0 };
        let srcDist = Infinity;
        if (sourceLat !== undefined && sourceLng !== undefined) {
          srcMatch = getClosestPointOnSegment(sourceLat, sourceLng, p1.lat, p1.lng, p2.lat, p2.lng);
          srcDist = getDistance(sourceLat, sourceLng, srcMatch.lat, srcMatch.lng);
        } else if (source) {
          if (isTextMatch(p1.name, source) || isTextMatch(p2.name, source)) {
            srcDist = 0;
            srcMatch = { lat: p1.lat, lng: p1.lng, t: 0 };
          }
        }

        for (let j = i; j < numSegments; j++) {
          const q1 = pathPoints[j];
          const q2 = pathPoints[j + 1];

          let dstMatch = { lat: q2.lat, lng: q2.lng, t: 1 };
          let dstDist = Infinity;
          if (destLat !== undefined && destLng !== undefined) {
            dstMatch = getClosestPointOnSegment(destLat, destLng, q1.lat, q1.lng, q2.lat, q2.lng);
            dstDist = getDistance(destLat, destLng, dstMatch.lat, dstMatch.lng);
          } else if (destination) {
            if (isTextMatch(q1.name, destination) || isTextMatch(q2.name, destination)) {
              dstDist = 0;
              dstMatch = { lat: q2.lat, lng: q2.lng, t: 1 };
            }
          }

          let isValidOrder = true;
          if (i === j) {
            isValidOrder = srcMatch.t < dstMatch.t;
          }

          if (isValidOrder && srcDist <= queryRadius && dstDist <= queryRadius) {
            const totalDist = srcDist + dstDist;
            const currentMin = bestSrcDist + bestDstDist;
            if (totalDist < currentMin) {
              bestSrcDist = srcDist;
              bestDstDist = dstDist;
              bestSrcIndex = i;
              bestDstIndex = j;
              bestSrcT = srcMatch.t;
              bestDstT = dstMatch.t;
              matchedPairFound = true;
            }
          }
        }
      }

      const mappedTrip = {
        ...trip,
        availableSeatNumbers: trip.seats
          ?.filter((seat) => seat.status === SeatStatus.AVAILABLE)
          .map((seat) => seat.seatNumber),
      };

      if (!matchedPairFound) {
        let minSrcDist = Infinity;
        let bestSrcPtIndex = -1;
        for (let i = 0; i < numSegments; i++) {
          const p1 = pathPoints[i];
          const p2 = pathPoints[i + 1];
          if (sourceLat !== undefined && sourceLng !== undefined) {
            const srcMatch = getClosestPointOnSegment(sourceLat, sourceLng, p1.lat, p1.lng, p2.lat, p2.lng);
            const srcDist = getDistance(sourceLat, sourceLng, srcMatch.lat, srcMatch.lng);
            if (srcDist < minSrcDist) {
              minSrcDist = srcDist;
              bestSrcPtIndex = i;
            }
          }
        }

        let minDstDist = Infinity;
        let bestDstPtIndex = -1;
        for (let i = 0; i < numSegments; i++) {
          const p1 = pathPoints[i];
          const p2 = pathPoints[i + 1];
          if (destLat !== undefined && destLng !== undefined) {
            const dstMatch = getClosestPointOnSegment(destLat, destLng, p1.lat, p1.lng, p2.lat, p2.lng);
            const dstDist = getDistance(destLat, destLng, dstMatch.lat, dstMatch.lng);
            if (dstDist < minDstDist) {
              minDstDist = dstDist;
              bestDstPtIndex = i;
            }
          }
        }

        if (minSrcDist <= queryRadius) {
          const finalTrip = {
            ...mappedTrip,
            matchDetails: {
              rank: 6,
              sourceStop: pathPoints[bestSrcPtIndex].name || trip.source,
              sourceDist: minSrcDist,
              isDepartureOnly: true,
            }
          };
          nearbyDeparture.push(finalTrip);
          similarRoutes.push(finalTrip);
        }

        if (minDstDist <= queryRadius) {
          const finalTrip = {
            ...mappedTrip,
            matchDetails: {
              rank: 6,
              destStop: pathPoints[bestDstPtIndex].name || trip.destination,
              destDist: minDstDist,
              isDestinationOnly: true,
            }
          };
          nearbyDestination.push(finalTrip);
          if (!similarRoutes.some(t => t.id === trip.id)) {
            similarRoutes.push(finalTrip);
          }
        }
      } else {
        const isSrcExact = bestSrcDist <= matchThreshold;
        const isDstExact = bestDstDist <= matchThreshold;
        let bestRank = 7;

        if (isSrcExact && isDstExact) {
          const isTripStart = bestSrcIndex === 0 && bestSrcT <= 0.15;
          const isTripEnd = bestDstIndex === numSegments - 1 && bestDstT >= 0.85;
          if (isTripStart && isTripEnd) {
            bestRank = 1;
          } else {
            bestRank = 2;
          }
        } else if (isDstExact) {
          bestRank = 3;
        } else if (isSrcExact) {
          bestRank = 4;
        } else {
          bestRank = 5;
        }

        const sourceStop = pathPoints[bestSrcIndex].name || trip.source;
        const destStop = pathPoints[bestDstIndex + 1].name || trip.destination;

        const finalTrip = {
          ...mappedTrip,
          matchDetails: {
            rank: bestRank,
            sourceStop,
            destStop,
            sourceDist: bestSrcDist,
            destDist: bestDstDist,
            isRouteBased: true,
          },
        };

        if (bestRank === 1 || bestRank === 2) {
          exactMatches.push(finalTrip);
        } else {
          partialMatches.push(finalTrip);
          similarRoutes.push(finalTrip);
        }
      }
    }

    const sortTrips = (list: any[]) => {
      return list.sort((a, b) => {
        const rankA = a.matchDetails?.rank ?? 99;
        const rankB = b.matchDetails?.rank ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        const distA = (a.matchDetails?.sourceDist ?? 0) + (a.matchDetails?.destDist ?? 0);
        const distB = (b.matchDetails?.sourceDist ?? 0) + (b.matchDetails?.destDist ?? 0);
        return distA - distB;
      });
    };

    const sortedExact = sortTrips(exactMatches);
    const sortedPartial = sortTrips(partialMatches);
    const sortedDeparture = sortTrips(nearbyDeparture);
    const sortedDestination = sortTrips(nearbyDestination);
    const sortedSimilar = sortTrips(similarRoutes);

    const allMatches = [...sortedExact, ...sortedPartial];

    const result = {
      exactMatches: sortedExact,
      partialMatches: sortedPartial,
      nearbyDeparture: sortedDeparture,
      nearbyDestination: sortedDestination,
      similarRoutes: sortedSimilar,
      allMatches,
    };

    await this.redisService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async findAll(query: TripQueryDto) {
    const { page = 1, limit = 10, status, vehicleId, ownerId } = query;

    const where: any = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;

    const [trips, total] = await this.tripRepository.findAndCount({
      where,
      relations: ['vehicle', 'vehicle.owner', 'driver', 'driver.user', 'routes', 'stops', 'seats', 'bookings'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: trips,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const key = `trip:details:${id}`;
    return this.coalescingService.execute(key, async () => {
      await this.cleanupExpiredReservations();
      const trip = await this.tripRepository.findOne({
        where: { id },
        relations: ['vehicle', 'vehicle.owner', 'driver', 'driver.user', 'routes', 'stops', 'seats', 'bookings'],
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      return trip;
    });
  }

  async findByOwner(ownerId: string) {
    await this.cleanupExpiredReservations();
    return this.tripRepository.find({
      where: { vehicle: { ownerId } },
      relations: ['vehicle', 'driver', 'driver.user', 'routes', 'stops', 'seats', 'bookings'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, userId: string, updateTripDto: UpdateTripDto, userRole?: string) {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(userRole || '');
    if (trip.vehicle.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only update your own trips');
    }

    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      throw new BadRequestException('Cannot update completed or cancelled trips');
    }

    Object.assign(trip, updateTripDto);
    await this.tripRepository.save(trip);

    return this.findById(id);
  }

  async updateStatus(id: string, userId: string, statusDto: UpdateTripStatusDto) {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['vehicle', 'driver', 'bookings'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.vehicle.ownerId !== userId && (!trip.driver || trip.driver.userId !== userId)) {
      throw new ForbiddenException('You are not authorized to update this trip status');
    }

    const allowedTransitions: Record<TripStatus, TripStatus[]> = {
      [TripStatus.SCHEDULED]: [TripStatus.ACTIVE, TripStatus.CANCELLED],
      [TripStatus.ACTIVE]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
      [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.DELAYED],
      [TripStatus.DELAYED]: [TripStatus.IN_PROGRESS, TripStatus.COMPLETED],
      [TripStatus.COMPLETED]: [],
      [TripStatus.CANCELLED]: [],
    };

    const currentStatus = trip.status;
    const newStatus = statusDto.status;

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    await this.tripRepository.manager.transaction(async (manager) => {
      trip.status = newStatus;

      if (newStatus === TripStatus.IN_PROGRESS) {
        trip.arrivalTime = new Date();
      }
      if (newStatus === TripStatus.COMPLETED) {
        trip.completedAt = new Date();
      }

      await manager.save(trip);

      // Notify passengers
      if (trip.bookings) {
        for (const booking of trip.bookings) {
          await this.notificationsService.sendNotification({
            userId: booking.passengerId,
            type: 'TRIP_STATUS',
            channel: 'PUSH',
            title: `Trip ${newStatus}`,
            message: `Your trip from ${trip.source} to ${trip.destination} is now ${newStatus}`,
            data: { tripId: trip.id, status: newStatus },
          });
        }
      }

      // Broadcast status update via WebSocket
      this.websocketGateway.broadcastTripUpdate(trip.id, {
        status: newStatus,
        updatedAt: new Date(),
      });

      // Emit Kafka events via Outbox
      if (newStatus === TripStatus.ACTIVE || newStatus === TripStatus.IN_PROGRESS) {
        await this.outboxService.saveEvent(manager, 'trip.started', {
          tripId: trip.id,
          status: newStatus,
          driverId: trip.driverId,
          vehicleId: trip.vehicleId,
          departureTime: trip.departureTime,
        });
      } else if (newStatus === TripStatus.COMPLETED) {
        await this.outboxService.saveEvent(manager, 'trip.completed', {
          tripId: trip.id,
          status: newStatus,
          driverId: trip.driverId,
          vehicleId: trip.vehicleId,
          completedAt: trip.completedAt,
        });
      }
    });

    return trip;
  }

  async assignDriver(id: string, userId: string, assignDto: AssignDriverDto) {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.vehicle.ownerId !== userId) {
      throw new ForbiddenException('You can only assign drivers to your own trips');
    }

    const driver = await this.driverRepository.findOne({
      where: { id: assignDto.driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    await this.tripRepository.manager.transaction(async (manager) => {
      trip.driverId = driver.id;
      await manager.save(trip);

      await this.notificationsService.sendNotification({
        userId: driver.userId,
        type: 'DRIVER_ASSIGNED',
        channel: 'PUSH',
        title: 'New Trip Assignment',
        message: `You have been assigned to a trip from ${trip.source} to ${trip.destination}`,
        data: { tripId: trip.id },
      });

      // Emit Kafka event via Outbox
      await this.outboxService.saveEvent(manager, 'driver.assigned', {
        tripId: trip.id,
        driverId: driver.id,
        userId: driver.userId,
        vehicleId: trip.vehicleId,
        departureTime: trip.departureTime,
      });
    });

    return trip;
  }

  async remove(id: string, userId: string, userRole?: string) {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(userRole || '');
    if (trip.vehicle.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only cancel your own trips');
    }

    if (trip.status === TripStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed trips');
    }

    if (trip.bookings && trip.bookings.length > 0) {
      throw new BadRequestException('Cannot delete trip with existing bookings');
    }

    await this.tripRepository.softRemove(trip);

    return { message: 'Trip cancelled successfully' };
  }

  async getTripSeats(tripId: string) {
    return this.seatRepository.find({
      where: { tripId },
      order: { seatNumber: 'ASC' },
    });
  }

  async recalculateTripSeats(tripId: string) {
    const totalSeats = await this.seatRepository.count({ where: { tripId } });
    const bookedSeats = await this.seatRepository.count({ where: { tripId, status: SeatStatus.BOOKED } });
    const availableSeats = await this.seatRepository.count({ where: { tripId, status: SeatStatus.AVAILABLE } });

    await this.tripRepository.update({ id: tripId }, {
      totalSeats,
      bookedSeats,
      availableSeats,
    });
  }

  async cleanupExpiredReservations() {
    const now = new Date();
    const expiredSeats = await this.seatRepository.find({
      where: {
        status: SeatStatus.RESERVED,
        reservedUntil: LessThan(now),
      },
    });

    if (expiredSeats.length === 0) {
      return;
    }

    const bookingIds = Array.from(new Set(expiredSeats.map((s) => s.bookingId).filter((id) => !!id)));
    const tripIds = Array.from(new Set(expiredSeats.map((s) => s.tripId)));

    // Release seats
    for (const seat of expiredSeats) {
      seat.status = SeatStatus.AVAILABLE;
      seat.bookingId = null;
      seat.reservedUntil = null;
      seat.gender = null;
      await this.seatRepository.save(seat);
    }

    // Cancel expired bookings
    if (bookingIds.length > 0) {
      const bookingRepository = this.tripRepository.manager.getRepository(Booking);
      await bookingRepository.update(
        {
          id: In(bookingIds),
          status: BookingStatus.PENDING,
        },
        {
          status: BookingStatus.CANCELLED,
          paymentStatus: BookingPaymentStatus.FAILED,
          cancellationReason: 'Payment session expired',
          cancelledAt: now,
        }
      );
    }

    // Recalculate trip seat counts
    for (const tripId of tripIds) {
      await this.recalculateTripSeats(tripId);
    }
  }
}