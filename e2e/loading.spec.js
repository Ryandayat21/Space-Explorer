import { test, expect } from './fixtures.js';

test('startup stages, optional Sun deadline and opt-in audio do not create extra loops', async ({ page }) => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let audioRequests = 0;
  page.on('request', request => { if (request.url().includes('/audio/') && request.url().includes('.mp3')) audioRequests++; });
  await page.addInitScript(() => {
    window.loadingStagesSeen = [];
    new MutationObserver(() => { const stage = document.querySelector('#loading-screen')?.dataset.stage; if (stage && window.loadingStagesSeen.at(-1) !== stage) window.loadingStagesSeen.push(stage); }).observe(document, { subtree: true, attributes: true, childList: true, attributeFilter: ['data-stage'] });
    const original = requestAnimationFrame, cancel = cancelAnimationFrame, pending = new Set();
    window.requestAnimationFrame = callback => { const id = original(time => { pending.delete(id); callback(time); }); pending.add(id); return id; };
    window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
    window.pendingLoadingFrames = () => pending.size;
  });
  await page.route('**/textures/sun.jpg', async route => { await held; await route.fulfill({ status: 200, contentType: 'image/jpeg', body: 'invalid-image' }); });
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveAttribute('data-stage', 'assets');
  await expect(page.locator('#loading-detail')).toContainText('opsional');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/, { timeout: 12000 });
  await expect(page.locator('#app-status')).toContainText('procedural');
  const stages = await page.evaluate(() => window.loadingStagesSeen);
  for (const stage of ['initializing', 'assets', 'scene', 'ready']) expect(stages).toContain(stage);
  expect(audioRequests).toBe(0);
  release(); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await expect.poll(() => page.evaluate(() => window.pendingLoadingFrames())).toBe(1);
  await page.locator('#mode-toggle').click(); await expect.poll(() => page.evaluate(() => window.__observer.mode().transitioning)).toBe(false);
  await expect(page.locator('#galaxy-placeholder')).toBeVisible(); expect(audioRequests).toBe(0);
  expect(await page.evaluate(() => window.pendingLoadingFrames())).toBe(1);
});

test('required application module failure offers a full reload, never retry initialization', async ({ page }) => {
  await page.route('**/src/main.js', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: 'throw new Error("Injected module failure")' }));
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveAttribute('data-stage', 'error');
  await expect(page.locator('#loading-detail')).toContainText('gagal');
  await expect(page.getByRole('link', { name: 'Muat Ulang', exact: true })).toBeFocused();
  expect(await page.evaluate(() => typeof window.__observer)).toBe('undefined');
  await page.unroute('**/src/main.js');
  await page.getByRole('link', { name: 'Muat Ulang', exact: true }).click();
  await expect(page.locator('#loading-screen')).toHaveClass(/done/, { timeout: 12000 });
});

test('unsupported WebGL is explained and optional audio initialization cannot block startup', async ({ page }) => {
  await page.addInitScript(() => { window.Audio = class { constructor() { throw new Error('Audio unavailable'); } }; });
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/, { timeout: 12000 });
  await expect(page.locator('#audio-play')).toBeDisabled(); await expect(page.locator('#audio-status')).toContainText('unavailable');
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' ? null : get.call(this, type, ...args); };
  });
  await page.reload(); await expect(page.locator('#loading-screen')).toHaveAttribute('data-stage', 'error');
  await expect(page.locator('#loading-detail')).toContainText('WebGL 2 tidak tersedia');
});

test('Galaxy preparation failure retains a rendered source and offers reload', async ({ page }) => {
  await page.route('**/src/modes/GalaxyMode.js', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('initialize() {', 'initialize() { throw new Error("Injected scene failure");');
    await route.fulfill({ response, body });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#mode-toggle').click();
  await expect(page.locator('#loading-screen')).toHaveAttribute('data-stage', 'error');
  await expect(page.locator('#loading-detail')).toContainText('Scene tujuan gagal');
  expect(await page.evaluate(() => window.__observer.mode().id)).toBe('solar-system');
  await expect(page.locator('#loading-reload')).toBeVisible();
});

test('required module watchdog explains a stalled request and ignores late initialization', async ({ page }) => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.addInitScript(() => {
    const timeout = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => timeout(callback, delay === 15000 ? 250 : delay, ...args);
  });
  await page.route('**/src/main.js', async route => { await held; await route.continue(); });
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveAttribute('data-stage', 'error');
  await expect(page.locator('#loading-detail')).toContainText('Modul wajib belum siap');
  release(); await page.waitForTimeout(350);
  expect(await page.evaluate(() => typeof window.__observer)).toBe('undefined');
  await expect(page.locator('#loading-screen')).not.toHaveClass(/done/);
});
