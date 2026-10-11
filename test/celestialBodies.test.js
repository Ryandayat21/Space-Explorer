import assert from 'node:assert/strict';
import test from 'node:test';
import { bodies, moons, orbitRadiusFromAu, visualRadiusFromEarth } from '../src/data/celestialBodies.js';

test('the MVP contains the Sun and eight planets', () => {
  assert.equal(bodies.length, 9);
  assert.equal(bodies.filter((body) => body.type === 'star').length, 1);
  assert.equal(bodies.filter((body) => body.type === 'planet').length, 8);
});

test('the major-moon catalog has valid parent planets', () => {
  assert.equal(moons.length, 22);
  const bodyIds = new Set(bodies.map((body) => body.id));
  moons.forEach((moon) => assert.ok(bodyIds.has(moon.parent), `${moon.name} has an unknown parent`));
});

test('all celestial object identifiers are unique', () => {
  const ids = [...bodies, ...moons].map((object) => object.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('visual-scale helpers remain monotonic', () => {
  assert.ok(orbitRadiusFromAu(30) > orbitRadiusFromAu(1));
  assert.ok(visualRadiusFromEarth(11) > visualRadiusFromEarth(1));
});
