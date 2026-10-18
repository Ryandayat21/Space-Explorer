import { test, expect } from './fixtures.js';
test('mode switching isolates selection, input, time, resources and audio', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#object-select').selectOption('earth');
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
  await page.locator('#time-toggle').click();
  const before = await page.evaluate(() => window.__observer.snapshot());
  await page.evaluate(async () => {
    const { getAudioManager } = await import('/src/core/AudioManager.js'); window.testAudio = getAudioManager();
  });
  await page.locator('#mode-toggle').click();
  await expect(page.locator('#galaxy-placeholder')).toBeVisible();
  expect(await page.evaluate(() => window.__observer.mode().sceneObjects)).toBe(2);
  expect(await page.evaluate(() => window.__observer.mode().galaxyParticles)).toBe(30240);
  const days = await page.evaluate(() => window.__observer.elapsedDays());
  await page.keyboard.press('g'); await page.keyboard.press('p'); await page.keyboard.press('f');
  await page.mouse.click(800, 550);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__observer.elapsedDays())).toBe(days);
  expect(await page.evaluate(() => window.__observer.snapshot().selected)).toBeUndefined();
  await expect(page.locator('#object-select')).toBeDisabled();
  await expect(page.locator('#tour-panel')).toBeHidden();
  await page.setViewportSize({ width: 1500, height: 850 });
  await expect.poll(() => page.evaluate(() => window.__observer.mode().aspect)).toBeCloseTo(1500/850);
  await page.locator('#mode-toggle').click();
  await expect(page.locator('#object-select')).toBeEnabled();
  const restoredCamera = await page.evaluate(() => window.__observer.snapshot().camera);
  restoredCamera.forEach((value, axis) => expect(value).toBeCloseTo(before.camera[axis], 10));
  expect(await page.evaluate(async () => {
    const { getAudioManager } = await import('/src/core/AudioManager.js'); return window.testAudio === getAudioManager();
  })).toBe(true);
  const resources = await page.evaluate(() => window.__observer.resources());
  for (let i = 0; i < 3; i++) { await page.locator('#mode-toggle').click(); await page.locator('#mode-toggle').click(); }
  expect(await page.evaluate(() => window.__observer.resources())).toEqual(resources);
  await page.locator('#tour-button').click(); await page.locator('#mode-toggle').click();
  expect(await page.evaluate(() => window.__observer.snapshot().tourActive)).toBe(false);
  await page.locator('#mode-toggle').click();
  await page.locator('#flight-button').click();
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().pointerLocked)).toBe(true);
  await page.keyboard.press('Escape'); await page.locator('#mode-toggle').click();
  expect(await page.evaluate(() => window.__observer.snapshot().flight)).toBe(false);
  await page.locator('#mode-toggle').click();
  await page.locator('#search-input').fill('pluto'); await page.locator('#search-input').press('Enter');
  await expect(page.locator('#object-name')).toHaveText('Pluto');
});
