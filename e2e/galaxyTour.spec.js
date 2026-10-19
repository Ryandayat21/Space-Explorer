import { test, expect } from './fixtures.js';
test('galaxy tour navigation pause resume escape and mode cleanup', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
  await page.locator('#tour-button').click();
  const panel = page.locator('#galaxy-tour-panel');
  await expect(panel).toBeVisible(); await expect(panel.locator('[data-progress]')).toHaveText('1 / 10');
  await expect(page.locator('#galaxy-flight')).toBeDisabled();
  await panel.locator('[data-action="pause"]').click();
  const position = await page.evaluate(() => window.__observer.galaxyCamera().position);
  await page.waitForTimeout(300);
  const pausedPosition = await page.evaluate(() => window.__observer.galaxyCamera().position);
  pausedPosition.forEach((v,i) => expect(v).toBeCloseTo(position[i], 8));
  await expect(panel.locator('[data-action="pause"]')).toHaveText('Resume');
  await panel.locator('[data-action="pause"]').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (let i = 2; i <= 10; i++) { await panel.locator('[data-action="next"]').click(); await expect(panel.locator('[data-progress]')).toHaveText(`${i} / 10`); }
  await expect(panel.locator('h2')).toHaveText('Kembali ke overview');
  await panel.locator('[data-action="previous"]').click(); await expect(panel.locator('[data-progress]')).toHaveText('9 / 10');
  await page.keyboard.press('Escape'); await expect(panel).toBeHidden(); await expect(page.locator('#galaxy-flight')).toBeEnabled();
  await page.locator('#tour-button').click(); await panel.locator('[data-action="exit"]').click(); await expect(panel).toBeHidden();
  await page.locator('#tour-button').click(); await page.keyboard.press('h'); await page.keyboard.press('Escape'); await expect(panel).toBeHidden();
  await page.locator('#tour-button').click(); await page.locator('#mode-toggle').click();
  await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false); await expect(panel).toBeHidden();
  await page.locator('#tour-button').click(); await expect(page.locator('#tour-panel')).toBeVisible();
});
