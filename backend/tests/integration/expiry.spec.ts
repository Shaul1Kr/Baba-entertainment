// Event-driven reservation expiry: an abandoned cart auto-releases its stock
// via Redis keyspace-expiry notifications (no polling). Requires Docker Mongo +
// Redis (with notify-keyspace-events Ex, set in docker-compose).
import request from 'supertest';
import { startTestApp, TestApp } from './testApp.js';

let ctx: TestApp;

beforeAll(async () => {
  // Short TTL so the reservation expires within the test. Set BEFORE the app
  // is imported (see testApp.ts).
  ctx = await startTestApp({ ttlSeconds: 2 });
});

afterAll(async () => {
  await ctx.close();
});

test('an expired reservation restores stock and removes the CartItem', async () => {
  const itemId = await ctx.seedItem({ name: 'Sunglasses', price: 39.99, totalStock: 1 });
  const token = await ctx.login('Forgetful');

  const add = await request(ctx.app)
    .post('/cart/add')
    .set('Authorization', `Bearer ${token}`)
    .send({ itemId, qty: 1 });
  expect(add.status).toBe(200);
  expect(Number(await ctx.redis.get(ctx.stockKey(itemId)))).toBe(0);

  // Wait past the 2s TTL (plus slack for the expiry event to be delivered).
  await new Promise((resolve) => setTimeout(resolve, 3500));

  // Stock is back and the cart row is gone.
  expect(Number(await ctx.redis.get(ctx.stockKey(itemId)))).toBe(1);

  const cart = await request(ctx.app)
    .get('/cart')
    .set('Authorization', `Bearer ${token}`);
  expect(cart.body.lines).toHaveLength(0);
});
