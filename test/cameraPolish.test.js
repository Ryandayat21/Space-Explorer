import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { cinematicEase, safeCameraRadius, visitDistance } from '../src/core/cameraMath.js';
import { CameraSafety } from '../src/core/CameraSafety.js';

test('cinematic easing is bounded, monotonic and has gentle endpoints', () => {
  assert.equal(cinematicEase(-1), 0); assert.equal(cinematicEase(2), 1);
  let previous = 0;
  for (let i = 0; i <= 100; i++) {
    const value = cinematicEase(i/100); assert.ok(value >= previous); previous = value;
  }
  assert.ok(cinematicEase(.001) < 1e-7);
  for (const r of [.17, .54, 2, 8, 20]) assert.ok(visitDistance(r) > safeCameraRadius(r));
});

test('camera collision handles body center and a translated tilted ring without changing objects', () => {
  const group = new THREE.Group(), mesh = new THREE.Mesh(new THREE.SphereGeometry(2));
  group.position.set(12, 4, 8); group.rotation.z = .6; group.add(mesh);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3, 5)); ring.name = 'test-rings';
  ring.rotation.x = Math.PI/2; mesh.add(ring);
  const safety = new CameraSafety({ objects: new Map([['test', { data: { id:'test' }, radius:2, group, mesh }]]) });
  group.updateMatrixWorld(true);
  const point = group.getWorldPosition(new THREE.Vector3()); safety.resolve(point);
  assert.ok(point.distanceTo(group.position) >= safeCameraRadius(2));
  point.copy(ring.localToWorld(new THREE.Vector3(4,0,0))); safety.resolve(point);
  assert.ok(Math.abs(ring.worldToLocal(point.clone()).z) >= .3);
  assert.deepEqual(group.position.toArray(), [12,4,8]);
  const from = new THREE.Vector3(12,4,20), to = new THREE.Vector3(12,4,-10);
  safety.resolve(to, from);
  assert.ok(to.z > 8, 'fast movement must stop before tunnelling through the body');
  const ringStart = ring.localToWorld(new THREE.Vector3(4,0,3));
  const ringEnd = ring.localToWorld(new THREE.Vector3(4,0,-3));
  safety.resolve(ringEnd, ringStart);
  assert.ok(ring.worldToLocal(ringEnd).z >= .3, 'fast movement must not tunnel through rings');
});
