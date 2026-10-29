import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, LessThan, MoreThanOrEqual, In } from "typeorm";
import { User, UserStatus } from "../database/entities/user.entity";
import { Vehicle, VehicleStatus } from "../database/entities/vehicle.entity";
import { Trip, TripStatus } from "../database/entities/trip.entity";
import { Booking, BookingStatus } from "../database/entities/booking.entity";
import { Payment, PaymentStatus } from "../database/entities/payment.entity";
import {
  SupportTicket,
  TicketStatus,
  TicketPriority,
} from "../database/entities/support-ticket.entity";
import { AuditLog, AuditAction } from "../database/entities/audit-log.entity";
import { Driver } from "../database/entities/driver.entity";
import { Role, RoleName } from "../database/entities/role.entity";
import { Permission } from "../database/entities/permission.entity";
import { RedisService } from "../redis/redis.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  DashboardStatsQueryDto,
  UpdateCommissionDto,
  GenerateReportDto,
  CreateRoleDto,
  CreatePermissionDto,
} from "./dto/admin.dto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDashboardStats(query: DashboardStatsQueryDto, currentUser: any) {
    const { startDate, endDate } = query;

    const dateRange =
      startDate && endDate
        ? Between(new Date(startDate), new Date(endDate))
        : undefined;

    const [
      totalUsers,
      totalVehicles,
      totalTrips,
      totalBookings,
      totalRevenue,
      activeTrips,
      pendingKyc,
      pendingVehicles,
      openTickets,
      todayBookings,
    ] = await Promise.all([
      this.userRepository.count(),
      this.vehicleRepository.count(),
      this.tripRepository.count(),
      this.bookingRepository.count({
        where: dateRange ? { createdAt: dateRange } : {},
      }),
      this.paymentRepository
        .createQueryBuilder("payment")
        .select("SUM(payment.amount)", "total")
        .where("payment.status = :status", { status: PaymentStatus.COMPLETED })
        .getRawOne(),
      this.tripRepository.count({
        where: { status: In([TripStatus.ACTIVE, TripStatus.IN_PROGRESS]) },
      }),
      this.userRepository.count({ where: { status: UserStatus.PENDING_KYC } }),
      this.vehicleRepository.count({
        where: { status: VehicleStatus.PENDING },
      }),
      this.ticketRepository.count({ where: { status: TicketStatus.OPEN } }),
      this.bookingRepository.count({
        where: {
          createdAt: Between(
            new Date(new Date().setHours(0, 0, 0, 0)),
            new Date(new Date().setHours(23, 59, 59, 999)),
          ),
        },
      }),
    ]);

    const isSuperAdmin =
      currentUser?.role === RoleName.SUPER_ADMIN ||
      currentUser?.userType === "super_admin";

    const result: any = {
      users: {
        total: totalUsers,
        pendingKyc,
        newToday: await this.getNewUsersToday(),
      },
      vehicles: {
        total: totalVehicles,
        pending: pendingVehicles,
        active: await this.vehicleRepository.count({
          where: { status: VehicleStatus.ACTIVE },
        }),
      },
      trips: {
        total: totalTrips,
        active: activeTrips,
        completedToday: await this.getCompletedTripsToday(),
      },
      bookings: {
        total: totalBookings,
        today: todayBookings,
        pending: await this.bookingRepository.count({
          where: { status: BookingStatus.PENDING },
        }),
      },
      support: {
        openTickets,
        urgentTickets: await this.ticketRepository.count({
          where: { status: TicketStatus.OPEN, priority: TicketPriority.URGENT },
        }),
      },
    };

    if (isSuperAdmin) {
      result.revenue = {
        total: parseFloat(totalRevenue?.total || "0"),
        today: await this.getTodayRevenue(),
        thisMonth: await this.getMonthlyRevenue(),
      };
    }

    return result;
  }

  async getPendingApprovals(type: "kyc" | "vehicles" | "all") {
    const result: any = {};

    if (type === "kyc" || type === "all") {
      result.kyc = await this.userRepository.find({
        where: { status: UserStatus.PENDING_KYC },
        select: [
          "id",
          "firstName",
          "lastName",
          "email",
          "phone",
          "kycDocumentType",
          "kycSubmittedAt",
        ],
        order: { kycSubmittedAt: "ASC" },
        take: 50,
      });
    }

    if (type === "vehicles" || type === "all") {
      result.vehicles = await this.vehicleRepository.find({
        where: { status: VehicleStatus.PENDING },
        relations: ["owner"],
        order: { createdAt: "ASC" },
        take: 50,
      });
    }

    return result;
  }

  async getActiveTrips() {
    return this.tripRepository.find({
      where: {
        status: In([
          TripStatus.ACTIVE,
          TripStatus.IN_PROGRESS,
          TripStatus.DELAYED,
        ]),
      },
      relations: ["vehicle", "driver", "driver.user", "bookings"],
      order: { departureTime: "DESC" },
    });
  }

  async getAllBookings(query: any) {
    const { page = 1, limit = 20, status, startDate, endDate } = query;

    const where: any = {};
    if (status) where.status = status;
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [bookings, total] = await this.bookingRepository.findAndCount({
      where,
      relations: ["trip", "trip.vehicle", "passenger"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAllPayments(query: any) {
    const { page = 1, limit = 20, status, method, startDate, endDate } = query;

    const where: any = {};
    if (status) where.status = status;
    if (method) where.method = method;
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ["user", "booking"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserGrowth(period: "daily" | "weekly" | "monthly") {
    const query = this.userRepository
      .createQueryBuilder("user")
      .select(
        `TO_CHAR(user.createdAt, '${this.getDateFormat(period)}')`,
        "period",
      )
      .addSelect("COUNT(*)", "count")
      .groupBy("period")
      .orderBy("period", "ASC");

    const results = await query.getRawMany();

    return results.map((r: any) => ({
      period: r.period,
      count: parseInt(r.count),
    }));
  }

  async getRevenueAnalytics(period: "daily" | "weekly" | "monthly" | "yearly") {
    const query = this.paymentRepository
      .createQueryBuilder("payment")
      .select(
        `TO_CHAR(payment.createdAt, '${this.getDateFormat(period)}')`,
        "period",
      )
      .addSelect("SUM(payment.amount)", "revenue")
      .addSelect("COUNT(*)", "transactions")
      .where("payment.status = :status", { status: PaymentStatus.COMPLETED })
      .groupBy("period")
      .orderBy("period", "ASC");

    const results = await query.getRawMany();

    return results.map((r: any) => ({
      period: r.period,
      revenue: parseFloat(r.revenue),
      transactions: parseInt(r.transactions),
    }));
  }

  async getHeatmapData(startDate: string, endDate: string) {
    const trips = await this.tripRepository.find({
      where: {
        createdAt: Between(new Date(startDate), new Date(endDate)),
        status: TripStatus.COMPLETED,
      },
      select: ["sourceLat", "sourceLng", "destLat", "destLng", "bookedSeats"],
    });

    return trips.map((trip) => ({
      start: { lat: trip.sourceLat, lng: trip.sourceLng },
      end: { lat: trip.destLat, lng: trip.destLng },
      intensity: trip.bookedSeats,
    }));
  }

  async updateCommission(dto: UpdateCommissionDto, adminId: string) {
    await this.redisService.set(
      "platform:commission",
      dto.percentage.toString(),
    );

    await this.auditLogRepository.save({
      userId: adminId,
      action: AuditAction.UPDATE,
      entityType: "Settings",
      entityId: "commission",
      newValues: JSON.stringify({ percentage: dto.percentage }),
      description: "Updated platform commission",
    });

    return {
      message: "Commission updated successfully",
      percentage: dto.percentage,
    };
  }

  async generateReport(dto: GenerateReportDto, currentUser: any) {
    const { reportType, startDate, endDate, format } = dto;
    const isSuperAdmin =
      currentUser?.role === RoleName.SUPER_ADMIN ||
      currentUser?.userType === "super_admin";

    if (reportType === "revenue" && !isSuperAdmin) {
      throw new ForbiddenException(
        "Access denied. Financial reports are restricted to Super Admin.",
      );
    }

    let data: any;

    switch (reportType) {
      case "bookings":
        data = await this.getBookingReport(startDate, endDate);
        break;
      case "revenue":
        data = await this.getRevenueReport(startDate, endDate);
        break;
      case "users":
        data = await this.getUserReport(startDate, endDate);
        break;
      case "trips":
        data = await this.getTripReport(startDate, endDate);
        break;
      default:
        throw new NotFoundException("Report type not found");
    }

    await this.auditLogRepository.save({
      userId: currentUser.id || currentUser.userId,
      action: AuditAction.EXPORT,
      entityType: "Report",
      entityId: reportType,
      description: `Generated ${reportType} report`,
    });

    return {
      reportType,
      period: { startDate, endDate },
      format,
      data,
      generatedAt: new Date(),
    };
  }

  async getAuditLogs(query: any) {
    const { page = 1, limit = 50, userId, action, entityType } = query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ["user"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateSettings(settings: Record<string, any>, adminId: string) {
    for (const [key, value] of Object.entries(settings)) {
      await this.redisService.set(`platform:${key}`, JSON.stringify(value));
    }

    await this.auditLogRepository.save({
      userId: adminId,
      action: AuditAction.UPDATE,
      entityType: "Settings",
      description: "Updated platform settings",
    });

    return { message: "Settings updated successfully" };
  }

  private async getNewUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.userRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });
  }

  private async getCompletedTripsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.tripRepository.count({
      where: {
        status: TripStatus.COMPLETED,
        updatedAt: MoreThanOrEqual(today),
      },
    });
  }

  private async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.paymentRepository
      .createQueryBuilder("payment")
      .select("SUM(payment.amount)", "total")
      .where("payment.status = :status", { status: PaymentStatus.COMPLETED })
      .andWhere("payment.createdAt >= :today", { today })
      .getRawOne();
    return parseFloat(result?.total || "0");
  }

  private async getMonthlyRevenue(): Promise<number> {
    const firstDay = new Date();
    firstDay.setDate(1);
    firstDay.setHours(0, 0, 0, 0);
    const result = await this.paymentRepository
      .createQueryBuilder("payment")
      .select("SUM(payment.amount)", "total")
      .where("payment.status = :status", { status: PaymentStatus.COMPLETED })
      .andWhere("payment.createdAt >= :firstDay", { firstDay })
      .getRawOne();
    return parseFloat(result?.total || "0");
  }

  private getDateFormat(period: string): string {
    const formats: Record<string, string> = {
      daily: "YYYY-MM-DD",
      weekly: "IYYY-IW",
      monthly: "YYYY-MM",
      yearly: "YYYY",
    };
    return formats[period] || "YYYY-MM-DD";
  }

  private async getBookingReport(startDate: string, endDate: string) {
    return this.bookingRepository.find({
      where: { createdAt: Between(new Date(startDate), new Date(endDate)) },
      relations: ["trip", "passenger"],
    });
  }

  private async getRevenueReport(startDate: string, endDate: string) {
    return this.paymentRepository.find({
      where: {
        createdAt: Between(new Date(startDate), new Date(endDate)),
        status: PaymentStatus.COMPLETED,
      },
      relations: ["user", "booking"],
    });
  }

  private async getUserReport(startDate: string, endDate: string) {
    return this.userRepository.find({
      where: { createdAt: Between(new Date(startDate), new Date(endDate)) },
    });
  }

  private async getTripReport(startDate: string, endDate: string) {
    return this.tripRepository.find({
      where: { createdAt: Between(new Date(startDate), new Date(endDate)) },
      relations: ["vehicle", "driver", "bookings"],
    });
  }

  // RBAC Roles Methods
  async getRoles() {
    return this.roleRepository.find({ relations: ["permissions"] });
  }

  async createRole(dto: CreateRoleDto) {
    const role = this.roleRepository.create({
      ...dto,
      name: dto.name as RoleName,
    });
    return this.roleRepository.save(role);
  }

  async updateRole(id: string, dto: Partial<CreateRoleDto>) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException("Role not found");
    Object.assign(role, {
      ...dto,
      name: dto.name ? (dto.name as RoleName) : role.name,
    });
    return this.roleRepository.save(role);
  }

  async deleteRole(id: string) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException("Role not found");
    await this.roleRepository.remove(role);
    return { success: true };
  }

  // RBAC Permissions Methods
  async getPermissions() {
    // Proactively seed default permissions if permissions table is empty
    const count = await this.permissionRepository.count();
    if (count === 0) {
      const defaultPerms = [
        {
          code: "user:create",
          name: "Create Users",
          module: "Users",
          action: "create",
          description: "Allows creating new user profiles",
        },
        {
          code: "user:read",
          name: "View Users",
          module: "Users",
          action: "read",
          description: "Allows viewing user profiles",
        },
        {
          code: "user:update",
          name: "Update Users",
          module: "Users",
          action: "update",
          description: "Allows editing user profiles",
        },
        {
          code: "user:delete",
          name: "Delete Users",
          module: "Users",
          action: "delete",
          description: "Allows deleting user profiles",
        },
        {
          code: "trip:read",
          name: "View Trips",
          module: "Trips",
          action: "read",
          description: "Allows tracking and viewing trip events",
        },
        {
          code: "payment:refund",
          name: "Refund Payments",
          module: "Payments",
          action: "refund",
          description: "Allows executing financial refunds",
        },
        {
          code: "settings:update",
          name: "Update Settings",
          module: "Settings",
          action: "update",
          description: "Allows modifying platform values",
        },
      ];
      await this.permissionRepository.save(
        this.permissionRepository.create(defaultPerms),
      );
    }
    return this.permissionRepository.find();
  }

  async createPermission(dto: CreatePermissionDto) {
    const permission = this.permissionRepository.create(dto);
    return this.permissionRepository.save(permission);
  }

  async updatePermission(id: string, dto: Partial<CreatePermissionDto>) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) throw new NotFoundException("Permission not found");
    Object.assign(permission, dto);
    return this.permissionRepository.save(permission);
  }

  async deletePermission(id: string) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) throw new NotFoundException("Permission not found");
    await this.permissionRepository.remove(permission);
    return { success: true };
  }

  // Role Permissions Mapping Method
  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ["permissions"],
    });
    if (!role) throw new NotFoundException("Role not found");

    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    role.permissions = permissions;
    return this.roleRepository.save(role);
  }
}

// Helper imports
//
