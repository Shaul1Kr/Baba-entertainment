import { pino } from 'pino';
import { env } from '../../config/env.js';

/**
 * The single configured pino logger for the whole backend.
 *
 * - Level comes from LOG_LEVEL (default `info`) — never hardcoded.
 * - In development we pipe through pino-pretty for readable, colourised output.
 * - Everywhere else (production, test) output stays as raw JSON (one object per
 *   line), ideal for log shippers. Toggled by NODE_ENV, not hardcoded — and
 *   avoiding the pino-pretty worker thread outside dev keeps tests clean.
 * - Auth headers/tokens are redacted defensively at the source.
 */
const usePretty = env.nodeEnv === 'development';

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
      'token',
      '*.token',
    ],
    remove: true,
  },
  ...(usePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

export type AppLogger = typeof logger;
