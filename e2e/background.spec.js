import { test, expect, chooseObject } from './fixtures.js';

test('decorative sky toggles with keyboard and survives quality changes', async ({ page }, testInfo) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#time-toggle').click();
  await chooseObject(page, 'earth');
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
  const toggle = page.locator('#starfield-toggle');
  await toggle.focus(); await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#quality-button').click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const canvas = await page.locator('#space-canvas').boundingBox();
  expect(canvas.width).toBeGreaterThan(1000);
  const box = await toggle.boundingBox();
  expect(box.x).toBeGreaterThan(0); expect(box.x + box.width).toBeLessThan(canvas.width);
  await page.screenshot({ path: testInfo.outputPath('background.png') });
  await page.locator('#close-info').click();
  const point = await page.evaluate(() => window.__observer.project('earth'));
  await page.mouse.click(point.x, point.y);
  expect(await page.evaluate(() => window.__observer.snapshot().selected)).toBe('earth');
});
