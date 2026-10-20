import { test, expect, chooseObject } from './fixtures.js';
test('cinematic switch, skip, marker entry and restored solar controls', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.getByRole('button', { name: 'Beralih antara Tata Surya dan Bima Sakti' }).click();
  await expect(page.locator('#mode-transition')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('body')).not.toHaveClass(/hud-hidden/);
  await page.getByRole('button', { name: 'Skip transition' }).click();
  await expect(page.locator('#mode-transition')).toBeHidden();
  expect(await page.evaluate(() => window.__observer.mode().id)).toBe('galaxy');
  await page.locator('.galaxy-landmark-list > summary').click();
  await page.locator('[data-landmark="solar-system-region"]').click();
  await page.locator('#galaxy-landmark-panel').getByRole('button', { name: 'Enter Solar System' }).click();
  await expect(page.locator('#mode-transition')).toBeHidden();
  expect(await page.evaluate(() => window.__observer.mode().id)).toBe('solar-system');
  await chooseObject(page, 'earth'); await expect(page.locator('#object-name')).toHaveText('Bumi');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (let i = 0; i < 4; i++) {
    await page.locator('#mode-toggle').click();
    await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
  }
  await expect(page.locator('#search-input')).toBeEnabled();
});
