import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { Trip } from '../database/entities/trip.entity';
import { Booking } from '../database/entities/booking.entity';
import { Payment } from '../database/entities/payment.entity';
import { SupportTicket } from '../database/entities/support-ticket.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { Driver } from '../database/entities/driver.entity';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Vehicle,
      Trip,
      Booking,
      Payment,
      SupportTicket,
      AuditLog,
      Driver,
      Role,
      Permission,
    ]),
    RedisModule,
    NotificationsModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}