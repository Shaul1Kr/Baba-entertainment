/**
 * Seeds the catalogue with demo flash-sale items and initialises Redis stock.
 * Run with: npm run seed
 *
 * Idempotent-ish: it wipes existing items/carts/orders and reseeds, so you get
 * a clean, predictable demo every time.
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

const DEMO_ITEMS = [
  {
    name: 'Golden Jackpot Hoodie',
    description: 'Limited-run gold-threaded hoodie. Blink and it’s gone.',
    price: 89.99,
    imageUrl: 'https://picsum.photos/seed/hoodie/600/400',
    totalStock: 10,
  },
  {
    name: 'Neon Ace Sneakers',
    description: 'Light-up soles, casino-floor ready.',
    price: 149.0,
    imageUrl: 'https://picsum.photos/seed/sneakers/600/400',
    totalStock: 5,
  },
  {
    name: 'High Roller Watch',
    description: 'Solid-feel chronograph with an amber dial.',
    price: 299.5,
    imageUrl: 'https://picsum.photos/seed/watch/600/400',
    totalStock: 3,
  },
  {
    name: 'Lucky 7 Backpack',
    description: 'Everyday carry with a jackpot-red lining.',
    price: 59.99,
    imageUrl: 'https://picsum.photos/seed/backpack/600/400',
    totalStock: 20,
  },
  {
    name: 'Vegas Nights Sunglasses',
    description: 'Polarised, gold frames, pure swagger.',
    price: 39.99,
    imageUrl: 'https://picsum.photos/seed/sunglasses/600/400',
    totalStock: 2,
  },
  {
    name: 'Diamond Hands Mug',
    description: 'Keeps your coffee hot through any downswing.',
    price: 19.99,
    imageUrl: 'https://picsum.photos/seed/mug/600/400',
    totalStock: 50,
  },
];

async function run(): Promise<void> {
  await connectMongo();

  await Promise.all([
    ItemModel.deleteMany({}),
    CartItemModel.deleteMany({}),
    OrderModel.deleteMany({}),
  ]);

  const created = await ItemModel.insertMany(DEMO_ITEMS);
  console.log(`[seed] inserted ${created.length} items`);

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
  console.log('[seed] seeded Redis live-stock counters');

  await disconnectMongo();
  await closeRedis();
  console.log('[seed] done');
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
