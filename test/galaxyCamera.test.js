import test from 'node:test';
import assert from 'node:assert/strict';
import { galaxyAdaptiveSpeed, galaxyBoundaryScale, galaxyCameraLimit, galaxyCameraPresets } from '../src/core/galaxyCameraMath.js';
test('galaxy speed grows with distance but stays finite, bounded and independent of solar speed', () => {
  let previous = 0;
  for (let distance = 0; distance <= 1000; distance++) {
    const speed = galaxyAdaptiveSpeed(distance);
    assert.ok(speed >= previous && speed <= 32); previous = speed;
  }
  for (const value of [NaN, Infinity, -10, 0, 1e9]) assert.ok(Number.isFinite(galaxyAdaptiveSpeed(value, value)));
  assert.ok(galaxyAdaptiveSpeed(10, 2) > galaxyAdaptiveSpeed(10, 1));
  assert.equal(galaxyAdaptiveSpeed(0), .4);
});
test('galaxy boundary leaves interior unchanged and constrains distant positions', () => {
  for (const distance of [0, 1, 79, 80]) assert.equal(galaxyBoundaryScale(distance), 1);
  for (const distance of [81, 100, 10000]) assert.ok(Math.abs(distance * galaxyBoundaryScale(distance) - galaxyCameraLimit) < 1e-9);
  for (const preset of Object.values(galaxyCameraPresets)) {
    assert.ok(preset.position.every(Number.isFinite));
    assert.ok(Math.hypot(...preset.position) < galaxyCameraLimit);
    assert.notDeepEqual(preset.position, preset.target);
  }
});
