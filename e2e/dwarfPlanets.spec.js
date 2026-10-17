import { test, expect } from './fixtures.js';
import { dwarfPlanets } from '../src/data/dwarfPlanets.js';

test('dwarf planets have category, labels, panels, picking and Follow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#time-toggle').click();
  await page.locator('[data-filter="dwarf-planet"]').click();
  await expect(page.locator('#object-select optgroup')).toHaveAttribute('label', 'Planet katai');
  await expect(page.locator('#object-select option')).toHaveCount(6);
  for (const body of dwarfPlanets) {
    await expect(page.locator('.space-label').filter({ hasText: new RegExp(`^${body.name}$`) })).toHaveCount(1);
    await page.locator('#search-input').fill(body.name);
    await page.locator('#search-input').press('Enter');
    await expect(page.locator('#object-name')).toHaveText(body.name);
    await expect(page.locator('#object-type')).toHaveText('PLANET KATAI');
    await expect(page.locator('#object-description')).toContainText('tidak proporsional');
    await expect(page.locator('#object-stats')).toContainText('au dari Matahari');
    await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
    await page.locator('#close-info').click();
    const point = await page.evaluate(id => window.__observer.project(id), body.id);
    await page.mouse.click(point.x, point.y);
    await expect(page.locator('#info-panel')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#object-name')).toHaveText(body.name);
  }
  await page.locator('#follow-button').click();
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
  const first = await page.evaluate(() => window.__observer.snapshot());
  await page.locator('#time-speed').fill('4');
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().camera)).not.toEqual(first.camera);
  expect((await page.evaluate(() => window.__observer.snapshot())).followed).toBe('eris');
  expect(errors).toEqual([]);
});
