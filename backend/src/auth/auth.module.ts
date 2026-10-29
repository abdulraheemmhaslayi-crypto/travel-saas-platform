import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpService } from './services/otp.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLog } from '../database/entities/audit-log.entity';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiration', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Role, AuditLog]),
    RedisModule,
    NotificationsModule,
  ],
  providers: [AuthService, JwtStrategy, OtpService, JwtAuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, OtpService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}