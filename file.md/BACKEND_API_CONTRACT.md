# Travel SaaS Platform - Complete Backend API Contract

**Generated:** June 2, 2026  
**Framework:** NestJS + TypeORM + PostgreSQL  
**Database:** PostgreSQL with 23 entities

---

## Table of Contents

1. [Users Module](#users-module)
2. [Authentication Module](#authentication-module)
3. [Roles & Permissions Module](#roles--permissions-module)
4. [Drivers Module](#drivers-module)
5. [Vehicles Module](#vehicles-module)
6. [Fleet Module](#fleet-module)
7. [Trips Module](#trips-module)
8. [Bookings Module](#bookings-module)
9. [Payments Module](#payments-module)
10. [Wallet Module](#wallet-module)
11. [Notifications Module](#notifications-module)
12. [Support Module](#support-module)
13. [Tracking Module](#tracking-module)
14. [Ratings Module](#ratings-module)

---

## USERS MODULE

### Entity: User
**Database Table:** `users`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | Primary key |
| firstName | varchar(100) | Yes | MinLength: 2, MaxLength: 100 | |
| lastName | varchar(100) | Yes | MinLength: 2, MaxLength: 100 | |
| email | varchar(255) | Yes | Unique | |
| phone | varchar(20) | No | Unique | International format with country code |
| password | varchar(255) | No | MinLength: 8 | Hashed password |
| userType | enum | Yes | Default: PASSENGER | PASSENGER, VEHICLE_OWNER, DRIVER, ADMIN, SUPER_ADMIN, SUPPORT |
| status | enum | Yes | Default: PENDING_KYC | ACTIVE, INACTIVE, SUSPENDED, PENDING_KYC, KYC_VERIFIED, KYC_REJECTED |
| profileImage | varchar(255) | No | | URL to profile image |
| address | text | No | | Street address |
| city | varchar(100) | No | | |
| state | varchar(100) | No | | |
| pincode | varchar(20) | No | | |
| country | varchar(100) | No | | |
| kycDocumentType | varchar(50) | No | | Aadhar, PAN, Passport, etc. |
| kycDocumentNumber | varchar(255) | No | | Document ID |
| kycDocumentFront | varchar(255) | No | | Document image URL |
| kycDocumentBack | varchar(255) | No | | Document image URL |
| kycSelfie | varchar(255) | No | | Self-verification image URL |
| kycVerifiedAt | timestamp | No | | KYC verification date |
| kycRejectionReason | text | No | | Reason for KYC rejection |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |
| deletedAt | timestamp | No | Soft delete | |

#### Relationships
- **Role:** Many-to-One relationship with Role entity
- **Vehicles:** One-to-Many (user owns vehicles)
- **Bookings:** One-to-Many (user makes bookings)
- **Wallet:** One-to-One (user has one wallet)
- **DriverProfile:** One-to-One (user has driver profile)
- **Notifications:** One-to-Many (user receives notifications)
- **FleetCompanies:** One-to-Many (user owns fleet companies)
- **SupportTickets:** One-to-Many (user creates support tickets)

### DTOs

#### CreateUserDto
```typescript
{
  firstName: string (2-100 chars, required)
  lastName: string (2-100 chars, required)
  email: string (email format, required)
  phone: string (required)
  password: string (min 8 chars, required)
  userType: enum (required) - PASSENGER | VEHICLE_OWNER | DRIVER | ADMIN | SUPER_ADMIN | SUPPORT
  roleName?: enum - SUPER_ADMIN | ADMIN | VEHICLE_OWNER | DRIVER | PASSENGER | SUPPORT | FLEET_MANAGER | SUPPORT_AGENT
  status?: enum - ACTIVE | INACTIVE | SUSPENDED | PENDING_KYC | KYC_VERIFIED | KYC_REJECTED
}
```

#### UpdateProfileDto
```typescript
{
  firstName?: string (2-100 chars)
  lastName?: string (2-100 chars)
  address?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  emergencyContactPhone?: string
  emergencyContactName?: string
  profileImage?: string (URL)
  preferredLanguage?: string (ISO 639-1 code)
}
```

#### UpdateUserDto
```typescript
{
  firstName?: string
  lastName?: string
  email?: string (email format)
  phone?: string
  userType?: enum (PASSENGER | VEHICLE_OWNER | DRIVER | ADMIN | SUPER_ADMIN | SUPPORT)
  status?: enum
}
```

#### KycSubmissionDto
```typescript
{
  documentType: string (required) - Aadhar, PAN, Passport, DL
  documentNumber: string (required)
  documentFront: string (required) - File URL
  documentBack: string (optional) - File URL
  selfie: string (required) - File URL
}
```

#### KycVerificationDto
```typescript
{
  isVerified: boolean (required)
  rejectionReason?: string (required if isVerified = false)
}
```

#### UserQueryDto (Pagination & Filtering)
```typescript
{
  page?: number (default: 1)
  limit?: number (default: 10)
  status?: enum (ACTIVE | INACTIVE | SUSPENDED | PENDING_KYC | KYC_VERIFIED | KYC_REJECTED)
  userType?: enum
  search?: string (searches firstName, lastName, email)
}
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/users/me` | JWT | All | Get current user profile |
| PUT | `/users/me` | JWT | All | Update current user profile |
| POST | `/users/me/kyc` | JWT | All | Submit KYC documents |
| GET | `/users` | JWT | ADMIN, SUPER_ADMIN | Get all users (paginated) |
| GET | `/users/:id` | JWT | ADMIN, SUPER_ADMIN | Get user by ID |
| POST | `/users` | JWT | SUPER_ADMIN | Create new user |
| PUT | `/users/:id` | JWT | ADMIN, SUPER_ADMIN | Update user (admin) |
| PATCH | `/users/:id/kyc` | JWT | ADMIN, SUPER_ADMIN | Verify/reject KYC |
| PATCH | `/users/:id/suspend` | JWT | SUPER_ADMIN | Suspend/activate user |
| DELETE | `/users/:id` | JWT | SUPER_ADMIN | Delete user (soft delete) |

---

## AUTHENTICATION MODULE

### DTOs

#### RegisterDto
```typescript
{
  firstName: string (2-100 chars, required)
  lastName: string (2-100 chars, required)
  email: string (email format, required)
  phone: string (international format, required) - Pattern: /^\+[1-9]\d{1,14}$/
  password: string (required) - Min 8 chars, 1 uppercase, 1 lowercase, 1 number
  userType: enum (required) - PASSENGER | VEHICLE_OWNER | DRIVER | ADMIN | SUPER_ADMIN | SUPPORT
  roleName?: enum - SUPER_ADMIN | ADMIN | VEHICLE_OWNER | DRIVER | PASSENGER | SUPPORT | FLEET_MANAGER | SUPPORT_AGENT
  ip?: string (optional)
}
```

#### LoginDto
```typescript
{
  email?: string (email format, optional)
  phone?: string (optional)
  password: string (required)
  ip?: string (optional)
}
```

#### VerifyOtpDto
```typescript
{
  phone: string (required)
  otp: string (required) - 4-8 characters
}
```

#### ResendOtpDto
```typescript
{
  phone: string (required)
}
```

#### RefreshTokenDto
```typescript
{
  refreshToken: string (required)
}
```

#### ForgotPasswordDto
```typescript
{
  email: string (email format, required)
}
```

#### ResetPasswordDto
```typescript
{
  token: string (required) - Token from email
  newPassword: string (required) - Min 8 chars, 1 uppercase, 1 lowercase, 1 number
}
```

#### ChangePasswordDto
```typescript
{
  currentPassword: string (required)
  newPassword: string (required) - Min 8 chars, 1 uppercase, 1 lowercase, 1 number
}
```

#### SocialLoginDto
```typescript
{
  provider: string (required) - google | facebook | apple
  idToken: string (required)
  email?: string
  firstName?: string
  lastName?: string
  profileImage?: string
}
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login with email/phone + password |
| POST | `/auth/login/otp` | Public | Request OTP for phone login |
| POST | `/auth/verify-otp` | Public | Verify OTP and login |
| POST | `/auth/resend-otp` | Public | Resend OTP |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password with token |
| POST | `/auth/change-password` | JWT | Change password (authenticated) |
| GET | `/auth/me` | JWT | Get current user profile |
| POST | `/auth/logout` | JWT | Logout user |
| POST | `/auth/social-login` | Public | Social login (Google, Facebook, Apple) |

### Response Format
```typescript
{
  user: {
    id: string (UUID)
    firstName: string
    lastName: string
    email: string
    phone: string
    userType: enum
    status: enum
    profileImage?: string
    role?: { name: enum, displayName: string }
  }
  accessToken: string (JWT)
  refreshToken: string (for refresh endpoint)
  expiresIn: number (seconds)
}
```

---

## ROLES & PERMISSIONS MODULE

### Entity: Role
**Database Table:** `roles`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| name | enum | Yes | Unique | SUPER_ADMIN, ADMIN, VEHICLE_OWNER, DRIVER, PASSENGER, SUPPORT, FLEET_MANAGER, SUPPORT_AGENT |
| displayName | varchar(255) | Yes | | User-friendly name |
| description | text | No | | |
| hierarchyLevel | int | Yes | Default: 0 | For role hierarchy (0=lowest, higher=more permissions) |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

#### Relationships
- **Permissions:** Many-to-Many relationship with Permission entity (join table: role_permissions)
- **Users:** One-to-Many (users have roles)

### Entity: Permission
**Database Table:** `permissions`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| code | varchar(100) | Yes | Unique | e.g., "users:create", "vehicles:approve" |
| name | varchar(255) | Yes | | User-friendly name |
| description | text | No | | |
| module | varchar(50) | Yes | | users, vehicles, trips, bookings, payments, etc. |
| action | varchar(50) | Yes | | create, read, update, delete, approve, verify, etc. |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

#### Relationships
- **Roles:** Many-to-Many relationship with Role entity (join table: role_permissions)

### Role Hierarchy
```
SUPER_ADMIN (Level: 100) - Full access to all resources
  ↓
ADMIN (Level: 80) - Manage users, vehicles, trips, support
  ↓
FLEET_MANAGER (Level: 60) - Manage fleet and drivers
  ↓
SUPPORT_AGENT (Level: 50) - Handle support tickets
  ↓
VEHICLE_OWNER (Level: 30) - Create trips, manage vehicles
  ↓
DRIVER (Level: 20) - Manage assigned trips, update location
  ↓
PASSENGER (Level: 10) - Book trips, rate, support tickets
```

---

## DRIVERS MODULE

### Entity: Driver
**Database Table:** `drivers`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| userId | UUID | Yes | Unique, FK | Reference to User entity |
| licenseNumber | varchar(100) | No | | Driving license number |
| licenseDocument | varchar(255) | No | | License document URL |
| licenseExpiry | date | No | | License expiration date |
| licenseType | varchar(50) | No | | LMV, HMV, etc. |
| drivingExperience | int | Yes | Default: 0 | Years of experience |
| backgroundCheckDocument | varchar(255) | No | | Background verification URL |
| status | enum | Yes | Default: PENDING | PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE, ON_TRIP, OFFLINE, SUSPENDED |
| rating | decimal(3,2) | Yes | Default: 0 | Average rating (0-5) |
| totalTrips | int | Yes | Default: 0 | |
| totalRatings | int | Yes | Default: 0 | Count of ratings received |
| cancelledTrips | int | Yes | Default: 0 | |
| totalEarnings | decimal(10,2) | Yes | Default: 0 | Total money earned |
| currentBalance | decimal(10,2) | Yes | Default: 0 | Available balance |
| currentLocation | varchar(255) | No | | Current location name |
| currentLatitude | decimal(10,8) | No | | |
| currentLongitude | decimal(11,8) | No | | |
| locationUpdatedAt | timestamp | No | | Last location update time |
| isOnline | boolean | Yes | Default: false | |
| lastOnlineAt | timestamp | No | | |
| documents | simple-json | No | | Flexible document storage |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |
| deletedAt | timestamp | No | Soft delete | |

#### Relationships
- **User:** One-to-One relationship with User entity
- **Trips:** One-to-Many (driver operates trips)

### DTO: DriverProfileDto (Part of Auth/User)
```typescript
{
  licenseNumber: string
  licenseDocument: string (file URL)
  licenseExpiry: date
  licenseType: string
  drivingExperience: int
  backgroundCheckDocument: string (file URL)
}
```

### Enums

#### DriverStatus
```
PENDING - Awaiting approval
APPROVED - Approved but not yet active
REJECTED - Application rejected
ACTIVE - Active and can accept trips
INACTIVE - Temporarily inactive
ON_TRIP - Currently on a trip
OFFLINE - Not available for trips
SUSPENDED - Suspended account
```

---

## VEHICLES MODULE

### Entity: Vehicle
**Database Table:** `vehicles`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| ownerId | UUID | Yes | FK | Reference to User (vehicle owner) |
| registrationNumber | varchar(50) | Yes | | License plate number |
| brand | varchar(100) | Yes | | Vehicle manufacturer |
| model | varchar(100) | Yes | | Model name |
| year | int | Yes | Min: 1990, Max: 2030 | Manufacturing year |
| type | enum | Yes | | SEDAN, SUV, HATCHBACK, MPV, VAN, MINIBUS, BUS, LUXURY, ELECTRIC |
| color | varchar(50) | Yes | | |
| seatingCapacity | int | Yes | Min: 1, Max: 100 | Number of seats |
| fuelType | varchar(50) | No | | Petrol, Diesel, CNG, LPG, Electric, Hybrid |
| transmission | varchar(50) | No | | Manual, Automatic |
| vehicleImage | varchar(255) | No | | Vehicle photo URL |
| rcNumber | varchar(255) | No | | Registration Certificate number |
| rcDocument | varchar(255) | No | | RC document URL |
| insuranceNumber | varchar(255) | No | | Insurance policy number |
| insuranceExpiry | date | No | | Insurance expiration date |
| insuranceDocument | varchar(255) | No | | Insurance document URL |
| permitNumber | varchar(255) | No | | Commercial permit number |
| permitExpiry | date | No | | Permit expiration date |
| permitDocument | varchar(255) | No | | Permit document URL |
| fitnessNumber | varchar(255) | No | | Fitness certificate number |
| fitnessExpiry | date | No | | Fitness expiration date |
| fitnessDocument | varchar(255) | No | | Fitness document URL |
| pollutionNumber | varchar(255) | No | | PUC number |
| pollutionExpiry | date | No | | PUC expiration date |
| pollutionDocument | varchar(255) | No | | PUC document URL |
| status | enum | Yes | Default: PENDING | PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE, MAINTENANCE, SUSPENDED |
| hasAC | boolean | No | | |
| hasWifi | boolean | No | | |
| hasCharging | boolean | No | | |
| hasToilet | boolean | No | | |
| basePrice | decimal(10,2) | No | | Base price for trip |
| pricePerKm | decimal(10,2) | No | | Price per kilometer |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |
| deletedAt | timestamp | No | Soft delete | |

#### Relationships
- **Owner:** Many-to-One relationship with User entity
- **Documents:** One-to-Many relationship with VehicleDocument entity
- **Trips:** One-to-Many relationship with Trip entity
- **FleetDetails:** One-to-One relationship with FleetVehicle entity

### Entity: VehicleDocument
**Database Table:** `vehicle_documents`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID    | Yes      | PK           | |
| vehicleId    | UUID    | Yes      | FK | Reference to Vehicle |
| documentType | enum    | Yes      | | RC, INSURANCE, PERMIT, FITNESS, POLLUTION, OWNERSHIP, OTHER |
| documentUrl  | varchar(255) | Yes | | Document file URL |
| documentNumber | varchar(255) | No | | Document ID/Number |
| expiryDate | date | No | | Expiration date |
| verificationStatus | enum | Yes | Default: PENDING | PENDING, APPROVED, REJECTED |
| verifiedAt | timestamp | No | | Verification timestamp |
| verifiedBy | UUID | No | | Admin who verified |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

### DTOs

#### CreateVehicleDto
```typescript
{
  registrationNumber: string (5-50 chars, required)
  brand: string (required)
  model: string (required)
  year: int (1990-2030, required)
  type: enum (required) - SEDAN | SUV | HATCHBACK | MPV | VAN | MINIBUS | BUS | LUXURY | ELECTRIC
  color: string (required)
  seatingCapacity: int (1-100, required)
  fuelType?: string
  transmission?: string
  vehicleImage?: string (URL)
  rcNumber?: string
  rcDocument?: string (URL)
  insuranceNumber?: string
  insuranceExpiry?: string (date)
  insuranceDocument?: string (URL)
  hasAC?: boolean
  hasWifi?: boolean
  hasCharging?: boolean
  basePrice?: number
  pricePerKm?: number
  documents?: VehicleDocumentInputDto[]
}
```

#### VehicleDocumentInputDto
```typescript
{
  documentType: enum (required) - RC | INSURANCE | PERMIT | FITNESS | POLLUTION | OWNERSHIP | OTHER
  documentUrl: string (required)
  documentNumber?: string
  expiryDate?: string (date)
}
```

#### UpdateVehicleDto
```typescript
{
  brand?: string
  model?: string
  color?: string
  seatingCapacity?: int (1-100)
  fuelType?: string
  transmission?: string
  vehicleImage?: string
  hasAC?: boolean
  hasWifi?: boolean
  hasCharging?: boolean
  basePrice?: number
  pricePerKm?: number
}
```

#### VerifyVehicleDto
```typescript
{
  isApproved: boolean (required)
  rejectionReason?: string (required if isApproved = false)
}
```

#### VehicleQueryDto
```typescript
{
  page?: number
  limit?: number
  status?: enum
  search?: string
}
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/vehicles` | JWT | All | Register new vehicle |
| GET | `/vehicles` | JWT | ADMIN, SUPER_ADMIN | Get all vehicles (admin) |
| GET | `/vehicles/my-vehicles` | JWT | All | Get current user's vehicles |
| GET    | `/vehicles/stats` | JWT | All | Get vehicle statistics |
| GET    | `/vehicles/:id` | JWT | All | Get vehicle details |
| PUT    | `/vehicles/:id` | JWT | All | Update vehicle |
| PATCH  | `/vehicles/:id/verify` | JWT | ADMIN, SUPER_ADMIN | Verify/reject vehicle |
| POST   | `/vehicles/:id/documents` | JWT | All | Upload vehicle document |
| DELETE | `/vehicles/:id` | JWT | All | Delete vehicle |

### Enums

#### VehicleType
```
SEDAN
SUV
HATCHBACK
MPV
VAN
MINIBUS
BUS
LUXURY
ELECTRIC
```

#### VehicleStatus
```
PENDING - Awaiting verification
APPROVED - Verified and approved
REJECTED - Verification rejected
ACTIVE - Listed and available for trips
INACTIVE - Not available for trips
MAINTENANCE - Under maintenance
SUSPENDED - Suspended account
```

---

## FLEET MODULE

### Entity: FleetCompany
**Database Table:** `fleet_companies`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| ownerId | UUID | Yes | FK | Reference to User (fleet owner) |
| name | varchar(255) | Yes | | Fleet company name |
| description | text | No | | |
| logo | varchar(255) | No | | Company logo URL |
| email | varchar(255) | Yes | | Contact email |
| phone | varchar(20) | Yes | | Contact phone |
| address | text | No | | |
| city | varchar(100) | No | | |
| state | varchar(100) | No | | |
| pincode | varchar(20) | No | | |
| country | varchar(100) | No | | |
| registrationNumber | varchar(50) | No | | Business registration number |
| taxId | varchar(255) | No | | GST/VAT ID |
| status | enum | Yes | Default: PENDING | ACTIVE, INACTIVE, SUSPENDED, PENDING |
| totalVehicles | int | Yes | Default: 0 | |
| totalDrivers | int | Yes | Default: 0 | |
| totalTripsCompleted | int | Yes | Default: 0 | |
| averageRating | decimal(3,2) | Yes | Default: 0 | |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |
| deletedAt | timestamp | No | Soft delete | |

#### Relationships
- **Owner:** Many-to-One relationship with User entity
- **FleetVehicles:** One-to-Many relationship with FleetVehicle entity

### Entity: FleetVehicle
**Database Table:** `fleet_vehicles`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| fleetCompanyId | UUID | Yes | FK | Reference to FleetCompany |
| vehicleId | UUID | Yes | FK | Reference to Vehicle |
| fleetNumber | varchar(50) | No | | Fleet-specific vehicle number |
| status | enum | Yes | Default: ACTIVE | ACTIVE, MAINTENANCE, RETIRED, INACTIVE |
| purchaseDate | date | No | | |
| purchasePrice | decimal(12,2) | No | | |
| totalKmDriven | int | Yes | Default: 0 | |
| lastMaintenanceDate | date | No | | |
| nextMaintenanceDate | date | No | | |
| maintenanceCount | int | Yes | Default: 0 | |
| totalMaintenanceCost | decimal(12,2) | Yes | Default: 0 | |
| fuelEfficiency | decimal(10,2) | Yes | Default: 0 | km/liter |
| fuelType | varchar(50) | No | | |
| maintenanceHistory | simple-json | No | | Array of maintenance records |
| insuranceDetails | simple-json | No | | Insurance information JSON |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

### DTOs

#### CreateFleetDto
```typescript
{
  companyName: string (required)
  description?: string
  logo?: string (URL)
  email: string (email format, required)
  phone: string (required)
  address?: string
  city?: string
  state?: string
  registrationNumber?: string
  taxId?: string
}
```

#### UpdateFleetDto
```typescript
{
  companyName?: string
  description?: string
  email?: string
  phone?: string
  address?: string
  logo?: string (URL)
}
```

#### AddFleetVehicleDto
```typescript
{
  vehicleId?: string (UUID)
  registrationNumber?: string
  make?: string
  model?: string
  year?: int
  capacity?: int
  status?: string
  fleetNumber?: string
  purchaseDate?: date
  purchasePrice?: decimal
}
```

#### UpdateFleetVehicleDto
```typescript
{
  status?: enum (ACTIVE | MAINTENANCE | RETIRED | INACTIVE)
  fleetNumber?: string
  purchasePrice?: decimal
  lastMaintenanceDate?: date
  nextMaintenanceDate?: date
}
```

#### FleetQueryDto
```typescript
{
  page?: number
  limit?: number
  status?: enum
  search?: string
}
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/fleet` | JWT | FLEET_MANAGER, VEHICLE_OWNER | Create fleet company |
| GET | `/fleet/my-fleets` | JWT | FLEET_MANAGER, VEHICLE_OWNER | Get my fleet companies |
| GET | `/fleet/:id` | JWT | All | Get fleet details |
| PUT | `/fleet/:id` | JWT | FLEET_MANAGER, VEHICLE_OWNER | Update fleet company |
| DELETE | `/fleet/:id` | JWT | FLEET_MANAGER, VEHICLE_OWNER | Delete fleet company |
| POST | `/fleet/:id/vehicles` | JWT | FLEET_MANAGER, VEHICLE_OWNER | Add vehicle to fleet |
| GET | `/fleet/:id/vehicles` | JWT | FLEET_MANAGER, VEHICLE_OWNER | Get fleet vehicles |
| PUT | `/fleet/:fleetId/vehicles/:vehicleId` | JWT | FLEET_MANAGER, VEHICLE_OWNER | Update fleet vehicle |
| GET | `/fleet/:id/analytics` | JWT | FLEET_MANAGER, VEHICLE_OWNER | Get fleet analytics |
| GET | `/fleet` | JWT | ADMIN, SUPER_ADMIN | Get all fleets (admin) |

---

## TRIPS MODULE

### Entity: Trip
**Database Table:** `trips`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| vehicleId | UUID | Yes | FK | Reference to Vehicle |
| driverId | UUID | No | FK | Reference to Driver (optional until assigned) |
| title | varchar(255) | Yes | | Trip name/description |
| description | text | No | | Detailed description |
| tripType | enum | Yes | | ONE_WAY, ROUND_TRIP, RETURN_ONLY |
| status | enum | Yes | Default: SCHEDULED | SCHEDULED, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED, DELAYED |
| source | varchar(255) | Yes | | Starting location |
| destination | varchar(255) | Yes | | Ending location |
| sourceLat | decimal(10,8) | Yes | | Source latitude |
| sourceLng | decimal(11,8) | Yes | | Source longitude |
| destLat | decimal(10,8) | Yes | | Destination latitude |
| destLng | decimal(11,8) | Yes | | Destination longitude |
| departureTime | timestamp | Yes | | Departure datetime |
| arrivalTime | timestamp | No | | Expected arrival time |
| completedAt | timestamp | No | | Actual completion time |
| returnDepartureTime | timestamp | No | | Return trip departure (if round trip) |
| returnArrivalTime | timestamp | No | | Return trip arrival time |
| totalSeats | int | Yes | | Total available seats |
| availableSeats | int | Yes | Default: 0 | Currently available seats |
| bookedSeats | int | Yes | Default: 0 | Currently booked seats |
| basePrice | decimal(10,2) | Yes | | Base fare |
| pricePerSeat | decimal(10,2) | Yes | | Price per seat |
| returnPricePerSeat | decimal(10,2) | No | | Price for return trip |
| distanceKm | int | No | | Trip distance in km |
| estimatedDuration | int | No | | Duration in minutes |
| routePolyline | varchar(50) | No | | Encoded polyline for map display |
| isReturnTripAvailable | boolean | Yes | Default: false | |
| allowBooking | boolean | Yes | Default: true | |
| bookingCloseTime | timestamp | No | | Deadline for bookings |
| cancellationPolicy | varchar(50) | No | | Cancellation policy code |
| metadata | simple-json | No | | Additional data |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |
| deletedAt | timestamp | No | Soft delete | |

#### Relationships
- **Vehicle:** Many-to-One relationship with Vehicle entity
- **Driver:** Many-to-One relationship with Driver entity (optional)
- **Routes:** One-to-Many relationship with TripRoute entity
- **Stops:** One-to-Many relationship with TripStop entity
- **Seats:** One-to-Many relationship with TripSeat entity
- **Bookings:** One-to-Many relationship with Booking entity
- **Ratings:** One-to-Many relationship with Rating entity

### Entity: TripRoute
**Database Table:** `trip_routes`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| tripId | UUID | Yes | FK | Reference to Trip |
| waypoint | varchar(255) | Yes | | Location name |
| latitude | decimal(10,8) | Yes | | |
| longitude | decimal(11,8) | Yes | | |
| sequenceOrder | int | No | | Order in route |
| distanceFromStart | int | No | | km from start |
| estimatedArrival | int | No | | Minutes from start |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

### Entity: TripStop
**Database Table:** `trip_stops`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| tripId | UUID | Yes | FK | Reference to Trip |
| stopName | varchar(255) | Yes | | Stop location name |
| latitude | decimal(10,8) | Yes | | |
| longitude | decimal(11,8) | Yes | | |
| sequenceOrder | int | Yes | | Order of stop |
| estimatedArrival | timestamp | No | | Expected arrival time |
| stopDuration | int | Yes | Default: 0 | Duration in minutes |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

### Entity: TripSeat
**Database Table:** `trip_seats`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| tripId | UUID | Yes | FK | Reference to Trip |
| seatNumber | varchar(20) | Yes | | Seat identifier |
| row | varchar(50) | No | | Row number |
| seatType | enum | Yes | Default: WINDOW | WINDOW, AISLE, MIDDLE, PREMIUM, RECLINER |
| status | enum | Yes | Default: AVAILABLE | AVAILABLE, BOOKED, RESERVED, BLOCKED, UNAVAILABLE |
| price | decimal(10,2) | No | | Seat-specific price |
| bookingId | UUID | No | FK | Reference to Booking |
| isReturnSeat | boolean | Yes | Default: false | Is this a return trip seat |
| reservedUntil | timestamp | No | | Reservation expiration |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

### DTOs

#### CreateRouteDto
```typescript
{
  waypoint: string (required)
  latitude: number (required)
  longitude: number (required)
  distanceFromStart?: number
}
```

#### CreateStopDto
```typescript
{
  stopName: string (required)
  latitude: number (required)
  longitude: number (required)
  estimatedArrival?: date
  stopDuration?: int
}
```

#### CreateTripDto
```typescript
{
  vehicleId: string (UUID, required)
  title: string (required)
  description?: string
  tripType: enum (required) - ONE_WAY | ROUND_TRIP | RETURN_ONLY
  source: string (required)
  destination: string (required)
  sourceLat: number (required)
  sourceLng: number (required)
  destLat: number (required)
  destLng: number (required)
  departureTime: date (required)
  arrivalTime?: date
  returnDepartureTime?: date
  returnArrivalTime?: date
  basePrice: number (required)
  pricePerSeat: number (required)
  returnPricePerSeat?: number
  distanceKm?: int
  estimatedDuration?: int
  routePolyline?: string
  isReturnTripAvailable?: boolean
  bookingCloseTime?: timestamp
  cancellationPolicy?: string
  routes?: CreateRouteDto[]
  stops?: CreateStopDto[]
}
```

#### UpdateTripDto
```typescript
{
  title?: string
  description?: string
  pricePerSeat?: number
  returnPricePerSeat?: number
  bookingCloseTime?: timestamp
  cancellationPolicy?: string
}
```

#### UpdateTripStatusDto
```typescript
{
  status: enum (required) - ACTIVE | IN_PROGRESS | COMPLETED | CANCELLED | DELAYED
  cancellationReason?: string
}
```

#### AssignDriverDto
```typescript
{
  driverId: string (UUID, required)
}
```

#### TripSearchDto (Public Endpoint)
```typescript
{
  source: string (required)
  destination: string (required)
  date: date (required)
  seats?: number
  tripType?: enum
  maxPrice?: number
}
```

#### TripQueryDto
```typescript
{
  page?: number
  limit?: number
  status?: enum
  search?: string
}
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/trips` | JWT | VEHICLE_OWNER, FLEET_MANAGER | Create new trip |
| GET | `/trips/search` | Public | - | Search available trips |
| GET | `/trips/my-trips` | JWT | VEHICLE_OWNER | Get my trips |
| GET | `/trips/:id` | JWT | All | Get trip details |
| PUT | `/trips/:id` | JWT | VEHICLE_OWNER | Update trip |
| PATCH | `/trips/:id/status` | JWT | VEHICLE_OWNER, DRIVER | Update trip status |
| PATCH | `/trips/:id/assign-driver` | JWT | VEHICLE_OWNER, FLEET_MANAGER | Assign driver |
| DELETE | `/trips/:id` | JWT | VEHICLE_OWNER | Cancel trip |
| GET | `/trips` | JWT | ADMIN, SUPER_ADMIN | Get all trips (admin) |

---

## BOOKINGS MODULE

### Entity: Booking
**Database Table:** `bookings`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| bookingNumber | varchar(50) | Yes | Unique | Reference number for user |
| passengerId | UUID | Yes | FK | Reference to User (passenger) |
| tripId | UUID | Yes | FK | Reference to Trip |
| bookingType | enum | Yes | | ONE_WAY, RETURN, ROUND_TRIP |
| status | enum | Yes | Default: PENDING | PENDING, CONFIRMED, CHECKED_IN, ON_TRIP, COMPLETED, CANCELLED, NO_SHOW, REFUNDED |
| paymentStatus | enum | Yes | Default: PENDING | PENDING, PAID, FAILED, REFUNDED, PARTIAL_REFUND |
| numberOfSeats | int | Yes | | |
| seatNumbers | simple-array | No | | Array of seat numbers |
| outboundSeatId | UUID | No | FK | Seat for outbound journey |
| returnSeatId | UUID | No | | Seat for return journey |
| pickupLocation | varchar(255) | No | | Custom pickup location |
| pickupLat | decimal(10,8) | No | | |
| pickupLng | decimal(11,8) | No | | |
| dropLocation | varchar(255) | No | | Custom drop location |
| dropLat | decimal(10,8) | No | | |
| dropLng | decimal(11,8) | No | | |
| totalPrice | decimal(10,2) | Yes | | Total booking amount |
| discountAmount | decimal(10,2) | Yes | Default: 0 | Discount applied |
| taxAmount | decimal(10,2) | Yes | Default: 0 | Tax/GST amount |
| finalPrice | decimal(10,2) | Yes | | Price after discounts |
| passengerName | varchar(255) | No | | |
| passengerPhone | varchar(20) | No | | |
| passengerEmail | varchar(255) | No | | |
| specialRequests | text | No | | Passenger notes |
| cancellationReason | text | No | | Reason for cancellation |
| cancelledAt | timestamp | No | | Cancellation time |
| refundAmount | decimal(10,2) | Yes | Default: 0 | Amount refunded |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |
| deletedAt | timestamp | No | Soft delete | |

#### Relationships
- **Passenger:** Many-to-One relationship with User entity
- **Trip:** Many-to-One relationship with Trip entity
- **Seat:** One-to-One relationship with TripSeat entity
- **Payments:** One-to-Many relationship with Payment entity

### DTOs

#### CreateBookingDto
```typescript
{
  tripId: string (UUID, required)
  seatNumbers: string[] (required) - Array of seat numbers
  bookingType: enum (required) - ONE_WAY | RETURN | ROUND_TRIP
  paymentMethod: string (required) - wallet | stripe | razorpay | cash | upi
  pickupLocation?: string
  dropLocation?: string
  passengerName?: string
  passengerPhone?: string
  passengerEmail?: string
  couponCode?: string
}
```

#### CancelBookingDto
```typescript
{
  reason: string (required)
}
```

#### UpdateBookingStatusDto
```typescript
{
  status: enum (required) - CHECKED_IN | ON_TRIP | COMPLETED | NO_SHOW
}
```

#### BookingQueryDto
```typescript
{
  page?: number
  limit?: number
  status?: enum
  passengerId?: string (UUID)
  tripId?: string (UUID)
}
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/bookings` | JWT | PASSENGER | Create booking |
| GET | `/bookings/my-bookings` | JWT | PASSENGER | Get my bookings |
| GET | `/bookings/:id` | JWT | PASSENGER | Get booking details |
| PATCH | `/bookings/:id/cancel` | JWT | PASSENGER | Cancel booking |
| PATCH | `/bookings/:id/status` | JWT | DRIVER, ADMIN | Update status |
| GET | `/bookings` | JWT | ADMIN, SUPER_ADMIN | Get all bookings |

---

## PAYMENTS MODULE

### Entity: Payment
**Database Table:** `payments`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| transactionId | varchar(100) | Yes | Unique | Internal transaction ID |
| userId | UUID | Yes | FK | User making payment |
| bookingId | UUID | No | FK | Associated booking (if any) |
| paymentType | enum | Yes | | BOOKING, REFUND, WALLET_TOPUP, WALLET_WITHDRAWAL, COMMISSION, SUBSCRIPTION |
| method | enum | Yes | | STRIPE, RAZORPAY, WALLET, CASH, UPI, CARD, NET_BANKING |
| status | enum | Yes | Default: PENDING | PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, PARTIAL_REFUND, CANCELLED |
| amount | decimal(10,2) | Yes | | Payment amount |
| currency | varchar(10) | Yes | Default: INR | Currency code |
| stripePaymentIntentId | varchar(255) | No | | Stripe integration ID |
| razorpayOrderId | varchar(255) | No | | Razorpay order ID |
| razorpayPaymentId | varchar(255) | No | | Razorpay payment ID |
| razorpaySignature | varchar(255) | No | | Razorpay signature for verification |
| paymentGatewayResponse | text | No | | Full response from gateway |
| failureReason | varchar(255) | No | | Reason for failure |
| refundId | varchar(255) | No | | Refund reference ID |
| refundAmount | decimal(10,2) | Yes | Default: 0 | Amount refunded |
| refundStatus | enum | No | | PENDING, COMPLETED, FAILED |
| refundedAt | timestamp | No | | Refund completion time |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

#### Relationships
- **User:** Many-to-One relationship with User entity
- **Booking:** Many-to-One relationship with Booking entity

### Entity: Wallet
**Database Table:** `wallets`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| userId | UUID | Yes | Unique, FK | Reference to User |
| balance | decimal(12,2) | Yes | Default: 0 | Current wallet balance |
| totalCredited | decimal(12,2) | Yes | Default: 0 | Total money added |
| totalDebited | decimal(12,2) | Yes | Default: 0 | Total money spent |
| isActive | boolean | Yes | Default: true | |
| currency | varchar(50) | No | Default: INR | |
| metadata | simple-json | No | | Additional information |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

#### Relationships
- **User:** One-to-One relationship with User entity
- **Transactions:** One-to-Many relationship with WalletTransaction entity

### Entity: WalletTransaction
**Database Table:** `wallet_transactions`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| walletId | UUID | Yes | FK | Reference to Wallet |
| transactionId | varchar(100) | Yes | Unique | Transaction reference |
| type | enum | Yes | | CREDIT, DEBIT |
| purpose | enum | Yes | | BOOKING_PAYMENT, REFUND, TOPUP, WITHDRAWAL, COMMISSION, BONUS, PENALTY |
| status | enum | Yes | Default: COMPLETED | PENDING, COMPLETED, FAILED, CANCELLED |
| amount | decimal(12,2) | Yes | | Transaction amount |
| balanceAfter | decimal(12,2) | Yes | | Balance after transaction |
| description | varchar(255) | No | | Transaction description |
| referenceId | UUID | No | | Reference to booking/payment |
| referenceType | varchar(50) | No | | Type of reference (booking, refund, etc.) |
| metadata | simple-json | No | | Additional data |
| createdAt | timestamp | Yes | Auto | |

### DTOs

#### CreatePaymentDto
```typescript
{
  bookingId?: string (UUID)
  amount: number (required) - Min: 1
  method: enum (required) - STRIPE | RAZORPAY | WALLET | CASH | UPI | CARD | NET_BANKING
  currency?: string - Default: INR
}
```

#### WalletTopupDto
```typescript
{
  amount: number (required) - Min: 10
  paymentMethod: string (required)
  transactionId?: string
}
```

#### WalletWithdrawDto
```typescript
{
  amount: number (required) - Min: 100
  bankAccount: string (required)
  ifscCode: string (required)
}
```

#### PaymentQueryDto
```typescript
{
  page?: number
  limit?: number
  status?: enum
}
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/payments` | JWT | All | Create payment |
| POST | `/payments/stripe/intent` | JWT | All | Create Stripe payment intent |
| POST | `/payments/razorpay/order` | JWT | All | Create Razorpay order |
| POST | `/payments/razorpay/verify` | JWT | All | Verify Razorpay payment |
| POST | `/payments/stripe/webhook` | Public | - | Stripe webhook handler |
| POST | `/payments/razorpay/webhook` | Public | - | Razorpay webhook handler |
| GET | `/payments/wallet` | JWT | All | Get wallet balance |
| POST | `/payments/wallet/topup` | JWT | All | Top up wallet |
| POST | `/payments/wallet/withdraw` | JWT | All | Withdraw from wallet |
| GET | `/payments/wallet/transactions` | JWT | All | Get wallet transactions |
| GET | `/payments/my-payments` | JWT | All | Get my payments |
| GET | `/payments` | JWT | ADMIN, SUPER_ADMIN | Get all payments |

---

## WALLET MODULE

Covered in Payments Module above. Wallet has its own entity and transactions are tracked separately.

### Wallet Operations

**Balance Updates:**
- TopUp: Increases balance and creates CREDIT transaction
- Withdrawal: Decreases balance and creates DEBIT transaction
- Booking Payment: Debits wallet balance
- Refund: Credits wallet balance

---

## NOTIFICATIONS MODULE

### Entity: Notification
**Database Table:** `notifications`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| userId | UUID | Yes | FK | Reference to User |
| type | varchar(100) | Yes | | BOOKING, PAYMENT, TRIP, SYSTEM, PROMOTIONAL, SUPPORT, RATING, WALLET, SAFETY |
| channel | varchar(50) | Yes | Default: IN_APP | IN_APP, EMAIL, PUSH, SMS |
| title | varchar(255) | Yes | | Notification title |
| body | text | Yes | | Notification message |
| isRead | boolean | Yes | Default: false | |
| data | simple-json | No | | Additional payload |
| status | enum | Yes | Default: PENDING | PENDING, SENT, DELIVERED, READ, FAILED |
| sentAt | timestamp | No | | Time when sent |
| readAt | timestamp | No | | Time when read |
| errorMessage | varchar(255) | No | | Error details if failed |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

#### Relationships
- **User:** Many-to-One relationship with User entity

### DTOs

#### CreateNotificationDto
```typescript
{
  userId: string (UUID, required)
  type: enum (required) - BOOKING | PAYMENT | TRIP | SYSTEM | PROMOTIONAL | SUPPORT | RATING | WALLET | SAFETY
  channel?: enum - IN_APP | EMAIL | PUSH | SMS
  title: string (required)
  body: string (required)
  data?: Record<string, any>
}
```

#### NotificationResponseDto
```typescript
{
  id: string
  userId: string
  type: string
  channel: string
  title: string
  body: string
  isRead: boolean
  data?: Record<string, any>
  status: string
  createdAt: timestamp
  readAt?: timestamp
}
```

#### NotificationQueryDto
```typescript
{
  page?: number (default: 1)
  limit?: number (default: 20)
  unreadOnly?: boolean
  type?: enum
}
```

#### MarkReadDto
```typescript
{
  notificationIds: string[] (UUIDs)
}
```

#### NotificationPreferencesDto
```typescript
{
  bookingNotifications: boolean
  paymentNotifications: boolean
  tripNotifications: boolean
  promotionalNotifications: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
}
```

#### UnreadCountDto
```typescript
{
  unreadCount: number
}
```

### Notification Types
```
BOOKING - Booking confirmation, status updates
PAYMENT - Payment confirmation, refund notices
TRIP - Trip updates, driver assigned, trip started
SYSTEM - System announcements
PROMOTIONAL - Offers, discounts, promotions
SUPPORT - Support ticket updates
RATING - Rating and review requests
WALLET - Wallet credit/debit
SAFETY - Safety alerts, emergency notices
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/notifications` | JWT | ADMIN, SUPER_ADMIN | Create notification |
| GET | `/notifications` | JWT | All | Get user notifications |
| GET | `/notifications/unread-count` | JWT | All | Get unread count |
| PATCH | `/notifications/mark-read` | JWT | All | Mark as read |
| PATCH | `/notifications/mark-all-read` | JWT | All | Mark all as read |
| DELETE | `/notifications/:id` | JWT | All | Delete notification |
| GET | `/notifications/preferences` | JWT | All | Get preferences |
| PATCH | `/notifications/preferences` | JWT | All | Update preferences |
| SSE | `/notifications/stream` | JWT | All | Real-time notifications stream |

---

## SUPPORT MODULE

### Entity: SupportTicket
**Database Table:** `support_tickets`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| ticketNumber | varchar(50) | Yes | Unique | Reference for users |
| userId | UUID | Yes | FK | Ticket creator |
| assignedToId | UUID | No | FK | Support agent assigned |
| bookingId | UUID | No | FK | Related booking |
| tripId | UUID | No | FK | Related trip |
| fleetCompanyId | UUID | No | FK | Related fleet |
| subject | varchar(255) | Yes | MaxLength: 200 | Ticket subject |
| description | text | Yes | MaxLength: 5000 | Detailed description |
| category | enum | Yes | | BOOKING_ISSUE, PAYMENT_ISSUE, REFUND_REQUEST, DRIVER_COMPLAINT, VEHICLE_ISSUE, SAFETY_CONCERN, APP_TECHNICAL, GENERAL_INQUIRY, EMERGENCY, BOOKING, PAYMENT, TRIP, VEHICLE, DRIVER, APP, ACCOUNT, REFUND, FEEDBACK, OTHER |
| priority | enum | Yes | Default: MEDIUM | LOW, MEDIUM, HIGH, URGENT, CRITICAL |
| status | enum | Yes | Default: OPEN | OPEN, IN_PROGRESS, WAITING_CUSTOMER, WAITING_THIRD_PARTY, RESOLVED, CLOSED, REOPENED, ESCALATED |
| resolution | text | No | | Resolution details |
| satisfactionRating | int | No | Min: 1, Max: 5 | User satisfaction rating |
| comments | simple-json | No | | Array of comments |
| attachments | simple-json | No | | Array of attachment URLs |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |
| resolvedAt | timestamp | No | | Resolution timestamp |
| closedAt | timestamp | No | | Closure timestamp |

### DTOs

#### CreateTicketDto
```typescript
{
  subject: string (required) - Max 200 chars
  description: string (required) - Max 5000 chars
  category: enum (required) - See TicketCategory list
  priority?: enum - LOW | MEDIUM | HIGH | URGENT | CRITICAL (default: MEDIUM)
  bookingId?: string (UUID)
  tripId?: string (UUID)
  fleetCompanyId?: string (UUID)
}
```

#### UpdateTicketDto
```typescript
{
  subject?: string (Max 200 chars)
  description?: string (Max 5000 chars)
  category?: enum
  priority?: enum
  resolution?: string (Max 5000 chars)
  satisfactionRating?: int (1-5)
}
```

#### AssignTicketDto
```typescript
{
  agentId: string (UUID, required)
}
```

#### EscalateTicketDto
```typescript
{
  reason: string (required)
  newPriority: enum (required)
}
```

#### TicketQueryDto
```typescript
{
  page?: number
  limit?: number
  status?: enum
  priority?: enum
  category?: enum
  assignedToId?: string (UUID)
  userId?: string (UUID)
}
```

#### TicketResponseDto
```typescript
{
  id: string
  ticketNumber: string
  subject: string
  description: string
  category: enum
  priority: enum
  status: enum
  userId: string
  assignedToId?: string
  createdAt: timestamp
  updatedAt: timestamp
  resolution?: string
  satisfactionRating?: int
}
```

#### TicketStatsDto
```typescript
{
  totalTickets: int
  openTickets: int
  resolvedTickets: int
  avgResolutionTime: int (hours)
  satisfactionScore: decimal (0-5)
}
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/support/tickets` | JWT | All except SUPPORT_AGENT | Create ticket |
| GET | `/support/tickets` | JWT | All | Get tickets (filtered by user) |
| GET | `/support/tickets/:id` | JWT | All | Get ticket details |
| PATCH | `/support/tickets/:id` | JWT | CREATOR, SUPPORT_AGENT, ADMIN | Update ticket |
| POST | `/support/tickets/:id/assign` | JWT | ADMIN, SUPPORT_AGENT | Assign to agent |
| POST | `/support/tickets/:id/escalate` | JWT | ADMIN, SUPPORT_AGENT | Escalate priority |
| POST | `/support/tickets/:id/resolve` | JWT | ADMIN, SUPPORT_AGENT | Resolve ticket |
| POST | `/support/tickets/:id/reopen` | JWT | CREATOR, ADMIN | Reopen ticket |
| POST | `/support/tickets/:id/comments` | JWT | All | Add comment |
| DELETE | `/support/tickets/:id` | JWT | ADMIN, SUPER_ADMIN | Soft delete |
| GET | `/support/stats` | JWT | ADMIN, SUPPORT_AGENT | Get support stats |

---

## TRACKING MODULE

### Entity: LiveLocation
**Database Table:** `live_locations`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| tripId | UUID | Yes | | Trip being tracked |
| driverId | UUID | Yes | | Driver providing location |
| vehicleId | UUID | No | | Associated vehicle |
| latitude | decimal(10,8) | Yes | | Current latitude |
| longitude | decimal(11,8) | Yes | | Current longitude |
| accuracy | decimal(8,2) | No | | GPS accuracy in meters |
| speed | decimal(8,2) | No | | Speed in km/h |
| heading | decimal(8,2) | No | | Heading in degrees |
| altitude | decimal(8,2) | No | | Altitude in meters |
| address | varchar(255) | No | | Reverse geocoded address |
| city | varchar(100) | No | | Current city |
| isOnline | boolean | Yes | Default: false | Driver online status |
| metadata | simple-json | No | | Additional GPS data |
| createdAt | timestamp | Yes | Auto | |

#### Indexes
- ON (tripId, driverId)
- ON (latitude, longitude)

### DTOs

#### UpdateLocationDto
```typescript
{
  latitude: number (decimal, required)
  longitude: number (decimal, required)
  accuracy?: number
  speed?: number
  heading?: number
  altitude?: number
  address?: string
  city?: string
  isOnline?: boolean
  metadata?: Record<string, any>
}
```

#### LocationQueryDto
```typescript
{
  startTime?: string (ISO date)
  endTime?: string (ISO date)
  page?: number
  limit?: number
}
```

#### NearbyVehiclesQueryDto
```typescript
{
  lat: number (required)
  lng: number (required)
  radius?: number (default: 5000) - Min: 100, Max: 50000 (in meters)
}
```

### API Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/tracking/update` | JWT | DRIVER | Update driver location |
| GET | `/tracking/trip/:tripId` | JWT | All | Get trip location history |
| GET | `/tracking/trip/:tripId/live` | JWT | All | Get live trip location |
| GET | `/tracking/live-vehicles` | JWT | ADMIN, SUPER_ADMIN | Get all live vehicles (admin) |
| GET | `/tracking/driver/:driverId` | JWT | All | Get driver location history |
| GET | `/tracking/nearby` | JWT | All | Find nearby vehicles |

### Location Tracking Flow
1. Driver updates location via POST `/tracking/update`
2. Location saved to `live_locations` table with timestamp
3. Passengers can fetch real-time location via GET `/tracking/trip/:tripId/live`
4. Location history available via GET `/tracking/trip/:tripId`
5. Admin can see all live vehicles with GET `/tracking/live-vehicles`

---

## RATINGS MODULE

### Entity: Rating
**Database Table:** `ratings`

#### Fields
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | PK | |
| bookingId | UUID | Yes | FK | Associated booking |
| tripId | UUID | Yes | FK | Associated trip |
| raterId | UUID | Yes | FK | User giving rating |
| rateeId | UUID | Yes | FK | User being rated |
| rating | int | Yes | Min: 1, Max: 5 | Overall rating |
| review | text | No | | Written review |
| categories | simple-json | No | | Detailed category ratings |
| isVerified | boolean | Yes | Default: false | Verified purchase rating |
| isReported | boolean | Yes | Default: false | Reported as inappropriate |
| reportReason | text | No | | Reason for report |
| createdAt | timestamp | Yes | Auto | |
| updatedAt | timestamp | Yes | Auto | |

#### Relationships
- **Booking:** Many-to-One relationship with Booking entity
- **Trip:** Many-to-One relationship with Trip entity
- **Rater:** Many-to-One relationship with User entity
- **Ratee:** Many-to-One relationship with User entity

#### Category Ratings (nested in categories JSON)
```typescript
{
  punctuality?: number (1-5)
  cleanliness?: number (1-5)
  behavior?: number (1-5)
  driving?: number (1-5)
  comfort?: number (1-5)
}
```

### Rating Request Flow
1. After booking is completed, passenger is prompted to rate
2. Passenger provides overall rating (1-5 stars)
3. Optionally provides category-based ratings
4. Can write text review
5. Rating is marked as `isVerified: true` for completed bookings
6. Ratings affect driver/user profile rating average

---

## COMMON GUARDS & DECORATORS

### Guards
- **JwtAuthGuard**: Validates JWT token and attaches user to request
- **RolesGuard**: Validates user has required roles

### Decorators
- **@CurrentUser()**: Extracts current user from request
- **@Public()**: Marks route as public (no JWT required)
- **@Roles(...)**: Specifies required roles for route

### Public Routes (No JWT Required)
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/login/otp`
- POST `/auth/verify-otp`
- POST `/auth/resend-otp`
- POST `/auth/refresh`
- POST `/auth/forgot-password`
- POST `/auth/reset-password`
- POST `/auth/social-login`
- GET `/trips/search`
- POST `/payments/stripe/webhook`
- POST `/payments/razorpay/webhook`

---

## ENUMS SUMMARY

### UserStatus
ACTIVE, INACTIVE, SUSPENDED, PENDING_KYC, KYC_VERIFIED, KYC_REJECTED

### UserType
PASSENGER, VEHICLE_OWNER, DRIVER, ADMIN, SUPER_ADMIN, SUPPORT

### RoleName
SUPER_ADMIN, ADMIN, VEHICLE_OWNER, DRIVER, PASSENGER, SUPPORT, FLEET_MANAGER, SUPPORT_AGENT

### DriverStatus
PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE, ON_TRIP, OFFLINE, SUSPENDED

### VehicleType
SEDAN, SUV, HATCHBACK, MPV, VAN, MINIBUS, BUS, LUXURY, ELECTRIC

### VehicleStatus
PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE, MAINTENANCE, SUSPENDED

### FleetStatus
ACTIVE, INACTIVE, SUSPENDED, PENDING

### FleetVehicleStatus
ACTIVE, MAINTENANCE, RETIRED, INACTIVE

### TripType
ONE_WAY, ROUND_TRIP, RETURN_ONLY

### TripStatus
SCHEDULED, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED, DELAYED

### BookingType
ONE_WAY, RETURN, ROUND_TRIP

### BookingStatus
PENDING, CONFIRMED, CHECKED_IN, ON_TRIP, COMPLETED, CANCELLED, NO_SHOW, REFUNDED

### PaymentMethod
STRIPE, RAZORPAY, WALLET, CASH, UPI, CARD, NET_BANKING

### PaymentStatus
PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, PARTIAL_REFUND, CANCELLED

### PaymentType
BOOKING, REFUND, WALLET_TOPUP, WALLET_WITHDRAWAL, COMMISSION, SUBSCRIPTION

### NotificationType
BOOKING, PAYMENT, TRIP, SYSTEM, PROMOTIONAL, SUPPORT, RATING, WALLET, SAFETY

### NotificationChannel
IN_APP, EMAIL, PUSH, SMS

### NotificationStatus
PENDING, SENT, DELIVERED, READ, FAILED

### TicketStatus
OPEN, IN_PROGRESS, WAITING_CUSTOMER, WAITING_THIRD_PARTY, RESOLVED, CLOSED, REOPENED, ESCALATED

### TicketPriority
LOW, MEDIUM, HIGH, URGENT, CRITICAL

### DocumentType
RC, INSURANCE, PERMIT, FITNESS, POLLUTION, OWNERSHIP, OTHER

### DocumentStatus
PENDING, APPROVED, REJECTED

### SeatStatus
AVAILABLE, BOOKED, RESERVED, BLOCKED, UNAVAILABLE

### SeatType
WINDOW, AISLE, MIDDLE, PREMIUM, RECLINER

### TransactionType
CREDIT, DEBIT

### TransactionStatus
PENDING, COMPLETED, FAILED, CANCELLED

### TransactionPurpose
BOOKING_PAYMENT, REFUND, TOPUP, WITHDRAWAL, COMMISSION, BONUS, PENALTY

---

## AUTHENTICATION FLOW

### Registration
1. User submits `RegisterDto`
2. System validates input
3. Email/phone uniqueness checked
4. Password hashed with bcrypt
5. User created with PENDING_KYC status
6. Return access token + refresh token

### Login
1. User submits `LoginDto` (email OR phone + password)
2. User found and password verified
3. KYC status checked
4. Access token generated (15 min expiry)
5. Refresh token generated (30 day expiry)

### OTP Login
1. User requests OTP via phone
2. OTP sent via SMS
3. User submits OTP for verification
4. User logged in if valid
5. Tokens returned

### Token Refresh
1. User submits refresh token
2. Token validated
3. New access token generated
4. Returned to client

### Social Login
1. User submits social provider + ID token
2. Token verified with provider
3. User found or created
4. Tokens generated and returned

---

## DATABASE RELATIONSHIPS SUMMARY

```
User
├── Role (Many-to-One)
├── Vehicles (One-to-Many)
│   ├── VehicleDocument (One-to-Many)
│   └── Trips (One-to-Many)
│       ├── TripRoute (One-to-Many)
│       ├── TripStop (One-to-Many)
│       ├── TripSeat (One-to-Many)
│       └── Bookings (One-to-Many)
│           ├── Payment (One-to-Many)
│           └── Rating (One-to-Many)
├── DriverProfile (One-to-One)
│   └── Trips (One-to-Many)
├── Bookings (One-to-Many)
├── Wallet (One-to-One)
│   └── WalletTransaction (One-to-Many)
├── Notifications (One-to-Many)
├── FleetCompanies (One-to-Many)
│   └── FleetVehicle (One-to-Many)
└── SupportTickets (One-to-Many)

Payment
├── User (Many-to-One)
└── Booking (Many-to-One)

LiveLocation
├── Trip (Many-to-One)
└── Driver (Many-to-One)
```

---

## API AUTHENTICATION HEADER

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### Token Structure (JWT)
```typescript
{
  sub: string (userId)
  email: string
  phone: string
  userType: enum
  role: string (roleName)
  iat: number (issued at)
  exp: number (expiration)
}
```

---

## ERROR RESPONSES

### Standard Error Format
```typescript
{
  statusCode: number
  message: string | string[]
  error: string
  timestamp: ISO8601
  path: string
}
```

### Common Error Codes
```
400 - Bad Request (validation failed)
401 - Unauthorized (invalid/missing token)
403 - Forbidden (insufficient permissions)
404 - Not Found (resource doesn't exist)
409 - Conflict (duplicate email/phone)
500 - Internal Server Error
```

---

## VALIDATION RULES SUMMARY

### Email
- Must be valid email format
- Must be unique in system

### Phone
- International format: +[country code][number]
- Pattern: /^\+[1-9]\d{1,14}$/
- Must be unique (for login purposes)

### Password
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

### String Fields
- firstName/lastName: 2-100 chars
- email: 255 chars max
- phone: 20 chars max
- Various other text fields with specific max lengths

### Numeric Fields
- Ages: typically 0-150
- Ratings: 0-5
- Prices: 2 decimal places precision
- Latitude/Longitude: specific decimal precision

---

## FILE UPLOADS

### Supported File Types
- Documents: PDF, JPG, PNG, JPEG
- Images: JPG, PNG, JPEG
- Max size: 10MB per file

### Document Fields
- KYC documents (front, back, selfie)
- Vehicle documents (RC, Insurance, Permit, etc.)
- License documents
- Driver background check
- Support ticket attachments

---

## PAGINATION

### Standard Pagination
```typescript
{
  page: number (default: 1, min: 1)
  limit: number (default: 10, max: 100)
}
```

### Response Format
```typescript
{
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
```

---

## SEARCH & FILTERING

### Available Search Fields
- Users: firstName, lastName, email, phone
- Vehicles: brand, model, registrationNumber
- Trips: title, source, destination
- Bookings: bookingNumber, passengerName
- Tickets: subject, ticketNumber

### Filter Fields
- status: enum
- userType: enum
- category: enum
- priority: enum
- createdAt: date range
- updatedAt: date range

---

**End of Backend API Contract**

*This document represents the complete NestJS backend API specification as of June 2, 2026.*
