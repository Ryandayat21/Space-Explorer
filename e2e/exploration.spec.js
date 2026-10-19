import { test, expect } from './fixtures.js';

const key = 'milky-way-observer.favorites.v1';
async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
}
async function earth(page) {
  await page.locator('#object-select').selectOption('earth');
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
}

test('bookmarks persist, favorites are keyboard accessible and removable', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await ready(page); await earth(page);
  await page.locator('#bookmark-button').focus(); await page.keyboard.press('Space');
  await expect(page.locator('#bookmark-button')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).toEqual(['earth']);
  await page.reload(); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#favorites-button').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#favorites-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Kunjungi Bumi', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#object-name')).toHaveText('Bumi');
  await expect(page.locator('#bookmark-button')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#favorites-button').click();
  await page.getByRole('button', { name: 'Hapus Bumi dari favorit' }).focus(); await page.keyboard.press('Space');
  await expect(page.locator('#favorites-empty')).toBeVisible();
  await expect(page.locator('#close-favorites')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#favorites-button')).toBeFocused();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).toEqual([]);
  expect(errors).toEqual([]);
});

test('comparison is limited to two scientific records and does not change scene or camera', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await ready(page); await earth(page); await page.locator('#time-toggle').click();
  const snapshot = () => page.evaluate(() => {
    const state = window.__observer.snapshot();
    return { camera: state.camera, target: state.target, selected: state.selected, followed: state.followed,
      days: window.__observer.elapsedDays(), resources: window.__observer.resources(), tourActive: state.tourActive };
  });
  const before = await snapshot();
  await page.locator('#compare-button').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#comparison-dialog')).toBeVisible();
  await page.keyboard.press('f'); await page.keyboard.press('g'); await page.keyboard.press('h');
  await page.locator('#compare-second').selectOption('jupiter');
  await expect(page.locator('#comparison-table')).toContainText('142.984 km');
  await expect(page.locator('#comparison-table thead th')).toHaveCount(3);
  await expect(page.locator('#compare-second option[value="earth"]')).toHaveJSProperty('disabled', true);
  const sizes = await page.locator('.comparison-circle').evaluateAll(nodes => nodes.map(node => parseFloat(node.style.width)));
  expect(sizes[0] / sizes[1]).toBeCloseTo(12756 / 142984, 6);
  await page.screenshot({ path: testInfo.outputPath('comparison.png') });
  await page.locator('#compare-first').selectOption('moon');
  await expect(page.locator('#comparison-table')).toContainText('jarak katalog bulan');
  await page.keyboard.press('Escape');
  await expect(page.locator('#compare-button')).toBeFocused();
  const after = await snapshot();
  // OrbitControls can introduce floating-point roundoff while the camera is idle.
  for (const key of ['camera', 'target']) {
    after[key].forEach((value, index) => expect(value).toBeCloseTo(before[key][index], 10));
  }
  expect({ ...after, camera: before.camera, target: before.target }).toEqual(before);
  await page.locator('#favorites-button').click(); await page.locator('#favorites-compare').click();
  await expect(page.locator('#comparison-empty')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#favorites-button')).toBeFocused();
  expect(errors).toEqual([]);
});

test('corrupt and denied storage cannot crash the application', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(key => { try { localStorage.setItem(key, '{broken'); } catch {} }, key);
  await ready(page); await page.locator('#favorites-button').click();
  await expect(page.locator('#favorites-empty')).toBeVisible();
  await expect(page.locator('#favorites-status')).not.toBeEmpty();
  await page.keyboard.press('Escape'); await earth(page);
  await page.locator('#bookmark-button').click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).toEqual(['earth']);
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } }));
  await ready(page); await earth(page); await page.locator('#bookmark-button').click();
  await expect(page.locator('#bookmark-button')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#bookmark-status')).toContainText('sesi ini');
  expect(errors).toEqual([]);
});
