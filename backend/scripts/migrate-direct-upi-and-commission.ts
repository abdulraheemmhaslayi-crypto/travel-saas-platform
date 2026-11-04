import { config } from 'dotenv';
config();

import { AppDataSource } from '../src/database/data-source';

async function runMigration() {
  console.log('Initializing database connection...');
  await AppDataSource.initialize();
  console.log('Running Direct UPI & Dynamic Commission schema migration...');

  await AppDataSource.query(`
    -- 1. Users UPI & QR Code
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "upiId" varchar(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "upiAccountName" varchar(150);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "upiQrCodeUrl" text;

    -- 2. Vehicles UPI & QR Code
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "upiId" varchar(100);
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "upiAccountName" varchar(150);
    ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "upiQrCodeUrl" text;

    -- 3. Bookings Direct UPI & UTR Verification
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(50) DEFAULT 'direct_upi_qr';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "utrNumber" varchar(50);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paymentReceiptUrl" text;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paymentVerifiedAt" timestamp;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paymentVerifiedBy" uuid;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "cancellationUpiId" varchar(100);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "cancellationRefundUtr" varchar(50);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "cancellationRefundStatus" varchar(50) DEFAULT 'NONE';

    -- 4. Platform Settings for Dynamic Super Admin Commission
    CREATE TABLE IF NOT EXISTS platform_settings (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      key varchar(100) UNIQUE NOT NULL,
      value jsonb NOT NULL,
      description text,
      "updatedBy" uuid,
      "createdAt" timestamp DEFAULT now(),
      "updatedAt" timestamp DEFAULT now()
    );

    -- 5. Seed default commission configuration if not present
    INSERT INTO platform_settings (key, value, description)
    VALUES (
      'commission_config',
      '{
        "commissionType": "PERCENTAGE",
        "commissionValue": 10,
        "deductionTiming": "INSTANT",
        "minWalletBalance": 500,
        "autoPauseTrips": true,
        "gracePeriodHours": 24,
        "freeCancellationHours": 4,
        "lateCancellationRefundPercent": 50
      }'::jsonb,
      'Dynamic Platform Commission & Cancellation Settings managed by Super Admin'
    )
    ON CONFLICT (key) DO NOTHING;
  `);

  console.log('Direct UPI & Dynamic Commission schema migration finished successfully!');
  await AppDataSource.destroy();
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

