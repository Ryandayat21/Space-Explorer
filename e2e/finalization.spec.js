import { test, expect } from './fixtures.js';

test('resizing, hidden HUD keyboard focus and time control labels remain consistent', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#object-select').selectOption('earth');
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
  await page.locator('#time-toggle').click();
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    const canvas = await page.locator('#space-canvas').boundingBox();
    expect(canvas.width).toBe(viewport.width); expect(canvas.height).toBe(viewport.height);
    await page.locator('#compare-button').click();
    await page.locator('#compare-second').selectOption('halley');
    const dialog = await page.locator('#comparison-dialog').boundingBox();
    expect(dialog.x).toBeGreaterThanOrEqual(0);
    expect(dialog.x + dialog.width).toBeLessThanOrEqual(viewport.width);
    expect(dialog.y + dialog.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape');
    await page.locator('#close-info').click();
    const point = await page.evaluate(() => window.__observer.project('earth'));
    await page.mouse.click(point.x, point.y);
    await expect(page.locator('#object-name')).toHaveText('Bumi');
  }
  await page.locator('#hud-button').click();
  await expect(page.locator('.topbar')).toHaveJSProperty('inert', true);
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('[inert]'))).toBe(false);
  }
  await page.locator('#hud-button').click();
  await expect(page.locator('.topbar')).toHaveJSProperty('inert', false);
  await expect(page.locator('#time-toggle')).toHaveAttribute('aria-label', 'Lanjutkan simulasi');
  await page.locator('#time-speed').fill('4');
  await expect(page.locator('#time-toggle')).toHaveAttribute('aria-label', 'Jeda simulasi');
});

test('all texture decode failures preserve exploration, regions and comparison', async ({ page }) => {
  await page.route('**/textures/*.jpg', route => route.fulfill({ status: 200, contentType: 'image/jpeg', body: 'invalid-image' }));
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await expect(page.locator('#app-status')).toContainText('procedural');
  for (const id of ['earth', 'moon', 'ceres', 'saturn', 'uranus', 'halley']) {
    await page.locator('#object-select').selectOption(id);
    await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
    await page.locator('#bookmark-button').click();
    await expect(page.locator('#bookmark-button')).toHaveAttribute('aria-pressed', 'true');
  }
  await page.locator('#compare-button').click();
  await page.locator('#compare-second').selectOption('ceres');
  await expect(page.locator('#comparison-table')).toContainText('Komet Halley');
  await page.keyboard.press('Escape');
  await page.locator('#asteroid-belt-toggle').click(); await page.locator('#kuiper-belt-toggle').click();
  expect((await page.evaluate(() => window.__observer.regions())).every(region => !region.visible)).toBe(true);
  await page.locator('#favorites-button').click();
  await expect(page.locator('#favorites-list li')).toHaveCount(6);
});
