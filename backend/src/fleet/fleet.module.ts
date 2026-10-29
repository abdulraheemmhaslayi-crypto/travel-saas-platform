import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { FleetCompany } from '../database/entities/fleet-company.entity';
import { FleetVehicle } from '../database/entities/fleet-vehicle.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { Driver } from '../database/entities/driver.entity';
import { User } from '../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FleetCompany, FleetVehicle, Vehicle, Driver, User]),
    NotificationsModule,
  ],
  providers: [FleetService],
  controllers: [FleetController],
  exports: [FleetService],
})
export class FleetModule {}