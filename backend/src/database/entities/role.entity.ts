import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Permission } from './permission.entity';
import { User } from './user.entity';

export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  VEHICLE_OWNER = 'vehicle_owner',
  DRIVER = 'driver',
  PASSENGER = 'passenger',
  SUPPORT = 'support',
  FLEET_MANAGER = 'fleet_manager',
  SUPPORT_AGENT = 'support_agent',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: RoleName, unique: true })
  name: RoleName;

  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  hierarchyLevel: number;

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}