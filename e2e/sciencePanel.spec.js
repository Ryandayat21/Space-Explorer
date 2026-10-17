import { test, expect } from './fixtures.js';

test('grouped scientific panel supports every object type and restores keyboard focus', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  for (const id of ['sun', 'earth', 'moon', 'pluto', 'halley']) {
    await page.locator('#object-select').focus();
    await page.locator('#object-select').selectOption(id);
    await expect(page.locator('#object-name')).toBeFocused();
    await expect(page.locator('#object-stats')).toContainText('Karakteristik fisik');
    await expect(page.locator('#object-stats')).toContainText('Orbit dan rotasi');
    await expect(page.locator('#info-panel')).not.toContainText('undefined');
    if (['pluto','halley'].includes(id)) await expect(page.locator('#object-stats')).toContainText('Data belum tersedia');
    expect(await page.locator('#object-sources a').count()).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#info-panel')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#object-select')).toBeFocused();
  }
});
