import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SpaceBackground } from '../src/core/SpaceBackground.js';

test('background is seeded, layered, non-pickable and camera-relative without reallocating buffers', () => {
  const a = new SpaceBackground(), b = new SpaceBackground();
  const camera = new THREE.PerspectiveCamera();
  assert.equal(typeof a.layers.test, 'function'); // Preserve Three.js render-layer API.
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(a.starLayers[i].geometry.attributes.position.array, b.starLayers[i].geometry.attributes.position.array);
    assert.deepEqual(a.starLayers[i].geometry.attributes.color.array, b.starLayers[i].geometry.attributes.color.array);
  }
  const geometry = a.starLayers[0].geometry, array = geometry.attributes.position.array;
  camera.position.set(10000, -200, 320); a.update(camera);
  assert.ok(a.position.equals(camera.position));
  camera.updateMatrixWorld(); a.updateMatrixWorld(true);
  const direction = new THREE.Vector3(100, 50, -1800);
  const projected = direction.clone().applyMatrix4(a.matrixWorld).project(camera);
  camera.position.set(-400, 700, 80); a.update(camera);
  camera.updateMatrixWorld(); a.updateMatrixWorld(true);
  assert.ok(projected.distanceTo(direction.clone().applyMatrix4(a.matrixWorld).project(camera)) < 1e-10);
  a.visible = false; a.setQuality('low'); assert.equal(a.visible, false);
  assert.equal(a.haze.visible, false);
  a.setQuality('high'); assert.equal(a.starLayers[0].geometry, geometry);
  assert.equal(geometry.attributes.position.array, array);
  for (const object of a.children) {
    const hits = []; object.raycast(new THREE.Raycaster(), hits); assert.equal(hits.length, 0);
    assert.equal(object.material.depthWrite, false);
    assert.equal(object.material.transparent, false);
    assert.ok(object.renderOrder < 0);
  }
});
