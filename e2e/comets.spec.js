import { test, expect } from './fixtures.js';

test('Halley search, panel, Visit, picking and Follow', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  await page.locator('#time-toggle').click();
  await page.locator('#search-input').fill('1P/Halley');
  await expect(page.locator('#object-select optgroup')).toHaveAttribute('label', 'Komet');
  await page.locator('#search-input').press('Enter');
  await expect(page.locator('#object-type')).toHaveText('KOMET');
  await expect(page.locator('#object-description')).toContainText('0,92');
  await expect(page.locator('#object-stats')).toContainText('76,1');
  await expect(page.locator('#object-sources a')).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().tween)).toBe(false);
  await page.locator('#close-info').click();
  const point = await page.evaluate(() => window.__observer.project('halley'));
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('#info-panel')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#object-name')).toHaveText('Komet Halley');
  await page.locator('#follow-button').click();
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().followed)).toBe('halley');
  await page.locator('#time-toggle').click();
  const before = await page.evaluate(() => window.__observer.snapshot().camera);
  await expect.poll(() => page.evaluate(() => window.__observer.snapshot().camera)).not.toEqual(before);
  await page.locator('#info-panel').evaluate(panel => { panel.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath('halley.png') });
  expect(errors).toEqual([]);
});

test('comet world tail, pause, Low quality and disposal', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loading-screen')).toHaveClass(/done/);
  const result = await page.evaluate(async () => {
    const THREE = await import('/e2e/browserThree.js');
    const { SolarSystem } = await import('/src/core/SolarSystem.js');
    const system = new SolarSystem(new THREE.Scene());
    const object = system.getObject('halley'), visual = object.cometVisual;
    let freed = 0;
    visual.traverse(child => {
      child.geometry?.addEventListener('dispose', () => freed++);
      child.material?.addEventListener('dispose', () => freed++);
    });
    const alignment = [];
    for (const days of [0, 100, 5000, 10000]) {
      system.update(days); system.scene.updateMatrixWorld(true);
      const base = system.getWorldPosition('halley');
      const end = visual.tail.localToWorld(new THREE.Vector3(0, 1, 0));
      alignment.push(end.sub(base).normalize().dot(base.sub(system.getWorldPosition('sun')).normalize()));
    }
    const before = object.group.position.toArray();
    system.update(0);
    const paused = before.every((value, index) => value === object.group.position.toArray()[index]);
    system.setQuality('low');
    const low = !visual.coma.visible && visual.tail.visible && visual.nucleus.visible;
    const parent = object.parentObject.data.id;
    system.dispose();
    return { alignment, paused, low, parent, freed };
  });
  expect(result.alignment.every(value => value > .99999)).toBe(true);
  expect(result.paused && result.low).toBe(true);
  expect(result.parent).toBe('sun');
  expect(result.freed).toBe(6);
});
