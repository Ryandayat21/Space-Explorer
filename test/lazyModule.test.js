import test from 'node:test';
import assert from 'node:assert/strict';
import { lazyModule } from '../src/core/lazyModule.js';

test('lazy import does not run before demand and shares one resolved request', async () => {
  let calls = 0;
  const module = {}, load = lazyModule(() => { calls++; return module; });
  assert.equal(calls, 0);
  const first = load(); assert.equal(load(), first);
  assert.equal(await first, module); assert.equal(await load(), module); assert.equal(calls, 1);
});
test('lazy import rejection is cached without automatic retries', async () => {
  let calls = 0;
  const load = lazyModule(() => { calls++; throw new Error('chunk unavailable'); });
  await assert.rejects(load(), /chunk unavailable/);
  await assert.rejects(load(), /chunk unavailable/); assert.equal(calls, 1);
});
test('timeout rejects and late module resolution cannot restart initialization', async () => {
  let finish;
  const load = lazyModule(() => new Promise(resolve => { finish = resolve; }), 5);
  const pending = load(); await assert.rejects(pending, /timed out/);
  finish({}); await assert.rejects(load(), /timed out/);
});
