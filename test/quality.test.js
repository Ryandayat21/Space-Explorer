import test from 'node:test';
import assert from 'node:assert/strict';
import { readQuality, saveQuality, qualityPresets } from '../src/data/quality.js';

test('quality storage defaults safely and rejects corrupt values without coercion', () => {
  for (const value of [null, 'broken', 'null', '123', '{}', '["low"]', '"unknown"', '"__proto__"']) {
    assert.equal(readQuality(() => ({ getItem: () => value })), 'medium');
  }
  assert.equal(readQuality(() => { throw new Error('Denied'); }), 'medium');
  assert.equal(saveQuality('low', () => { throw new Error('Denied'); }), false);
  let stored;
  const storage = { getItem: () => stored, setItem: (key, value) => { stored = value; } };
  for (const level of Object.keys(qualityPresets)) {
    assert.equal(saveQuality(level, () => storage), true);
    assert.equal(readQuality(() => storage), level);
  }
});
