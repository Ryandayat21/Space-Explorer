import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';

// Opt-in benchmark, separate from correctness tests. Headless results are
// comparable on this machine, not a promise about users' GPU performance.
const server = await createServer({ server: { host: '127.0.0.1', port: 5175 } });
const results = { date: new Date().toISOString(), platform: `${os.platform()} ${os.release()}`,
  cpu: os.cpus()[0]?.model, node: process.version, runs: [] };
await server.listen();
try {
  for (const [channel, width, height] of [['msedge', 1366, 768], ['chrome', 1920, 1080]]) {
    const browser = await chromium.launch({ channel, headless: true });
    try {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(server.resolvedUrls.local[0]);
      await page.locator('#loading-screen.done').waitFor();
      await page.locator('#time-toggle').click();
      const cdp = await page.context().newCDPSession(page);
      const measure = async () => {
        await cdp.send('HeapProfiler.collectGarbage');
        return { heap: await cdp.send('Runtime.getHeapUsage'),
          resources: await page.evaluate(() => window.__observer.resources()),
          gpuResources: await page.evaluate(() => window.__observer.snapshot().memory) };
      };
      const cycle = async () => {
        for (const id of ['earth', 'jupiter', 'pluto']) {
          await page.locator('#object-select').selectOption(id);
          await page.waitForFunction(() => !window.__observer.snapshot().tween);
        }
        await page.locator('#tour-button').click();
        for (let step = 0; step < 10; step++) await page.locator('#tour-next').click();
        await page.locator('#tour-panel').waitFor({ state: 'hidden' });
        for (let repeat = 0; repeat < 2; repeat++) {
          await page.locator('#asteroid-belt-toggle').click();
          await page.locator('#kuiper-belt-toggle').click();
        }
      };
      await cycle(); await cycle(); // Warm lazy texture loads and renderer caches.
      const samples = [await measure()];
      for (let repeat = 0; repeat < 5; repeat++) { await cycle(); samples.push(await measure()); }
      const frameTimes = [];
      // Fixed Sun view and paused simulation make quality samples comparable.
      await page.locator('#object-select').selectOption('sun');
      await page.waitForFunction(() => !window.__observer.snapshot().tween);
      await page.locator('#close-info').click();
      for (const quality of ['high', 'medium', 'low']) {
        if (quality !== 'high') await page.locator('#quality-button').click();
        const frames = await page.evaluate(() => new Promise(resolve => {
          const values = []; let previous; let warmup = 30;
          const sample = now => {
            if (previous !== undefined && warmup-- <= 0) values.push(now - previous);
            previous = now;
            if (values.length === 180) resolve(values); else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }));
        frames.sort((a, b) => a - b);
        frameTimes.push({ quality, samples: frames.length, medianMs: frames[89], p95Ms: frames[170],
          maxMs: frames.at(-1), over33ms: frames.filter(value => value > 33.34).length });
      }
      const gpu = await page.evaluate(() => {
        const gl = document.querySelector('canvas').getContext('webgl2');
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'Unavailable';
      });
      const run = { channel, version: browser.version(), width, height, gpu, frameTimes, samples, errors };
      results.runs.push(run);
      console.log(JSON.stringify({ channel, frameTimes, heapBytes: samples.map(s => s.heap.usedSize),
        resources: samples.map(s => s.resources), errors }));
      if (errors.length) process.exitCode = 1;
    } finally { await browser.close(); }
  }
} finally {
  await server.close();
  await mkdir('docs/benchmarks', { recursive: true });
  await writeFile('docs/benchmarks/phase-3-performance.json', JSON.stringify(results, null, 2) + '\n');
}
