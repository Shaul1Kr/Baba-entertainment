// Concurrent quantity INCREASES must respect the same oversell guard as
// add-to-cart — they go through the identical atomic Lua reserve path.
// Requires Docker Mongo + Redis.
import request from 'supertest';
import { startTestApp, TestApp } from './testApp.js';

let ctx: TestApp;

beforeAll(async () => {
  ctx = await startTestApp();
});

afterAll(async () => {
  await ctx.close();
});

test('20 concurrent PATCH /cart/update (+1) on a stock-3 item: exactly 3 succeed, 17 get 409, stock lands at 0', async () => {
  const itemId = await ctx.seedItem({ name: 'Watch', price: 299.5, totalStock: 3 });
  const token = await ctx.login('Racer');

  // Fire 20 increase requests simultaneously (each reserves 1 unit atomically).
  const responses = await Promise.all(
    Array.from({ length: 20 }, () =>
      request(ctx.app)
        .patch('/cart/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId, delta: 1 }),
    ),
  );

  const succeeded = responses.filter((r) => r.status === 200).length;
  const conflicted = responses.filter((r) => r.status === 409).length;

  expect(succeeded).toBe(3);
  expect(conflicted).toBe(17);

  // Authoritative Redis counter is exactly 0 — never negative.
  expect(Number(await ctx.redis.get(ctx.stockKey(itemId)))).toBe(0);
});
