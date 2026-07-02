import { test, expect, Page } from '@playwright/test';

async function login(page: Page, name: string) {
  await page.goto('/');
  await page.fill('input[name="name"]', name);
  await page.click('button:has-text("Let me in")');
  await page.waitForSelector('app-item-card');
}

function stockPill(page: Page, itemName: string) {
  return page
    .locator('app-item-card', { has: page.locator(`h3:has-text("${itemName}")`) })
    .locator('span.rounded-full')
    .first();
}

test('live sync: one user adding an item updates another user\'s stock count with no reload', async ({
  browser,
}) => {
  // Two independent sessions (separate browser contexts = separate users).
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const alice = await ctxA.newPage();
  const bob = await ctxB.newPage();

  await login(alice, 'E2E-Alice');
  await login(bob, 'E2E-Bob');

  const itemName = await alice.locator('app-item-card h3').first().innerText();
  const bobPill = stockPill(bob, itemName);
  const before = await bobPill.innerText();

  // Alice grabs the item.
  await alice
    .locator('app-item-card', { has: alice.locator(`h3:has-text("${itemName}")`) })
    .locator('button:has-text("Grab it")')
    .click();

  // Bob's pill must change WITHOUT any reload (pushed over Socket.io).
  await expect(bobPill).not.toHaveText(before, { timeout: 5000 });

  await ctxA.close();
  await ctxB.close();
});
