import type { Redis } from 'ioredis';
import { parseReservationKey } from './RedisClient.js';
import { logger } from '../logging/logger.js';

/**
 * Event-driven reservation expiry.
 *
 * Redis is configured with `notify-keyspace-events Ex`, which publishes a
 * message on `__keyevent@<db>__:expired` whenever ANY key expires. We listen
 * for those, and when a `reservation:{cartItemId}` key expires we hand the
 * cart item id off to the ExpireReservation use case (injected as `onExpire`).
 *
 * No polling, no cron. Tradeoff (documented in ARCHITECTURE.md): if Redis
 * restarts, pending expiry notifications are NOT replayed — a production system
 * would add a reconciliation sweep. The startup seed already reconciles counts.
 */
export class ReservationExpirySubscriber {
  constructor(
    private readonly subscriber: Redis,
    private readonly onExpire: (cartItemId: string) => Promise<void>,
    private readonly dbIndex = 0,
  ) {}

  async start(): Promise<void> {
    const channel = `__keyevent@${this.dbIndex}__:expired`;
    await this.subscriber.subscribe(channel);
    logger.info({ component: 'redis:sub', channel }, 'listening for reservation expirations');

    this.subscriber.on('message', (_channel: string, expiredKey: string) => {
      const cartItemId = parseReservationKey(expiredKey);
      if (!cartItemId) return; // not one of our reservation keys
      logger.debug(
        { component: 'redis:sub', event: 'reservation.expired.received', cartItemId },
        'reservation expiry event received',
      );
      this.onExpire(cartItemId).catch((err) =>
        logger.error(
          { component: 'redis:sub', event: 'reservation.expired.failed', cartItemId, err },
          'failed to process reservation expiry',
        ),
      );
    });
  }
}
