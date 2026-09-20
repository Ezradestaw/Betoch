import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load .env from project root if available
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().default('postgresql://betoch_admin@localhost:5433/betoch_dev'),
  DB_MAX_CONNECTIONS: z.coerce.number().default(20),
  DB_TIMEOUT_MS: z.coerce.number().default(10000),

  // Security & JWT
  JWT_SECRET: z.string().min(16).default('super-secret-jwt-key-change-in-production-min-32-chars-long!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('super-secret-refresh-key-change-in-production-min-32-chars!'),
  COOKIE_SECRET: z.string().min(16).default('super-secret-cookie-signing-key-change-in-production-32-chars!'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),

  // Telebirr
  TELEBIRR_ENABLED: z.coerce.boolean().default(true),
  TELEBIRR_MODE: z.enum(['live', 'mock']).default('mock'),
  TELEBIRR_API_URL: z.string().default('https://app.ethiomobilemoney.et:2121/ammapi/payment/service-open/'),
  TELEBIRR_APP_ID: z.string().default('mock_telebirr_app_id'),
  TELEBIRR_APP_KEY: z.string().default('mock_telebirr_app_key'),
  TELEBIRR_SHORT_CODE: z.string().default('100100'),
  TELEBIRR_NOTIFY_URL: z.string().default('http://localhost:4000/api/v1/payments/telebirr/webhook'),
  TELEBIRR_RETURN_URL: z.string().default('http://localhost:5173/payments/success'),
  TELEBIRR_PRIVATE_KEY: z.string().default('MOCK_PRIVATE_KEY'),
  TELEBIRR_PUBLIC_KEY: z.string().default('MOCK_PUBLIC_KEY'),

  // Business rules
  DEFAULT_COMMISSION_PERCENT: z.coerce.number().default(10.0),
  MAX_DEPOSIT_MONTHS: z.coerce.number().default(2),

  // AI Intelligence Layer Configuration
  AI_ENABLED: z.coerce.boolean().default(true),
  AI_PROVIDER: z.enum(['local', 'gemini', 'openai', 'mock']).default('local'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('local-rules-engine'),
  AI_CACHE_TTL_SECONDS: z.coerce.number().default(3600),

  LOG_LEVEL: z.string().default('info')
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
