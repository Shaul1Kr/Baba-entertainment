// Offset-based pagination of GET /items: correct slice + metadata, and an
// out-of-range page returns an empty array (not an error). Requires Docker.
import request from 'supertest';
import { startTestApp, TestApp } from './testApp.js';

let ctx: TestApp;
const TOTAL = 25;

beforeAll(async () => {
  ctx = await startTestApp();
  // Seed a known-size catalogue sequentially so insertion (_id) order is stable.
  for (let i = 0; i < TOTAL; i++) {
    await ctx.seedItem({ name: `Item ${String(i).padStart(2, '0')}`, price: 10 + i, totalStock: 5 });
  }
});

afterAll(async () => {
  await ctx.close();
});

test('page 2 with limit 12 returns the correct slice and total/totalPages', async () => {
  const res = await request(ctx.app).get('/items').query({ page: 2, limit: 12 });

  expect(res.status).toBe(200);
  expect(res.body.page).toBe(2);
  expect(res.body.limit).toBe(12);
  expect(res.body.total).toBe(TOTAL);
  expect(res.body.totalPages).toBe(3); // ceil(25 / 12)
  expect(res.body.items).toHaveLength(12);
  // Page 2 (0-based offset 12) => items 12..23.
  expect(res.body.items[0].name).toBe('Item 12');
  expect(res.body.items[11].name).toBe('Item 23');
  // Live remaining is merged in for the page's items.
  expect(res.body.items[0].remaining).toBe(5);
});

test('an out-of-range page returns an empty items array, not an error', async () => {
  const res = await request(ctx.app).get('/items').query({ page: 99, limit: 12 });

  expect(res.status).toBe(200);
  expect(res.body.items).toEqual([]);
  expect(res.body.total).toBe(TOTAL);
  expect(res.body.totalPages).toBe(3);
});
