import { test, expect } from './fixtures.js';

test('keyboard shortcuts, named modal focus and toggle semantics', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#help-button').focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Jelajahi semesta dengan caramu.' })).toBeVisible();
  await expect(page.locator('#close-help')).toBeFocused();
  await page.keyboard.press('Tab');
  // Native dialog may let Tab reach browser chrome when it has a single button.
  expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement.closest('#help-dialog'))).toBe(true);
  await page.keyboard.press('p');
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-button')).toBeFocused();
  await expect(page.locator('#time-toggle')).toHaveAttribute('aria-label', 'Jeda simulasi');
  await page.keyboard.press('p');
  await expect(page.locator('#time-toggle')).toHaveAttribute('aria-label', 'Lanjutkan simulasi');
  await page.locator('#search-input').fill('pluto');
  await page.locator('#search-input').press('p');
  await expect(page.locator('#time-toggle')).toHaveAttribute('aria-label', 'Lanjutkan simulasi');
  await page.locator('#time-speed').focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#time-speed')).toHaveAttribute('aria-valuetext', '10 hari simulasi per detik');
  await page.locator('#orbit-toggle').focus(); await page.keyboard.press('Space');
  await expect(page.locator('#orbit-toggle')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.locator('#orbit-toggle').evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
  await page.keyboard.press('l');
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.keyboard.press('Escape');
  expect(await page.locator('.icon-button:not([aria-label])').count()).toBe(0);
});

test('reduced motion shortens new and running transitions and removes loading animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  expect(await page.locator('.loading-orbit').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
  await page.locator('#object-select').selectOption('earth');
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween), { timeout: 1000, intervals: [50] }).toBe(false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#object-select').selectOption('saturn');
  expect(await page.evaluate(() => window.__observer.snapshot().tween)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween), { timeout: 1000, intervals: [50] }).toBe(false);
});
