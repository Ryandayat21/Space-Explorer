import { test, expect } from './fixtures.js';

test('quality persists, corrupt storage recovers and geometry is disposed without rebuilding objects', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await expect(page.locator('#quality-button')).toHaveText('Kualitas: Medium');
  await expect(page.locator('#debug-fps')).toHaveCount(0);
  await page.locator('#quality-button').click();
  await page.reload(); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  expect((await page.evaluate(() => window.__observer.rendering())).quality).toBe('low');
  await page.evaluate(() => localStorage.setItem('milky-way-observer.quality.v1', '{broken'));
  await page.reload(); await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await expect(page.locator('#quality-button')).toHaveText('Kualitas: Medium');
  const checks = await page.evaluate(async () => {
    const THREE = await import('/e2e/browserThree.js');
    const { SolarSystem } = await import('/src/core/SolarSystem.js');
    const system = new SolarSystem(new THREE.Scene());
    const earth = system.getObject('earth'), mesh = earth.mesh, material = mesh.material;
    let disposed = 0; mesh.geometry.addEventListener('dispose', () => disposed++);
    system.setQuality('low'); const low = mesh.geometry.attributes.position.count;
    const same = mesh.geometry; system.setQuality('low');
    const reused = same === mesh.geometry;
    mesh.geometry.addEventListener('dispose', () => disposed++);
    system.setQuality('high'); const high = mesh.geometry.attributes.position.count;
    const identity = earth.mesh === mesh && mesh.material === material;
    system.dispose(); return { disposed, low, high, reused, identity };
  });
  expect(checks.disposed).toBe(2); expect(checks.high).toBeGreaterThan(checks.low);
  expect(checks.reused && checks.identity).toBe(true);
  await page.goto('/?debug');
  await expect(page.locator('#debug-fps')).toContainText('FPS');
});
