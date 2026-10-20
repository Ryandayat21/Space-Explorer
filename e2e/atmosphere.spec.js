import { test, expect, chooseObject } from './fixtures.js';

test('rim shaders compile, follow parents, release resources and preserve picking', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  const result = await page.evaluate(async () => {
    const THREE = await import('/e2e/browserThree.js');
    const { SolarSystem } = await import('/src/core/SolarSystem.js');
    const scene = new THREE.Scene(), system = new SolarSystem(scene);
    const renderer = new THREE.WebGLRenderer(); renderer.setSize(64, 64);
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 2200);
    const results = [];
    for (const id of ['sun', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) {
      const object = system.getObject(id);
      const effect = object.group.getObjectByName(id === 'sun' ? 'solar-corona' : 'atmosphere-rim');
      camera.position.copy(system.getWorldPosition(id)).add(new THREE.Vector3(0, 0, object.radius * 5));
      camera.lookAt(system.getWorldPosition(id));
      renderer.render(scene, camera); renderer.render(scene, camera);
      system.update(.01);
      results.push(effect.material.isRawShaderMaterial &&
        effect.getWorldPosition(new THREE.Vector3()).distanceTo(system.getWorldPosition(id)) < 1e-7);
    }
    system.setQuality('low'); const low = system.effects.every(effect => !effect.visible);
    system.setQuality('high'); const high = system.effects.every(effect => effect.visible);
    const earth = system.getObject('earth');
    const effect = earth.group.getObjectByName('atmosphere-rim');
    const hits = []; effect.raycast(new THREE.Raycaster(), hits);
    let disposed = 0; effect.material.addEventListener('dispose', () => disposed++);
    system.dispose(); renderer.dispose(); renderer.forceContextLoss();
    return { results, low, high, hits: hits.length, disposed };
  });
  expect(result.results.every(Boolean)).toBe(true);
  expect(result.low && result.high).toBe(true);
  expect(result.hits).toBe(0); expect(result.disposed).toBe(1);
  await page.locator('#time-toggle').click();
  for (const id of ['earth', 'sun', 'jupiter', 'moon']) {
    await chooseObject(page, id);
    await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
    await page.locator('#close-info').click();
    const point = await page.evaluate(id => window.__observer.project(id), id);
    await page.mouse.click(point.x, point.y);
    expect(await page.evaluate(() => window.__observer.snapshot().selected)).toBe(id);
    await page.screenshot({ path: testInfo.outputPath(`${id}.png`) });
  }
});
