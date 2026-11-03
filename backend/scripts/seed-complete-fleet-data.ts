import { config } from 'dotenv';
config();

import { AppDataSource } from '../src/database/data-source';
import * as bcrypt from 'bcryptjs';

async function seedCompleteFleetData() {
  await AppDataSource.initialize();
  console.log('✅ Database connected successfully!');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 0. Ensure UUID extension and Base System Roles
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    const systemRoles = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'super_admin', displayName: 'Super Admin' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'admin', displayName: 'Admin' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'vehicle_owner', displayName: 'Vehicle Owner' },
      { id: '44444444-4444-4444-4444-444444444444', name: 'driver', displayName: 'Driver' },
      { id: '55555555-5555-5555-5555-555555555555', name: 'passenger', displayName: 'Passenger' },
      { id: '66666666-6666-6666-6666-666666666666', name: 'support', displayName: 'Support' },
    ];

    for (const r of systemRoles) {
      const exists = (await queryRunner.query(`SELECT id FROM roles WHERE name = $1`, [r.name]))[0];
      if (!exists) {
        await queryRunner.query(
          `INSERT INTO roles (id, name, "displayName", description) VALUES ($1, $2, $3, $4)`,
          [r.id, r.name, r.displayName, r.displayName]
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Get or Ensure Fleet Company & Vehicle Owner
    // ─────────────────────────────────────────────────────────────────────────
    let ownerUser = (await queryRunner.query(
      `SELECT * FROM users WHERE "userType" = 'vehicle_owner' OR email = 'vehicleowner@gmail.com' LIMIT 1`
    ))[0];

    if (!ownerUser) {
      const ownerRole = (await queryRunner.query(`SELECT id FROM roles WHERE name = 'vehicle_owner' LIMIT 1`))[0];
      const defaultPassword = await bcrypt.hash('Password@123', 10);
      const insertedOwner = await queryRunner.query(
        `INSERT INTO users (
          id, email, phone, password, "firstName", "lastName", "userType",
          "roleId", status, "isEmailVerified", "isPhoneVerified", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(), 'vehicleowner@gmail.com', '+91 98234 56789', $1, 'Abdul', 'FleetOwner', 'vehicle_owner',
          $2, 'active', true, true, NOW(), NOW()
        ) RETURNING *`,
        [defaultPassword, ownerRole ? ownerRole.id : null]
      );
      ownerUser = insertedOwner[0];
      console.log('✅ Created default vehicle owner:', ownerUser.email);
    }

    let fleetCompany = (await queryRunner.query(
      `SELECT * FROM fleet_companies LIMIT 1`
    ))[0];

    if (!fleetCompany) {
      const fleetRes = await queryRunner.query(
        `INSERT INTO fleet_companies (
          id, "ownerId", name, description, email, phone, city, state, status,
          "totalVehicles", "totalDrivers", "totalTrips", "totalRevenue", rating, "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(), $1, 'Konkan Express Fleet & Mobility', 'Premier intercity fleet network connecting Mhasla, Raigad, Mumbai, and Pune',
          $2, '+91 98234 56789', 'Mhasla', 'Maharashtra', 'active', 0, 0, 0, 0, 4.9, NOW(), NOW()
        ) RETURNING *`,
        [ownerUser.id, ownerUser.email]
      );
      fleetCompany = fleetRes[0];
      console.log('Created new fleet company:', fleetCompany.name);
    } else {
      await queryRunner.query(
        `UPDATE fleet_companies SET 
          name = 'Konkan Express Fleet & Mobility',
          description = 'Premier intercity fleet network connecting Mhasla, Raigad, Mumbai, and Pune',
          status = 'active',
          city = 'Mhasla',
          state = 'Maharashtra',
          rating = 4.9,
          "updatedAt" = NOW()
        WHERE id = $1`,
        [fleetCompany.id]
      );
      console.log('Updated fleet company to active:', fleetCompany.id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Ensure Driver Users & Driver Profiles
    // ─────────────────────────────────────────────────────────────────────────
    const driverRole = (await queryRunner.query(
      `SELECT id FROM roles WHERE name = 'driver' LIMIT 1`
    ))[0];

    const driverProfilesData = [
      {
        email: 'abdulraheemmhaslayi@gmail.com',
        firstName: 'Abdul',
        lastName: 'Mhaslayi',
        phone: '+919823000001',
        licenseNumber: 'MH-06-2016-0034120',
        licenseType: 'Commercial Heavy / Light Transport',
        drivingExperience: 8,
        rating: 4.92,
        totalTrips: 284,
        totalEarnings: 92400,
        isOnline: true,
        currentLocation: 'Mhasla Stand, Raigad',
        currentLatitude: 18.1336,
        currentLongitude: 73.1118,
      },
      {
        email: 'driver@gmail.com',
        firstName: 'Imran',
        lastName: 'Khan',
        phone: '+919823000002',
        licenseNumber: 'MH-06-2018-0056781',
        licenseType: 'Commercial Light Transport',
        drivingExperience: 6,
        rating: 4.85,
        totalTrips: 195,
        totalEarnings: 64200,
        isOnline: true,
        currentLocation: 'Panvel Highway, Navi Mumbai',
        currentLatitude: 18.9894,
        currentLongitude: 73.1175,
      },
      {
        email: 'ramesh.patil@travelsaas.com',
        firstName: 'Ramesh',
        lastName: 'Patil',
        phone: '+919823000003',
        licenseNumber: 'MH-14-2014-0099882',
        licenseType: 'Commercial Transport',
        drivingExperience: 10,
        rating: 4.95,
        totalTrips: 412,
        totalEarnings: 148500,
        isOnline: true,
        currentLocation: 'Dadar T.T. Circle, Mumbai',
        currentLatitude: 19.0178,
        currentLongitude: 72.8478,
      },
      {
        email: 'sachin.shinde@travelsaas.com',
        firstName: 'Sachin',
        lastName: 'Shinde',
        phone: '+919823000004',
        licenseNumber: 'MH-12-2019-0044331',
        licenseType: 'Commercial Transport',
        drivingExperience: 5,
        rating: 4.78,
        totalTrips: 156,
        totalEarnings: 48900,
        isOnline: false,
        currentLocation: 'Swargate Bus Terminal, Pune',
        currentLatitude: 18.5018,
        currentLongitude: 73.8582,
      },
      {
        email: 'salim.qureshi@travelsaas.com',
        firstName: 'Salim',
        lastName: 'Qureshi',
        phone: '+919823000005',
        licenseNumber: 'MH-06-2017-0077112',
        licenseType: 'Commercial Heavy Passenger',
        drivingExperience: 7,
        rating: 4.88,
        totalTrips: 230,
        totalEarnings: 76500,
        isOnline: true,
        currentLocation: 'Mangaon Bypass, Raigad',
        currentLatitude: 18.2526,
        currentLongitude: 73.2878,
      },
    ];

    const passwordHash = await bcrypt.hash('Password@123', 10);
    const createdDriverIds: string[] = [];

    for (const d of driverProfilesData) {
      let u = (await queryRunner.query(
        `SELECT id FROM users WHERE email = $1`,
        [d.email]
      ))[0];

      if (!u) {
        const uRes = await queryRunner.query(
          `INSERT INTO users (
            id, email, phone, password, "firstName", "lastName", "userType",
            "roleId", status, "isEmailVerified", "isPhoneVerified", "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, 'driver',
            $6, 'active', true, true, NOW(), NOW()
          ) RETURNING id`,
          [d.email, d.phone, passwordHash, d.firstName, d.lastName, driverRole ? driverRole.id : null]
        );
        u = uRes[0];
        console.log(`Created driver user: ${d.firstName} ${d.lastName} (${d.email})`);
      } else {
        await queryRunner.query(
          `UPDATE users SET "firstName" = $1, "lastName" = $2, "userType" = 'driver', status = 'active' WHERE id = $3`,
          [d.firstName, d.lastName, u.id]
        );
      }

      // Check driver profile in drivers table
      let drv = (await queryRunner.query(
        `SELECT id FROM drivers WHERE "userId" = $1`,
        [u.id]
      ))[0];

      if (!drv) {
        const drvRes = await queryRunner.query(
          `INSERT INTO drivers (
            id, "userId", "fleetCompanyId", "licenseNumber", "licenseType", "drivingExperience",
            status, rating, "totalTrips", "totalEarnings", "isOnline",
            "currentLocation", "currentLatitude", "currentLongitude", "locationUpdatedAt", "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5,
            'approved', $6, $7, $8, $9,
            $10, $11, $12, NOW(), NOW(), NOW()
          ) RETURNING id`,
          [
            u.id,
            fleetCompany.id,
            d.licenseNumber,
            d.licenseType,
            d.drivingExperience,
            d.rating,
            d.totalTrips,
            d.totalEarnings,
            d.isOnline,
            d.currentLocation,
            d.currentLatitude,
            d.currentLongitude,
          ]
        );
        drv = drvRes[0];
        console.log(`Created driver profile for ${d.firstName}: ${drv.id}`);
      } else {
        await queryRunner.query(
          `UPDATE drivers SET 
            "fleetCompanyId" = $1,
            "licenseNumber" = $2,
            "licenseType" = $3,
            "drivingExperience" = $4,
            status = 'approved',
            rating = $5,
            "totalTrips" = $6,
            "totalEarnings" = $7,
            "isOnline" = $8,
            "currentLocation" = $9,
            "currentLatitude" = $10,
            "currentLongitude" = $11,
            "updatedAt" = NOW()
          WHERE id = $12`,
          [
            fleetCompany.id,
            d.licenseNumber,
            d.licenseType,
            d.drivingExperience,
            d.rating,
            d.totalTrips,
            d.totalEarnings,
            d.isOnline,
            d.currentLocation,
            d.currentLatitude,
            d.currentLongitude,
            drv.id,
          ]
        );
      }
      createdDriverIds.push(drv.id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Clean & Add Premium Commercial Fleet Vehicles
    // ─────────────────────────────────────────────────────────────────────────
    // Fix existing vehicle typos (e.g. 'tyota' -> 'Toyota')
    await queryRunner.query(`
      UPDATE vehicles SET 
        brand = 'Toyota',
        model = 'Innova Crysta',
        status = 'approved',
        type = 'mpv',
        "seatingCapacity" = 7
      WHERE brand ILIKE '%tyota%' OR brand ILIKE '%4wer%'
    `);

    const commercialVehicles = [
      {
        reg: 'MH 06 BW 4589',
        brand: 'Toyota',
        model: 'Innova Crysta 2.4 VX',
        year: 2023,
        type: 'mpv',
        color: 'Super White',
        seats: 7,
        fuel: 'Diesel',
        trans: 'Manual',
        status: 'approved',
      },
      {
        reg: 'MH 06 CA 1204',
        brand: 'Maruti Suzuki',
        model: 'Ertiga ZXi+',
        year: 2024,
        type: 'mpv',
        color: 'Metallic Silky Silver',
        seats: 7,
        fuel: 'CNG / Petrol',
        trans: 'Manual',
        status: 'approved',
      },
      {
        reg: 'MH 06 AX 9900',
        brand: 'Toyota',
        model: 'Fortuner 4x2 AT',
        year: 2023,
        type: 'suv',
        color: 'Attitude Black',
        seats: 7,
        fuel: 'Diesel',
        trans: 'Automatic',
        status: 'approved',
      },
      {
        reg: 'MH 06 DF 7721',
        brand: 'Tata',
        model: 'Winger Luxury Executive',
        year: 2023,
        type: 'van',
        color: 'Pearl Grey',
        seats: 12,
        fuel: 'Diesel',
        trans: 'Manual',
        status: 'approved',
      },
      {
        reg: 'MH 06 EA 5511',
        brand: 'Toyota',
        model: 'Innova HyCross Hybrid',
        year: 2024,
        type: 'luxury',
        color: 'Platinum White Pearl',
        seats: 7,
        fuel: 'Hybrid Petrol',
        trans: 'Automatic',
        status: 'approved',
      },
      {
        reg: 'MH 06 BK 3344',
        brand: 'Honda',
        model: 'City ZX',
        year: 2023,
        type: 'sedan',
        color: 'Radiant Red Metallic',
        seats: 5,
        fuel: 'Petrol',
        trans: 'Automatic',
        status: 'approved',
      },
    ];

    const activeVehicleIds: string[] = [];

    for (const cv of commercialVehicles) {
      let v = (await queryRunner.query(
        `SELECT id FROM vehicles WHERE "registrationNumber" = $1`,
        [cv.reg]
      ))[0];

      if (!v) {
        const vRes = await queryRunner.query(
          `INSERT INTO vehicles (
            id, "ownerId", "registrationNumber", brand, model, year, type, color,
            "seatingCapacity", "fuelType", transmission, status,
            "insuranceExpiry", "permitExpiry", "fitnessExpiry", "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, 'approved',
            NOW() + interval '320 days', NOW() + interval '280 days', NOW() + interval '365 days',
            NOW(), NOW()
          ) RETURNING id`,
          [
            ownerUser.id,
            cv.reg,
            cv.brand,
            cv.model,
            cv.year,
            cv.type,
            cv.color,
            cv.seats,
            cv.fuel,
            cv.trans,
          ]
        );
        v = vRes[0];
        console.log(`Added vehicle: ${cv.brand} ${cv.model} (${cv.reg})`);
      } else {
        await queryRunner.query(
          `UPDATE vehicles SET
            brand = $1, model = $2, year = $3, type = $4, color = $5,
            "seatingCapacity" = $6, "fuelType" = $7, transmission = $8, status = 'approved',
            "updatedAt" = NOW()
          WHERE id = $9`,
          [cv.brand, cv.model, cv.year, cv.type, cv.color, cv.seats, cv.fuel, cv.trans, v.id]
        );
      }

      activeVehicleIds.push(v.id);

      // Ensure linked into fleet_vehicles
      const fv = (await queryRunner.query(
        `SELECT id FROM fleet_vehicles WHERE "vehicleId" = $1`,
        [v.id]
      ))[0];

      if (!fv) {
        await queryRunner.query(
          `INSERT INTO fleet_vehicles (
            id, "fleetCompanyId", "vehicleId", "fleetNumber", status, "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, 'active', NOW(), NOW()
          )`,
          [fleetCompany.id, v.id, `FL-${cv.reg.replace(/\s+/g, '')}`]
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Create Rich Trips with Full Routes and Seats
    // ─────────────────────────────────────────────────────────────────────────
    // Clear old orphaned trips without valid records if needed
    const routesConfig = [
      {
        title: 'Mhasla Taluka to Mumbai Dadar Express',
        source: 'Mhasla Taluka, Raigad, Maharashtra, 402105, India',
        destination: 'Dadar T.T. Circle, Mumbai, Maharashtra, 400014, India',
        sourceLat: 18.1336,
        sourceLng: 73.1118,
        destLat: 19.0178,
        destLng: 72.8478,
        departureHoursFromNow: 2, // Live departing soon
        durationMins: 230,
        distanceKm: 168,
        pricePerSeat: 399,
        status: 'active',
        vehicleIdx: 0, // Toyota Innova Crysta
        driverIdx: 0, // Abdul Mhaslayi
        waypoints: [
          { name: 'Mhasla Bus Stand', lat: 18.1336, lng: 73.1118, km: 0, order: 1 },
          { name: 'Mangaon Junction NH66', lat: 18.2526, lng: 73.2878, km: 32, order: 2 },
          { name: 'Nagothane Bridge', lat: 18.5358, lng: 73.1362, km: 74, order: 3 },
          { name: 'Panvel Highway Flyover', lat: 18.9894, lng: 73.1175, km: 128, order: 4 },
          { name: 'Vashi Plaza, Navi Mumbai', lat: 19.0745, lng: 72.9978, km: 146, order: 5 },
          { name: 'Dadar T.T. Circle, Mumbai', lat: 19.0178, lng: 72.8478, km: 168, order: 6 },
        ],
      },
      {
        title: 'Mumbai Dadar to Mhasla Taluka Return',
        source: 'Dadar T.T. Circle, Mumbai, Maharashtra, 400014, India',
        destination: 'Mhasla Taluka, Raigad, Maharashtra, 402105, India',
        sourceLat: 19.0178,
        sourceLng: 72.8478,
        destLat: 18.1336,
        destLng: 73.1118,
        departureHoursFromNow: 8,
        durationMins: 230,
        distanceKm: 168,
        pricePerSeat: 399,
        status: 'scheduled',
        vehicleIdx: 4, // Innova HyCross
        driverIdx: 2, // Ramesh Patil
        waypoints: [
          { name: 'Dadar T.T. Circle', lat: 19.0178, lng: 72.8478, km: 0, order: 1 },
          { name: 'Maitri Park Chembur', lat: 19.0522, lng: 72.9005, km: 12, order: 2 },
          { name: 'Panvel Bus Stand', lat: 18.9894, lng: 73.1175, km: 40, order: 3 },
          { name: 'Mangaon Phata', lat: 18.2526, lng: 73.2878, km: 136, order: 4 },
          { name: 'Mhasla Market', lat: 18.1336, lng: 73.1118, km: 168, order: 5 },
        ],
      },
      {
        title: 'Mhasla Taluka to Pune Swargate Express',
        source: 'Mhasla Taluka, Raigad, Maharashtra, 402105, India',
        destination: 'Swargate Bus Terminal, Pune, Maharashtra, 411042, India',
        sourceLat: 18.1336,
        sourceLng: 73.1118,
        destLat: 18.5018,
        destLng: 73.8582,
        departureHoursFromNow: 4,
        durationMins: 195,
        distanceKm: 142,
        pricePerSeat: 349,
        status: 'scheduled',
        vehicleIdx: 1, // Maruti Ertiga
        driverIdx: 1, // Imran Khan
        waypoints: [
          { name: 'Mhasla Stand', lat: 18.1336, lng: 73.1118, km: 0, order: 1 },
          { name: 'Mangaon Bus Depot', lat: 18.2526, lng: 73.2878, km: 32, order: 2 },
          { name: 'Tamhini Ghat Viewpoint', lat: 18.4728, lng: 73.4412, km: 78, order: 3 },
          { name: 'Pirangut Chowk', lat: 18.5115, lng: 73.6828, km: 118, order: 4 },
          { name: 'Kothrud Stand', lat: 18.5074, lng: 73.8077, km: 134, order: 5 },
          { name: 'Swargate Bus Terminal, Pune', lat: 18.5018, lng: 73.8582, km: 142, order: 6 },
        ],
      },
      {
        title: 'Pune Swargate to Mhasla Taluka Evening',
        source: 'Swargate Bus Terminal, Pune, Maharashtra, 411042, India',
        destination: 'Mhasla Taluka, Raigad, Maharashtra, 402105, India',
        sourceLat: 18.5018,
        sourceLng: 73.8582,
        destLat: 18.1336,
        destLng: 73.1118,
        departureHoursFromNow: 12,
        durationMins: 195,
        distanceKm: 142,
        pricePerSeat: 349,
        status: 'scheduled',
        vehicleIdx: 1, // Ertiga
        driverIdx: 3, // Sachin Shinde
        waypoints: [
          { name: 'Swargate Terminal', lat: 18.5018, lng: 73.8582, km: 0, order: 1 },
          { name: 'Chandani Chowk, Kothrud', lat: 18.5085, lng: 73.7912, km: 10, order: 2 },
          { name: 'Tamhini Ghat Road', lat: 18.4728, lng: 73.4412, km: 64, order: 3 },
          { name: 'Mangaon', lat: 18.2526, lng: 73.2878, km: 110, order: 4 },
          { name: 'Mhasla Taluka', lat: 18.1336, lng: 73.1118, km: 142, order: 5 },
        ],
      },
      {
        title: 'Shrivardhan Beach to Mumbai Borivali via Mhasla',
        source: 'Shrivardhan Beach, Raigad, Maharashtra, 402110, India',
        destination: 'Borivali West Station, Mumbai, Maharashtra, 400092, India',
        sourceLat: 18.0538,
        sourceLng: 73.0182,
        destLat: 19.2307,
        destLng: 72.8567,
        departureHoursFromNow: 6,
        durationMins: 270,
        distanceKm: 195,
        pricePerSeat: 449,
        status: 'scheduled',
        vehicleIdx: 2, // Toyota Fortuner
        driverIdx: 4, // Salim Qureshi
        waypoints: [
          { name: 'Shrivardhan ST Stand', lat: 18.0538, lng: 73.0182, km: 0, order: 1 },
          { name: 'Mhasla Bypass', lat: 18.1336, lng: 73.1118, km: 18, order: 2 },
          { name: 'Mangaon', lat: 18.2526, lng: 73.2878, km: 50, order: 3 },
          { name: 'Panvel', lat: 18.9894, lng: 73.1175, km: 146, order: 4 },
          { name: 'Thane Majiwada', lat: 19.2183, lng: 72.9781, km: 174, order: 5 },
          { name: 'Borivali West Station', lat: 19.2307, lng: 72.8567, km: 195, order: 6 },
        ],
      },
      {
        title: 'Mhasla Taluka to Thane Teen Hath Naka Luxury Van',
        source: 'Mhasla Taluka, Raigad, Maharashtra, 402105, India',
        destination: 'Teen Hath Naka, Thane West, Maharashtra, 400602, India',
        sourceLat: 18.1336,
        sourceLng: 73.1118,
        destLat: 19.1865,
        destLng: 72.9644,
        departureHoursFromNow: 16,
        durationMins: 240,
        distanceKm: 175,
        pricePerSeat: 380,
        status: 'scheduled',
        vehicleIdx: 3, // Tata Winger 12 seater
        driverIdx: 2, // Ramesh Patil
        waypoints: [
          { name: 'Mhasla', lat: 18.1336, lng: 73.1118, km: 0, order: 1 },
          { name: 'Mangaon', lat: 18.2526, lng: 73.2878, km: 32, order: 2 },
          { name: 'Pen Express Bypass', lat: 18.7365, lng: 73.0894, km: 92, order: 3 },
          { name: 'Panvel Kalamboli', lat: 19.0125, lng: 73.1042, km: 135, order: 4 },
          { name: 'Airoli Toll Naka', lat: 19.1554, lng: 72.9982, km: 162, order: 5 },
          { name: 'Teen Hath Naka, Thane', lat: 19.1865, lng: 72.9644, km: 175, order: 6 },
        ],
      },
    ];

    for (const rc of routesConfig) {
      const vId = activeVehicleIds[rc.vehicleIdx] || activeVehicleIds[0];
      const dId = createdDriverIds[rc.driverIdx] || createdDriverIds[0];

      // Calculate departure and arrival times
      const depDate = new Date();
      depDate.setHours(depDate.getHours() + rc.departureHoursFromNow);
      depDate.setMinutes(0, 0, 0);

      const arrDate = new Date(depDate.getTime() + rc.durationMins * 60 * 1000);

      // Check vehicle capacity
      const vInfo = (await queryRunner.query(
        `SELECT "seatingCapacity" FROM vehicles WHERE id = $1`,
        [vId]
      ))[0];
      const totalSeats = vInfo?.seatingCapacity || 7;

      // Random booked seats between 1 and totalSeats - 2 so trips look active
      const bookedSeats = Math.floor(Math.random() * (totalSeats - 2)) + 1;
      const availableSeats = totalSeats - bookedSeats;

      // Check if trip with similar title already exists
      const existingTrip = (await queryRunner.query(
        `SELECT id FROM trips WHERE title = $1`,
        [rc.title]
      ))[0];

      let tripId: string;

      if (!existingTrip) {
        const tripRes = await queryRunner.query(
          `INSERT INTO trips (
            id, "vehicleId", "driverId", title, description, "tripType", status,
            source, destination, "sourceLat", "sourceLng", "destLat", "destLng",
            "departureTime", "arrivalTime", "totalSeats", "availableSeats", "bookedSeats",
            "basePrice", "pricePerSeat", "distanceKm", "estimatedDuration", "allowBooking",
            "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, 'one_way', $5,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, true,
            NOW(), NOW()
          ) RETURNING id`,
          [
            vId,
            dId,
            rc.title,
            `Direct high-frequency express fleet route from ${rc.source.split(',')[0]} to ${rc.destination.split(',')[0]}`,
            rc.status,
            rc.source,
            rc.destination,
            rc.sourceLat,
            rc.sourceLng,
            rc.destLat,
            rc.destLng,
            depDate,
            arrDate,
            totalSeats,
            availableSeats,
            bookedSeats,
            rc.pricePerSeat,
            rc.pricePerSeat,
            rc.distanceKm,
            rc.durationMins,
          ]
        );
        tripId = tripRes[0].id;
        console.log(`Created Trip: "${rc.title}" [${rc.status}] -> ID: ${tripId}`);
      } else {
        tripId = existingTrip.id;
        await queryRunner.query(
          `UPDATE trips SET
            "vehicleId" = $1, "driverId" = $2, status = $3,
            "source" = $4, "destination" = $5,
            "sourceLat" = $6, "sourceLng" = $7, "destLat" = $8, "destLng" = $9,
            "departureTime" = $10, "arrivalTime" = $11,
            "totalSeats" = $12, "availableSeats" = $13, "bookedSeats" = $14,
            "pricePerSeat" = $15, "distanceKm" = $16, "estimatedDuration" = $17,
            "updatedAt" = NOW()
          WHERE id = $18`,
          [
            vId,
            dId,
            rc.status,
            rc.source,
            rc.destination,
            rc.sourceLat,
            rc.sourceLng,
            rc.destLat,
            rc.destLng,
            depDate,
            arrDate,
            totalSeats,
            availableSeats,
            bookedSeats,
            rc.pricePerSeat,
            rc.distanceKm,
            rc.durationMins,
            tripId,
          ]
        );
        console.log(`Updated Trip: "${rc.title}" -> ID: ${tripId}`);
      }

      // ── Insert Trip Seats ──
      // Check existing seats
      const existingSeats = await queryRunner.query(
        `SELECT id FROM trip_seats WHERE "tripId" = $1`,
        [tripId]
      );

      if (existingSeats.length === 0) {
        for (let s = 1; s <= totalSeats; s++) {
          const isSeatBooked = s <= bookedSeats;
          const seatType = s === 1 ? 'window' : s % 2 === 0 ? 'aisle' : 'window';

          await queryRunner.query(
            `INSERT INTO trip_seats (
              id, "tripId", "seatNumber", "seatType", status, price, "createdAt", "updatedAt"
            ) VALUES (
              uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), NOW()
            )`,
            [
              tripId,
              String(s),
              seatType,
              isSeatBooked ? 'booked' : 'available',
              rc.pricePerSeat,
            ]
          );
        }
        console.log(`Generated ${totalSeats} seats for trip ${tripId}`);
      }

      // ── Insert Trip Route Waypoints ──
      const existingWaypoints = await queryRunner.query(
        `SELECT id FROM trip_routes WHERE "tripId" = $1`,
        [tripId]
      );

      if (existingWaypoints.length === 0 && rc.waypoints) {
        for (const wp of rc.waypoints) {
          await queryRunner.query(
            `INSERT INTO trip_routes (
              id, "tripId", waypoint, latitude, longitude, "sequenceOrder", "distanceFromStart", "createdAt", "updatedAt"
            ) VALUES (
              uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
            )`,
            [tripId, wp.name, wp.lat, wp.lng, wp.order, wp.km]
          );
        }
        console.log(`Inserted ${rc.waypoints.length} route waypoints for trip ${tripId}`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Update Fleet Aggregates
    // ─────────────────────────────────────────────────────────────────────────
    const vCount = (await queryRunner.query(
      `SELECT count(*) FROM fleet_vehicles WHERE "fleetCompanyId" = $1`,
      [fleetCompany.id]
    ))[0].count;

    const dCount = (await queryRunner.query(
      `SELECT count(*) FROM drivers WHERE "fleetCompanyId" = $1`,
      [fleetCompany.id]
    ))[0].count;

    const tCount = (await queryRunner.query(
      `SELECT count(*) FROM trips WHERE "vehicleId" IN (SELECT "vehicleId" FROM fleet_vehicles WHERE "fleetCompanyId" = $1)`,
      [fleetCompany.id]
    ))[0].count;

    await queryRunner.query(
      `UPDATE fleet_companies SET
        "totalVehicles" = $1,
        "totalDrivers" = $2,
        "totalTrips" = $3,
        "totalRevenue" = 184500,
        "updatedAt" = NOW()
      WHERE id = $4`,
      [parseInt(vCount), parseInt(dCount), parseInt(tCount), fleetCompany.id]
    );

    console.log(`\n🎉 Fleet statistics updated:`);
    console.log(`- Vehicles: ${vCount}`);
    console.log(`- Drivers: ${dCount}`);
    console.log(`- Trips: ${tCount}`);

    console.log('\n✅ ALL DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    throw err;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seedCompleteFleetData().catch(console.error);

