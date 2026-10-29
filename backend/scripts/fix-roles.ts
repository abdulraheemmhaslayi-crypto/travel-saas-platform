import { config } from 'dotenv';
config();

import { AppDataSource } from '../src/database/data-source';
import { Role, RoleName } from '../src/database/entities/role.entity';
import { User, UserType } from '../src/database/entities/user.entity';

async function fixRoles() {
  await AppDataSource.initialize();
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);

  const roles = await roleRepo.find();
  const roleMap = new Map(roles.map(r => [r.name, r.id]));

  console.log('Available roles in DB:', Array.from(roleMap.keys()));

  const users = await userRepo.find({ relations: ['role'] });
  for (const user of users) {
    let targetRoleName: RoleName | null = null;
    if (user.userType === UserType.PASSENGER) targetRoleName = RoleName.PASSENGER;
    else if (user.userType === UserType.DRIVER) targetRoleName = RoleName.DRIVER;
    else if (user.userType === UserType.VEHICLE_OWNER) targetRoleName = RoleName.VEHICLE_OWNER;
    else if (user.userType === UserType.ADMIN) targetRoleName = RoleName.ADMIN;
    else if (user.userType === UserType.SUPER_ADMIN) targetRoleName = RoleName.SUPER_ADMIN;
    else if (user.userType === UserType.SUPPORT) targetRoleName = RoleName.SUPPORT;

    if (targetRoleName) {
      const roleId = roleMap.get(targetRoleName);
      if (roleId && user.roleId !== roleId) {
        user.roleId = roleId;
        await userRepo.save(user);
        console.log(`Updated user ${user.email} to role ${targetRoleName}`);
      } else {
        console.log(`User ${user.email} already has role ${user.role?.name || targetRoleName}`);
      }
    } else {
      console.log(`User ${user.email} has unknown or missing userType: ${user.userType}`);
    }
  }
  await AppDataSource.destroy();
  console.log('Role alignment script completed successfully!');
}

fixRoles().catch((err) => {
  console.error('Failed to align roles:', err);
  process.exit(1);
});
