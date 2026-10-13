import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { comets, cometScience } from '../src/data/comets.js';
import { searchObjects } from '../src/data/search.js';
import { scienceFor } from '../src/data/science.js';
import { orbitalElements } from '../src/data/orbitalElements.js';
import { orbitalPosition } from '../src/core/orbitMath.js';
import { CometVisual, tailDirection } from '../src/core/CometVisual.js';

test('comet identity, search, sourced science and strongly elliptical safe orbit', () => {
  const all = searchObjects();
  assert.equal(new Set(all.map(body => body.id)).size, all.length);
  assert.equal(searchObjects('1P/Halley', 'comet')[0].id, 'halley');
  assert.equal(searchObjects("Halley's Comet")[0].id, 'halley');
  assert.equal(searchObjects('halley', 'planet').length, 0);
  const panel = scienceFor(comets[0]);
  for (const key of ['name', 'type', 'diameterKm', 'distance', 'orbitPeriod', 'composition', 'fact', 'sources']) assert.ok(panel[key]);
  assert.equal(panel.mass, null);
  assert.equal(scienceFor({ ...comets[0], visualRadius: 999 }).diameterKm, panel.diameterKm);
  assert.ok(panel.sources.every(source => new URL(source.url).hostname.endsWith('nasa.gov')));
  const orbit = orbitalElements.halley;
  assert.equal(orbit.parent, 'sun');
  assert.ok(orbit.eccentricity > .9 && orbit.eccentricity < 1);
  assert.ok(orbit.inclination > Math.PI / 2);
  assert.equal(cometScience.halley.eccentricity, .967);
  assert.ok(orbit.semiMajorAxis * (1 - orbit.eccentricity) > 8 + comets[0].visualRadius);
});

test('tail points away from translated Sun, including a safe zero-distance fallback', () => {
  const sun = new THREE.Vector3(9, -3, 5), target = new THREE.Vector3();
  for (const offset of [[1, 0, 0], [-4, 2, 9], [0, -2, 0]]) {
    const comet = sun.clone().add(new THREE.Vector3(...offset));
    assert.equal(tailDirection(comet, sun, target), target);
    assert.ok(target.dot(comet.sub(sun).normalize()) > .999999);
  }
  tailDirection(sun, sun, target);
  assert.ok(target.toArray().every(Number.isFinite));
  assert.equal(target.length(), 1);
});

test('comet tail stays anti-solar through the inclined orbit without rebuilding resources', () => {
  const visual = new CometVisual(.7), position = new THREE.Vector3();
  const geometry = visual.tail.geometry, material = visual.tail.material;
  for (const days of [0, 100, 1000, 10000, 20000, -500]) {
    orbitalPosition(orbitalElements.halley, days, position);
    visual.update(position);
    const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(visual.tail.quaternion);
    assert.ok(direction.dot(position.clone().normalize()) > .999999);
    assert.ok(position.toArray().every(Number.isFinite));
    assert.equal(visual.tail.geometry, geometry); assert.equal(visual.tail.material, material);
  }
  const hits = [];
  visual.tail.raycast(new THREE.Raycaster(), hits); visual.coma.raycast(new THREE.Raycaster(), hits);
  assert.deepEqual(hits, []);
  assert.equal(visual.children.length, 3);
  visual.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
});
