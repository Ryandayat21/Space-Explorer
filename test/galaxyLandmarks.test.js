import test from 'node:test';
import assert from 'node:assert/strict';
import { galaxyLandmarks, landmarkCategories } from '../src/data/galaxyLandmarks.js';
import { GalaxyLandmarks } from '../src/core/GalaxyLandmarks.js';
import { PerspectiveCamera } from 'three';
test('landmarks have unique IDs, supported categories, finite schematic positions and sourced science', () => {
  assert.equal(galaxyLandmarks.length, 13);
  assert.equal(new Set(galaxyLandmarks.map(x => x.id)).size, 13);
  for (const item of galaxyLandmarks) {
    assert.ok(item.name && item.description && Array.isArray(item.aliases));
    assert.ok(landmarkCategories.includes(item.category));
    assert.equal(item.position.coordinates.length, 3);
    assert.ok(item.position.coordinates.every(Number.isFinite));
    assert.equal(item.position.approximate, true);
    assert.equal(item.position.unit, 'model');
    assert.ok(item.sources.length && item.sources.every(s => new URL(s.url).protocol === 'https:' && s.title));
    if (item.science.distance) {
      assert.ok(item.science.distance.value > 0);
      assert.equal(item.science.distance.reference, 'Earth');
      assert.equal(item.science.distance.approximate, true);
    }
  }
});
test('landmark proxies retain finite screen size and release shared resources once', () => {
  const markers = new GalaxyLandmarks(); const camera = new PerspectiveCamera(50, 1, .1, 200);
  camera.position.set(0, 20, 30); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  markers.update(camera, 768);
  assert.equal(markers.pickables.length, 13);
  for (const proxy of markers.pickables) assert.ok(Number.isFinite(proxy.scale.x) && proxy.scale.x > 0);
  markers.select('galactic-center'); assert.equal(markers.markers[0].material, markers.selectedMaterial);
  let disposed = 0; markers.texture.addEventListener('dispose', () => disposed++);
  markers.dispose(); markers.dispose(); assert.equal(disposed, 1);
});
