import { test, expect, chooseObject } from './fixtures.js';
async function ready(page) { await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/); expect(await page.evaluate(() => '__observer' in window)).toBe(false); }
async function switchMode(page) { await page.locator('#mode-toggle').click(); await expect(page.locator('#mode-transition')).toBeHidden(); }

test('production discovery, tours, flight, quality, bookmarks and comparison', async ({ page }, info) => {
  const failures = [];
  page.on('requestfailed', request => failures.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page);
  const input = page.locator('#search-input');
  await input.fill('zzzzzzzz'); await expect(page.locator('#search-results')).toContainText('Objek tidak ditemukan');
  await input.fill('earth'); await input.press('ArrowDown'); await input.press('Enter');
  await expect(page.locator('#object-name')).toHaveText('Bumi');
  await page.locator('#bookmark-button').click(); await expect(page.locator('#bookmark-button')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#compare-button').click(); await page.locator('#compare-second').selectOption('jupiter');
  await expect(page.locator('#comparison-table')).toContainText('142.984'); await page.keyboard.press('Escape');
  await page.locator('#favorites-button').click(); await expect(page.locator('#favorites-dialog')).toContainText('Bumi'); await page.keyboard.press('Escape');
  await page.locator('#close-info').click();
  await input.fill(''); await input.pressSequentially('ghlp');
  await expect(page.locator('body')).not.toHaveClass(/hud-hidden/); await expect(page.locator('#tour-panel')).toBeHidden();
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false); await input.press('Escape'); await input.blur();
  for (let i = 0; i < 3; i++) await page.locator('#quality-button').click();
  await expect(page.locator('#quality-button')).toContainText('Medium');
  await page.locator('#tour-button').click(); await expect(page.locator('#tour-panel')).toBeVisible();
  await page.locator('#tour-pause').click(); await page.locator('#tour-pause').click(); await page.locator('#tour-next').click(); await page.locator('#tour-exit').click();
  await page.locator('#flight-button').click(); await expect.poll(() => page.evaluate(() => !!document.pointerLockElement)).toBe(true);
  await page.keyboard.down('w'); await page.waitForTimeout(150); await page.keyboard.up('w'); await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => !!document.pointerLockElement)).toBe(false);
  for (let i = 0; i < 5; i++) await switchMode(page);
  await expect(page.locator('#galaxy-placeholder')).toBeVisible();
  await chooseObject(page, 'sirius'); await expect(page.locator('#landmark-title')).toHaveText('Sirius');
  await expect(page.locator('[data-landmark="sirius"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#galaxy-landmark-panel')).toContainText('Sources');
  await page.screenshot({ path: info.outputPath('galaxy-panel.png') }); await page.keyboard.press('Escape');
  await page.locator('#tour-button').click(); const tour = page.locator('#galaxy-tour-panel');
  await expect(tour.locator('[data-narration]')).toBeVisible();
  await tour.locator('[data-action="pause"]').click(); await expect(tour.locator('[data-action="pause"]')).toHaveText('Resume');
  await tour.locator('[data-action="pause"]').click(); await expect(tour.locator('[data-narration]')).toBeVisible();
  await tour.locator('[data-action="minimize"]').click(); await expect(tour.locator('[data-narration]')).toBeHidden();
  await tour.locator('[data-action="minimize"]').click(); await expect(tour.locator('[data-narration]')).toBeVisible();
  await tour.locator('[data-action="next"]').click(); await expect(tour.locator('[data-narration]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('galaxy-tour.png') }); await tour.locator('[data-action="exit"]').click();
  await page.locator('#galaxy-flight').click(); await expect.poll(() => page.evaluate(() => !!document.pointerLockElement)).toBe(true);
  await page.keyboard.press('Escape'); await page.locator('#galaxy-reset').click();
  await page.locator('#fullscreen-button').click(); await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.locator('#hud-button').click(); await expect(page.locator('body')).toHaveClass(/hud-hidden/); await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/hud-hidden/); await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  expect(failures).toEqual([]);
});

test('production fallback, corrupt and denied localStorage', async ({ page }) => {
  await page.route('**/textures/*.jpg', route => route.fulfill({ contentType: 'image/jpeg', body: 'invalid image' }));
  await page.addInitScript(() => { for (const key of ['quality', 'audio', 'favorites']) localStorage.setItem(`milky-way-observer.${key}.v1`, '{invalid'); });
  await ready(page); await expect(page.locator('#app-status')).toContainText('procedural');
  await chooseObject(page, 'earth'); await expect(page.locator('#object-name')).toHaveText('Bumi');
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Denied for test'); } }));
  await ready(page); await chooseObject(page, 'earth'); await page.locator('#bookmark-button').click();
  await expect(page.locator('#bookmark-status')).toContainText('sesi ini');
  await switchMode(page); await expect(page.locator('#galaxy-placeholder')).toBeVisible();
});

test('production audio opt-in, preferences and visibility lifecycle', async ({ page }) => {
  let requests = 0; page.on('request', request => { if (request.url().includes('.mp3')) requests++; });
  await page.addInitScript(() => { const Original = Audio; window.Audio = class extends Original { constructor(...args) { super(...args); window.testAudio = this; } }; });
  await ready(page); expect(requests).toBe(0);
  await page.locator('#audio-settings').click(); await page.locator('#audio-play').click();
  await expect(page.locator('#audio-status')).toContainText('Ambience aktif');
  await page.locator('#audio-volume').fill('12'); await page.locator('#audio-mute').click();
  await expect.poll(() => page.evaluate(() => window.testAudio.volume)).toBe(0);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  expect(await page.evaluate(() => window.testAudio.paused)).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('#audio-status')).toContainText('Ambience aktif');
  await page.locator('#audio-play').click(); await expect.poll(() => page.evaluate(() => window.testAudio.paused)).toBe(true);
  await page.reload(); await expect(page.locator('#loading-screen')).toHaveClass(/done/); await page.locator('#audio-settings').click();
  await expect(page.locator('#audio-volume')).toHaveValue('12'); await expect(page.locator('#audio-mute')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.testAudio.paused)).toBe(true);
});

test('zoom-equivalent reflow keeps key controls reachable', async ({ page }, info) => {
  const original = page.viewportSize();
  await page.setViewportSize({ width: Math.floor(original.width / 2), height: Math.floor(original.height / 2) });
  await ready(page);
  await expect(page.locator('#tour-button')).toBeVisible(); await expect(page.locator('#quality-button')).toBeVisible();
  await page.locator('#quality-button').click();
  await chooseObject(page, 'earth'); await expect(page.locator('#info-panel')).toBeVisible();
  await page.locator('#close-info').click(); await switchMode(page);
  await page.locator('#galaxy-reset').click(); await page.locator('#tour-button').click();
  const tour = page.locator('#galaxy-tour-panel'); await expect(tour.locator('[data-narration]')).toBeVisible();
  const box = await tour.boundingBox();
  for (const selector of ['#mode-toggle', '#hud-button', '#galaxy-placeholder']) {
    const other = await page.locator(selector).boundingBox();
    expect(box.x >= other.x + other.width || box.x + box.width <= other.x || box.y >= other.y + other.height || box.y + box.height <= other.y).toBe(true);
  }
  await page.screenshot({ path: info.outputPath('reflow-tour.png') });
  await tour.locator('[data-action="pause"]').click(); await tour.locator('[data-action="minimize"]').click();
  await tour.locator('[data-action="minimize"]').click(); await tour.locator('[data-action="exit"]').click();
  await page.screenshot({ path: info.outputPath('reflow-half-viewport.png') });
});
