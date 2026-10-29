import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Vehicle, VehicleStatus } from '../database/entities/vehicle.entity';
import { VehicleDocument, DocumentStatus } from '../database/entities/vehicle-document.entity';
import { User, UserType } from '../database/entities/user.entity';
import { RoleName } from '../database/entities/role.entity';
import { AuditLog, AuditAction } from '../database/entities/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryDto,
  VehicleDocumentDto,
  VerifyVehicleDto,
  SuspendVehicleDto,
  ReactivateVehicleDto,
} from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehicleDocument)
    private readonly documentRepository: Repository<VehicleDocument>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(ownerId: string, createVehicleDto: CreateVehicleDto) {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });

    if (!owner || owner.userType !== UserType.VEHICLE_OWNER) {
      throw new ForbiddenException('Only vehicle owners can register vehicles');
    }

    const existingVehicle = await this.vehicleRepository.findOne({
      where: { registrationNumber: createVehicleDto.registrationNumber },
    });

    if (existingVehicle) {
      throw new BadRequestException('Vehicle with this registration number already exists');
    }

    const vehicle = this.vehicleRepository.create({
      registrationNumber: createVehicleDto.registrationNumber,
      brand: createVehicleDto.brand,
      model: createVehicleDto.model,
      year: createVehicleDto.year,
      type: createVehicleDto.type,
      color: createVehicleDto.color,
      seatingCapacity: createVehicleDto.seatingCapacity,
      fuelType: createVehicleDto.fuelType,
      transmission: createVehicleDto.transmission,
      vehicleImage: createVehicleDto.vehicleImage,
      rcNumber: createVehicleDto.rcNumber,
      rcDocument: createVehicleDto.rcDocument,
      insuranceNumber: createVehicleDto.insuranceNumber,
      insuranceExpiry: createVehicleDto.insuranceExpiry,
      insuranceDocument: createVehicleDto.insuranceDocument,
      hasAC: createVehicleDto.hasAC,
      hasWifi: createVehicleDto.hasWifi,
      hasCharging: createVehicleDto.hasCharging,
      basePrice: createVehicleDto.basePrice,
      pricePerKm: createVehicleDto.pricePerKm,
      ownerId,
      status: VehicleStatus.PENDING,
    });

    await this.vehicleRepository.save(vehicle);

    // Create vehicle documents
    if (createVehicleDto.documents?.length) {
      const documents = createVehicleDto.documents.map((doc) =>
        this.documentRepository.create({
          ...doc,
          vehicleId: vehicle.id,
          status: DocumentStatus.PENDING,
        }),
      );
      await this.documentRepository.save(documents);
    }

    await this.notificationsService.sendNotification({
      userId: ownerId,
      type: 'SYSTEM',
      channel: 'IN_APP',
      title: 'Vehicle Registered',
      message: `Your vehicle ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) has been registered and is pending approval.`,
    });

    return vehicle;
  }

  async findAll(query: VehicleQueryDto) {
    const { page = 1, limit = 10, status, ownerId, search, type } = query;

    const where: any = {};

    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (type) where.type = type;

    if (search) {
      where[0] = [
        { brand: Like(`%${search}%`) },
        { model: Like(`%${search}%`) },
        { registrationNumber: Like(`%${search}%`) },
      ];
    }

    const [vehicles, total] = await this.vehicleRepository.findAndCount({
      where,
      relations: ['owner', 'documents', 'fleetCompany'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: vehicles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string, userRole: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['owner', 'documents', 'trips', 'fleetCompany'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const isAdmin = [RoleName.ADMIN, RoleName.SUPER_ADMIN].includes(userRole as RoleName);
    if (vehicle.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return vehicle;
  }

  async findByOwner(ownerId: string) {
    return this.vehicleRepository.find({
      where: { ownerId },
      relations: ['documents'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, ownerId: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, ownerId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found or access denied');
    }

    if (vehicle.status === VehicleStatus.SUSPENDED) {
      throw new ForbiddenException('Cannot update suspended vehicle');
    }

    Object.assign(vehicle, updateVehicleDto);
    await this.vehicleRepository.save(vehicle);

    return vehicle;
  }

  async verifyVehicle(id: string, verifyDto: VerifyVehicleDto, adminId: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const oldStatus = vehicle.status;

    if (verifyDto.status === 'approved') {
      vehicle.status = VehicleStatus.APPROVED;
      vehicle.approvedBy = adminId;
      vehicle.approvedAt = new Date();
      vehicle.rejectionReason = null;
      vehicle.rejectedBy = null;
      vehicle.rejectedAt = null;
    } else {
      vehicle.status = VehicleStatus.REJECTED;
      vehicle.rejectionReason = verifyDto.reason;
      vehicle.rejectedBy = adminId;
      vehicle.rejectedAt = new Date();
    }

    await this.vehicleRepository.save(vehicle);

    await this.auditLogRepository.save({
      userId: adminId,
      action: verifyDto.status === 'approved' ? AuditAction.APPROVE : AuditAction.REJECT,
      entityType: 'Vehicle',
      entityId: id,
      oldValues: JSON.stringify({ status: oldStatus }),
      newValues: JSON.stringify({ status: vehicle.status }),
      description: `Vehicle ${verifyDto.status} by admin`,
      metadata: verifyDto.reason ? { reason: verifyDto.reason } : undefined,
    });

    await this.notificationsService.sendNotification({
      userId: vehicle.ownerId,
      type: 'SYSTEM',
      channel: 'PUSH',
      title: `Vehicle ${verifyDto.status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: verifyDto.status === 'approved'
        ? `Your vehicle ${vehicle.registrationNumber} has been approved. You can now create trips.`
        : `Your vehicle ${vehicle.registrationNumber} was rejected. Reason: ${verifyDto.reason}`,
    });

    return vehicle;
  }

  async suspendVehicle(id: string, suspendDto: SuspendVehicleDto, adminId: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.status === VehicleStatus.SUSPENDED) {
      throw new BadRequestException('Vehicle is already suspended');
    }

    const oldStatus = vehicle.status;
    vehicle.status = VehicleStatus.SUSPENDED;
    vehicle.suspendedBy = adminId;
    vehicle.suspendedAt = new Date();
    vehicle.suspensionReason = suspendDto.reason;

    await this.vehicleRepository.save(vehicle);

    await this.auditLogRepository.save({
      userId: adminId,
      action: AuditAction.SUSPEND,
      entityType: 'Vehicle',
      entityId: id,
      oldValues: JSON.stringify({ status: oldStatus }),
      newValues: JSON.stringify({ status: VehicleStatus.SUSPENDED }),
      description: `Vehicle suspended by admin. Reason: ${suspendDto.reason}`,
      metadata: { reason: suspendDto.reason },
    });

    await this.notificationsService.sendNotification({
      userId: vehicle.ownerId,
      type: 'SYSTEM',
      channel: 'PUSH',
      title: 'Vehicle Suspended',
      message: `Your vehicle ${vehicle.registrationNumber} has been suspended. Reason: ${suspendDto.reason}`,
    });

    return vehicle;
  }

  async reactivateVehicle(id: string, adminId: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.status !== VehicleStatus.SUSPENDED) {
      throw new BadRequestException('Only suspended vehicles can be reactivated');
    }

    vehicle.status = VehicleStatus.APPROVED;
    vehicle.suspendedBy = null;
    vehicle.suspendedAt = null;
    vehicle.suspensionReason = null;

    await this.vehicleRepository.save(vehicle);

    await this.auditLogRepository.save({
      userId: adminId,
      action: AuditAction.APPROVE,
      entityType: 'Vehicle',
      entityId: id,
      oldValues: JSON.stringify({ status: VehicleStatus.SUSPENDED }),
      newValues: JSON.stringify({ status: VehicleStatus.APPROVED }),
      description: 'Vehicle reactivated by admin',
    });

    await this.notificationsService.sendNotification({
      userId: vehicle.ownerId,
      type: 'SYSTEM',
      channel: 'PUSH',
      title: 'Vehicle Reactivated',
      message: `Your vehicle ${vehicle.registrationNumber} has been reactivated and is now approved for trips.`,
    });

    return vehicle;
  }

  async getVehicleApprovalHistory(vehicleId: string) {
    return this.auditLogRepository.find({
      where: {
        entityType: 'Vehicle',
        entityId: vehicleId,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAdminVehicleStats() {
    const [pending, approved, rejected, suspended, total] = await Promise.all([
      this.vehicleRepository.count({ where: { status: VehicleStatus.PENDING } }),
      this.vehicleRepository.count({ where: { status: VehicleStatus.APPROVED } }),
      this.vehicleRepository.count({ where: { status: VehicleStatus.REJECTED } }),
      this.vehicleRepository.count({ where: { status: VehicleStatus.SUSPENDED } }),
      this.vehicleRepository.count(),
    ]);

    return { total, pending, approved, rejected, suspended };
  }

  async uploadDocument(vehicleId: string, ownerId: string, documentDto: VehicleDocumentDto) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId, ownerId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found or access denied');
    }

    const document = this.documentRepository.create({
      ...documentDto,
      vehicleId,
      status: DocumentStatus.PENDING,
    });

    await this.documentRepository.save(document);

    return document;
  }

  async delete(id: string, ownerId: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, ownerId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found or access denied');
    }

    await this.vehicleRepository.softRemove(vehicle);

    return { message: 'Vehicle deleted successfully' };
  }

  async getVehicleStats(ownerId: string) {
    const vehicles = await this.vehicleRepository.find({
      where: { ownerId },
    });

    return {
      total: vehicles.length,
      active: vehicles.filter((v) => v.status === VehicleStatus.ACTIVE).length,
      pending: vehicles.filter((v) => v.status === VehicleStatus.PENDING).length,
      approved: vehicles.filter((v) => v.status === VehicleStatus.APPROVED).length,
      suspended: vehicles.filter((v) => v.status === VehicleStatus.SUSPENDED).length,
      rejected: vehicles.filter((v) => v.status === VehicleStatus.REJECTED).length,
    };
  }
}