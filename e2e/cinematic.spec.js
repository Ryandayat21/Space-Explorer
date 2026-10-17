import { test, expect } from './fixtures.js';

test('cinematic mode restores UI safely without changing the scene or persisting on reload', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#object-select').selectOption('earth');
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
  await page.locator('#time-toggle').click();
  await page.locator('#label-toggle').click();
  const before = await page.evaluate(() => window.__observer.snapshot());
  await page.locator('#hud-button').click();
  await expect(page.locator('body')).toHaveClass(/hud-hidden/);
  await expect(page.locator('#cinematic-status')).toBeVisible();
  await expect(page.locator('#info-panel')).toHaveJSProperty('inert', true);
  await expect(page.locator('.topbar')).toHaveJSProperty('inert', true);
  await expect(page.locator('#cinematic-status')).toBeHidden({ timeout: 5000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/hud-hidden/);
  await expect(page.locator('#info-panel')).toHaveJSProperty('inert', false);
  await expect(page.locator('#welcome-card')).toHaveJSProperty('inert', true);
  await expect(page.locator('#labels-layer')).toBeHidden();
  const after = await page.evaluate(() => window.__observer.snapshot());
  expect(after.camera).toEqual(before.camera); expect(after.target).toEqual(before.target);
  await page.keyboard.press('h');
  await expect(page.locator('body')).toHaveClass(/hud-hidden/);
  await page.reload(); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await expect(page.locator('body')).not.toHaveClass(/hud-hidden/);
  expect(await page.locator('button:not([title]):not([aria-label])').count()).toBe(0);
});

test('fullscreen Escape and rejected or unavailable API leave usable controls', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#fullscreen-button').click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await expect(page.locator('#fullscreen-button')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#hud-button').click();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  await expect(page.locator('body')).not.toHaveClass(/hud-hidden/);
  await expect(page.locator('#fullscreen-button')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => { document.documentElement.requestFullscreen = () => Promise.reject(new Error('Denied')); });
  await page.locator('#fullscreen-button').click();
  await expect(page.locator('#app-status')).toContainText('tidak tersedia');
  await page.evaluate(() => { document.documentElement.requestFullscreen = undefined; });
  await page.locator('#fullscreen-button').click();
  await expect(page.locator('#fullscreen-button')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#help-button').click(); await page.keyboard.press('Escape');
  await expect(page.locator('#help-dialog')).not.toBeVisible();
});
