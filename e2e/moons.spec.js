import { test, expect } from '@playwright/test';
import { moons } from '../src/data/celestialBodies.js';
import { moonScience } from '../src/data/moonScience.js';

test('major moons are searchable, have sourced panels, and can be clicked after visiting', async ({ page }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#time-toggle').click();
  await page.locator('[data-filter="moon"]').click();
  for (const id of Object.keys(moonScience)) {
    const moon = moons.find(body => body.id === id);
    await page.locator('#search-input').fill(moon.name);
    await page.locator('#object-select').selectOption(id);
    await expect(page.locator('#object-name')).toHaveText(moon.name);
    await expect(page.locator('#object-type')).toHaveText('SATELIT ALAMI');
    await expect(page.locator('#object-fact')).toHaveText(moonScience[id].fact);
    await expect(page.locator('#object-stats')).toContainText('dari pusat');
    await expect(page.locator('#object-stats')).toContainText('GM/R²');
    expect(await page.locator('#object-sources a').count()).toBeGreaterThanOrEqual(3);
    await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
    await page.locator('#close-info').click();
    const point = await page.evaluate(id => window.__observer.project(id), id);
    await page.mouse.click(point.x, point.y);
    await expect(page.locator('#info-panel')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#object-name')).toHaveText(moon.name);
  }
  expect(errors).toEqual([]);
});

test('all moon materials remain usable without external textures; Moon decode failure retains fallback', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  const result = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { SolarSystem } = await import('/src/core/SolarSystem.js');
    const { moons } = await import('/src/data/celestialBodies.js');
    const system = new SolarSystem(new THREE.Scene());
    const checks = moons.map(moon => {
      const object = system.getObject(moon.id);
      return { id: moon.id, parent: object.parentObject.data.id, hasMap: object.mesh.material.map.isCanvasTexture,
        pickable: system.pickables.some(mesh => mesh.userData.bodyId === moon.id) };
    });
    const object = system.getObject('moon');
    const fallback = object.mesh.material.map;
    // Inject the same failure callback invoked by TextureLoader for missing/invalid images.
    let requests = 0;
    system.textureLoader.load = (url, onLoad, progress, onError) => { requests++; queueMicrotask(onError); };
    const loaded = await system.loadTexture('moon');
    await system.loadTexture('moon');
    const kept = object.mesh.material.map === fallback && fallback.image.width > 0;
    system.update(1);
    const finite = moons.every(moon => system.getWorldPosition(moon.id).toArray().every(Number.isFinite));
    system.dispose();
    return { checks, loaded, requests, kept, finite };
  });
  expect(result.checks).toHaveLength(22);
  for (const item of result.checks) {
    expect(item.parent).toBe(moons.find(moon => moon.id === item.id).parent);
    expect(item.hasMap && item.pickable).toBe(true);
  }
  expect(result.loaded).toBe(false);
  expect(result.requests).toBe(1);
  expect(result.kept && result.finite).toBe(true);
  expect(errors).toEqual([]);
});
