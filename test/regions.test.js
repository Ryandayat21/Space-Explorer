import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SmallBodyRegion } from '../src/core/SmallBodyRegion.js';
import { smallBodyRegions } from '../src/data/smallBodyRegions.js';
import { orbitRadiusFromAu } from '../src/data/celestialBodies.js';
import { orbitalElements } from '../src/data/orbitalElements.js';

const dispose = region => { region.geometry.dispose(); region.material.dispose(); };

test('regions are deterministic flattened annuli at the intended scene distances', () => {
  for (const config of smallBodyRegions) {
    const region = new SmallBodyRegion(config), repeat = new SmallBodyRegion(config);
    const other = new SmallBodyRegion({ ...config, seed: config.seed + 1 });
    const points = region.geometry.attributes.position;
    assert.deepEqual(points.array, repeat.geometry.attributes.position.array);
    assert.notDeepEqual(points.array, other.geometry.attributes.position.array);
    const quadrants = [0, 0, 0, 0];
    for (let index = 0; index < points.count; index++) {
      const x = points.getX(index), y = points.getY(index), z = points.getZ(index);
      assert.ok([x, y, z].every(Number.isFinite));
      const radial = Math.hypot(x, z);
      assert.ok(radial >= orbitRadiusFromAu(config.innerAu) - 1e-4);
      assert.ok(radial <= orbitRadiusFromAu(config.outerAu) + 1e-4);
      assert.ok(Math.abs(y) <= config.halfHeight);
      assert.ok(Math.abs(y) / radial < .025);
      quadrants[(x < 0 ? 1 : 0) + (z < 0 ? 2 : 0)]++;
    }
    assert.ok(quadrants.every(count => count > points.count * .2));
    dispose(region); dispose(repeat); dispose(other);
  }
  const [asteroids, kuiper] = smallBodyRegions;
  const mars = orbitalElements.mars, jupiter = orbitalElements.jupiter, neptune = orbitalElements.neptune;
  assert.ok(orbitRadiusFromAu(asteroids.innerAu) > mars.semiMajorAxis * (1 + mars.eccentricity));
  assert.ok(orbitRadiusFromAu(asteroids.outerAu) < jupiter.semiMajorAxis * (1 - jupiter.eccentricity));
  assert.ok(orbitRadiusFromAu(kuiper.innerAu) > neptune.semiMajorAxis * (1 + neptune.eccentricity));
});

test('quality and visibility reuse buffers; motion pauses and particles cannot be picked', () => {
  for (const config of smallBodyRegions) {
    const region = new SmallBodyRegion(config);
    const buffer = region.geometry.attributes.position.array;
    const copy = buffer.slice();
    region.visible = false;
    for (const quality of ['low', 'medium', 'high']) {
      region.setQuality(quality);
      assert.equal(region.geometry.drawRange.count, config.counts[quality]);
      assert.equal(region.visible, false);
      assert.equal(region.geometry.attributes.position.array, buffer);
    }
    region.update(0); assert.equal(region.rotation.y, 0);
    region.update(1); assert.equal(region.rotation.y, config.angularSpeed);
    for (let frame = 0; frame < 100; frame++) region.update(.05);
    assert.deepEqual(buffer, copy);
    region.visible = true;
    const hits = [];
    region.raycast(new THREE.Raycaster(), hits);
    assert.equal(hits.length, 0);
    assert.equal(region.userData.bodyId, undefined);
    let freed = 0;
    region.geometry.addEventListener('dispose', () => freed++);
    region.material.addEventListener('dispose', () => freed++);
    dispose(region); assert.equal(freed, 2);
  }
});
