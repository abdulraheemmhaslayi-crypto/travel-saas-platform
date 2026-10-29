import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { Driver } from './entities/driver.entity';
import { Trip } from './entities/trip.entity';
import { TripRoute } from './entities/trip-route.entity';
import { TripStop } from './entities/trip-stop.entity';
import { TripSeat } from './entities/trip-seat.entity';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { Notification } from './entities/notification.entity';
import { LiveLocation } from './entities/live-location.entity';
import { Rating } from './entities/rating.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Subscription } from './entities/subscription.entity';
import { FleetCompany } from './entities/fleet-company.entity';
import { FleetVehicle } from './entities/fleet-vehicle.entity';

const entities = [
  User,
  Role,
  Permission,
  Vehicle,
  VehicleDocument,
  Driver,
  Trip,
  TripRoute,
  TripStop,
  TripSeat,
  Booking,
  Payment,
  Wallet,
  WalletTransaction,
  Notification,
  LiveLocation,
  Rating,
  SupportTicket,
  AuditLog,
  Subscription,
  FleetCompany,
  FleetVehicle,
];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}