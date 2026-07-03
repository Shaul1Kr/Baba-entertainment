import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Redis } from 'ioredis';
import { reservationKey, stockKey } from './RedisClient.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESERVE_LUA = readFileSync(join(__dirname, 'reserveStock.lua'), 'utf8');

export interface ReserveResult {
  ok: boolean;
  /** Remaining available stock after the attempt (unchanged on failure). */
  remaining: number;
}

/**
 * Owns the live, authoritative available-stock counters in Redis and the
 * atomic reservation logic. This is the ONLY place that decrements/increments
 * stock, so overselling is impossible as long as everything goes through here.
 */
export class StockReservationService {
  private reserveSha: string | null = null;

  constructor(
    private readonly redis: Redis,
    private readonly defaultTtlSeconds: number,
  ) {}

  /** Preload the Lua script into Redis so we can call it by SHA (EVALSHA). */
  async init(): Promise<void> {
    this.reserveSha = (await this.redis.script('LOAD', RESERVE_LUA)) as string;
  }

  /**
   * Seed live counters from the catalogue. `available` is expected to already
   * account for any outstanding reservations (see reconciliation in seed
   * script). We overwrite unconditionally so startup is deterministic.
   */
  async seed(itemId: string, available: number): Promise<void> {
    await this.redis.set(stockKey(itemId), Math.max(0, available));
  }

  async getRemaining(itemId: string): Promise<number> {
    const raw = await this.redis.get(stockKey(itemId));
    return raw === null ? 0 : Number.parseInt(raw, 10);
  }

  /**
   * Atomically try to reserve `qty` units of `itemId` for `cartItemId`.
   * On success the companion reservation key is set with a TTL, so an
   * abandoned cart auto-releases via keyspace-expiry notifications.
   */
  async reserve(
    itemId: string,
    cartItemId: string,
    qty: number,
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<ReserveResult> {
    if (!this.reserveSha) await this.init();
    const result = (await this.redis.evalsha(
      this.reserveSha as string,
      2,
      stockKey(itemId),
      reservationKey(cartItemId),
      String(qty),
      String(ttlSeconds),
    )) as number;

    if (result < 0) {
      return { ok: false, remaining: await this.getRemaining(itemId) };
    }
    return { ok: true, remaining: result };
  }

  /**
   * Return `qty` units to the available pool and drop the reservation key.
   * Used by RemoveFromCart (explicit) and ExpireReservation (via expiry).
   * `dropReservationKey` is false when the key already vanished (expiry case).
   */
  async release(
    itemId: string,
    cartItemId: string,
    qty: number,
    dropReservationKey = true,
  ): Promise<number> {
    const remaining = await this.redis.incrby(stockKey(itemId), qty);
    if (dropReservationKey) {
      await this.redis.del(reservationKey(cartItemId));
    }
    return remaining;
  }

  /**
   * Drop a reservation key WITHOUT returning stock. Used at checkout: the units
   * were actually sold, so we must cancel the pending expiry (which would
   * otherwise fire later and wrongly credit the stock back).
   */
  async clearReservationKey(cartItemId: string): Promise<void> {
    await this.redis.del(reservationKey(cartItemId));
  }

  /**
   * Reset a reservation key's TTL back to the full duration. Used when a cart is
   * actively edited (quantity change) so it doesn't expire mid-adjustment. If
   * the key is already gone this is a harmless no-op.
   */
  async refreshReservation(
    cartItemId: string,
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<void> {
    await this.redis.expire(reservationKey(cartItemId), ttlSeconds);
  }
}
