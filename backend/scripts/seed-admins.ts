import { config } from 'dotenv';
config();

import { AppDataSource } from '../src/database/data-source';
import { Role, RoleName } from '../src/database/entities/role.entity';
import { User, UserType, UserStatus } from '../src/database/entities/user.entity';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);

  const roles: { name: RoleName; displayName: string }[] = [
    { name: RoleName.SUPER_ADMIN, displayName: 'Super Admin' },
    { name: RoleName.ADMIN, displayName: 'Admin' },
    { name: RoleName.VEHICLE_OWNER, displayName: 'Vehicle Owner' },
    { name: RoleName.DRIVER, displayName: 'Driver' },
    { name: RoleName.PASSENGER, displayName: 'Passenger' },
    { name: RoleName.SUPPORT, displayName: 'Support' },
  ];

  for (const r of roles) {
    let existing = await roleRepo.findOne({ where: { name: r.name } });
    if (!existing) {
      existing = roleRepo.create({ name: r.name, displayName: r.displayName });
      await roleRepo.save(existing);
      console.log('Created role', r.name);
    }
  }

  // Create or update admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Password@123';

  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@gmail.com';
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || 'Password@123';

  const adminRole = await roleRepo.findOne({ where: { name: RoleName.ADMIN } });
  const superAdminRole = await roleRepo.findOne({ where: { name: RoleName.SUPER_ADMIN } });

  if (superAdminRole) {
    let sa = await userRepo.findOne({ where: { email: superAdminEmail } });
    if (!sa) {
      sa = userRepo.create({
        email: superAdminEmail,
        phone: process.env.SEED_SUPER_ADMIN_PHONE || '+10000000000',
        password: await bcrypt.hash(superAdminPassword, 12),
        firstName: 'Super',
        lastName: 'Admin',
        userType: UserType.ADMIN,
        roleId: superAdminRole.id,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      await userRepo.save(sa);
      console.log('Created super admin', superAdminEmail);
    } else {
      // Update existing user's role if it's incorrect
      if (sa.roleId !== superAdminRole.id) {
        sa.roleId = superAdminRole.id;
        sa.status = UserStatus.ACTIVE;
        sa.isEmailVerified = true;
        sa.isPhoneVerified = true;
        await userRepo.save(sa);
        console.log('Updated super admin role', superAdminEmail);
      }
    }
  }

  if (adminRole) {
    let a = await userRepo.findOne({ where: { email: adminEmail } });
    if (!a) {
      a = userRepo.create({
        email: adminEmail,
        phone: process.env.SEED_ADMIN_PHONE || '+10000000001',
        password: await bcrypt.hash(adminPassword, 12),
        firstName: 'System',
        lastName: 'Admin',
        userType: UserType.ADMIN,
        roleId: adminRole.id,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      await userRepo.save(a);
      console.log('Created admin', adminEmail);
    } else {
      // Update existing user's role if it's incorrect
      if (a.roleId !== adminRole.id) {
        a.roleId = adminRole.id;
        a.status = UserStatus.ACTIVE;
        a.isEmailVerified = true;
        a.isPhoneVerified = true;
        await userRepo.save(a);
        console.log('Updated admin role', adminEmail);
      }
    }
  }

  await AppDataSource.destroy();
  console.log('Seeding complete');
}

seed().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
