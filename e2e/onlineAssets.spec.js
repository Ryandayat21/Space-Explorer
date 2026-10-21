import { test, expect } from './fixtures.js';
import { readdirSync, readFileSync } from 'node:fs';

// Hosting assertions must not be mistaken for Vite dev-server routing behavior.
test.skip(!process.env.PLAYWRIGHT_BASE_URL?.startsWith('https://'), 'Set an authorized HTTPS deployment URL to run hosting checks.');

test('hosted assets, fresh session and reload', async ({ page }, info) => {
  const failed = [], responses = [], mp3 = [];
  page.on('requestfailed', request => failed.push(request.url()));
  page.on('response', response => { responses.push({ url: response.url(), status: response.status() }); });
  page.on('request', request => { if (request.url().includes('.mp3')) mp3.push(request.url()); });
  await page.goto('/'); await expect(page).toHaveTitle('Milky Way Observer');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  expect(mp3).toHaveLength(0);
  await page.reload(); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  expect(mp3).toHaveLength(0); expect(failed).toEqual([]);
  expect(responses.filter(response => response.status >= 400)).toEqual([]);
  const checks = [];
  for (const name of readdirSync('public/textures').filter(name => name.endsWith('.jpg'))) {
    const response = await page.request.get(`/textures/${name}`);
    checks.push({ path: `/textures/${name}`, status: response.status(), type: response.headers()['content-type'] });
    expect(response.status()).toBe(200); expect(response.headers()['content-type']).toContain('image/jpeg');
    expect((await response.body()).length).toBeGreaterThan(0);
  }
  const audio = await page.request.get('/audio/Interstellar%20Main%20Theme.mp3', { headers: { Range: 'bytes=0-1023' } });
  checks.push({ path: 'audio range', status: audio.status(), type: audio.headers()['content-type'], range: audio.headers()['content-range'] });
  expect(audio.status()).toBe(206); expect(audio.headers()['content-type']).toContain('audio/');
  expect((await audio.body()).length).toBe(1024);
  for (const path of ['/textures/__missing__.jpg', '/assets/__missing__.js', '/audio/__missing__.mp3', '/textures/Sun.jpg']) {
    const response = await page.request.get(path); checks.push({ path, status: response.status() }); expect(response.status()).toBe(404);
  }
  const root = await page.request.get('/');
  const deployedHTML = await root.text();
  const localHTML = readFileSync('dist/index.html', 'utf8');
  const assets = html => [...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(match => match[1]).sort();
  const headers = { root: root.headers()['cache-control'], sun: (await page.request.head('/textures/sun.jpg')).headers()['cache-control'] };
  for (const value of Object.values(headers)) expect(value || '').not.toContain('immutable');
  console.log(JSON.stringify({ checks, headers, deployedEntryAssets: assets(deployedHTML), localEntryAssets: assets(localHTML) }));
  await info.attach('hosted-audit', { body: JSON.stringify({ url: page.url(), checks, headers, pageResponses: responses, deployedEntryAssets: assets(deployedHTML), localEntryAssets: assets(localHTML), entryAssetsMatch: JSON.stringify(assets(deployedHTML)) === JSON.stringify(assets(localHTML)) }, null, 2), contentType: 'application/json' });
});
