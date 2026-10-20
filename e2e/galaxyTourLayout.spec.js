import { test, expect } from './fixtures.js';
test('galaxy tour stays below center, collapses for travel and supports keyboard minimize', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
  await page.locator('#tour-button').click();
  const panel = page.locator('#galaxy-tour-panel'), narration = panel.locator('[data-narration]');
  await expect(panel).toHaveClass(/is-moving/); await expect(narration).toBeHidden();
  await expect(narration).toBeVisible();
  const box = await panel.boundingBox(), viewport = page.viewportSize();
  expect(box.width).toBeLessThanOrEqual(640); expect(box.y).toBeGreaterThan(viewport.height / 2);
  for (const selector of ['#mode-toggle', '#hud-button', '#galaxy-placeholder']) {
    const other = await page.locator(selector).boundingBox();
    expect(box.x >= other.x + other.width || box.x + box.width <= other.x || box.y >= other.y + other.height || box.y + box.height <= other.y).toBe(true);
  }
  const minimize = panel.locator('[data-action="minimize"]');
  await minimize.focus(); await page.keyboard.press('Enter');
  await expect(panel).toHaveClass(/is-minimized/); await expect(narration).toBeHidden();
  expect((await panel.boundingBox()).height).toBeLessThan(box.height);
  await page.keyboard.press('Enter'); await expect(narration).toBeVisible();
  await panel.locator('[data-action="next"]').click(); await expect(narration).toBeHidden(); await expect(narration).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const small = await panel.boundingBox(); expect(small.width).toBeLessThanOrEqual(366); expect(small.height).toBeLessThanOrEqual(245); expect(small.y).toBeGreaterThan(422);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await narration.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await minimize.click(); await page.keyboard.press('Escape'); await expect(panel).toBeHidden();
});
