import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { orbitalElements } from '../src/data/orbitalElements.js';
import { bodies, moons, orbitRadiusFromAu, visualRadiusFromEarth } from '../src/data/celestialBodies.js';
import { orbitalPosition, validateOrbit } from '../src/core/orbitMath.js';
import { OrbitMotion } from '../src/core/OrbitMotion.js';

const close = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('orbital elements preserve visual scales and correct parents', () => {
  assert.equal(Object.keys(orbitalElements).length, 35);
  for (const body of bodies.filter(body => body.type === 'planet')) {
    const elements = orbitalElements[body.id];
    assert.equal(elements.parent, 'sun');
    assert.equal(elements.semiMajorAxis, orbitRadiusFromAu(body.orbitAu));
    assert.equal(elements.orbitalPeriod, body.orbitalPeriodDays);
  }
  for (const moon of moons) {
    const elements = orbitalElements[moon.id];
    assert.equal(elements.parent, moon.parent);
    assert.equal(elements.semiMajorAxis, moon.distance);
    assert.equal(elements.orbitalPeriod, moon.period);
    const parent = bodies.find(body => body.id === moon.parent);
    assert.ok(elements.semiMajorAxis * (1 - elements.eccentricity) > visualRadiusFromEarth(parent.radiusEarth) + moon.size);
  }
});

test('all orbital positions stay finite across negative, zero and large times', () => {
  const target = new THREE.Vector3();
  for (const elements of Object.values(orbitalElements)) {
    validateOrbit(elements);
    for (const days of [-1e12, -100, 0, 0.001, 100, 1e12, Number.MAX_VALUE]) {
      assert.equal(orbitalPosition(elements, days, target), target);
      assert.ok(target.toArray().every(Number.isFinite));
      assert.ok(target.length() >= elements.semiMajorAxis * (1 - elements.eccentricity) - 1e-8);
      assert.ok(target.length() <= elements.semiMajorAxis * (1 + elements.eccentricity) + 1e-8);
    }
  }
});

test('periapsis and apoapsis are at a(1-e) and a(1+e), with circular exceptions', () => {
  for (const value of Object.values(orbitalElements)) {
    const elements = { ...value, initialAngle: 0 };
    const periapsis = orbitalPosition(elements, 0, new THREE.Vector3()).length();
    const apoapsis = orbitalPosition(elements, elements.orbitalPeriod / 2, new THREE.Vector3()).length();
    close(periapsis, elements.semiMajorAxis * (1 - elements.eccentricity));
    close(apoapsis, elements.semiMajorAxis * (1 + elements.eccentricity));
    if (elements.eccentricity > 0) assert.ok(periapsis < apoapsis);
    else close(periapsis, apoapsis);
  }
});

test('Kepler motion is periodic, faster at periapsis and supports retrograde time', () => {
  const elements = { ...orbitalElements.mercury, initialAngle: 0 };
  const p = days => orbitalPosition(elements, days, new THREE.Vector3());
  assert.ok(p(0).distanceTo(p(elements.orbitalPeriod)) < 1e-8);
  assert.ok(p(0).distanceTo(p(0.01)) > p(elements.orbitalPeriod / 2).distanceTo(p(elements.orbitalPeriod / 2 + 0.01)));
  const backward = orbitalPosition({ ...elements, orbitalPeriod: -elements.orbitalPeriod }, 1, new THREE.Vector3());
  assert.ok(backward.distanceTo(p(-1)) < 1e-8);
  const highE = { ...elements, eccentricity: 0.9999 };
  for (const fraction of [0.00001, 0.05, 0.25, 0.49]) {
    const position = orbitalPosition(highE, fraction * highE.orbitalPeriod, new THREE.Vector3());
    const angle = Math.acos(Math.max(-1, Math.min(1, position.x / highE.semiMajorAxis + highE.eccentricity)));
    close(angle - highE.eccentricity * Math.sin(angle), fraction * Math.PI * 2);
  }
});

test('orbit lines and moving objects share an inclined ellipse and parent frame', () => {
  const sun = new THREE.Group();
  const earth = new OrbitMotion(sun, orbitalElements.earth);
  const moon = new OrbitMotion(earth.group, orbitalElements.moon);
  assert.equal(earth.frame.parent, sun);
  assert.equal(moon.frame.parent, earth.group);
  for (const days of [0, 20, 200]) {
    earth.update(days); moon.update(days);
    sun.updateMatrixWorld(true);
    const expected = orbitalPosition(orbitalElements.moon, days, new THREE.Vector3());
    const relative = moon.group.getWorldPosition(new THREE.Vector3()).sub(earth.group.getWorldPosition(new THREE.Vector3()));
    assert.ok(relative.distanceTo(expected) < 1e-8);
  }
  const before = moon.group.getWorldPosition(new THREE.Vector3());
  sun.position.set(20, 30, 40);
  assert.ok(moon.group.getWorldPosition(new THREE.Vector3()).sub(before).distanceTo(sun.position) < 1e-8);
  const elements = orbitalElements.moon;
  const points = moon.line.geometry.attributes.position;
  for (let index = 0; index < points.count; index++) {
    const x = points.getX(index), y = points.getY(index), z = points.getZ(index);
    close(y * Math.cos(elements.inclination) + z * Math.sin(elements.inclination), 0, 1e-6);
    close(((x / elements.semiMajorAxis) + elements.eccentricity) ** 2
      + (y * y + z * z) / (elements.semiMajorAxis ** 2 * (1 - elements.eccentricity ** 2)), 1, 1e-6);
  }
  for (const motion of [earth, moon]) {
    motion.line.geometry.dispose(); motion.line.material.dispose();
  }
});

test('invalid orbit data and nonfinite time are rejected', () => {
  for (const patch of [{ semiMajorAxis: 0 }, { eccentricity: 1 }, { eccentricity: -0.1 }, { inclination: NaN }, { orbitalPeriod: 0 }, { initialAngle: Infinity }]) {
    assert.throws(() => validateOrbit({ ...orbitalElements.earth, ...patch }), RangeError);
  }
  assert.throws(() => orbitalPosition(orbitalElements.earth, Infinity, {}), RangeError);
});
