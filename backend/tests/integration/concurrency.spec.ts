// THE core requirement, proven mechanically: stock can never oversell under
// concurrent add-to-cart requests. Requires Docker Mongo + Redis.
import request from 'supertest';
import { startTestApp, TestApp } from './testApp.js';

let ctx: TestApp;

beforeAll(async () => {
  ctx = await startTestApp();
});

afterAll(async () => {
  await ctx.close();
});

test('20 concurrent /cart/add on a stock-3 item: exactly 3 succeed, 17 get 409, stock lands at 0', async () => {
  const itemId = await ctx.seedItem({ name: 'Watch', price: 299.5, totalStock: 3 });
  const token = await ctx.login('Racer');

  // Fire 20 add-to-cart requests simultaneously.
  const responses = await Promise.all(
    Array.from({ length: 20 }, () =>
      request(ctx.app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId, qty: 1 }),
    ),
  );

  const succeeded = responses.filter((r) => r.status === 200).length;
  const conflicted = responses.filter((r) => r.status === 409).length;

  expect(succeeded).toBe(3);
  expect(conflicted).toBe(17);

  // The authoritative Redis counter must be exactly 0 — never negative.
  const remaining = Number(await ctx.redis.get(ctx.stockKey(itemId)));
  expect(remaining).toBe(0);
});
