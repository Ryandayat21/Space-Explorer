import test from 'node:test';
import assert from 'node:assert/strict';
import { clearApproach } from '../src/core/cameraMath.js';

test('visit approach rejects an occluder or unsafe endpoint, but ignores bodies beyond the camera', () => {
  const target = [0, 0, 0], destination = [0, 0, 5];
  assert.equal(clearApproach(target, destination, [{ center: [0, 0, 3], radius: 1 }]), false);
  assert.equal(clearApproach(target, destination, [{ center: [0, 0, 5.2], radius: 1 }]), false);
  assert.equal(clearApproach(target, destination, [{ center: [0, 0, 8], radius: 1 }]), true);
  assert.equal(clearApproach(target, destination, [{ center: [2, 0, 3], radius: 1 }]), true);
  assert.equal(clearApproach(target, target, []), false);
});
