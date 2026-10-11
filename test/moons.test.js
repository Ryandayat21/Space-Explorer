import test from 'node:test';
import assert from 'node:assert/strict';
import { bodies, moons } from '../src/data/celestialBodies.js';
import { moonScience } from '../src/data/moonScience.js';
import { scienceFor } from '../src/data/science.js';
import { searchObjects } from '../src/data/search.js';

const expectedParents = {
  moon: 'earth', phobos: 'mars', deimos: 'mars', io: 'jupiter', europa: 'jupiter', ganymede: 'jupiter', callisto: 'jupiter',
  titan: 'saturn', enceladus: 'saturn', rhea: 'saturn', iapetus: 'saturn',
  titania: 'uranus', oberon: 'uranus', ariel: 'uranus', umbriel: 'uranus', miranda: 'uranus', triton: 'neptune'
};

test('all 17 requested moons exist exactly once with correct parents and searchable IDs', () => {
  assert.equal(moons.length, 22); // Preserve five other existing moons.
  const ids = [...bodies, ...moons].map(body => body.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(Object.keys(moonScience).sort(), Object.keys(expectedParents).sort());
  for (const [id, parent] of Object.entries(expectedParents)) {
    const matches = moons.filter(moon => moon.id === id);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].parent, parent);
    assert.ok(bodies.some(body => body.id === parent && body.type === 'planet'));
    for (const query of [id, matches[0].name.toUpperCase()]) {
      assert.ok(searchObjects(query, 'moon').some(result => result.id === id));
      assert.equal(searchObjects(query, 'planet').some(result => result.id === id), false);
    }
  }
});

test('major moon scientific fields are physical, sourced and explicit about unknowns', () => {
  for (const id of Object.keys(expectedParents)) {
    const data = moonScience[id];
    for (const key of ['radiusKm', 'diameterKm', 'gm', 'massKg', 'gravityMs2', 'semiMajorAxisKm', 'orbitalPeriodDays']) {
      assert.ok(Number.isFinite(data[key]) && data[key] > 0, `${id}: ${key}`);
    }
    assert.equal(data.diameterKm, data.radiusKm * 2);
    assert.ok(data.semiMajorAxisKm > data.radiusKm);
    for (const key of ['composition', 'fact', 'verifiedOn']) assert.ok(data[key], `${id}: ${key}`);
    for (const key of ['temperature', 'rotation']) {
      assert.ok(Object.hasOwn(data, key));
      assert.ok(data[key] === null || typeof data[key] === 'string');
    }
    assert.ok(data.sources.length >= 3);
    assert.ok(data.sources.every(source => new URL(source.url).hostname.endsWith('.nasa.gov')));
    const moon = moons.find(body => body.id === id);
    const panel = scienceFor(moon);
    for (const key of ['name', 'type', 'diameterKm', 'mass', 'gravity', 'distance', 'orbitPeriod', 'moons', 'composition', 'description', 'fact', 'sources']) assert.ok(panel[key], `${id}: panel ${key}`);
    assert.equal(panel.type, 'moon');
    const altered = scienceFor({ ...moon, size: 12345, distance: 12345, period: -12345 });
    for (const key of ['diameterKm', 'mass', 'gravity', 'distance', 'rotation', 'orbitPeriod']) assert.equal(altered[key], panel[key]);
  }
});

test('physical conversions have sensible independent reference bounds; missing values stay unknown', () => {
  assert.ok(moonScience.moon.massKg > 7.34e22 && moonScience.moon.massKg < 7.35e22);
  assert.ok(moonScience.moon.gravityMs2 > 1.62 && moonScience.moon.gravityMs2 < 1.63);
  assert.ok(moonScience.phobos.gravityMs2 > 0.005 && moonScience.phobos.gravityMs2 < 0.006);
  assert.equal(moonScience.moon.semiMajorAxisKm, 384400);
  assert.equal(moonScience.europa.temperature, null);
  assert.equal(moonScience.deimos.rotation, null);
  const nereid = scienceFor(moons.find(moon => moon.id === 'nereid'));
  assert.equal(nereid.mass, null);
  assert.equal(nereid.orbitPeriod, null);
  assert.ok(Number.isFinite(nereid.diameterKm));
});
