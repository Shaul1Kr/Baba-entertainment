import { Redis } from 'ioredis';
import { env } from '../../config/env.js';

/**
 * We keep TWO connections:
 *  - `redis` for normal commands (GET/SET/EVAL/INCRBY).
 *  - `subscriber` because a connection in subscribe mode cannot issue regular
 *    commands. The ReservationExpirySubscriber uses this one.
 */
export const redis = new Redis(env.redisUrl);
export const subscriber = new Redis(env.redisUrl);

redis.on('error', (err) => console.error('[redis] error', err.message));
subscriber.on('error', (err) => console.error('[redis:sub] error', err.message));

export function stockKey(itemId: string): string {
  return `stock:${itemId}`;
}

export function reservationKey(cartItemId: string): string {
  return `reservation:${cartItemId}`;
}

/** Parse `reservation:<cartItemId>` back into the cart item id. */
export function parseReservationKey(key: string): string | null {
  const prefix = 'reservation:';
  return key.startsWith(prefix) ? key.slice(prefix.length) : null;
}

export async function closeRedis(): Promise<void> {
  await Promise.allSettled([redis.quit(), subscriber.quit()]);
}
