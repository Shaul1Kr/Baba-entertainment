import { defineConfig } from '@playwright/test';

/**
 * E2E config. Drives the REAL app end-to-end, so it needs the full stack:
 * Docker (Mongo + Redis) must already be up (`docker-compose up -d`). Playwright
 * then boots the backend (reseeding a clean catalogue first) and the Angular dev
 * server automatically via `webServer`, and reuses them if already running.
 *
 * Uses the system Google Chrome (`channel: 'chrome'`) so no browser download is
 * required.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 6_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    channel: 'chrome',
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      // Reseed a clean catalogue, then start the API.
      command: 'npm run seed && npm start',
      cwd: '../backend',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm start',
      cwd: '../frontend',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
