import { chromium } from '@playwright/test';
import { createServer, preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const report = { date: '2026-10-19 Asia/Jakarta', scope: 'Short controlled mode-switch audit, not a long-session leak proof', runs: [] };
const server = await createServer({ server: { host: '127.0.0.1', port: 5180, strictPort: true } });
await server.listen();
try {
  for (const channel of ['msedge', 'chrome']) {
    const browser = await chromium.launch({ channel, headless: true });
    try {
      const page = await browser.newPage({ viewport: channel === 'msedge' ? {width:1366,height:768} : {width:1920,height:1080}, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (['warning','error'].includes(m.type())) errors.push(m.text()); });
      await page.addInitScript(() => {
        const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window), pending = new Set();
        window.requestAnimationFrame = callback => { let id = request(now => { pending.delete(id); callback(now); }); pending.add(id); return id; };
        window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
        window.pendingFrames = () => pending.size;
      });
      await page.goto('http://127.0.0.1:5180'); await page.waitForFunction(() => document.querySelector('#loading-screen').classList.contains('done'));
      const cdp = await page.context().newCDPSession(page), samples = [];
      const toggle = async () => { await page.locator('#mode-toggle').click(); await page.waitForFunction(() => !window.__observer.mode().transitioning); };
      for (let cycle = 0; cycle < 30; cycle++) {
        await toggle();
        await page.locator('#tour-button').click(); await page.locator('#galaxy-tour-panel [data-action="exit"]').click();
        await page.locator('#search-input').fill('Sirius'); await page.locator('#search-input').press('Enter');
        await page.waitForFunction(() => !window.__observer.galaxyCamera().tween); await page.keyboard.press('Escape');
        await cdp.send('HeapProfiler.collectGarbage');
        samples.push({ cycle, heap: (await cdp.send('Runtime.getHeapUsage')).usedSize,
          dom: await cdp.send('Memory.getDOMCounters'), stats: await page.evaluate(() => window.__observer.performance()),
          pendingRAF: await page.evaluate(() => window.pendingFrames()) });
        await toggle();
      }
      const stable = samples.slice(2), baseline = stable[0];
      for (const sample of stable) {
        assert.equal(sample.pendingRAF, 1);
        assert.equal(sample.dom.jsEventListeners, baseline.dom.jsEventListeners);
        assert.equal(sample.stats.residentGeometries, baseline.stats.residentGeometries);
        assert.equal(sample.stats.residentTextures, baseline.stats.residentTextures);
      }
      assert.deepEqual(errors, []);
      report.runs.push({ channel, version: browser.version(), samples, errors });
      console.log(channel, JSON.stringify({ samples: stable.length, listeners: baseline.dom.jsEventListeners, geometry: baseline.stats.residentGeometries, textures: baseline.stats.residentTextures, heaps: stable.map(x => x.heap), pendingRAF: 1 }));
    } finally { await browser.close(); }
  }
} finally { await server.close(); }
const production = await preview({ preview: { host: '127.0.0.1', port: 5181, strictPort: true } });
try {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion:'reduce' }); const errors=[];
    page.on('pageerror', e=>errors.push(e.message)); page.on('console', m=>{ if(['warning','error'].includes(m.type())) errors.push(m.text()); });
    await page.goto('http://127.0.0.1:5181/?debug'); await page.waitForFunction(()=>document.querySelector('#loading-screen').classList.contains('done'));
    assert.equal(await page.evaluate(()=>typeof window.__observer), 'undefined'); assert.equal(await page.locator('#debug-fps').count(),0);
    await page.locator('#mode-toggle').click(); await page.locator('#galaxy-placeholder').waitFor({state:'visible'}); await page.locator('#mode-transition').waitFor({state:'hidden'});
    await page.locator('#search-input').fill('Sirius'); await page.locator('#search-input').press('Enter'); await page.locator('#galaxy-landmark-panel').waitFor({state:'visible'});
    assert.equal(await page.locator('#galaxy-landmark-panel h2').textContent(), 'Sirius');
    await page.locator('#tour-button').click(); await page.locator('#galaxy-tour-panel').waitFor({state:'visible'}); await page.keyboard.press('Escape');
    await page.locator('#mode-toggle').click(); await page.locator('#mode-transition').waitFor({state:'hidden'});
    await page.locator('#search-input').fill('earth'); await page.locator('#search-input').press('Enter'); assert.equal(await page.locator('#object-name').textContent(),'Bumi');
    assert.deepEqual(errors,[]); report.production = { passed:true, errors, diagnosticsAbsent:true };
  } finally { await browser.close(); }
} finally { await new Promise(resolve=>production.httpServer.close(resolve)); }
await mkdir('docs/benchmarks',{recursive:true}); await writeFile('docs/benchmarks/phase-5-finalization.json', JSON.stringify(report,null,2)+'\n');
console.log('Audit and production smoke passed');
