import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:43918', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testMatch: ['**/experience.spec.ts', '**/header.spec.ts'], use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: ['**/experience.spec.ts', '**/header.spec.ts'], use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run serve -- --host 127.0.0.1 --port 43918 --no-open',
    url: 'http://127.0.0.1:43918',
    reuseExistingServer: !process.env.CI,
  },
});
