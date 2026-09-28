import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    channel: 'chrome',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium', channel: 'chrome', viewport: { width: 390, height: 844 } } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'], browserName: 'chromium', channel: 'chrome', viewport: { width: 768, height: 1024 } } }
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: true,
    timeout: 30_000
  }
})
