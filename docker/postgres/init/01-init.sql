-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create roles
INSERT INTO roles (id, name, slug, description, permissions) VALUES
('11111111-1111-1111-1111-111111111111', 'super_admin', 'super-admin', 'Full platform control', '["*"]'),
('22222222-2222-2222-2222-222222222222', 'admin', 'admin', 'Operational management', '["users:read", "users:update", "users:verify", "users:suspend", "vehicles:verify", "trips:read", "bookings:read", "payments:read", "payments:refund", "support:*", "admin:*"]'),
('33333333-3333-3333-3333-333333333333', 'vehicle_owner', 'vehicle-owner', 'Vehicle and trip management', '["vehicles:*", "trips:*", "bookings:read", "fleet:*"]'),
('44444444-4444-4444-4444-444444444444', 'driver', 'driver', 'Trip operation', '["trips:manage", "bookings:checkin"]'),
('55555555-5555-5555-5555-555555555555', 'passenger', 'passenger', 'Booking and tracking', '["bookings:create", "bookings:cancel", "payments:create", "payments:topup"]'),
('66666666-6666-6666-6666-666666666666', 'support', 'support', 'Customer support', '["support:*", "users:read"]');

-- Create super admin user (password: admin123)
INSERT INTO users (id, email, phone, "passwordHash", "firstName", "lastName", "roleId", status, "emailVerified", "phoneVerified", "kycStatus", "createdAt")
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'admin@travel.com',
  '+1234567890',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6',
  'Super',
  'Admin',
  '11111111-1111-1111-1111-111111111111',
  'active',
  true,
  true,
  'verified',
  NOW()
);