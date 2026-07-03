/**
 * Manual catalogue reset. Run with: npm run seed
 *
 * DESTRUCTIVE (unlike the startup auto-seed): it wipes existing items/carts/
 * orders and reseeds, so you get a clean, predictable demo every time. The
 * catalogue data + insert logic are shared with startup via seedCatalogue.ts —
 * this script just adds the destructive reset + a Redis counter refresh.
 *
 * Note: startup now auto-seeds an empty catalogue, so this is optional — use it
 * to force a clean re-seed during development.
 */
import { env } from '../config/env.js';
import { connectMongo, disconnectMongo } from '../infrastructure/persistence/mongoose/connection.js';
import {
  ItemModel,
  CartItemModel,
  OrderModel,
} from '../infrastructure/persistence/mongoose/schemas.js';
import { redis, closeRedis } from '../infrastructure/redis/RedisClient.js';
import { StockReservationService } from '../infrastructure/redis/StockReservationService.js';
import { seedItemsIfEmpty } from '../bootstrap/seedCatalogue.js';
import { logger } from '../infrastructure/logging/logger.js';

async function run(): Promise<void> {
  await connectMongo();

  await Promise.all([
    ItemModel.deleteMany({}),
    CartItemModel.deleteMany({}),
    OrderModel.deleteMany({}),
  ]);

  // Collection is now empty, so this inserts the shared demo catalogue.
  await seedItemsIfEmpty();
  const created = await ItemModel.find();

  // Clear any stale live-stock keys, then seed fresh counters in Redis.
  const stock = new StockReservationService(redis, env.reservationTtlSeconds);
  const staleStockKeys = await redis.keys('stock:*');
  const staleReservationKeys = await redis.keys('reservation:*');
  if (staleStockKeys.length || staleReservationKeys.length) {
    await redis.del(...staleStockKeys, ...staleReservationKeys);
  }
  for (const item of created) {
    await stock.seed(item._id.toString(), item.totalStock);
  }
  logger.info({ component: 'seed', itemCount: created.length }, 'seeded Redis live-stock counters');

  await disconnectMongo();
  await closeRedis();
  logger.info({ component: 'seed' }, 'catalogue reset complete');
}

run().catch((err) => {
  logger.error({ component: 'seed', err }, 'catalogue reset failed');
  process.exit(1);
});
