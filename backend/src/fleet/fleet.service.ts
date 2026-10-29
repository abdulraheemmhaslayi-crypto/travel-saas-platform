import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { FleetCompany, FleetStatus } from '../database/entities/fleet-company.entity';
import { FleetVehicle, FleetVehicleStatus } from '../database/entities/fleet-vehicle.entity';
import { Vehicle, VehicleType, VehicleStatus } from '../database/entities/vehicle.entity';
import { Driver, DriverStatus } from '../database/entities/driver.entity';
import { User, UserType, UserStatus } from '../database/entities/user.entity';
import { Role, RoleName } from '../database/entities/role.entity';
import { Trip, TripStatus } from '../database/entities/trip.entity';
import { Booking, BookingStatus, PaymentStatus } from '../database/entities/booking.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateFleetDto,
  UpdateFleetDto,
  AddFleetVehicleDto,
  UpdateFleetVehicleDto,
  FleetQueryDto,
} from './dto/fleet.dto';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(FleetCompany)
    private readonly fleetRepository: Repository<FleetCompany>,
    @InjectRepository(FleetVehicle)
    private readonly fleetVehicleRepository: Repository<FleetVehicle>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createFleet(ownerId: string, createFleetDto: CreateFleetDto) {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    const existingFleet = await this.fleetRepository.findOne({
      where: { name: createFleetDto.companyName },
    });

    if (existingFleet) {
      throw new BadRequestException('Fleet company with this name already exists');
    }

    const fleet = this.fleetRepository.create({
      ...createFleetDto,
      name: createFleetDto.companyName,
      ownerId,
      status: FleetStatus.PENDING,
      totalVehicles: 0,
      totalDrivers: 0,
      totalTrips: 0,
      totalRevenue: 0,
    });

    await this.fleetRepository.save(fleet);

    await this.notificationsService.sendNotification({
      userId: ownerId,
      type: 'SYSTEM',
      channel: 'IN_APP',
      title: 'Fleet Created',
      message: `Your fleet company ${fleet.name} has been created and is pending approval.`,
    });

    return fleet;
  }

  async findById(id: string, userId: string, userRole: string) {
    const fleet = await this.fleetRepository.findOne({
      where: { id },
      relations: ['owner', 'vehicles', 'fleetVehicles', 'fleetVehicles.vehicle'],
    });

    if (!fleet) {
      throw new NotFoundException('Fleet company not found');
    }

    const isAdmin = [RoleName.ADMIN, RoleName.SUPER_ADMIN].includes(userRole as RoleName);
    if (fleet.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return fleet;
  }

  async findByOwner(ownerId: string) {
    return this.fleetRepository.find({
      where: { ownerId },
      relations: ['vehicles', 'fleetVehicles'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(query: FleetQueryDto) {
    const { page = 1, limit = 10, status, search } = query;

    const where: any = {};
    if (status) where.status = status;

    const [fleets, total] = await this.fleetRepository.findAndCount({
      where,
      relations: ['owner'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: fleets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, ownerId: string, updateFleetDto: UpdateFleetDto) {
    const fleet = await this.fleetRepository.findOne({ where: { id } });

    if (!fleet) {
      throw new NotFoundException('Fleet company not found');
    }

    if (fleet.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own fleets');
    }

    Object.assign(fleet, updateFleetDto);
    await this.fleetRepository.save(fleet);

    return fleet;
  }

  async remove(id: string, ownerId: string) {
    const fleet = await this.fleetRepository.findOne({
      where: { id },
      relations: ['vehicles'],
    });

    if (!fleet) {
      throw new NotFoundException('Fleet company not found');
    }

    if (fleet.ownerId !== ownerId) {
      throw new ForbiddenException('You can only delete your own fleets');
    }

    if (fleet.vehicles?.length > 0) {
      throw new BadRequestException('Cannot delete fleet with active vehicles');
    }

    await this.fleetRepository.softRemove(fleet);

    return { message: 'Fleet company deleted successfully' };
  }

  async addVehicle(fleetId: string, ownerId: string, vehicleDto: AddFleetVehicleDto) {
    const fleet = await this.fleetRepository.findOne({ where: { id: fleetId } });

    if (!fleet) {
      throw new NotFoundException('Fleet company not found');
    }

    if (fleet.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied');
    }

    let vehicleId = vehicleDto.vehicleId;

    if (!vehicleId) {
      const brand = vehicleDto.brand || vehicleDto.make;
      const seatingCapacity = vehicleDto.seatingCapacity || vehicleDto.capacity;

      if (!vehicleDto.registrationNumber || !brand || !vehicleDto.model || !vehicleDto.year || !seatingCapacity) {
        throw new BadRequestException('Vehicle registration number, brand/make, model, year, and seating capacity are required');
      }

      const vehicle = this.vehicleRepository.create({
        ownerId,
        registrationNumber: vehicleDto.registrationNumber,
        brand,
        model: vehicleDto.model,
        year: vehicleDto.year,
        type: vehicleDto.type || VehicleType.SEDAN,
        color: vehicleDto.color || 'White',
        seatingCapacity,
        fuelType: vehicleDto.fuelType,
        transmission: vehicleDto.transmission,
        vehicleImage: vehicleDto.vehicleImage,
        rcNumber: vehicleDto.rcNumber,
        rcDocument: vehicleDto.rcDocument,
        insuranceNumber: vehicleDto.insuranceNumber,
        insuranceExpiry: vehicleDto.insuranceExpiry ? new Date(vehicleDto.insuranceExpiry) : undefined,
        insuranceDocument: vehicleDto.insuranceDocument,
        hasAC: vehicleDto.hasAC || false,
        hasWifi: vehicleDto.hasWifi || false,
        hasCharging: vehicleDto.hasCharging || false,
        basePrice: vehicleDto.basePrice || 0,
        pricePerKm: vehicleDto.pricePerKm || 0,
        status: this.normalizeVehicleStatus(vehicleDto.status),
        fleetCompanyId: fleetId,
      });

      await this.vehicleRepository.save(vehicle);
      vehicleId = vehicle.id;
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId, ownerId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found or access denied');
    }

    vehicle.fleetCompanyId = fleetId;
    await this.vehicleRepository.save(vehicle);

    const fleetVehicle = this.fleetVehicleRepository.create({
      fleetCompanyId: fleetId,
      vehicleId,
      fleetNumber: vehicleDto.fleetNumber,
      status: this.normalizeFleetVehicleStatus(vehicleDto.status),
      purchaseDate: vehicleDto.purchaseDate,
      purchasePrice: vehicleDto.purchasePrice,
    });

    const savedFleetVehicle = await this.fleetVehicleRepository.save(fleetVehicle);

    fleet.totalVehicles += 1;
    await this.fleetRepository.save(fleet);

    const fleetVehicleWithRelation = await this.fleetVehicleRepository.findOne({
      where: { id: savedFleetVehicle.id },
      relations: ['vehicle'],
    });

    if (!fleetVehicleWithRelation || !fleetVehicleWithRelation.vehicle) {
      throw new NotFoundException('Fleet vehicle was created but related vehicle data could not be loaded');
    }

    return this.formatFleetVehicleResponse(fleetVehicleWithRelation);
  }

  async getFleetVehicles(fleetId: string, ownerId: string) {
    const fleet = await this.fleetRepository.findOne({ where: { id: fleetId } });

    if (!fleet) {
      throw new NotFoundException('Fleet company not found');
    }

    if (fleet.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied');
    }

    const fleetVehicles = await this.fleetVehicleRepository.find({
      where: { fleetCompanyId: fleetId },
      relations: ['vehicle', 'vehicle.documents'],
    });

    return fleetVehicles.map((fleetVehicle) => this.formatFleetVehicleResponse(fleetVehicle));
  }

  private normalizeVehicleStatus(status?: string): VehicleStatus {
    if (!status) {
      return VehicleStatus.PENDING;
    }

    const normalized = status.toLowerCase();
    if (Object.values(VehicleStatus).includes(normalized as VehicleStatus)) {
      return normalized as VehicleStatus;
    }

    return VehicleStatus.PENDING;
  }

  private normalizeFleetVehicleStatus(status?: string): FleetVehicleStatus {
    if (!status) {
      return FleetVehicleStatus.ACTIVE;
    }

    const normalized = status.toLowerCase();
    if (Object.values(FleetVehicleStatus).includes(normalized as FleetVehicleStatus)) {
      return normalized as FleetVehicleStatus;
    }

    return FleetVehicleStatus.ACTIVE;
  }

  private formatFleetVehicleResponse(fleetVehicle: FleetVehicle) {
    return {
      id: fleetVehicle.vehicle.id,
      fleetVehicleId: fleetVehicle.id,
      registrationNumber: fleetVehicle.vehicle.registrationNumber,
      make: fleetVehicle.vehicle.brand,
      model: fleetVehicle.vehicle.model,
      year: fleetVehicle.vehicle.year,
      capacity: fleetVehicle.vehicle.seatingCapacity,
      status: fleetVehicle.status,
      fleetNumber: fleetVehicle.fleetNumber,
      purchaseDate: fleetVehicle.purchaseDate,
      purchasePrice: fleetVehicle.purchasePrice,
      vehicle: fleetVehicle.vehicle,
    };
  }

  async updateFleetVehicle(
    fleetId: string,
    vehicleId: string,
    ownerId: string,
    updateDto: UpdateFleetVehicleDto,
  ) {
    const fleet = await this.fleetRepository.findOne({ where: { id: fleetId } });

    if (!fleet || fleet.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied');
    }

    const fleetVehicle = await this.fleetVehicleRepository.findOne({
      where: { fleetCompanyId: fleetId, vehicleId },
    });

    if (!fleetVehicle) {
      throw new NotFoundException('Fleet vehicle not found');
    }

    Object.assign(fleetVehicle, updateDto);
    await this.fleetVehicleRepository.save(fleetVehicle);

    return fleetVehicle;
  }

  async getFleetAnalytics(fleetId: string, userId: string, userRole: string) {
    const fleet = await this.fleetRepository.findOne({
      where: { id: fleetId },
      relations: ['fleetVehicles', 'fleetVehicles.vehicle'],
    });

    if (!fleet) {
      throw new NotFoundException('Fleet company not found');
    }

    const isAdmin = [RoleName.ADMIN, RoleName.SUPER_ADMIN].includes(userRole as RoleName);
    if (fleet.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const vehicles = fleet.fleetVehicles || [];
    
    const totalKm = vehicles.reduce((sum, v) => sum + (v.totalKmDriven || 0), 0);
    const totalRevenue = 0;
    const totalMaintenance = vehicles.reduce((sum, v) => sum + parseFloat(v.totalMaintenanceCost?.toString() || '0'), 0);

    return {
      fleetId,
      fleetName: fleet.name,
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v) => v.status === FleetVehicleStatus.ACTIVE).length,
      maintenanceVehicles: vehicles.filter((v) => v.status === FleetVehicleStatus.MAINTENANCE).length,
      totalKmDriven: totalKm,
      totalRevenue,
      totalMaintenanceCost: totalMaintenance,
      averageFuelEfficiency: vehicles.length > 0
        ? vehicles.reduce((sum, v) => sum + (v.fuelEfficiency || 0), 0) / vehicles.length
        : 0,
      vehicleUtilization: this.calculateUtilization(vehicles),
    };
  }

  private calculateUtilization(vehicles: FleetVehicle[]): number {
    if (vehicles.length === 0) return 0;
    const active = vehicles.filter((v) => v.status === FleetVehicleStatus.ACTIVE).length;
    return Math.round((active / vehicles.length) * 100);
  }

  async getDrivers(ownerId: string) {
    const fleets = await this.fleetRepository.find({ where: { ownerId } });
    if (!fleets || fleets.length === 0) {
      return [];
    }
    const fleetIds = fleets.map((f) => f.id);

    const drivers = await this.driverRepository.find({
      where: { fleetCompanyId: In(fleetIds) },
      relations: ['user'],
    });

    return drivers.map((d) => ({
      id: d.id,
      name: `${d.user.firstName} ${d.user.lastName}`,
      phone: d.user.phone,
      email: d.user.email,
      licenseNumber: d.licenseNumber,
      status: d.status,
      rating: Number(d.rating || 5.0),
      totalTrips: d.totalTrips || 0,
    }));
  }

  async addDriver(ownerId: string, emailOrPhone: string, licenseNumber?: string) {
    const fleets = await this.fleetRepository.find({ where: { ownerId } });
    if (!fleets || fleets.length === 0) {
      throw new BadRequestException('Create a fleet company first before adding drivers');
    }
    const fleet = fleets[0];

    let user = await this.userRepository.findOne({
      where: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      relations: ['driverProfile'],
    });

    let driver: Driver;

    if (user) {
      if (user.userType !== UserType.DRIVER) {
        throw new BadRequestException('User is not registered as a driver');
      }
      if (!user.driverProfile) {
        driver = this.driverRepository.create({
          userId: user.id,
          licenseNumber,
          status: DriverStatus.ACTIVE,
          fleetCompanyId: fleet.id,
        });
        await this.driverRepository.save(driver);
      } else {
        driver = user.driverProfile;
        driver.fleetCompanyId = fleet.id;
        if (licenseNumber) {
          driver.licenseNumber = licenseNumber;
        }
        await this.driverRepository.save(driver);
      }
    } else {
      const tempPassword = await bcrypt.hash('Driver@12345', 12);
      const isEmail = emailOrPhone.includes('@');
      const email = isEmail ? emailOrPhone : `driver.${Math.floor(Math.random() * 1000000)}@travelsaas.com`;
      const phone = isEmail ? `+91${Math.floor(1000000000 + Math.random() * 9000000000)}` : emailOrPhone;
      
      const roleRepository = this.userRepository.manager.getRepository(Role);
      const role = await roleRepository.findOne({ where: { name: RoleName.DRIVER } });

      user = this.userRepository.create({
        email,
        phone,
        password: tempPassword,
        firstName: 'Fleet',
        lastName: 'Driver',
        userType: UserType.DRIVER,
        roleId: role?.id,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      await this.userRepository.save(user);

      driver = this.driverRepository.create({
        userId: user.id,
        licenseNumber: licenseNumber || 'LIC-' + Math.floor(Math.random() * 10000000),
        status: DriverStatus.ACTIVE,
        fleetCompanyId: fleet.id,
      });
      await this.driverRepository.save(driver);
    }

    fleet.totalDrivers += 1;
    await this.fleetRepository.save(fleet);

    return {
      id: driver.id,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      email: user.email,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      rating: Number(driver.rating || 5.0),
      totalTrips: driver.totalTrips || 0,
    };
  }

  async getRevenueStats(ownerId: string) {
    const vehicles = await this.vehicleRepository.find({
      where: { ownerId },
    });
    if (!vehicles || vehicles.length === 0) {
      return { today: 0, thisWeek: 0, thisMonth: 0, total: 0, activeTrips: 0 };
    }
    const vehicleIds = vehicles.map((v) => v.id);

    const trips = await this.userRepository.manager.getRepository(Trip).find({
      where: { vehicleId: In(vehicleIds) },
      relations: ['bookings'],
    });

    const activeTrips = trips.filter(
      (t) => t.status === TripStatus.ACTIVE || t.status === TripStatus.IN_PROGRESS,
    ).length;

    let today = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    let total = 0;

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - now.getDay() * oneDay);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const trip of trips) {
      if (!trip.bookings) continue;
      for (const booking of trip.bookings) {
        if (booking.paymentStatus === PaymentStatus.PAID || booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) {
          const amount = Number(booking.finalAmount || booking.totalAmount || 0);
          total += amount;

          const bookingDate = new Date(booking.createdAt);
          if (bookingDate >= startOfToday) {
            today += amount;
          }
          if (bookingDate >= startOfWeek) {
            thisWeek += amount;
          }
          if (bookingDate >= startOfMonth) {
            thisMonth += amount;
          }
        }
      }
    }

    return { today, thisWeek, thisMonth, total, activeTrips };
  }

  async updateStatus(id: string, status: string) {
    const fleet = await this.fleetRepository.findOne({ where: { id } });
    if (!fleet) {
      throw new NotFoundException('Fleet company not found');
    }
    fleet.status = status.toLowerCase() as any;
    return this.fleetRepository.save(fleet);
  }
}