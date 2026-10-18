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
    layer.material.addEventListener('dispose', () => disposed++);
  }
  galaxy.sprite.addEventListener('dispose', () => disposed++);
  for (const [preset, expected] of [['low', 12600], ['medium', 30240], ['high', 50400], ['invalid', 30240]]) {
    galaxy.setQuality(preset); assert.equal(galaxy.particleCount, expected);
    assert.deepEqual(galaxy.children, layers);
  }
  galaxy.dispose(); galaxy.dispose(); assert.equal(disposed, 43);
});
