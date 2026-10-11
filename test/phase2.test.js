import test from 'node:test';
import assert from 'node:assert/strict';
import { bodies, moons, orbitRadiusFromAu, visualRadiusFromEarth, tourStops } from '../src/data/celestialBodies.js';
import { tour } from '../src/data/tour.js';
import { searchObjects } from '../src/data/search.js';
import { scienceFor } from '../src/data/science.js';
import { visitDistance, proximityFactor } from '../src/core/cameraMath.js';

test('tour includes the asteroid belt and keeps narrative outside UI', () => {
  assert.deepEqual(tour.map(stop => stop.id), ['sun', 'mercury', 'venus', 'earth', 'mars', 'asteroid-belt', 'jupiter', 'saturn', 'uranus', 'neptune']);
  assert.deepEqual(tour.map(stop => stop.id), tourStops);
  for (const stop of tour) {
    assert.ok(stop.title && stop.narration && stop.duration >= 12000);
    assert.ok(stop.id === 'asteroid-belt' || bodies.some(body => body.id === stop.id));
  }
});
test('science panels have all required fields and explicit provenance', () => {
  for (const body of bodies) {
    const science = scienceFor(body);
    for (const key of ['name', 'type', 'diameterKm', 'mass', 'gravity', 'temperature', 'distance', 'rotation', 'orbitPeriod', 'moons', 'composition', 'fact', 'sources']) assert.ok(science[key], body.id + ':' + key);
    assert.ok(science.sources.every(source => new URL(source.url).hostname.endsWith('nasa.gov')));
    assert.equal(science.radiusEarth, body.radiusEarth);
  }
});
test('moon parent is a planet and unknown science is not derived from scene units', () => {
  for (const moon of moons) {
    assert.ok(bodies.some(body => body.id === moon.parent && body.type === 'planet'));
    const data = scienceFor({ ...moon, type: 'moon' });
    assert.notEqual(data.distance, moon.distance);
    if (moon.id !== 'moon') assert.equal(data.mass, null);
  }
});
test('search supports Indonesian names, aliases, case and category intersections', () => {
  assert.equal(searchObjects(' EARTH ')[0].id, 'earth');
  assert.equal(searchObjects('matahari')[0].id, 'sun');
  assert.equal(searchObjects('bulan', 'moon')[0].id, 'moon');
  assert.equal(searchObjects('Europa', 'planet').length, 0);
  assert.equal(searchObjects('', 'moon').length, 22);
  assert.equal(searchObjects('', 'planet').length, 8);
  assert.equal(searchObjects('unknown').length, 0);
});
test('visual scales and safe camera distances remain finite and monotonic', () => {
  for (const radius of [.17, .54, 1, 8, 109.2]) {
    assert.ok(visitDistance(radius) > radius + .05);
    assert.ok(Number.isFinite(visualRadiusFromEarth(radius)));
  }
  for (const au of [.387, 1, 5.2, 30.07]) assert.ok(orbitRadiusFromAu(au + 1) > orbitRadiusFromAu(au));
  assert.equal(proximityFactor(-1), .025);
  assert.equal(proximityFactor(100), 1);
  assert.ok(proximityFactor(1) < proximityFactor(10));
});
