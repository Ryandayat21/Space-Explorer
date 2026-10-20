import { test, expect } from './fixtures.js';
test('galaxy landmark raycast, keyboard panel and mode isolation', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
  const size = page.viewportSize();
  await page.mouse.click(size.width / 2, size.height / 2);
  const panel = page.locator('#galaxy-landmark-panel');
  await expect(panel).toBeVisible(); await expect(panel.locator('h2')).toHaveText('Galactic Center');
  await expect(panel).toContainText('26.000'); await expect(panel).toContainText('skematis');
  await page.keyboard.press('Escape'); await expect(panel).toBeHidden();
  await page.locator('.galaxy-landmark-list > summary').click();
  const button = page.locator('[data-landmark="sirius"]');
  await button.focus(); await page.keyboard.press('Enter');
  await expect(panel.locator('h2')).toHaveText('Sirius'); await expect(panel).toContainText('8,6');
  await page.keyboard.press('Escape'); await expect(button).toBeFocused();
  await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false); await expect(panel).toBeHidden();
  await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false); await expect(panel).toBeHidden();
  await expect(page.locator('#search-input')).toBeEnabled();
});
