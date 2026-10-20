import { test, expect } from './fixtures.js';
test('mode-aware search activates galaxy, frames marker and formats its panel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  const input = page.locator('#search-input'), select = page.locator('#search-results');
  await input.fill('Sirius'); await expect(page.locator('#search-status')).toContainText('Milky Way');
  await input.press('Enter');
  const panel = page.locator('#galaxy-landmark-panel');
  await expect(panel).toBeVisible(); await expect(panel.locator('h2')).toHaveText('Sirius');
  await expect(panel).toContainText('Star System'); await expect(panel).toContainText('8,6');
  await expect(panel.locator('nav')).toContainText('Milky Way >'); await expect(panel).toContainText('Approximate');
  await expect.poll(() => page.evaluate(() => window.__observer.galaxyCamera().tween)).toBe(false);
  const position = await page.evaluate(() => window.__observer.galaxyCamera().position);
  expect(position[0]).toBeCloseTo(7.2); expect(position[1]).toBeCloseTo(3); expect(position[2]).toBeCloseTo(6);
  await page.keyboard.press('Escape'); await expect(panel).toBeHidden();
  await expect(select).toBeHidden();
  // Enter while already in Galaxy must not activate the newly focused close button.
  await input.fill('Sirius'); await input.press('Enter');
  await expect(panel).toBeVisible(); await page.waitForTimeout(200); await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await input.fill(''); expect(await select.getByRole('group').count()).toBe(5);
  await input.fill('M42'); await input.press('ArrowDown'); await expect(input).toBeFocused();
  await input.press('Enter'); await expect(panel.locator('h2')).toHaveText('Orion Nebula');
  await page.keyboard.press('Escape'); await input.fill('no such landmark');
  await expect(page.locator('#search-status')).toContainText('Objek tidak ditemukan');
  await input.press('Escape'); await expect(select).toBeHidden();
  await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
  await input.fill('earth'); await input.press('Enter'); await expect(page.locator('#object-name')).toHaveText('Bumi');
});
