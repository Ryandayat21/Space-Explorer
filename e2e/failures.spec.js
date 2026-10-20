import { test, expect } from './fixtures.js';

test('context loss stops RAF and exposes reload even in cinematic mode; restore stays stopped', async ({ page }) => {
  await page.addInitScript(() => {
    const raf = requestAnimationFrame, cancel = cancelAnimationFrame, pending = new Set();
    window.requestAnimationFrame = callback => { const id = raf(time => { pending.delete(id); callback(time); }); pending.add(id); return id; };
    window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
    window.pendingFrames = () => pending.size;
  });
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.keyboard.press('h');
  const available = await page.evaluate(() => {
    const gl = document.getElementById('space-canvas').getContext('webgl2');
    window.lossExtension = gl.getExtension('WEBGL_lose_context');
    window.lossExtension?.loseContext(); return !!window.lossExtension;
  });
  expect(available).toBe(true);
  await expect(page.locator('#loading-detail')).toContainText('Konteks grafis terputus');
  await expect(page.locator('#loading-reload')).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.pendingFrames())).toBe(0);
  await page.evaluate(() => window.lossExtension.restoreContext());
  await expect(page.locator('#loading-detail')).toContainText('scene belum dipulihkan');
  expect(await page.evaluate(() => window.pendingFrames())).toBe(0);
  await page.locator('#loading-reload').click();
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
});

test('context failure during mode preparation unlocks fatal recovery', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.evaluate(() => {
    document.getElementById('mode-toggle').click();
    document.getElementById('space-canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  });
  await expect(page.locator('#loading-reload')).toBeFocused();
  await expect(page.locator('#loading-screen')).toBeVisible();
  await expect(page.locator('#mode-transition')).toBeHidden();
  expect(await page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
});

// This fault intentionally makes Three.js log its renderer-construction error.
// Audit it explicitly rather than disabling the console audit for ordinary cases.
import { test as faultTest } from '@playwright/test';
faultTest('renderer construction failure displays HTML recovery', async ({ page }) => {
  const errors = [], diagnostics = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (['warning', 'error'].includes(message.type())) errors.push(message.text());
    if (message.text().includes('[Milky Way Observer: startup]')) diagnostics.push(message.text());
  });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (this.id === 'space-canvas' && args[0] === 'webgl2') throw new Error('Injected renderer failure');
      return original.apply(this, args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#loading-detail')).toContainText('renderer grafis tidak tersedia');
  await expect(page.locator('#loading-screen')).toContainText('MILKY WAY OBSERVER');
  await expect(page.locator('#loading-reload')).toBeFocused();
  expect(errors).toEqual(['THREE.WebGLRenderer: Injected renderer failure']);
  expect(diagnostics).toHaveLength(1);
});
