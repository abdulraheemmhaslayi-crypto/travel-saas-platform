import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Like, Raw, Not, IsNull } from 'typeorm';
import { Trip, TripStatus } from '../database/entities/trip.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { User } from '../database/entities/user.entity';
import { Booking } from '../database/entities/booking.entity';
import { TripSeat, SeatStatus } from '../database/entities/trip-seat.entity';
import { RedisService } from '../redis/redis.service';
import { CoalescingService } from '../coalesce/coalesce.service';
import {
  TripSearchQueryDto,
  SearchResultsDto,
  AutocompleteDto,
  SearchFiltersDto,
  TripSearchResult,
} from './search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly redisService: RedisService,
    private readonly coalescingService: CoalescingService,
  ) {}

  async searchTrips(query: TripSearchQueryDto): Promise<SearchResultsDto> {
    const cacheKey = `search:trips:${JSON.stringify(query)}`;
    return this.coalescingService.execute(cacheKey, async () => {
      const cached = await this.redisService.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const {
        source,
        destination,
        date,
        passengers = 1,
        vehicleType,
        minPrice,
        maxPrice,
        page = 1,
        limit = 20,
        sortBy = 'departureTime',
        sortOrder = 'asc',
      } = query;

      const skip = (page - 1) * limit;

      const qb = this.tripRepository.createQueryBuilder('trip')
        .leftJoinAndSelect('trip.routes', 'route')
        .leftJoinAndSelect('trip.vehicle', 'vehicle')
        .leftJoinAndSelect('trip.driver', 'driver')
        .leftJoinAndSelect('trip.seats', 'seats');

      if (source) {
        qb.andWhere('(trip.source ILIKE :source OR route.waypoint ILIKE :source)', { source: `%${source}%` });
      }

      if (destination) {
        qb.andWhere('(trip.destination ILIKE :destination OR route.waypoint ILIKE :destination)', { destination: `%${destination}%` });
      }

      if (date) {
        const searchDate = new Date(date);
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);
        qb.andWhere('trip.departureTime BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay });
      }

      qb.andWhere('trip.status = :status', { status: TripStatus.SCHEDULED });

      if (passengers && passengers > 1) {
        qb.andWhere('trip.availableSeats >= :passengers', { passengers });
      }

      if (vehicleType) {
        qb.andWhere('vehicle.type = :vehicleType', { vehicleType });
      }

      if (minPrice) {
        qb.andWhere('trip.basePrice >= :minPrice', { minPrice });
      }

      if (maxPrice) {
        qb.andWhere('trip.basePrice <= :maxPrice', { maxPrice });
      }

      // Sorting
      const sortColumn = this.getSortColumn(sortBy);
      qb.orderBy(sortColumn, sortOrder.toUpperCase() as 'ASC' | 'DESC');

      const [trips, total] = await qb.skip(skip).take(limit).getManyAndCount();

      const results: TripSearchResult[] = trips.map((trip) => ({
        id: trip.id,
        source: trip.source,
        destination: trip.destination,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        duration: trip.estimatedDuration,
        price: trip.basePrice,
        vehicleType: trip.vehicle?.type,
        vehicleName: trip.vehicle ? `${trip.vehicle.brand} ${trip.vehicle.model}` : trip.vehicle?.registrationNumber,
        amenities: Array.isArray(trip.vehicle?.amenities) ? trip.vehicle.amenities : [],
        availableSeats: trip.seats?.filter((s) => s.status === SeatStatus.AVAILABLE).length || 0,
        totalSeats: trip.totalSeats,
        rating: 0,
        operatorName: trip.vehicle?.fleetCompany?.name || 'Travel SaaS',
        cancellationPolicy: trip.cancellationPolicy,
      }));

      const response: SearchResultsDto = {
        data: results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      await this.redisService.set(cacheKey, JSON.stringify(response), 300);
      return response;
    });
  }

  private getSortColumn(sortBy: string): string {
    const map: Record<string, string> = {
      price: 'trip.basePrice',
      departureTime: 'trip.departureTime',
      duration: 'trip.estimatedDuration',
      rating: 'vehicle.averageRating',
    };
    return map[sortBy] || 'trip.departureTime';
  }

  async globalSearch(
    query: string,
    types?: string[],
    page = 1,
    limit = 20,
  ): Promise<SearchResultsDto> {
    const searchTypes = types || ['trips', 'users', 'vehicles'];
    const results: any[] = [];
    let total = 0;

    const searchPattern = `%${query}%`;

    if (searchTypes.includes('trips')) {
      const tripQuery = this.tripRepository
        .createQueryBuilder('trip')
        .leftJoinAndSelect('trip.routes', 'route')
        .leftJoinAndSelect('trip.vehicle', 'vehicle')
        .where('(trip.source ILIKE :pattern OR route.waypoint ILIKE :pattern)', { pattern: searchPattern })
        .orWhere('(trip.destination ILIKE :pattern OR route.waypoint ILIKE :pattern)', { pattern: searchPattern })
        .orWhere('vehicle.registrationNumber LIKE :pattern', { pattern: searchPattern })
        .skip((page - 1) * limit)
        .take(limit);

      const [trips, tripCount] = await tripQuery.getManyAndCount();
      results.push(...trips.map((t) => ({ type: 'trip', data: t })));
      total += tripCount;
    }

    if (searchTypes.includes('users')) {
      const [users, userCount] = await this.userRepository.findAndCount({
        where: [
          { firstName: Like(searchPattern) },
          { lastName: Like(searchPattern) },
          { email: Like(searchPattern) },
          { phone: Like(searchPattern) },
        ],
        skip: (page - 1) * limit,
        take: limit,
      });
      results.push(...users.map((u) => ({ type: 'user', data: u })));
      total += userCount;
    }

    if (searchTypes.includes('vehicles')) {
      const [vehicles, vehicleCount] = await this.vehicleRepository.findAndCount({
        where: [
          { registrationNumber: Like(searchPattern) },
          { model: Like(searchPattern) },
          { brand: Like(searchPattern) },
        ],
        skip: (page - 1) * limit,
        take: limit,
      });
      results.push(...vehicles.map((v) => ({ type: 'vehicle', data: v })));
      total += vehicleCount;
    }

    return {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async autocomplete(query: string, type?: string): Promise<AutocompleteDto[]> {
    if (!query || query.length < 2) return [];

    const cacheKey = `autocomplete:${type || 'all'}:${query.toLowerCase()}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const suggestions: AutocompleteDto[] = [];
    const searchPattern = `%${query}%`;

    if (!type || type === 'location') {
      // Get unique sources and destinations from routes
      const routeSources = await this.tripRepository
        .createQueryBuilder('trip')
        .select('DISTINCT trip.source', 'name')
        .addSelect("'source' as type")
        .where('trip.source ILIKE :pattern', { pattern: searchPattern })
        .limit(5)
        .getRawMany();

      const routeDestinations = await this.tripRepository
        .createQueryBuilder('trip')
        .select('DISTINCT trip.destination', 'name')
        .addSelect("'destination' as type")
        .where('trip.destination ILIKE :pattern', { pattern: searchPattern })
        .limit(5)
        .getRawMany();

      suggestions.push(
        ...routeSources.map((r) => ({ text: r.name, type: 'location', subtype: 'source' })),
        ...routeDestinations.map((r) => ({ text: r.name, type: 'location', subtype: 'destination' })),
      );
    }

    if (!type || type === 'vehicle') {
      const vehicles = await this.vehicleRepository.find({
        where: [
          { registrationNumber: Like(searchPattern) },
          { brand: Like(searchPattern) },
          { model: Like(searchPattern) },
        ],
        take: 5,
      });

      suggestions.push(
        ...vehicles.map((v) => ({
          text: v.brand ? `${v.brand} ${v.model}` : v.registrationNumber,
          type: 'vehicle',
          id: v.id,
        })),
      );
    }

    if (!type || type === 'user') {
      const users = await this.userRepository.find({
        where: [
          { firstName: Like(searchPattern) },
          { lastName: Like(searchPattern) },
          { email: Like(searchPattern) },
        ],
        take: 5,
      });

      suggestions.push(
        ...users.map((u) => ({
          text: `${u.firstName} ${u.lastName}`.trim(),
          type: 'user',
          id: u.id,
          subtitle: u.email,
        })),
      );
    }

    const unique = suggestions
      .filter((item, index, self) => self.findIndex((t) => t.text === item.text) === index)
      .slice(0, 10);

    await this.redisService.set(cacheKey, JSON.stringify(unique), 300);
    return unique;
  }

  async getPopularRoutes(limit = 10): Promise<{ source: string; destination: string; count: number; avgPrice: number }[]> {
    const cacheKey = `popular:routes:${limit}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const results = await this.bookingRepository
        .createQueryBuilder('booking')
        .select('trip.source', 'source')
        .addSelect('trip.destination', 'destination')
        .addSelect('COUNT(booking.id)', 'count')
        .addSelect('AVG(booking.totalPrice)', 'avgPrice')
        .innerJoin('booking.trip', 'trip')
        .where('booking.status = :status', { status: 'COMPLETED' })
        .andWhere('trip.source IS NOT NULL AND trip.destination IS NOT NULL')
        .groupBy('trip.source, trip.destination')
        .orderBy('count', 'DESC')
        .limit(limit)
        .getRawMany();

      if (results && results.length > 0) {
        const formatted = results.map((r) => ({
          source: r.source,
          destination: r.destination,
          count: parseInt(r.count || '0', 10),
          avgPrice: Math.round(parseFloat(r.avgPrice || '0') * 100) / 100,
        }));
        await this.redisService.set(cacheKey, JSON.stringify(formatted), 3600);
        return formatted;
      }
    } catch (err) {
      this.logger.warn(`Failed to query popular routes from bookings: ${err?.message || err}`);
    }

    try {
      const tripResults = await this.tripRepository
        .createQueryBuilder('trip')
        .select('trip.source', 'source')
        .addSelect('trip.destination', 'destination')
        .addSelect('COUNT(trip.id)', 'count')
        .addSelect('AVG(trip.pricePerSeat)', 'avgPrice')
        .where('trip.source IS NOT NULL AND trip.destination IS NOT NULL')
        .groupBy('trip.source, trip.destination')
        .orderBy('count', 'DESC')
        .limit(limit)
        .getRawMany();

      if (tripResults && tripResults.length > 0) {
        const formatted = tripResults.map((r) => ({
          source: r.source,
          destination: r.destination,
          count: parseInt(r.count || '0', 10),
          avgPrice: Math.round(parseFloat(r.avgPrice || '0') * 100) / 100,
        }));
        await this.redisService.set(cacheKey, JSON.stringify(formatted), 3600);
        return formatted;
      }
    } catch (err) {
      this.logger.warn(`Failed to query popular routes from trips: ${err?.message || err}`);
    }

    const defaultRoutes = [
      { source: 'Mumbai', destination: 'Pune', count: 120, avgPrice: 450 },
      { source: 'Delhi', destination: 'Jaipur', count: 95, avgPrice: 650 },
      { source: 'Bangalore', destination: 'Mysore', count: 85, avgPrice: 350 },
      { source: 'Hyderabad', destination: 'Vijayawada', count: 70, avgPrice: 500 },
    ];
    await this.redisService.set(cacheKey, JSON.stringify(defaultRoutes), 3600);
    return defaultRoutes;
  }

  async getAvailableFilters(): Promise<SearchFiltersDto> {
    const cacheKey = 'search:filters';
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [vehicleTypes, priceRange, vehiclesWithAmenities] = await Promise.all([
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .select('DISTINCT vehicle.type', 'type')
        .getRawMany()
        .then((results) => results.map((r) => r.type)),

      this.tripRepository
        .createQueryBuilder('trip')
        .select('MIN(trip.basePrice)', 'min')
        .addSelect('MAX(trip.basePrice)', 'max')
        .getRawOne()
        .then((r) => ({ min: parseFloat(r.min) || 0, max: parseFloat(r.max) || 0 })),

      this.vehicleRepository.find({
        where: { amenities: Not(IsNull()) } as any,
        select: ['amenities'],
      }),
    ]);

    const amenitySet = new Set<string>();
    for (const vehicle of vehiclesWithAmenities) {
      const amenities = vehicle.amenities;
      if (!amenities) continue;

      if (Array.isArray(amenities)) {
        amenities.forEach((amenity) => {
          if (amenity) amenitySet.add(String(amenity));
        });
        continue;
      }

      if (typeof amenities === 'object') {
        Object.values(amenities).forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach((amenity) => {
              if (amenity) amenitySet.add(String(amenity));
            });
          } else if (value) {
            amenitySet.add(String(value));
          }
        });
      }
    }

    const filters: SearchFiltersDto = {
      vehicleTypes,
      priceRange,
      amenities: Array.from(amenitySet),
      sortOptions: [
        { value: 'price', label: 'Price' },
        { value: 'departureTime', label: 'Departure Time' },
        { value: 'duration', label: 'Duration' },
        { value: 'rating', label: 'Rating' },
      ],
    };

    await this.redisService.set(cacheKey, JSON.stringify(filters), 3600);
    return filters;
  }

  async getRecentSearches(userId: string): Promise<string[]> {
    const key = `recent:searches:${userId}`;
    const searches = await this.redisService.lrange(key, 0, 9);
    return searches;
  }

  async saveRecentSearch(userId: string, query: string): Promise<void> {
    const key = `recent:searches:${userId}`;
    await this.redisService.lpush(key, query);
    // Keep only last 10 searches
    await this.redisService.getClient().ltrim(key, 0, 9);
    await this.redisService.expire(key, 86400 * 30); // 30 days
  }
}