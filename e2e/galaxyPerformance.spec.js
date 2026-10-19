import { test, expect } from './fixtures.js';
test('galaxy quality and renderer audit preserves picking, resize and inactive solar state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?debug'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  for (const [preset, count] of [['medium',30240], ['low',12600], ['high',50400]]) {
    await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
    await expect.poll(() => page.evaluate(() => window.__observer.performance().particles)).toBe(count);
    const stats = await page.evaluate(() => window.__observer.performance());
    console.log(preset, JSON.stringify(stats));
    expect(stats.geometries).toBe(22); expect(stats.materials).toBe(5); expect(stats.calls).toBeLessThanOrEqual(34);
    const days = await page.evaluate(() => window.__observer.elapsedDays());
    await page.waitForTimeout(100); expect(await page.evaluate(() => window.__observer.elapsedDays())).toBe(days);
    await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
    if (preset !== 'high') await page.locator('#quality-button').click();
  }
  await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
  const before = await page.evaluate(() => window.__observer.performance());
  await page.setViewportSize({ width: 1500, height: 850 });
  await expect.poll(() => page.evaluate(() => window.__observer.mode().aspect)).toBeCloseTo(1500/850);
  const after = await page.evaluate(() => window.__observer.performance());
  expect(after.geometries).toBe(before.geometries); expect(after.bufferBytes).toBe(before.bufferBytes);
  await page.mouse.click(750,425); await expect(page.locator('#galaxy-landmark-panel')).toBeVisible();
  await expect(page.locator('#debug-fps')).toContainText('triangles');
  await page.goto('/'); await expect(page.locator('#debug-fps')).toHaveCount(0);
});
