import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from '../database/entities/vehicle.entity';
import { VehicleDocument } from '../database/entities/vehicle-document.entity';
import { User } from '../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLog } from '../database/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehicleDocument, User, AuditLog]),
    NotificationsModule,
  ],
  providers: [VehiclesService],
  controllers: [VehiclesController],
  exports: [VehiclesService],
})
export class VehiclesModule {}