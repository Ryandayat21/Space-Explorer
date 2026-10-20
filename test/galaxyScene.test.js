import test from 'node:test';
import assert from 'node:assert/strict';
import { GalaxyScene } from '../src/core/GalaxyScene.js';

test('educational galaxy is deterministic, finite, layered and non-pickable', () => {
  const a = new GalaxyScene(), b = new GalaxyScene();
  try {
    assert.equal(a.children.length, 21);
    assert.equal(new Set(a.children.map(layer => layer.name)).size, 7);
    for (let i = 0; i < a.children.length; i++) {
      const layer = a.children[i], positions = layer.geometry.attributes.position.array;
      assert.ok(layer.isPoints); assert.ok(positions.every(Number.isFinite));
      assert.deepEqual(positions, b.children[i].geometry.attributes.position.array);
      assert.deepEqual(layer.geometry.attributes.color.array, b.children[i].geometry.attributes.color.array);
      const hits = []; layer.raycast(null, hits); assert.equal(hits.length, 0);
      if (['disk', 'arms', 'spur'].includes(layer.name)) {
        let radial = 0, vertical = 0;
        for (let j = 0; j < positions.length; j += 3) {
          radial += positions[j] ** 2 + positions[j + 2] ** 2;
          vertical += positions[j + 1] ** 2;
        }
        assert.ok(vertical < radial * .02, 'disk structures must stay flattened');
      }
    }
  } finally { a.dispose(); b.dispose(); }
});
test('quality reuses buffers and all owned galaxy resources dispose exactly once', () => {
  const galaxy = new GalaxyScene(), layers = [...galaxy.children];
  let disposed = 0;
  for (const layer of layers) {
    layer.geometry.addEventListener('dispose', () => disposed++);

  }
  for (const material of new Set(layers.map(layer => layer.material))) material.addEventListener('dispose', () => disposed++);
  assert.equal(new Set(layers.map(layer => layer.material)).size, 3);
  assert.ok(layers.every(layer => layer.frustumCulled && !layer.matrixAutoUpdate && layer.geometry.boundingSphere));
  galaxy.sprite.addEventListener('dispose', () => disposed++);
  for (const [preset, expected] of [['low', 12600], ['medium', 30240], ['high', 50400], ['invalid', 30240]]) {
    galaxy.setQuality(preset); assert.equal(galaxy.particleCount, expected);
    assert.deepEqual(galaxy.children, layers);
  }
  galaxy.dispose(); galaxy.dispose(); assert.equal(disposed, 25);
});

import { GalaxyLandmarks } from '../src/core/GalaxyLandmarks.js';
import { PerspectiveCamera } from 'three';
test('stationary markers skip work, camera movement and resize invalidate without rebuilding', () => {
  const markers = new GalaxyLandmarks(), camera = new PerspectiveCamera(50, 1, .1, 200);
  camera.position.set(0, 20, 30); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const marker = markers.markers[0], hit = markers.pickables[0];
  assert.equal(markers.update(camera, 768), true); assert.equal(markers.update(camera, 768), false);
  camera.position.x += 1; camera.updateMatrixWorld(); assert.equal(markers.update(camera, 768), true);
  const scale = hit.scale.x;
  assert.equal(markers.update(camera, 1080), true); assert.ok(hit.scale.x < scale);
  assert.equal(markers.markers[0], marker); assert.equal(markers.pickables[0], hit); markers.dispose();
});
