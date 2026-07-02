// Checkout deletes the reservation keys (the units were SOLD, not abandoned),
// so a later expiry can't fire and wrongly credit the stock back. This verifies
// the exact tradeoff documented in ARCHITECTURE.md holds. Requires Docker.
import request from 'supertest';
import { startTestApp, TestApp } from './testApp.js';

let ctx: TestApp;

beforeAll(async () => {
  // Short TTL so we can prove the NEGATIVE: even after the TTL elapses, no
  // phantom restore happens because checkout removed the reservation key.
  ctx = await startTestApp({ ttlSeconds: 2 });
});

afterAll(async () => {
  await ctx.close();
});

test('checkout clears the reservation key; stock is not double-credited after the TTL', async () => {
  const itemId = await ctx.seedItem({ name: 'Mug', price: 19.99, totalStock: 5 });
  const token = await ctx.login('Buyer');

  const add = await request(ctx.app)
    .post('/cart/add')
    .set('Authorization', `Bearer ${token}`)
    .send({ itemId, qty: 2 });
  expect(add.status).toBe(200);
  expect(Number(await ctx.redis.get(ctx.stockKey(itemId)))).toBe(3);
  expect(await ctx.redis.keys('reservation:*')).not.toHaveLength(0);

  const checkout = await request(ctx.app)
    .post('/checkout')
    .set('Authorization', `Bearer ${token}`);
  expect(checkout.status).toBe(201);
  expect(checkout.body.total).toBeCloseTo(39.98, 2);

  // Reservation key gone, stock unchanged by checkout.
  expect(await ctx.redis.keys('reservation:*')).toHaveLength(0);
  expect(Number(await ctx.redis.get(ctx.stockKey(itemId)))).toBe(3);

  // Wait past the TTL: a phantom expiry must NOT restore the sold units.
  await new Promise((resolve) => setTimeout(resolve, 3500));
  expect(Number(await ctx.redis.get(ctx.stockKey(itemId)))).toBe(3);
});
