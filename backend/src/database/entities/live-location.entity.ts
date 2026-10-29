import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('live_locations')
@Index(['tripId', 'driverId'])
@Index(['latitude', 'longitude'])
export class LiveLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tripId: string;

  @Column({ type: 'uuid' })
  driverId: string;

  @Column({ type: 'uuid', nullable: true })
  vehicleId: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  accuracy: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  speed: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  heading: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  altitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}