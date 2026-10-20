import test from 'node:test';
import assert from 'node:assert/strict';
import { ModeController } from '../src/core/ModeController.js';
import { ModeTransition } from '../src/core/ModeTransition.js';
function setup(hooks = {}) {
  const make = id => ({ id, initialize() {}, resize() {}, activate() {}, deactivate() {}, dispose() {} });
  const manager = new ModeController([make('solar'), make('galaxy')]); manager.activate('solar');
  return { manager, transition: new ModeTransition(manager, hooks) };
}
function prepare(transition) {
  let frames = 0;
  while (transition.phase === 'preparing' && frames++ < 8) transition.update(0);
  assert.notEqual(transition.phase, 'preparing', 'bounded local preparation');
}

test('transition prepares before activation, ignores repeats and swaps at opaque midpoint', () => {
  const events = [];
  const { manager, transition } = setup({ prepare: () => events.push('ready'), lock: () => events.push('lock'), frame: amount => events.push(amount) });
  assert.equal(transition.start('galaxy'), true); assert.deepEqual(events, ['lock']);
  prepare(transition); assert.deepEqual(events, ['lock', 'ready']);
  assert.equal(manager.active.id, 'solar'); assert.equal(transition.start('galaxy'), false);
  transition.update(.65); assert.equal(manager.active.id, 'galaxy'); assert.equal(events.at(-1), 1);
  transition.update(.65); assert.equal(transition.busy, false);
  transition.start('solar', true); prepare(transition); transition.update(.08); transition.update(.08);
  assert.equal(manager.active.id, 'solar'); assert.equal(transition.busy, false);
});
test('skip works in both phases, repeated switches reuse modes and dispose is idempotent', () => {
  let unlocked = 0;
  const { manager, transition } = setup({ unlock: () => unlocked++ });
  for (let i = 0; i < 6; i++) { transition.start(i % 2 ? 'solar' : 'galaxy'); if (i % 2) { prepare(transition); transition.update(.65); } transition.skip(); prepare(transition); }
  assert.equal(unlocked, 6); assert.equal(manager.initialized.size, 2);
  transition.start('galaxy'); transition.dispose(); transition.dispose(); assert.equal(unlocked, 7);
  assert.equal(transition.start('galaxy'), false);
});
test('preparation and activation failures unlock and preserve previous mode', () => {
  let errors = 0;
  const { manager, transition } = setup({ error: () => errors++, prepare: () => { throw Error('not ready'); } });
  transition.start('galaxy'); prepare(transition); assert.equal(manager.active.id, 'solar'); assert.equal(transition.busy, false);
  transition.hooks.prepare = () => {};
  manager.modes.get('galaxy').activate = () => { throw Error('failed'); };
  transition.start('galaxy'); transition.skip(); prepare(transition); assert.equal(manager.active.id, 'solar'); assert.equal(transition.busy, false); assert.equal(errors, 2);
});

test('preparation exposes real stages before swap and never activates an unprepared destination', () => {
  const stages = [];
  const { manager, transition } = setup({ stage: stage => stages.push(stage) });
  let initialized = 0;
  manager.modes.get('galaxy').initialize = () => initialized++;
  transition.start('galaxy'); assert.equal(initialized, 0);
  transition.update(0); assert.equal(initialized, 0); // Overlay gets a paint before heavy work.
  transition.skip(); assert.equal(manager.active.id, 'solar');
  prepare(transition);
  assert.deepEqual(stages, ['initializing', 'assets', 'scene', 'ready']);
  assert.equal(initialized, 1); assert.equal(manager.active.id, 'galaxy'); assert.equal(transition.busy, false);
});

test('async preparation rejection unlocks without activating destination', async () => {
  const errors = [];
  const { manager, transition } = setup({ prepare: () => Promise.reject(new Error('asset unavailable')), error: error => errors.push(error) });
  transition.start('galaxy'); prepare(transition);
  assert.equal(transition.phase, 'waiting'); transition.skip();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(manager.active.id, 'solar'); assert.equal(transition.busy, false);
  assert.equal(errors.length, 1);
});

test('disposed transition ignores late preparation completion', async () => {
  let resolve;
  const { manager, transition } = setup({ prepare: () => new Promise(done => { resolve = done; }) });
  transition.start('galaxy'); prepare(transition); transition.dispose(); resolve();
  await new Promise(done => setImmediate(done));
  assert.equal(manager.active.id, 'solar'); assert.equal(transition.busy, false);
});

test('mode module loads before initialize and ignores completion after dispose', async () => {
  let finish, loaded = false;
  const { manager, transition } = setup({ load: () => loaded ? undefined : new Promise(resolve => { finish = () => { loaded = true; resolve(); }; }) });
  transition.start('galaxy'); transition.update(0); transition.update(0);
  assert.equal(transition.phase, 'waiting'); assert.equal(manager.initialized.has('galaxy'), false);
  finish(); await new Promise(resolve => setImmediate(resolve));
  prepare(transition); transition.skip(); assert.equal(manager.active.id, 'galaxy');
  loaded = false; transition.start('solar'); transition.update(0); transition.update(0);
  transition.dispose(); finish(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(transition.busy, false); assert.equal(manager.active.id, 'galaxy');
});
