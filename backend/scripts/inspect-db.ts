import { config } from 'dotenv';
config();

import { AppDataSource } from '../src/database/data-source';

async function main() {
  await AppDataSource.initialize();
  
  const vehicles = await AppDataSource.query(`SELECT id, "ownerId", brand, model, "registrationNumber", type, status, "seatingCapacity" FROM vehicles`);
  console.log('Vehicles:', vehicles);

  const trips = await AppDataSource.query(`SELECT id, "vehicleId", "driverId", source, destination, "departureTime", "pricePerSeat", status, "totalSeats" FROM trips`);
  console.log('Trips:', trips);

  const drivers = await AppDataSource.query(`SELECT * FROM drivers`);
  console.log('Drivers:', drivers);

  const fleetCompanies = await AppDataSource.query(`SELECT * FROM fleet_companies`);
  console.log('Fleet Companies:', fleetCompanies);

  await AppDataSource.destroy();
}

main().catch(console.error);
