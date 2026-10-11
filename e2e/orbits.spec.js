import { test, expect } from '@playwright/test';

test('elliptical scene preserves parents, pause/resume and simulation speed', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  const result = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { SolarSystem } = await import('/src/core/SolarSystem.js');
    const { moons } = await import('/src/data/celestialBodies.js');
    const system = new SolarSystem(new THREE.Scene());
    const snapshot = () => ({
      days: system.elapsedDays,
      positions: [...system.objects.keys()].map(id => system.getWorldPosition(id).toArray()),
      spins: [...system.objects.values()].map(object => object.mesh.rotation.y),
      belt: system.asteroidBelt.rotation.y
    });
    const parentsValid = [...system.objects.values()].every(object => {
      if (object.data.id === 'sun') return true;
      const expected = object.data.type !== 'moon' ? 'sun' : moons.find(moon => moon.id === object.data.id).parent;
      return object.parentObject.data.id === expected && object.motion.frame.parent === object.parentObject.group;
    });
    system.update(15, 15);
    const beforePause = snapshot();
    for (let frame = 0; frame < 20; frame++) system.update(0, 0.05);
    const afterPause = snapshot();
    system.update(5, 0.05);
    const resumed = snapshot();
    // A single 200x step must equal accumulated 1x simulation time.
    system.update(-20);
    system.update(0.05 * 200);
    const fast = snapshot();
    system.update(-10);
    for (let frame = 0; frame < 200; frame++) system.update(0.05);
    const slow = snapshot();
    system.setOrbitsVisible(false);
    const hidden = system.orbits.every(line => !line.visible);
    system.setOrbitsVisible(true);
    const shown = system.orbits.every(line => line.visible);
    system.dispose();
    return { parentsValid, beforePause, afterPause, resumed, fast, slow, hidden, shown, disposed: system.orbitMotions.length === 0 };
  });
  expect(result.parentsValid).toBe(true);
  expect(result.afterPause).toEqual(result.beforePause);
  expect(result.resumed.positions).not.toEqual(result.afterPause.positions);
  expect(result.resumed.days).toBe(20);
  for (let index = 0; index < result.fast.positions.length; index++) {
    for (let axis = 0; axis < 3; axis++) {
      expect(Number.isFinite(result.slow.positions[index][axis])).toBe(true);
      expect(result.fast.positions[index][axis]).toBeCloseTo(result.slow.positions[index][axis], 8);
    }
  }
  expect(result.hidden && result.shown && result.disposed).toBe(true);
  // Check the real UI clock also pauses/resumes object motion.
  await page.locator('#time-toggle').click();
  const paused = await page.evaluate(() => window.__observer.project('mercury'));
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__observer.project('mercury'))).toEqual(paused);
  await page.locator('#time-toggle').click();
  await expect.poll(() => page.evaluate(() => window.__observer.project('mercury'))).not.toEqual(paused);
  await page.locator('#time-speed').fill('4');
  await expect(page.locator('#time-label')).toHaveText('200 hari/detik');
  expect(errors).toEqual([]);
});
