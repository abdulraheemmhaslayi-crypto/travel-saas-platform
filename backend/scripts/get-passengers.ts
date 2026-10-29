import { config } from 'dotenv';
config();

import { AppDataSource } from '../src/database/data-source';
import { User } from '../src/database/entities/user.entity';

async function listUsers() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ relations: ['role'] });
  console.log("USERS_LIST_START");
  users.forEach(u => {
    console.log(`Email: ${u.email}, Name: ${u.firstName} ${u.lastName}, Role: ${u.role?.name}, Type: ${u.userType}`);
  });
  console.log("USERS_LIST_END");
  await AppDataSource.destroy();
}

listUsers().catch(err => {
  console.error("Failed to list users", err);
});
