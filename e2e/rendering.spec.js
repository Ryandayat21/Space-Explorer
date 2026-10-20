import { test, expect, chooseObject } from './fixtures.js';

test('rendering preserves quality caps across DPR changes and resize', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#time-toggle').click();
  while (await page.locator('#quality-button').getAttribute('data-quality') !== 'high') await page.locator('#quality-button').click();
  await page.evaluate(() => Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 }));
  for (const [quality, cap] of [['high', 1.75], ['medium', 1.25], ['low', .85]]) {
    if (quality !== 'high') await page.locator('#quality-button').click();
    for (const size of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(size);
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      const state = await page.evaluate(() => window.__observer.rendering());
      expect(state.pixelRatio).toBe(cap);
      expect(state.aspect).toBeCloseTo(size.width / size.height);
      expect(state.colorSpace).toBe('srgb');
      expect(state.exposure).toBe(1);
      expect(await page.locator('#space-canvas').evaluate(canvas => [canvas.width, canvas.height]))
        .toEqual([Math.floor(size.width * cap), Math.floor(size.height * cap)]);
    }
  }
  await page.locator('#quality-button').click();
  await page.evaluate(() => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 });
    window.dispatchEvent(new Event('resize'));
  });
  expect((await page.evaluate(() => window.__observer.rendering())).pixelRatio).toBe(1);
  for (const id of ['sun', 'earth', 'saturn']) {
    await chooseObject(page, id);
    await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`${id}.png`) });
  }
});
