import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 3011;
const baseURL = `http://localhost:${PORT}`;
const apiURL = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: './__tests__',
  globalSetup: require.resolve('./__tests__/setup/global-setup.ts'),
  globalTeardown: require.resolve('./__tests__/setup/global-teardown.ts'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    actionTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter api start:e2e',
      port: Number(API_PORT),
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm dev',
      port: Number(PORT),
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_GRAPHQL_URL: `${apiURL}/graphql`,
      },
    },
  ],
});
