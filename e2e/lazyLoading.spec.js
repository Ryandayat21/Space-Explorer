import { test, expect } from './fixtures.js';
const galaxyModule = /\/(?:src\/modes\/GalaxyMode|assets\/GalaxyMode-[^/]+)\.js(?:\?.*)?$/;

test('Galaxy code downloads only on demand, audio stays opt-in and repeat visits reuse module', async ({ page }) => {
  let galaxyRequests = 0, audioRequests = 0, release;
  const held = new Promise(resolve => { release = resolve; });
  page.on('request', request => {
    if (galaxyModule.test(request.url())) galaxyRequests++;
    if (request.url().includes('.mp3')) audioRequests++;
  });
  await page.route(galaxyModule, async route => { await held; await route.continue(); });
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  expect(galaxyRequests).toBe(0); expect(audioRequests).toBe(0);
  await page.locator('#mode-toggle').click();
  await expect(page.locator('#mode-transition')).toHaveAttribute('data-stage', 'assets');
  expect(galaxyRequests).toBe(1);
  await expect(page.locator('#mode-transition button')).toBeDisabled();
  release();
  await expect(page.locator('#mode-transition')).toBeHidden();
  await expect(page.locator('#galaxy-placeholder')).toBeVisible();
  await page.locator('#mode-toggle').click(); await expect(page.locator('#mode-transition')).toBeHidden();
  await page.locator('#mode-toggle').click(); await expect(page.locator('#mode-transition')).toBeHidden();
  expect(galaxyRequests).toBe(1); expect(audioRequests).toBe(0);
});

test('failed Galaxy dynamic import offers reload; startup remains usable before first visit', async ({ page }) => {
  await page.route(galaxyModule, route => route.fulfill({ contentType: 'application/javascript', body: 'throw new Error("Injected Galaxy module failure")' }));
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#mode-toggle').click();
  await expect(page.locator('#loading-detail')).toContainText('Modul atau scene tujuan gagal');
  await expect(page.locator('#loading-reload')).toBeFocused();
  await page.unroute(galaxyModule); await page.locator('#loading-reload').click();
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#mode-toggle').click(); await expect(page.locator('#mode-transition')).toBeHidden();
  await expect(page.locator('#galaxy-placeholder')).toBeVisible();
});
