import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus, UserType } from '../database/entities/user.entity';
import { Role, RoleName } from '../database/entities/role.entity';
import { AuditLog, AuditAction } from '../database/entities/audit-log.entity';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { KafkaService } from '../kafka/kafka.service';
import {
  UpdateProfileDto,
  UpdateUserDto,
  CreateUserDto,
  UserQueryDto,
  KycSubmissionDto,
  KycVerificationDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
    private readonly kafkaService: KafkaService,
  ) {}

  async findAll(query: UserQueryDto, currentUser?: any) {
    const { page = 1, limit = 10, status, userType, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const isSuperAdmin = currentUser?.role === RoleName.SUPER_ADMIN || currentUser?.userType === 'SUPER_ADMIN' || currentUser?.userType === UserType.SUPER_ADMIN;

    if (!isSuperAdmin) {
      if (userType && ['admin', 'super_admin', 'support'].includes(userType)) {
        throw new ForbiddenException('Access denied. Admin management is restricted to Super Admin.');
      }
    }

    let where: any;

    if (search) {
      const allowedTypes = !isSuperAdmin ? [UserType.PASSENGER, UserType.DRIVER, UserType.VEHICLE_OWNER] : null;
      const baseFilter = status ? { status } : {};
      const userTypeFilter = userType ? { userType } : (allowedTypes ? { userType: In(allowedTypes) } : {});

      where = [
        { firstName: Like(`%${search}%`), ...baseFilter, ...userTypeFilter },
        { lastName: Like(`%${search}%`), ...baseFilter, ...userTypeFilter },
        { email: Like(`%${search}%`), ...baseFilter, ...userTypeFilter },
        { phone: Like(`%${search}%`), ...baseFilter, ...userTypeFilter },
      ];
    } else {
      where = {};
      if (status) {
        where.status = status;
      }
      if (userType) {
        where.userType = userType;
      } else if (!isSuperAdmin) {
        where.userType = In([UserType.PASSENGER, UserType.DRIVER, UserType.VEHICLE_OWNER]);
      }
    }

    const [users, total] = await this.userRepository.findAndCount({
      where,
      relations: ['role'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users.map((user) => this.sanitizeUser(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, currentUser?: any) {
    const cacheKey = `user:profile:${id}`;
    const cached = await this.redisService.get(cacheKey);
    let user: User | null = null;

    if (cached) {
      try {
        user = JSON.parse(cached);
      } catch (err) {
        // Fallback to database
      }
    }

    if (!user) {
      user = await this.userRepository.findOne({
        where: { id },
        relations: ['role', 'role.permissions', 'wallet', 'driverProfile', 'vehicles'],
      });
      if (user) {
        await this.redisService.set(cacheKey, JSON.stringify(user), 3600); // Cache for 1 hour
      }
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (currentUser) {
      const isSuperAdmin = currentUser.role === RoleName.SUPER_ADMIN || currentUser.userType === 'SUPER_ADMIN' || currentUser.userType === UserType.SUPER_ADMIN;
      if (!isSuperAdmin && ['admin', 'super_admin', 'support'].includes(user.userType)) {
        throw new ForbiddenException('Access denied. Admin management is restricted to Super Admin.');
      }
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async findByPhone(phone: string) {
    return this.userRepository.findOne({
      where: { phone },
      relations: ['role'],
    });
  }

  async create(createUserDto: CreateUserDto, currentUser?: any) {
    const { email, phone, password, roleName, userType, ...rest } = createUserDto;

    if (currentUser) {
      const isSuperAdmin = currentUser.role === RoleName.SUPER_ADMIN || currentUser.userType === 'SUPER_ADMIN' || currentUser.userType === UserType.SUPER_ADMIN;
      if (!isSuperAdmin) {
        if (['admin', 'super_admin', 'support'].includes(userType)) {
          throw new ForbiddenException('Access denied. Admin creation is restricted to Super Admin.');
        }
        if (roleName && [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SUPPORT, RoleName.SUPPORT_AGENT].includes(roleName)) {
          throw new ForbiddenException('Access denied. Admin creation is restricted to Super Admin.');
        }
      }
    }

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const role = await this.roleRepository.findOne({
      where: { name: roleName || RoleName.PASSENGER },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = this.userRepository.create({
      ...rest,
      email,
      phone,
      password: hashedPassword,
      userType,
      roleId: role?.id,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(user);

    await this.createAuditLog({
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: user.id,
      description: `User created by admin`,
    });

    await this.kafkaService.publish('user.registered', {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
    });

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateProfileDto);
    await this.userRepository.save(user);

    // Emit Kafka event for central profile updates
    await this.kafkaService.publish('user.profile_updated', {
      userId,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Invalidate Cache
    await this.redisService.del(`user:profile:${userId}`);

    return this.sanitizeUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSuperAdmin = currentUser?.role === RoleName.SUPER_ADMIN || currentUser?.userType === 'SUPER_ADMIN' || currentUser?.userType === UserType.SUPER_ADMIN;

    if (!isSuperAdmin) {
      // Cannot modify administrative users
      if (['admin', 'super_admin', 'support'].includes(user.userType)) {
        throw new ForbiddenException('Access denied. Admin management is restricted to Super Admin.');
      }
      // Cannot assign administrative role/type
      if (updateUserDto.userType && ['admin', 'super_admin', 'support'].includes(updateUserDto.userType)) {
        throw new ForbiddenException('Access denied. Cannot assign administrative role/type.');
      }
      if (updateUserDto.roleName && [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SUPPORT, RoleName.SUPPORT_AGENT].includes(updateUserDto.roleName)) {
        throw new ForbiddenException('Access denied. Cannot assign administrative role/type.');
      }
    }

    const oldValues = { ...user };

    if (updateUserDto.roleName) {
      const role = await this.roleRepository.findOne({
        where: { name: updateUserDto.roleName },
      });
      if (role) {
        user.roleId = role.id;
      }
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // Invalidate Cache
    await this.redisService.del(`user:profile:${id}`);

    await this.createAuditLog({
      userId: currentUser.id || currentUser.userId,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: id,
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify(user),
      description: `User updated by admin`,
    });

    return this.sanitizeUser(user);
  }

  async submitKyc(userId: string, kycDto: KycSubmissionDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.KYC_VERIFIED) {
      throw new BadRequestException('KYC already verified');
    }

    user.kycDocumentType = kycDto.documentType;
    user.kycDocumentNumber = kycDto.documentNumber;
    user.kycDocumentFront = kycDto.documentFront;
    user.kycDocumentBack = kycDto.documentBack;
    user.kycSelfie = kycDto.selfie;
    user.kycSubmittedAt = new Date();
    user.status = UserStatus.PENDING_KYC;

    await this.userRepository.save(user);

    // Invalidate Cache
    await this.redisService.del(`user:profile:${userId}`);

    // Notify admins
    await this.notificationsService.sendNotification({
      userId: 'admin',
      type: 'SYSTEM',
      channel: 'IN_APP',
      title: 'New KYC Submission',
      message: `${user.firstName} ${user.lastName} has submitted KYC documents for verification.`,
      data: { userId: user.id, type: 'kyc_submission' },
    });

    return { message: 'KYC documents submitted successfully', status: UserStatus.PENDING_KYC };
  }

  async verifyKyc(id: string, kycDto: KycVerificationDto, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (kycDto.status === 'approved') {
      user.status = UserStatus.KYC_VERIFIED;
      user.kycVerifiedAt = new Date();
      user.kycVerifiedBy = adminId;
      user.kycRejectionReason = null;
    } else {
      user.status = UserStatus.KYC_REJECTED;
      user.kycRejectionReason = kycDto.reason;
    }

    await this.userRepository.save(user);

    // Invalidate Cache
    await this.redisService.del(`user:profile:${id}`);

    await this.createAuditLog({
      userId: adminId,
      action: AuditAction.VERIFY,
      entityType: 'User',
      entityId: id,
      description: `KYC ${kycDto.status} by admin`,
    });

    // Notify user
    await this.notificationsService.sendNotification({
      userId: user.id,
      type: 'KYC_STATUS',
      channel: 'PUSH',
      title: `KYC ${kycDto.status === 'approved' ? 'Verified' : 'Rejected'}`,
      message: kycDto.status === 'approved'
        ? 'Your KYC has been verified successfully. You can now start using all features.'
        : `Your KYC was rejected. Reason: ${kycDto.reason}`,
    });

    return {
      message: `KYC ${kycDto.status} successfully`,
      status: user.status,
    };
  }

  async suspendUser(id: string, reason: string, currentUser: any) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSuperAdmin = currentUser?.role === RoleName.SUPER_ADMIN || currentUser?.userType === 'SUPER_ADMIN' || currentUser?.userType === UserType.SUPER_ADMIN;

    if (!isSuperAdmin) {
      if (['admin', 'super_admin', 'support'].includes(user.userType)) {
        throw new ForbiddenException('Access denied. Admin management is restricted to Super Admin.');
      }
    }

    const isSuspended = user.status === UserStatus.SUSPENDED;
    user.status = isSuspended ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

    await this.userRepository.save(user);

    // Invalidate Cache
    await this.redisService.del(`user:profile:${id}`);

    await this.createAuditLog({
      userId: currentUser.id || currentUser.userId,
      action: isSuspended ? AuditAction.UPDATE : AuditAction.SUSPEND,
      entityType: 'User',
      entityId: id,
      description: `User ${isSuspended ? 'activated' : 'suspended'} by admin. Reason: ${reason}`,
    });

    // Notify user
    await this.notificationsService.sendNotification({
      userId: user.id,
      type: 'SYSTEM',
      channel: 'PUSH',
      title: `Account ${isSuspended ? 'Activated' : 'Suspended'}`,
      message: isSuspended
        ? 'Your account has been activated. You can now use the platform.'
        : `Your account has been suspended. Reason: ${reason}. Contact support for assistance.`,
    });

    return {
      message: `User ${isSuspended ? 'activated' : 'suspended'} successfully`,
      status: user.status,
    };
  }

  async remove(id: string, currentUser: any) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSuperAdmin = currentUser?.role === RoleName.SUPER_ADMIN || currentUser?.userType === 'SUPER_ADMIN' || currentUser?.userType === UserType.SUPER_ADMIN;

    if (!isSuperAdmin) {
      if (['admin', 'super_admin', 'support'].includes(user.userType)) {
        throw new ForbiddenException('Access denied. Admin management is restricted to Super Admin.');
      }
    }

    await this.userRepository.softRemove(user);

    // Invalidate Cache
    await this.redisService.del(`user:profile:${id}`);

    await this.createAuditLog({
      userId: currentUser.id || currentUser.userId,
      action: AuditAction.DELETE,
      entityType: 'User',
      entityId: id,
      description: `User deleted by admin`,
    });

    return { message: 'User deleted successfully' };
  }

  private async createAuditLog(data: Partial<AuditLog>) {
    const auditLog = this.auditLogRepository.create(data);
    await this.auditLogRepository.save(auditLog);
  }

  private sanitizeUser(user: User) {
    const { password, twoFactorSecret, role, ...sanitized } = user as any;
    
    // Import the enums at the top if not already imported
    // Map the role to frontend format
    let mappedRole = 'USER'; // default
    if (role?.name === 'super_admin') {
      mappedRole = 'SUPER_ADMIN';
    } else if (role?.name === 'admin') {
      mappedRole = 'ADMIN';
    }
    
    // Map userType to frontend format
    const userTypeMap: Record<string, string> = {
      'passenger': 'PASSENGER',
      'driver': 'DRIVER',
      'vehicle_owner': 'FLEET_OWNER',
      'admin': 'ADMIN',
      'super_admin': 'SUPER_ADMIN',
      'support': 'SUPPORT',
    };
    
    return {
      ...sanitized,
      role: mappedRole,
      userType: userTypeMap[user.userType] || 'PASSENGER',
      isVerified: user.isEmailVerified && user.isPhoneVerified,
    };
  }
}