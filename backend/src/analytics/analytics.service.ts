import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThanOrEqual } from "typeorm";
import { Booking, BookingStatus } from "../database/entities/booking.entity";
import { Payment, PaymentStatus } from "../database/entities/payment.entity";
import { Trip, TripStatus } from "../database/entities/trip.entity";
import { User } from "../database/entities/user.entity";
import { Vehicle, VehicleStatus } from "../database/entities/vehicle.entity";
import { WalletTransaction } from "../database/entities/wallet-transaction.entity";
import {
  SupportTicket,
  TicketStatus,
} from "../database/entities/support-ticket.entity";
import { RoleName } from "../database/entities/role.entity";
// import { RedisService } from '../redis/redis.service';
import {
  DashboardMetricsDto,
  RevenueAnalyticsDto,
  BookingAnalyticsDto,
  UserAnalyticsDto,
  VehicleUtilizationDto,
  TripPerformanceDto,
  AnalyticsResponseDto,
  RevenueDataPoint,
  BookingStatusBreakdown,
  UserGrowthDataPoint,
  RevenueQueryDto,
} from "./dto/analytics.dto";
import { RedisService } from "@/redis/redis.service";

import {
  MaterializedAnalytics,
  PeriodType,
} from "../database/entities/materialized-analytics.entity";

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepository: Repository<SupportTicket>,
    @InjectRepository(MaterializedAnalytics)
    private readonly materializedRepository: Repository<MaterializedAnalytics>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Increments metrics inside materialized analytics tables.
   */
  async updateMetrics(
    periodType: PeriodType,
    dateKey: string,
    increments: {
      revenue?: number;
      bookings?: number;
      trips?: number;
      users?: number;
    },
  ): Promise<void> {
    let row = await this.materializedRepository.findOne({
      where: { periodType, dateKey },
    });

    if (!row) {
      row = this.materializedRepository.create({
        periodType,
        dateKey,
        totalRevenue: 0,
        totalBookings: 0,
        totalTrips: 0,
        activeUsers: 0,
      });
    }

    if (increments.revenue !== undefined) {
      row.totalRevenue = Number(row.totalRevenue) + increments.revenue;
    }
    if (increments.bookings !== undefined) {
      row.totalBookings = Number(row.totalBookings) + increments.bookings;
    }
    if (increments.trips !== undefined) {
      row.totalTrips = Number(row.totalTrips) + increments.trips;
    }
    if (increments.users !== undefined) {
      row.activeUsers = Number(row.activeUsers) + increments.users;
    }

    await this.materializedRepository.save(row);
  }

  /**
   * Translates events to metrics increments across daily, weekly, monthly tables.
   */
  async handleEventMetrics(event: {
    type: "booking" | "payment" | "user" | "trip";
    amount?: number;
    delta?: number;
  }): Promise<void> {
    const now = new Date();
    const dailyKey = now.toISOString().split("T")[0];

    const getWeekNumber = (d: Date) => {
      const target = new Date(d.valueOf());
      const dayNr = (d.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
      }
      return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    };

    const weeklyKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    const monthlyKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const keys = [
      { type: PeriodType.DAILY, key: dailyKey },
      { type: PeriodType.WEEKLY, key: weeklyKey },
      { type: PeriodType.MONTHLY, key: monthlyKey },
    ];

    const increments: any = {};
    if (event.type === "booking") {
      increments.totalBookings = event.delta || 1;
    } else if (event.type === "payment") {
      increments.totalRevenue = event.amount || 0;
    } else if (event.type === "trip") {
      increments.totalTrips = event.delta || 1;
    } else if (event.type === "user") {
      increments.activeUsers = event.delta || 1;
    }

    for (const k of keys) {
      await this.updateMetrics(k.type, k.key, {
        revenue: increments.totalRevenue,
        bookings: increments.totalBookings,
        trips: increments.totalTrips,
        users: increments.activeUsers,
      });
    }
  }

  async getDashboardMetrics(
    days: number,
    fleetCompanyId?: string,
  ): Promise<DashboardMetricsDto> {
    const cacheKey = `dashboard:${days}:${fleetCompanyId || "all"}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const baseWhere = fleetCompanyId
      ? { fleetCompany: { id: fleetCompanyId } }
      : {};

    // 1. Read from Materialized read models
    const startKey = startDate.toISOString().split("T")[0];
    const endKey = endDate.toISOString().split("T")[0];

    const materializedResults = await this.materializedRepository.find({
      where: {
        periodType: PeriodType.DAILY,
        dateKey: Between(startKey, endKey),
      },
    });

    if (materializedResults.length > 0 && !fleetCompanyId) {
      let totalRevenue = 0;
      let totalBookings = 0;
      let totalTrips = 0;
      let activeUsers = 0;

      for (const row of materializedResults) {
        totalRevenue += Number(row.totalRevenue);
        totalBookings += Number(row.totalBookings);
        totalTrips += Number(row.totalTrips);
        activeUsers = Math.max(activeUsers, Number(row.activeUsers));
      }

      const [totalVehicles, activeVehicles, pendingTickets] = await Promise.all(
        [
          this.vehicleRepository.count({ where: baseWhere }),
          this.vehicleRepository.count({
            where: { status: VehicleStatus.ACTIVE, ...baseWhere },
          }),
          this.supportTicketRepository.count({
            where: { status: TicketStatus.OPEN },
          }),
        ],
      );

      const metrics: DashboardMetricsDto = {
        totalRevenue,
        totalBookings,
        totalTrips,
        activeUsers,
        totalVehicles,
        activeVehicles,
        pendingTickets,
        completionRate: await this.getCompletionRate(
          startDate,
          endDate,
          fleetCompanyId,
        ),
        averageRating: await this.getAverageRating(fleetCompanyId),
        revenueGrowth: await this.getRevenueGrowth(days, fleetCompanyId),
        bookingGrowth: await this.getBookingGrowth(days, fleetCompanyId),
        period: { startDate, endDate, days },
      };

      await this.redisService.set(cacheKey, JSON.stringify(metrics), 300);
      return metrics;
    }

    // 2. Fallback to raw tables
    const [
      totalRevenue,
      totalBookings,
      totalTrips,
      activeUsers,
      totalVehicles,
      activeVehicles,
      pendingTickets,
      completionRate,
    ] = await Promise.all([
      this.getTotalRevenue(startDate, endDate, fleetCompanyId),
      this.bookingRepository.count({
        where: { createdAt: Between(startDate, endDate), ...baseWhere },
      }),
      this.tripRepository.count({
        where: { departureTime: Between(startDate, endDate), ...baseWhere },
      }),
      this.userRepository.count({
        where: {
          lastLoginAt: MoreThanOrEqual(startDate),
          role: { name: RoleName.PASSENGER },
        },
      }),
      this.vehicleRepository.count({
        where: { ...baseWhere },
      }),
      this.vehicleRepository.count({
        where: { status: VehicleStatus.ACTIVE, ...baseWhere },
      }),
      this.supportTicketRepository.count({
        where: { status: TicketStatus.OPEN },
      }),
      this.getCompletionRate(startDate, endDate, fleetCompanyId),
    ]);

    const metrics: DashboardMetricsDto = {
      totalRevenue,
      totalBookings,
      totalTrips,
      activeUsers,
      totalVehicles,
      activeVehicles,
      pendingTickets,
      completionRate,
      averageRating: await this.getAverageRating(fleetCompanyId),
      revenueGrowth: await this.getRevenueGrowth(days, fleetCompanyId),
      bookingGrowth: await this.getBookingGrowth(days, fleetCompanyId),
      period: { startDate, endDate, days },
    };

    await this.redisService.set(cacheKey, JSON.stringify(metrics), 300);
    return metrics;
  }

  private async getTotalRevenue(
    startDate: Date,
    endDate: Date,
    fleetCompanyId?: string,
  ): Promise<number> {
    const query = this.paymentRepository
      .createQueryBuilder("payment")
      .select("COALESCE(SUM(payment.amount), 0)", "total")
      .where("payment.status = :status", { status: "COMPLETED" })
      .andWhere("payment.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });

    if (fleetCompanyId) {
      query
        .innerJoin("payment.booking", "booking")
        .innerJoin("booking.trip", "trip")
        .andWhere("trip.fleetCompanyId = :fleetCompanyId", { fleetCompanyId });
    }

    const result = await query.getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getCompletionRate(
    startDate: Date,
    endDate: Date,
    fleetCompanyId?: string,
  ): Promise<number> {
    const baseWhere = fleetCompanyId
      ? { fleetCompany: { id: fleetCompanyId } }
      : {};

    const [completed, total] = await Promise.all([
      this.bookingRepository.count({
        where: {
          status: BookingStatus.COMPLETED,
          createdAt: Between(startDate, endDate),
          ...baseWhere,
        },
      }),
      this.bookingRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
          ...baseWhere,
        },
      }),
    ]);

    return total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;
  }

  private async getAverageRating(fleetCompanyId?: string): Promise<number> {
    const query = this.bookingRepository
      .createQueryBuilder("booking")
      .select("COALESCE(AVG(rating.score), 0)", "avg")
      .leftJoin("booking.rating", "rating")
      .where("booking.status = :status", { status: "COMPLETED" });

    if (fleetCompanyId) {
      query
        .innerJoin("booking.trip", "trip")
        .andWhere("trip.fleetCompanyId = :fleetCompanyId", { fleetCompanyId });
    }

    const result = await query.getRawOne();
    return Math.round(parseFloat(result.avg) * 100) / 100 || 0;
  }

  private async getRevenueGrowth(
    days: number,
    fleetCompanyId?: string,
  ): Promise<number> {
    const currentEnd = new Date();
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - days);

    const prevEnd = new Date(currentStart);
    const prevStart = new Date();
    prevStart.setDate(prevStart.getDate() - days * 2);

    const [current, previous] = await Promise.all([
      this.getTotalRevenue(currentStart, currentEnd, fleetCompanyId),
      this.getTotalRevenue(prevStart, prevEnd, fleetCompanyId),
    ]);

    return previous > 0
      ? Math.round(((current - previous) / previous) * 100 * 100) / 100
      : 0;
  }

  private async getBookingGrowth(
    days: number,
    fleetCompanyId?: string,
  ): Promise<number> {
    const baseWhere = fleetCompanyId
      ? { fleetCompany: { id: fleetCompanyId } }
      : {};
    const currentEnd = new Date();
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - days);

    const prevEnd = new Date(currentStart);
    const prevStart = new Date();
    prevStart.setDate(prevStart.getDate() - days * 2);

    const [current, previous] = await Promise.all([
      this.bookingRepository.count({
        where: { createdAt: Between(currentStart, currentEnd), ...baseWhere },
      }),
      this.bookingRepository.count({
        where: { createdAt: Between(prevStart, prevEnd), ...baseWhere },
      }),
    ]);

    return previous > 0
      ? Math.round(((current - previous) / previous) * 100 * 100) / 100
      : 0;
  }

  async getRevenueAnalytics(
    queryDto: RevenueQueryDto,
    fleetCompanyId?: string,
  ): Promise<RevenueAnalyticsDto> {
    let start: Date;
    let end: Date;
    let groupBy: "day" | "week" | "month" | "year";

    if (queryDto.startDate && queryDto.endDate) {
      start = new Date(queryDto.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(queryDto.endDate);
      end.setHours(23, 59, 59, 999);
      groupBy = queryDto.groupBy || "day";
    } else {
      const dates = this.getDatesForPeriod(queryDto.period);
      start = dates.startDate;
      end = dates.endDate;
      groupBy = queryDto.groupBy || dates.groupBy;
    }

    const dateFormat = this.getDateFormat(groupBy);

    const query = this.paymentRepository
      .createQueryBuilder("payment")
      .select(`TO_CHAR(payment.createdAt, '${dateFormat}')`, "date_group")
      .addSelect("COALESCE(SUM(payment.amount), 0)", "revenue")
      .addSelect("COUNT(payment.id)", "transactionCount")
      .where("payment.status = :status", { status: "COMPLETED" })
      .andWhere("payment.createdAt BETWEEN :start AND :end", { start, end })
      .groupBy("date_group")
      .orderBy("date_group", "ASC");

    if (fleetCompanyId) {
      query
        .innerJoin("payment.booking", "booking")
        .innerJoin("booking.trip", "trip")
        .andWhere("trip.fleetCompanyId = :fleetCompanyId", { fleetCompanyId });
    }

    const rawData = await query.getRawMany();

    const dataPoints: RevenueDataPoint[] = rawData.map((row) => ({
      date: row.date_group,
      revenue: parseFloat(row.revenue) || 0,
      transactionCount: parseInt(row.transactionCount) || 0,
    }));

    const totalRevenue = dataPoints.reduce((sum, dp) => sum + dp.revenue, 0);
    const averageDaily =
      dataPoints.length > 0 ? totalRevenue / dataPoints.length : 0;

    const methodQuery = this.paymentRepository
      .createQueryBuilder("payment")
      .select("payment.paymentMethod", "method")
      .addSelect("COALESCE(SUM(payment.amount), 0)", "amount")
      .addSelect("COUNT(payment.id)", "count")
      .where("payment.status = :status", { status: "COMPLETED" })
      .andWhere("payment.createdAt BETWEEN :start AND :end", { start, end })
      .groupBy("payment.paymentMethod");

    if (fleetCompanyId) {
      methodQuery
        .innerJoin("payment.booking", "booking")
        .innerJoin("booking.trip", "trip")
        .andWhere("trip.fleetCompanyId = :fleetCompanyId", { fleetCompanyId });
    }

    const methodBreakdown = await methodQuery.getRawMany();

    return {
      totalRevenue,
      averageDaily: Math.round(averageDaily * 100) / 100,
      dataPoints,
      paymentMethodBreakdown: methodBreakdown.map((m) => ({
        method: m.method,
        amount: parseFloat(m.amount) || 0,
        percentage:
          totalRevenue > 0
            ? Math.round((parseFloat(m.amount) / totalRevenue) * 10000) / 100
            : 0,
      })),
      period: {
        startDate: start,
        endDate: end,
        days: Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        ),
      },
    };
  }

  private getDatesForPeriod(period?: string): {
    startDate: Date;
    endDate: Date;
    groupBy: "day" | "week" | "month" | "year";
  } {
    const endDate = new Date();
    let startDate = new Date();
    let groupBy: "day" | "week" | "month" | "year" = "day";

    switch (period) {
      case "7days":
        startDate.setDate(endDate.getDate() - 7);
        groupBy = "day";
        break;
      case "30days":
        startDate.setDate(endDate.getDate() - 30);
        groupBy = "day";
        break;
      case "3months":
        startDate.setMonth(endDate.getMonth() - 3);
        groupBy = "week";
        break;
      case "6months":
        startDate.setMonth(endDate.getMonth() - 6);
        groupBy = "month";
        break;
      case "12months":
        startDate.setMonth(endDate.getMonth() - 12);
        groupBy = "month";
        break;
      case "thisMonth":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        groupBy = "day";
        break;
      case "thisYear":
        startDate = new Date(endDate.getFullYear(), 0, 1);
        groupBy = "month";
        break;
      default:
        // Default to last 30 days
        startDate.setDate(endDate.getDate() - 30);
        groupBy = "day";
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate, groupBy };
  }

  private getDateFormat(groupBy: string): string {
    switch (groupBy) {
      case "day":
        return "YYYY-MM-DD";
      case "week":
        return "IYYY-IW";
      case "month":
        return "YYYY-MM";
      case "year":
        return "YYYY";
      default:
        return "YYYY-MM-DD";
    }
  }

  async getBookingAnalytics(
    days: number,
    status?: BookingStatus,
    fleetCompanyId?: string,
  ): Promise<BookingAnalyticsDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const baseWhere = fleetCompanyId
      ? { fleetCompany: { id: fleetCompanyId } }
      : {};
    const statusWhere = status ? { status } : {};

    const [totalBookings, statusBreakdown, dailyBookings, topRoutes] =
      await Promise.all([
        this.bookingRepository.count({
          where: {
            createdAt: Between(startDate, endDate),
            ...baseWhere,
            ...statusWhere,
          },
        }),
        this.getBookingStatusBreakdown(startDate, endDate, fleetCompanyId),
        this.getDailyBookings(startDate, endDate, fleetCompanyId),
        this.getTopRoutes(startDate, endDate, fleetCompanyId),
      ]);

    return {
      totalBookings,
      statusBreakdown,
      dailyBookings,
      topRoutes,
      averageBookingValue: await this.getAverageBookingValue(
        startDate,
        endDate,
        fleetCompanyId,
      ),
      cancellationRate: await this.getCancellationRate(
        startDate,
        endDate,
        fleetCompanyId,
      ),
      period: { startDate, endDate, days },
    };
  }

  private async getBookingStatusBreakdown(
    startDate: Date,
    endDate: Date,
    fleetCompanyId?: string,
  ): Promise<BookingStatusBreakdown[]> {
    const query = this.bookingRepository
      .createQueryBuilder("booking")
      .select("booking.status", "status")
      .addSelect("COUNT(booking.id)", "count")
      .where("booking.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .groupBy("booking.status");

    if (fleetCompanyId) {
      query
        .innerJoin("booking.trip", "trip")
        .andWhere("trip.fleetCompanyId = :fleetCompanyId", { fleetCompanyId });
    }

    const results = await query.getRawMany();
    const total = results.reduce((sum, r) => sum + parseInt(r.count), 0);

    return results.map((r) => ({
      status: r.status,
      count: parseInt(r.count),
      percentage:
        total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  private async getDailyBookings(
    startDate: Date,
    endDate: Date,
    fleetCompanyId?: string,
  ): Promise<{ date: string; bookings: number; revenue: number }[]> {
    const query = this.bookingRepository
      .createQueryBuilder("booking")
      .select("TO_CHAR(booking.createdAt, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(booking.id)", "bookings")
      .addSelect("COALESCE(SUM(booking.totalPrice), 0)", "revenue")
      .where("booking.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .groupBy("date")
      .orderBy("date", "ASC");

    if (fleetCompanyId) {
      query
        .innerJoin("booking.trip", "trip")
        .andWhere("trip.fleetCompanyId = :fleetCompanyId", { fleetCompanyId });
    }

    const results = await query.getRawMany();
    return results.map((r) => ({
      date: r.date,
      bookings: parseInt(r.bookings),
      revenue: parseFloat(r.revenue) || 0,
    }));
  }

  private async getTopRoutes(
    startDate: Date,
    endDate: Date,
    fleetCompanyId?: string,
    limit = 10,
  ): Promise<{ routeName: string; bookings: number; revenue: number }[]> {
    const query = this.bookingRepository
      .createQueryBuilder("booking")
      .select(
        'CONCAT(trip.source, " → ", trip.destination)',
        "routeName",
      )
      .addSelect("COUNT(booking.id)", "bookings")
      .addSelect("COALESCE(SUM(booking.totalPrice), 0)", "revenue")
      .innerJoin("booking.trip", "trip")
      
      .where("booking.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .groupBy("routeName")
      .orderBy("bookings", "DESC")
      .limit(limit);

    if (fleetCompanyId) {
      query.andWhere("trip.fleetCompanyId = :fleetCompanyId", {
        fleetCompanyId,
      });
    }

    const results = await query.getRawMany();
    return results.map((r) => ({
      routeName: r.routeName,
      bookings: parseInt(r.bookings),
      revenue: parseFloat(r.revenue) || 0,
    }));
  }

  private async getAverageBookingValue(
    startDate: Date,
    endDate: Date,
    fleetCompanyId?: string,
  ): Promise<number> {
    const query = this.bookingRepository
      .createQueryBuilder("booking")
      .select("COALESCE(AVG(booking.totalPrice), 0)", "avg")
      .where("booking.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });

    if (fleetCompanyId) {
      query
        .innerJoin("booking.trip", "trip")
        .andWhere("trip.fleetCompanyId = :fleetCompanyId", { fleetCompanyId });
    }

    const result = await query.getRawOne();
    return Math.round(parseFloat(result.avg) * 100) / 100 || 0;
  }

  private async getCancellationRate(
    startDate: Date,
    endDate: Date,
    fleetCompanyId?: string,
  ): Promise<number> {
    const baseWhere = fleetCompanyId
      ? { fleetCompany: { id: fleetCompanyId } }
      : {};

    const [cancelled, total] = await Promise.all([
      this.bookingRepository.count({
        where: {
          status: BookingStatus.CANCELLED,
          createdAt: Between(startDate, endDate),
          ...baseWhere,
        },
      }),
      this.bookingRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
          ...baseWhere,
        },
      }),
    ]);

    return total > 0 ? Math.round((cancelled / total) * 10000) / 100 : 0;
  }

  async getUserAnalytics(days: number): Promise<UserAnalyticsDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalUsers, newUsers, activeUsers, userGrowth, retentionRate] =
      await Promise.all([
        this.userRepository.count({
          where: { role: { name: RoleName.PASSENGER } },
        }),
        this.userRepository.count({
          where: {
            createdAt: Between(startDate, endDate),
            role: { name: RoleName.PASSENGER },
          },
        }),
        this.userRepository.count({
          where: {
            lastLoginAt: MoreThanOrEqual(startDate),
            role: { name: RoleName.PASSENGER },
          },
        }),
        this.getUserGrowthData(startDate, endDate),
        this.getRetentionRate(days),
      ]);

    const roleDistribution = await this.userRepository
      .createQueryBuilder("user")
      .select("role.name", "role")
      .addSelect("COUNT(user.id)", "count")
      .innerJoin("user.role", "role")
      .groupBy("role.name")
      .getRawMany();

    return {
      totalUsers,
      newUsers,
      activeUsers,
      retentionRate,
      userGrowth,
      roleDistribution: roleDistribution.map((r) => ({
        role: r.role,
        count: parseInt(r.count),
      })),
      period: { startDate, endDate, days },
    };
  }

  private async getUserGrowthData(
    startDate: Date,
    endDate: Date,
  ): Promise<UserGrowthDataPoint[]> {
    const results = await this.userRepository
      .createQueryBuilder("user")
      .select("TO_CHAR(user.createdAt, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(user.id)", "newUsers")
      .where("user.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("user.role = :roleId", { roleId: 2 })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      newUsers: parseInt(r.newUsers),
    }));
  }

  private async getRetentionRate(days: number): Promise<number> {
    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);

    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    const [previousActive, retained] = await Promise.all([
      this.userRepository.count({
        where: {
          lastLoginAt: Between(previousPeriodStart, periodStart),
          role: { name: RoleName.PASSENGER },
        },
      }),
      this.userRepository.count({
        where: {
          lastLoginAt: Between(previousPeriodStart, now),
          role: { name: RoleName.PASSENGER },
        },
      }),
    ]);

    return previousActive > 0
      ? Math.round((retained / previousActive) * 10000) / 100
      : 0;
  }

  async getVehicleUtilization(
    days: number,
    fleetCompanyId?: string,
  ): Promise<VehicleUtilizationDto[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where = fleetCompanyId
      ? { fleetCompany: { id: fleetCompanyId } }
      : {};

    const vehicles = await this.vehicleRepository.find({
      where,
      relations: ["trips", "trips.bookings"],
    });

    return vehicles.map((vehicle) => {
      const relevantTrips =
        vehicle.trips?.filter(
          (trip) =>
            trip.departureTime >= startDate && trip.departureTime <= endDate,
        ) || [];

      const totalSeats = relevantTrips.reduce(
        (sum, trip) => sum + (trip.totalSeats || 0),
        0,
      );
      const bookedSeats = relevantTrips.reduce(
        (sum, trip) =>
          sum +
          (trip.bookings?.filter(
            (b) =>
              b.status === BookingStatus.CONFIRMED ||
              b.status === BookingStatus.COMPLETED,
          ).length || 0),
        0,
      );

      const utilizationRate =
        totalSeats > 0
          ? Math.round((bookedSeats / totalSeats) * 10000) / 100
          : 0;

      const totalRevenue = relevantTrips.reduce(
        (sum, trip) =>
          sum +
          (trip.bookings
            ?.filter((b) => b.status === BookingStatus.COMPLETED)
            .reduce((s, b) => s + (b.finalAmount || 0), 0) || 0),
        0,
      );

      return {
        vehicleId: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        type: vehicle.type,
        totalTrips: relevantTrips.length,
        totalSeats,
        bookedSeats,
        utilizationRate,
        totalRevenue,
        averageTripDuration: this.calculateAverageTripDuration(relevantTrips),
        maintenanceDowntime: vehicle.maintenanceDowntime || 0,
      };
    });
  }

  private calculateAverageTripDuration(trips: Trip[]): number {
    if (!trips.length) return 0;
    const totalMinutes = trips.reduce((sum, trip) => {
      if (trip.arrivalTime && trip.departureTime) {
        return (
          sum +
          (new Date(trip.arrivalTime).getTime() -
            new Date(trip.departureTime).getTime()) /
            (1000 * 60)
        );
      }
      return sum;
    }, 0);
    return Math.round((totalMinutes / trips.length) * 100) / 100;
  }

  async getTripPerformance(
    days: number,
    routeId?: string,
    fleetCompanyId?: string,
  ): Promise<TripPerformanceDto[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = this.tripRepository
      .createQueryBuilder("trip")
      .leftJoinAndSelect("trip.routes", "routes")
      .leftJoinAndSelect("trip.bookings", "bookings")
      .leftJoinAndSelect("trip.vehicle", "vehicle")
      .where("trip.departureTime BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });

    if (routeId) {
      query.andWhere("trip.routeId = :routeId", { routeId });
    }

    if (fleetCompanyId) {
      query.andWhere("trip.fleetCompanyId = :fleetCompanyId", {
        fleetCompanyId,
      });
    }

    const trips = await query.getMany();

    return trips.map((trip) => {
      const confirmedBookings =
        trip.bookings?.filter(
          (b) =>
            b.status === BookingStatus.CONFIRMED ||
            b.status === BookingStatus.COMPLETED,
        ) || [];
      const completedBookings =
        trip.bookings?.filter((b) => b.status === BookingStatus.COMPLETED) ||
        [];
      const cancelledBookings =
        trip.bookings?.filter((b) => b.status === BookingStatus.CANCELLED) ||
        [];

      const occupancyRate =
        trip.totalSeats > 0
          ? Math.round((confirmedBookings.length / trip.totalSeats) * 10000) /
            100
          : 0;

      const revenue = completedBookings.reduce(
        (sum, b) => sum + (b.finalAmount || 0),
        0,
      );
      const onTimePerformance = this.calculateOnTimePerformance(trip);

      return {
        tripId: trip.id,
        routeName: `${trip.source} → ${trip.destination}`,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        vehicleRegistration: trip.vehicle?.registrationNumber,
        totalSeats: trip.totalSeats,
        bookedSeats: confirmedBookings.length,
        occupancyRate,
        revenue,
        status: trip.status,
        onTimePerformance,
        cancellationRate: trip.bookings?.length
          ? Math.round(
              (cancelledBookings.length / trip.bookings.length) * 10000,
            ) / 100
          : 0,
        averageRating: trip.ratings?.length
          ? Math.round(
              (trip.ratings.reduce((s, r) => s + (r.rating || 0), 0) /
                trip.ratings.length) *
                100,
            ) / 100
          : 0,
      };
    });
  }

  private calculateOnTimePerformance(trip: Trip): number {
    if (!trip.arrivalTime || !trip.estimatedArrivalTime) return 100;
    const actual = new Date(trip.arrivalTime).getTime();
    const estimated = new Date(trip.estimatedArrivalTime).getTime();
    const diffMinutes = Math.abs(actual - estimated) / (1000 * 60);
    return diffMinutes <= 15 ? 100 : Math.max(0, 100 - (diffMinutes - 15));
  }

  async getRealtimeMetrics(
    fleetCompanyId?: string,
  ): Promise<AnalyticsResponseDto> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const baseWhere = fleetCompanyId
      ? { fleetCompany: { id: fleetCompanyId } }
      : {};

    const [
      activeTrips,
      liveBookings,
      onlineUsers,
      pendingPayments,
      todayRevenue,
    ] = await Promise.all([
      this.tripRepository.count({
        where: {
          status: TripStatus.ACTIVE,
          ...baseWhere,
        },
      }),
      this.bookingRepository.count({
        where: {
          status: BookingStatus.CONFIRMED,
          createdAt: MoreThanOrEqual(todayStart),
          ...baseWhere,
        },
      }),
      this.redisService.get("online_users").then((v) => parseInt(v || "0")),
      this.paymentRepository.count({
        where: {
          status: PaymentStatus.PENDING,
          createdAt: MoreThanOrEqual(todayStart),
        },
      }),
      this.getTotalRevenue(todayStart, now, fleetCompanyId),
    ]);

    return {
      activeTrips,
      liveBookings,
      onlineUsers,
      pendingPayments,
      todayRevenue,
      serverLoad: await this.getServerLoad(),
      timestamp: now,
    };
  }

  private async getServerLoad(): Promise<{
    cpu: number;
    memory: number;
    requestsPerMinute: number;
  }> {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      requestsPerMinute: Math.floor(Math.random() * 1000),
    };
  }

  async exportAnalytics(
    type: "revenue" | "bookings" | "users" | "trips",
    format: "csv" | "json" | "xlsx",
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return {
      downloadUrl: `https://storage.example.com/exports/${type}_${Date.now()}.${format}`,
      expiresAt,
    };
  }
}
