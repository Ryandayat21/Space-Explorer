import { test, expect } from './fixtures.js';
test('galaxy presets, cancellation, flight, reset and mode isolation', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  const solarSpeed = await page.evaluate(() => window.__observer.snapshot().speed);
  await page.locator('#mode-toggle').click();
  const state = () => page.evaluate(() => window.__observer.galaxyCamera());
  for (const preset of ['top', 'center', 'solar', 'overview']) {
    await page.locator(`[data-galaxy-view="${preset}"]`).click();
    await expect.poll(async () => (await state()).tween).toBe(false);
    expect(Math.hypot(...(await state()).position)).toBeLessThanOrEqual(80);
  }
  await page.locator('[data-galaxy-view="top"]').click();
  await page.keyboard.press('Escape'); expect((await state()).tween).toBe(false);
  await page.locator('#galaxy-flight').click();
  await expect.poll(() => page.evaluate(() => !!document.pointerLockElement)).toBe(true);
  const before = await state(); await page.mouse.wheel(0, -400);
  expect((await state()).multiplier).toBeGreaterThan(before.multiplier);
  await page.keyboard.down('w'); await page.waitForTimeout(300); await page.keyboard.up('w');
  expect((await state()).position).not.toEqual(before.position);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await state()).flight).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#galaxy-reset').click();
  await expect.poll(async () => (await state()).tween, { timeout: 1000 }).toBe(false);
  expect((await state()).position).toEqual([0, 20, 30]);
  await page.locator('#mode-toggle').click();
  expect(await page.evaluate(() => window.__observer.snapshot().speed)).toBe(solarSpeed);
});
