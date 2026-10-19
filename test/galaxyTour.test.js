import test from 'node:test';
import assert from 'node:assert/strict';
import { galaxyTour } from '../src/data/galaxyTour.js';
import { galaxyLandmarks } from '../src/data/galaxyLandmarks.js';
import { galaxyCameraPresets } from '../src/core/galaxyCameraMath.js';
test('galaxy tour follows educational sequence and references valid landmarks and camera presets', () => {
  assert.deepEqual(galaxyTour.map(x => x.id), ['overview', 'disk-halo', 'center', 'bar', 'arms', 'local-spur', 'solar-region', 'neighbor', 'nebula', 'return-overview']);
  assert.equal(new Set(galaxyTour.map(x => x.id)).size, galaxyTour.length);
  for (const stop of galaxyTour) {
    assert.ok(stop.title && stop.text && stop.seconds >= 8);
    assert.equal([stop.landmarkId, stop.preset, stop.position].filter(Boolean).length, 1);
    if (stop.landmarkId) assert.ok(galaxyLandmarks.some(x => x.id === stop.landmarkId));
    if (stop.preset) assert.ok(galaxyCameraPresets[stop.preset]);
    if (stop.position) for (const vector of [stop.position, stop.target]) { assert.equal(vector.length, 3); assert.ok(vector.every(Number.isFinite)); }
  }
});
