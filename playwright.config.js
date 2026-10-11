import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', timeout: 60000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', headless: true, screenshot: 'only-on-failure' },
  projects: [
    { name: 'edge-1366', use: { channel: 'msedge', viewport: { width: 1366, height: 768 } } },
    { name: 'chrome-1920', use: { channel: 'chrome', viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: { command: `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run dev -- --host 127.0.0.1`, url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
