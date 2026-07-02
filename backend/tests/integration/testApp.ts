/**
 * Integration test harness. Boots the REAL app (real Mongo + Redis from
 * docker-compose) via the exported `bootstrap()`, wipes to a clean slate, and
 * exposes helpers.
 *
 * IMPORTANT: everything here is loaded with DYNAMIC `import()` inside the async
 * setup — never statically. `config/env.ts` reads `RESERVATION_TTL_SECONDS` at
 * module-evaluation time, so a test that needs a short TTL must set the env var
 * BEFORE the app modules are first imported. Static imports are hoisted and
 * would evaluate env.ts too early, defeating the override.
 */
export interface TestApp {
  app: import('express').Express;
  redis: import('ioredis').Redis;
  stockKey: (itemId: string) => string;
  reservationKey: (cartItemId: string) => string;
  seedItem: (opts: { name?: string; price?: number; totalStock: number }) => Promise<string>;
  login: (name: string) => Promise<string>;
  close: () => Promise<void>;
}

export async function startTestApp(opts: { ttlSeconds?: number } = {}): Promise<TestApp> {
  if (opts.ttlSeconds !== undefined) {
    process.env.RESERVATION_TTL_SECONDS = String(opts.ttlSeconds);
  }

  const { default: request } = await import('supertest');
  const { bootstrap } = await import('../../src/server.js');
  const schemas = await import('../../src/infrastructure/persistence/mongoose/schemas.js');
  const { redis, stockKey, reservationKey } = await import(
    '../../src/infrastructure/redis/RedisClient.js'
  );

  const booted = await bootstrap();

  // Clean slate: drop all catalogue/cart/order data and any live Redis keys.
  await Promise.all([
    schemas.ItemModel.deleteMany({}),
    schemas.CartItemModel.deleteMany({}),
    schemas.OrderModel.deleteMany({}),
  ]);
  const staleKeys = [
    ...(await redis.keys('stock:*')),
    ...(await redis.keys('reservation:*')),
  ];
  if (staleKeys.length) await redis.del(...staleKeys);

  const seedItem: TestApp['seedItem'] = async ({ name = 'Test Item', price = 10, totalStock }) => {
    const doc = await schemas.ItemModel.create({
      name,
      description: '',
      price,
      imageUrl: '',
      totalStock,
    });
    const id = doc._id.toString();
    await booted.stock.seed(id, totalStock);
    return id;
  };

  const login: TestApp['login'] = async (name) => {
    const res = await request(booted.app).post('/auth/login').send({ name });
    return res.body.token as string;
  };

  return {
    app: booted.app,
    redis,
    stockKey,
    reservationKey,
    seedItem,
    login,
    close: booted.close,
  };
}
