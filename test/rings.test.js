import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPlanetRings } from '../src/core/PlanetRings.js';

function dispose(ring) {
  ring.geometry.dispose(); ring.material.map.dispose(); ring.material.dispose();
}

test('procedural rings use one small texture, mesh and material with transparent gaps', () => {
  const saturn = createPlanetRings('saturn', 4);
  const uranus = createPlanetRings('uranus', 3);
  for (const ring of [saturn, uranus]) {
    assert.equal(ring.children.length, 0);
    assert.equal(Array.isArray(ring.material), false);
    assert.equal(ring.material.map.isDataTexture, true);
    assert.equal(ring.material.map.image.data.byteLength, 2048);
    assert.ok(ring.material.transparent && ring.material.depthTest && !ring.material.depthWrite);
    assert.equal(ring.material.forceSinglePass, true);
    assert.equal(ring.geometry.index.count, 128 * 6);
    const alpha = ring.material.map.image.data.filter((_, index) => index % 4 === 3);
    assert.ok(alpha.includes(0));
    assert.ok(Math.max(...alpha) < 255);
    assert.ok(Math.max(...alpha) > 0);
  }
  const alphaAt = (ring, radial) => ring.material.map.image.data[Math.round(radial * 511) * 4 + 3];
  assert.equal(alphaAt(saturn, .70), 0);
  assert.ok(alphaAt(saturn, .5) > alphaAt(saturn, .2));
  assert.ok(alphaAt(saturn, .8) > 0);
  assert.ok(Math.max(...uranus.material.map.image.data.filter((_, index) => index % 4 === 3)) < 60);
  assert.ok(uranus.geometry.parameters.outerRadius - uranus.geometry.parameters.innerRadius < .22);
  dispose(saturn); dispose(uranus);
});

test('rings inherit parent position, axial tilt and spin without intercepting rays', () => {
  const tilted = new THREE.Group(); tilted.rotation.z = .47;
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial());
  tilted.add(planet);
  const ring = createPlanetRings('saturn', 1); planet.add(ring);
  tilted.position.set(20, 30, 40); planet.rotation.y = 1.7;
  tilted.updateMatrixWorld(true);
  assert.ok(ring.getWorldPosition(new THREE.Vector3()).distanceTo(tilted.position) < 1e-10);
  const normal = new THREE.Vector3(0, 0, 1).transformDirection(ring.matrixWorld);
  const axis = new THREE.Vector3(0, 1, 0).transformDirection(planet.matrixWorld);
  assert.ok(Math.abs(normal.dot(axis)) > .999999);
  const before = ring.getWorldQuaternion(new THREE.Quaternion());
  planet.rotation.y += .5;
  assert.ok(before.angleTo(ring.getWorldQuaternion(new THREE.Quaternion())) > .49);
  const origin = tilted.position.clone().addScaledVector(axis, 10);
  const ray = new THREE.Raycaster(origin, axis.clone().negate());
  assert.equal(ray.intersectObject(ring, true).length, 0);
  assert.equal(ray.intersectObject(planet, true)[0].object, planet);
  dispose(ring); planet.geometry.dispose(); planet.material.dispose();
});

test('ring resources dispose once and invalid parameters are rejected', () => {
  const ring = createPlanetRings('uranus', 1);
  let count = 0;
  for (const resource of [ring.geometry, ring.material, ring.material.map]) resource.addEventListener('dispose', () => count++);
  dispose(ring); assert.equal(count, 3);
  for (const radius of [0, -1, NaN, Infinity]) assert.throws(() => createPlanetRings('saturn', radius), RangeError);
  assert.throws(() => createPlanetRings('earth', 1), RangeError);
});
