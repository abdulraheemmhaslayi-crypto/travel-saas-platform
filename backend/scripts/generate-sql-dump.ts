import { config } from 'dotenv';
config();

import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../src/database/data-source';

function escapeSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function generateDump() {
  await AppDataSource.initialize();
  console.log('✅ Connected to database to export dump...');

  let sqlOutput = `-- =====================================================================\n`;
  sqlOutput += `-- Travel SaaS Platform - Complete Cloud Database Seed Dump\n`;
  sqlOutput += `-- Ready to upload to blitz.cloud / PostgreSQL 17\n`;
  sqlOutput += `-- Generated at: ${new Date().toISOString()}\n`;
  sqlOutput += `-- =====================================================================\n\n`;
  sqlOutput += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

  const tables = [
    'roles',
    'users',
    'fleet_companies',
    'vehicles',
    'fleet_vehicles',
    'drivers',
    'trips',
    'trip_seats',
    'trip_routes',
  ];

  for (const tableName of tables) {
    try {
      const rows = await AppDataSource.query(`SELECT * FROM ${tableName}`);
      if (rows.length === 0) continue;

      sqlOutput += `-- Table: ${tableName} (${rows.length} records)\n`;

      const columns = Object.keys(rows[0]);
      const quotedCols = columns.map((c) => `"${c}"`).join(', ');

      for (const row of rows) {
        const values = columns.map((col) => escapeSqlValue(row[col])).join(', ');
        sqlOutput += `INSERT INTO ${tableName} (${quotedCols}) VALUES (${values}) ON CONFLICT (id) DO UPDATE SET ${columns
          .filter((c) => c !== 'id')
          .map((c) => `"${c}" = EXCLUDED."${c}"`)
          .join(', ')};\n`;
      }

      sqlOutput += `\n`;
      console.log(`Exported ${rows.length} rows from table ${tableName}`);
    } catch (err: any) {
      console.warn(`Skipping table ${tableName}: ${err.message}`);
    }
  }

  const outputPath = path.resolve(__dirname, '../../blitz-database-dump.sql');
  fs.writeFileSync(outputPath, sqlOutput, 'utf8');
  console.log(`\n🎉 Dump successfully saved to: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);

  await AppDataSource.destroy();
}

generateDump().catch(console.error);

