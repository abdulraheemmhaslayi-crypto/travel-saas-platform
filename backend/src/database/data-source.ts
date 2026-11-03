import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

let dbHost = configService.get<string>('DATABASE_HOST', 'localhost');
let dbPort = Number(configService.get<number>('DATABASE_PORT', 5432));
let dbUser = configService.get<string>('DATABASE_USERNAME') || process.env.DATABASE_USERNAME || 'postgres';
let dbPassword = String(configService.get<string>('DATABASE_PASSWORD') ?? process.env.DATABASE_PASSWORD ?? 'postgres');
let dbName = configService.get<string>('DATABASE_NAME') || process.env.DATABASE_NAME || 'travel_saas';
let dbSsl: boolean | { rejectUnauthorized: boolean } = configService.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false;

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    dbHost = parsed.hostname;
    dbPort = Number(parsed.port) || 5432;
    dbUser = decodeURIComponent(parsed.username);
    dbPassword = decodeURIComponent(parsed.password);
    dbName = parsed.pathname.replace(/^\//, '');
    if (parsed.searchParams.get('sslmode') === 'require' || parsed.searchParams.get('ssl') === 'true') {
      dbSsl = { rejectUnauthorized: false };
    }
  } catch (err) {
    console.error('Failed to parse DATABASE_URL in AppDataSource:', err);
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : {}),
  host: dbHost,
  port: dbPort,
  username: dbUser,
  password: dbPassword,
  database: dbName,
  ssl: dbSsl,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
