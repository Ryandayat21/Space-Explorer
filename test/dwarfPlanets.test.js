import test from 'node:test';
import assert from 'node:assert/strict';
import { dwarfPlanets, dwarfPlanetScience } from '../src/data/dwarfPlanets.js';
import { bodies, moons, orbitRadiusFromAu } from '../src/data/celestialBodies.js';
import { orbitalElements } from '../src/data/orbitalElements.js';
import { orbitalPosition } from '../src/core/orbitMath.js';
import { searchObjects } from '../src/data/search.js';
import { scienceFor } from '../src/data/science.js';

test('five dwarf planets have unique IDs and a separate searchable category', () => {
  assert.deepEqual(dwarfPlanets.map(body => body.id), ['ceres', 'pluto', 'haumea', 'makemake', 'eris']);
  const ids = [...bodies, ...moons, ...dwarfPlanets].map(body => body.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(searchObjects('', 'planet').length, 8);
  assert.equal(searchObjects('', 'dwarf-planet').length, 5);
  for (const body of dwarfPlanets) {
    assert.equal(body.type, 'dwarf-planet');
    assert.equal(searchObjects(body.name.toUpperCase(), 'dwarf-planet')[0].id, body.id);
    assert.equal(searchObjects(body.id, 'planet').length, 0);
    assert.equal(searchObjects(body.id, 'all')[0].id, body.id);
  }
});

test('dwarf planet panels use sourced scientific data independent of visual scale', () => {
  for (const body of dwarfPlanets) {
    const source = dwarfPlanetScience[body.id];
    const data = scienceFor(body);
    for (const key of ['diameterKm', 'semiMajorAxisAu', 'orbitalPeriodDays', 'epochJD']) assert.ok(Number.isFinite(source[key]) && source[key] > 0);
    for (const key of ['name', 'type', 'diameterKm', 'distance', 'orbitPeriod', 'moons', 'composition', 'fact', 'description']) assert.ok(data[key]);
    for (const key of ['mass', 'gravity', 'temperature', 'rotation']) assert.ok(Object.hasOwn(data, key));
    assert.ok(data.sources.every(source => new URL(source.url).hostname.endsWith('.nasa.gov')));
    assert.match(data.description, /tidak proporsional/);
    const changed = scienceFor({ ...body, visualRadius: 999, rotationDays: 999, initialAngle: 999 });
    for (const key of ['diameterKm', 'distance', 'rotation', 'orbitPeriod']) assert.equal(data[key], changed[key]);
  }
});

test('dwarf orbits are finite ellipses around the Sun using the existing distance scale', () => {
  for (const body of dwarfPlanets) {
    const orbit = orbitalElements[body.id];
    assert.equal(orbit.parent, 'sun');
    assert.equal(orbit.semiMajorAxis, orbitRadiusFromAu(dwarfPlanetScience[body.id].semiMajorAxisAu));
    assert.ok(orbit.eccentricity > 0 && orbit.eccentricity < 1);
    assert.ok(orbit.semiMajorAxis * (1 - orbit.eccentricity) > 8 + body.visualRadius);
    for (const days of [0, 100, 1000000, -1000000]) {
      assert.ok(Object.values(orbitalPosition(orbit, days, {})).every(Number.isFinite));
    }
  }
});
