import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUSPEND = 'suspend',
  PAYMENT = 'payment',
  REFUND = 'refund',
  CANCEL = 'cancel',
  ASSIGN = 'assign',
  VERIFY = 'verify',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'entityType'])
export class AuditLog {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuid_generate_v4()' })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.auditLogs)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  oldValues: string;

  @Column({ type: 'text', nullable: true })
  newValues: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  requestUrl: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  requestMethod: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @PrimaryColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}