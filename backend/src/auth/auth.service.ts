import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus, UserType } from '../database/entities/user.entity';
import { Role, RoleName } from '../database/entities/role.entity';
import { AuditLog, AuditAction } from '../database/entities/audit-log.entity';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OtpService } from './services/otp.service';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ResendOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  SocialLoginDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, phone, password, userType, firstName, lastName, roleName } = registerDto as any;

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // If a specific roleName is provided in the registration payload, prefer it.
    const resolvedRoleName = roleName || this.getRoleNameFromUserType(userType);

    // Prevent public registration as ADMIN or SUPER_ADMIN
    if (resolvedRoleName === RoleName.ADMIN || resolvedRoleName === RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('Registration for admin or super admin accounts is not allowed');
    }
    const role = await this.roleRepository.findOne({ where: { name: resolvedRoleName } });

    const user = this.userRepository.create({
      email,
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      userType,
      roleId: role?.id,
      status: UserStatus.PENDING_KYC,
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    await this.userRepository.save(user);

    await this.notificationsService.createNotification({
      userId: user.id,
      type: 'SYSTEM',
      channel: 'IN_APP',
      title: 'Welcome to Travel SaaS',
      message: `Welcome ${firstName}! Your account has been created. Please complete your KYC verification.`,
    });

    await this.createAuditLog({
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: user.id,
      description: `New user registered: ${email}`,
    });

    // Reload user with role relationship
    const userWithRole = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['role'],
    });

    const tokens = await this.generateTokens(userWithRole);

    return {
      user: this.sanitizeUser(userWithRole),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, phone, password } = loginDto;

    const where: any = {};
    if (email) where.email = email;
    if (phone) where.phone = phone;

    const user = await this.userRepository.findOne({
      where,
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = loginDto.ip || '';
    await this.userRepository.save(user);

    await this.createAuditLog({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      description: `User logged in`,
      ipAddress: loginDto.ip,
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async requestOtp(phone: string) {
    const user = await this.userRepository.findOne({ where: { phone } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.otpService.generateAndSendOtp(phone);

    return {
      message: 'OTP sent successfully',
      expiresIn: result.expiresIn,
      phone: result.maskedPhone,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phone, otp } = verifyOtpDto;

    const isValid = await this.otpService.verifyOtp(phone, otp);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.userRepository.findOne({
      where: { phone },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isPhoneVerified = true;
    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    return this.requestOtp(resendOtpDto.phone);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: this.getJwtRefreshSecret(),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['role'],
      });

      if (!user || user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      return { message: 'If an account exists, a password reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: '1h',
      },
    );

    await this.redisService.setex(`password_reset:${user.id}`, 3600, resetToken);

    await this.notificationsService.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        name: user.firstName,
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
        expiresIn: '1 hour',
      },
    });

    return { message: 'If an account exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token');
      }

      const storedToken = await this.redisService.get(`password_reset:${payload.sub}`);
      
      if (!storedToken || storedToken !== token) {
        throw new UnauthorizedException('Token expired or invalid');
      }

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.password = await bcrypt.hash(newPassword, 12);
      await this.userRepository.save(user);

      await this.redisService.del(`password_reset:${payload.sub}`);

      await this.createAuditLog({
        userId: user.id,
        action: AuditAction.UPDATE,
        entityType: 'User',
        entityId: user.id,
        description: 'Password reset via forgot password',
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);

    await this.createAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: userId,
      description: 'Password changed by user',
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions', 'wallet', 'driverProfile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async logout(userId: string, authHeader: string) {
    const token = authHeader.split(' ')[1];
    
    await this.redisService.setex(`blacklist:${token}`, 86400, 'true');

    await this.createAuditLog({
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'User',
      entityId: userId,
      description: 'User logged out',
    });

    return { message: 'Logged out successfully' };
  }

  async socialLogin(socialLoginDto: SocialLoginDto) {
    const { provider, token, email, firstName, lastName, profileImage } = socialLoginDto;

    let user = await this.userRepository.findOne({ 
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      const role = await this.roleRepository.findOne({ where: { name: RoleName.PASSENGER } });
      
      user = this.userRepository.create({
        email,
        firstName: firstName || 'User',
        lastName: lastName || '',
        userType: UserType.PASSENGER,
        roleId: role?.id,
        status: UserStatus.PENDING_KYC,
        isEmailVerified: true,
        profileImage,
        password: await bcrypt.hash(Math.random().toString(36), 12),
      });

      await this.userRepository.save(user);
      
      // Reload with role relationship
      user = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['role'],
      });
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      id: user.id,
      userId: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.role?.name || user.userType,
      userType: user.userType,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getJwtSecret(),
        expiresIn: this.configService.get('jwt.expiration', '24h'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getJwtRefreshSecret(),
        expiresIn: this.configService.get('jwt.refreshExpiration', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('jwt.expiration', '24h'),
    };
  }

  private getJwtSecret(): string {
    return this.configService.get('jwt.secret') || this.configService.get('jwt.refreshSecret') || 'default_jwt_secret';
  }

  private getJwtRefreshSecret(): string {
    return this.configService.get('jwt.refreshSecret') || this.configService.get('jwt.secret') || 'default_jwt_secret';
  }

  private getRoleNameFromUserType(userType: UserType): RoleName {
    const roleMap: Record<UserType, RoleName> = {
      [UserType.PASSENGER]: RoleName.PASSENGER,
      [UserType.VEHICLE_OWNER]: RoleName.VEHICLE_OWNER,
      [UserType.DRIVER]: RoleName.DRIVER,
      [UserType.ADMIN]: RoleName.ADMIN,
      [UserType.SUPER_ADMIN]: RoleName.SUPER_ADMIN,
      [UserType.SUPPORT]: RoleName.SUPPORT,
    };
    return roleMap[userType];
  }

  private sanitizeUser(user: User) {
    const { password, twoFactorSecret, role, ...sanitized } = user as any;
    
    // Map the role to frontend format
    let mappedRole = 'USER'; // default
    if (role?.name === RoleName.SUPER_ADMIN) {
      mappedRole = 'SUPER_ADMIN';
    } else if (role?.name === RoleName.ADMIN) {
      mappedRole = 'ADMIN';
    }
    
    // Map userType to frontend format (capitalize first letter)
    const userTypeMap: Record<string, string> = {
      [UserType.PASSENGER]: 'PASSENGER',
      [UserType.DRIVER]: 'DRIVER',
      [UserType.VEHICLE_OWNER]: 'FLEET_OWNER',
      [UserType.ADMIN]: 'ADMIN',
      [UserType.SUPER_ADMIN]: 'SUPER_ADMIN',
      [UserType.SUPPORT]: 'SUPPORT',
    };
    
    return {
      ...sanitized,
      role: mappedRole,
      userType: userTypeMap[user.userType] || 'PASSENGER',
      isVerified: user.isEmailVerified && user.isPhoneVerified,
    };
  }

  private async createAuditLog(data: Partial<AuditLog>) {
    const auditLog = this.auditLogRepository.create(data);
    await this.auditLogRepository.save(auditLog);
  }
}