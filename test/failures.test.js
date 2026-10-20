import test from 'node:test';
import assert from 'node:assert/strict';
import { createReporter, watchGraphicsContext } from '../src/core/failures.js';

test('diagnostics report each failure code only once', () => {
  const messages = [], report = createReporter((...args) => messages.push(args));
  report('texture', new Error('unavailable')); report('texture', new Error('again'));
  report('audio', new Error('blocked'));
  assert.equal(messages.length, 2); assert.match(messages[0][0], /texture/);
});

test('context loss stops once; restoration requires reload; disposal removes listeners', () => {
  const canvas = new EventTarget(), messages = [];
  let stops = 0;
  const dispose = watchGraphicsContext(canvas, { stop: () => stops++, status: message => messages.push(message), report() {} });
  const lost = new Event('webglcontextlost', { cancelable: true });
  canvas.dispatchEvent(lost); canvas.dispatchEvent(new Event('webglcontextlost'));
  assert.equal(lost.defaultPrevented, true); assert.equal(stops, 1);
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  assert.match(messages.at(-1), /scene belum dipulihkan/); assert.equal(stops, 1);
  dispose(); dispose(); canvas.dispatchEvent(new Event('webglcontextrestored'));
  assert.equal(messages.length, 2);
});
