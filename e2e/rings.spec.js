import { test, expect } from './fixtures.js';

test('planet rings follow the scene, remain pick-through and release resources', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  const checks = await page.evaluate(async () => {
    const THREE = await import('/e2e/browserThree.js');
    const { SolarSystem } = await import('/src/core/SolarSystem.js');
    const scene = new THREE.Scene();
    const system = new SolarSystem(scene);
    const results = [];
    let disposals = 0;
    for (const id of ['saturn', 'uranus']) {
      const object = system.getObject(id);
      const ring = object.mesh.getObjectByName(`${id}-rings`);
      for (const resource of [ring.geometry, ring.material, ring.material.map]) resource.addEventListener('dispose', () => disposals++);
      const start = ring.getWorldQuaternion(new THREE.Quaternion());
      system.update(.01);
      const spun = start.angleTo(ring.getWorldQuaternion(new THREE.Quaternion())) > .001;
      const paused = ring.getWorldQuaternion(new THREE.Quaternion());
      system.update(0);
      const same = paused.angleTo(ring.getWorldQuaternion(new THREE.Quaternion())) < 1e-7;
      results.push({ id, spun, same, parent: ring.parent === object.mesh,
        pickable: system.pickables.includes(ring),
        aligned: ring.getWorldPosition(new THREE.Vector3()).distanceTo(system.getWorldPosition(id)) < 1e-8 });
    }
    system.dispose();
    return { results, disposals };
  });
  expect(checks.disposals).toBe(6);
  for (const check of checks.results) {
    expect(check.spun && check.same && check.parent && check.aligned).toBe(true);
    expect(check.pickable).toBe(false);
  }
  await page.locator('#time-toggle').click();
  for (const id of ['saturn', 'uranus']) {
    await page.locator('#object-select').selectOption(id);
    await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
    await page.locator('#close-info').click();
    const point = await page.evaluate(id => window.__observer.project(id), id);
    await page.mouse.click(point.x, point.y);
    await expect(page.locator('#info-panel')).toHaveAttribute('aria-hidden', 'false');
    expect(await page.evaluate(() => window.__observer.snapshot().selected)).toBe(id);
    await page.screenshot({ path: testInfo.outputPath(`${id}-rings.png`) });
  }
  expect(errors).toEqual([]);
});
