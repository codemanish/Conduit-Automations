import { defineConfig, devices } from '@playwright/test';
import { API_BASE_URL, UI_BASE_URL } from './src/config/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_BASE_URL },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], baseURL: UI_BASE_URL },
    },
  ],
});
