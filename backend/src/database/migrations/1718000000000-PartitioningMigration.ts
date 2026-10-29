import { MigrationInterface, QueryRunner } from 'typeorm';

export class PartitioningMigration1718000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('audit_logs');
    if (!hasTable) {
      return;
    }
    // 1. Rename existing audit_logs table to a backup table
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME TO "audit_logs_old"');

    // 2. Create the partitioned table (primary key must include the partition key 'createdAt')
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "action" "audit_logs_action_enum" NOT NULL,
        "entityType" varchar(100) NOT NULL,
        "entityId" uuid,
        "oldValues" text,
        "newValues" text,
        "description" text,
        "ipAddress" varchar(255),
        "userAgent" varchar(500),
        "requestUrl" varchar(255),
        "requestMethod" varchar(20),
        "metadata" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_composite" PRIMARY KEY ("id", "createdAt")
      ) PARTITION BY RANGE ("createdAt");
    `);

    // 3. Create partitions for the year 2026
    await queryRunner.query(`
      CREATE TABLE "audit_logs_y2026m06" PARTITION OF "audit_logs"
      FOR VALUES FROM ('2026-06-01 00:00:00') TO ('2026-07-01 00:00:00');
    `);
    
    await queryRunner.query(`
      CREATE TABLE "audit_logs_y2026m07" PARTITION OF "audit_logs"
      FOR VALUES FROM ('2026-07-01 00:00:00') TO ('2026-08-01 00:00:00');
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs_y2026m08" PARTITION OF "audit_logs"
      FOR VALUES FROM ('2026-08-01 00:00:00') TO ('2026-09-01 00:00:00');
    `);

    // 4. Create default partition for fallback
    await queryRunner.query('CREATE TABLE "audit_logs_default" PARTITION OF "audit_logs" DEFAULT');

    // 5. Restore indexes on the partitioned table
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_user_created" ON "audit_logs" ("userId", "createdAt")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_action_entity" ON "audit_logs" ("action", "entityType")');

    // 6. Migrate existing data from old table
    await queryRunner.query('INSERT INTO "audit_logs" SELECT * FROM "audit_logs_old"');

    // 7. Drop the old table backup
    await queryRunner.query('DROP TABLE "audit_logs_old"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert logic: recreate single table and load data
    await queryRunner.query('CREATE TABLE "audit_logs_backup" AS SELECT * FROM "audit_logs"');
    await queryRunner.query('DROP TABLE "audit_logs" CASCADE');
    
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "action" "audit_logs_action_enum" NOT NULL,
        "entityType" varchar(100) NOT NULL,
        "entityId" uuid,
        "oldValues" text,
        "newValues" text,
        "description" text,
        "ipAddress" varchar(255),
        "userAgent" varchar(500),
        "requestUrl" varchar(255),
        "requestMethod" varchar(20),
        "metadata" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query('CREATE INDEX "IDX_audit_logs_user_created" ON "audit_logs" ("userId", "createdAt")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_action_entity" ON "audit_logs" ("action", "entityType")');
    await queryRunner.query('INSERT INTO "audit_logs" SELECT * FROM "audit_logs_backup"');
    await queryRunner.query('DROP TABLE "audit_logs_backup"');
  }
}
