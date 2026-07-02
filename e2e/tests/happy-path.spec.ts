import { test, expect, Page } from '@playwright/test';

async function login(page: Page, name: string) {
  await page.goto('/');
  await page.fill('input[name="name"]', name);
  await page.click('button:has-text("Let me in")');
  await page.waitForSelector('app-item-card');
}

test('happy path: login → add to cart → checkout → confirmation shows order details', async ({
  page,
}) => {
  await login(page, 'E2EHappy');

  // Grab the first item and remember its name.
  const itemName = await page.locator('app-item-card h3').first().innerText();
  await page
    .locator('app-item-card', { has: page.locator(`h3:has-text("${itemName}")`) })
    .locator('button:has-text("Grab it")')
    .click();

  // Open the cart and check out.
  await page.click('header button:has-text("Cart")');
  await expect(page.locator('app-cart-drawer aside')).toContainText(itemName);
  await page.click('app-checkout button:has-text("Checkout")');

  // Confirmation screen shows the celebratory state + correct order details.
  const confirmation = page.locator('app-order-confirmation');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText('JACKPOT');
  await expect(confirmation).toContainText(itemName);
  await expect(confirmation).toContainText('Total paid');
  await expect(confirmation).toContainText('Order #');
});
