import { test, expect } from './fixtures.js';

test('Escape cancels Visit and Follow and Free Flight takes over a tour transition', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#object-select').selectOption('saturn');
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(true);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
  // Escape now also closes the science panel; reopen it before using Follow.
  await page.locator('#object-select').selectOption('earth');
  await page.locator('#object-select').selectOption('saturn');
  await page.locator('#follow-button').click();
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().followed)).toBe('saturn');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__observer.snapshot().followed)).toBeUndefined();
  await page.locator('#tour-button').click();
  await page.locator('#flight-button').click();
  const state = await page.evaluate(() => window.__observer.snapshot());
  expect(state.flight).toBe(true); expect(state.tween).toBe(false); expect(state.tourActive).toBe(false);
  expect(state.clearance).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await page.locator('#flight-exit').click();
  expect(await page.evaluate(() => window.__observer.snapshot().flight)).toBe(false);
});
