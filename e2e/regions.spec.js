import { test, expect } from './fixtures.js';

test('region toggles, quality limits and standalone dwarf planets work together', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  const regions = () => page.evaluate(() => window.__observer.regions());
  expect((await regions()).map(region => region.count)).toEqual([1900, 3600]);
  await page.locator('#time-toggle').click();
  const paused = await regions();
  await page.waitForTimeout(100);
  expect(await regions()).toEqual(paused);
  for (const id of ['asteroid-belt', 'kuiper-belt']) {
    await page.locator(`#${id}-toggle`).click();
    await expect(page.locator(`#${id}-toggle`)).toHaveAttribute('aria-pressed', 'false');
  }
  expect((await regions()).every(region => !region.visible)).toBe(true);
  for (const counts of [[1200, 1800], [600, 900], [1900, 3600]]) {
    await page.locator('#quality-button').click();
    expect((await regions()).map(region => region.count)).toEqual(counts);
    expect((await regions()).every(region => !region.visible)).toBe(true);
  }
  // Toggle only affects background particles, not independent dwarf planets.
  for (const id of ['ceres', 'pluto']) {
    await page.locator('#object-select').selectOption(id);
    await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
    await page.locator('#close-info').click();
    const point = await page.evaluate(id => window.__observer.project(id), id);
    await page.mouse.click(point.x, point.y);
    expect((await page.evaluate(() => window.__observer.snapshot())).selected).toBe(id);
    await expect(page.locator('#info-panel')).toHaveAttribute('aria-hidden', 'false');
  }
  for (const id of ['asteroid-belt', 'kuiper-belt']) await page.locator(`#${id}-toggle`).click();
  expect((await regions()).every(region => region.visible)).toBe(true);
  await page.locator('#time-toggle').click();
  await expect.poll(regions).not.toEqual(paused);
  const resources = await page.evaluate(() => window.__observer.resources());
  for (let index = 0; index < 6; index++) await page.locator('#kuiper-belt-toggle').click();
  expect(await page.evaluate(() => window.__observer.resources())).toEqual(resources);
  const geometry = await page.locator('.time-dock').boundingBox();
  expect(geometry.x).toBeGreaterThanOrEqual(0);
  expect(geometry.x + geometry.width).toBeLessThanOrEqual(page.viewportSize().width);
  await page.screenshot({ path: testInfo.outputPath('regions-ui.png') });
  expect(errors).toEqual([]);
});
