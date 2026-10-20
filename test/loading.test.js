import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForOptionalAsset } from '../src/core/loading.js';
test('optional asset success, failure and rejection settle without retry', async () => {
  assert.equal(await waitForOptionalAsset(Promise.resolve(true)), 'loaded');
  assert.equal(await waitForOptionalAsset(Promise.resolve(false)), 'fallback');
  assert.equal(await waitForOptionalAsset(Promise.reject(new Error('decode'))), 'fallback');
});
test('optional asset deadline releases startup and late completion cannot settle it twice', async () => {
  let complete;
  const pending = new Promise(resolve => { complete = resolve; });
  const result = await waitForOptionalAsset(pending, 5);
  assert.equal(result, 'deferred'); complete(true); await pending;
  assert.equal(result, 'deferred');
});
