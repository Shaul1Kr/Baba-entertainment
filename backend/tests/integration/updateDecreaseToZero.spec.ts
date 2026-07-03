// Decreasing an item's quantity to 0 must fully remove the CartItem and clear
// its reservation key (no lingering row, no orphan key), returning the stock.
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

test('decreasing quantity to 0 removes the CartItem and its reservation key, restoring stock', async () => {
  const itemId = await ctx.seedItem({ name: 'Mug', price: 19.99, totalStock: 5 });
  const token = await ctx.login('Decrementer');
  const auth = { Authorization: `Bearer ${token}` };

  // Reserve 2 units -> stock 3, one cart row, one reservation key.
  const add = await request(ctx.app).post('/cart/add').set(auth).send({ itemId, qty: 2 });
  expect(add.status).toBe(200);
  expect(Number(await ctx.redis.get(ctx.stockKey(itemId)))).toBe(3);
  expect(await ctx.redis.keys('reservation:*')).toHaveLength(1);

  // Decrease by 2 -> quantity hits 0.
  const update = await request(ctx.app).patch('/cart/update').set(auth).send({ itemId, delta: -2 });
  expect(update.status).toBe(200);
  expect(update.body.qty).toBe(0);

  // CartItem gone, reservation key cleared, stock fully restored.
  const cart = await request(ctx.app).get('/cart').set(auth);
  expect(cart.body.lines).toHaveLength(0);
  expect(await ctx.redis.keys('reservation:*')).toHaveLength(0);
  expect(Number(await ctx.redis.get(ctx.stockKey(itemId)))).toBe(5);
});
