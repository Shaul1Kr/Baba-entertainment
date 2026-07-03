import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }
  return parsed;
}

export const env = {
  port: intFromEnv('PORT', 3000),
  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/flashsale'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  // Dynamic reservation TTL — sourced from env, never hardcoded in logic.
  reservationTtlSeconds: intFromEnv('RESERVATION_TTL_SECONDS', 600),
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Logging: level from env (default info); pretty output is dev-only.
  logLevel: process.env.LOG_LEVEL ?? 'info',
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
};

export type Env = typeof env;
