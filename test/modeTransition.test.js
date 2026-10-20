import test from 'node:test';
import assert from 'node:assert/strict';
import { ModeController } from '../src/core/ModeController.js';
import { ModeTransition } from '../src/core/ModeTransition.js';
function setup(hooks = {}) {
  const make = id => ({ id, initialize() {}, resize() {}, activate() {}, deactivate() {}, dispose() {} });
  const manager = new ModeController([make('solar'), make('galaxy')]); manager.activate('solar');
  return { manager, transition: new ModeTransition(manager, hooks) };
}
test('transition prepares before activation, ignores repeats and swaps at opaque midpoint', () => {
  const events = [];
  const { manager, transition } = setup({ prepare: () => events.push('ready'), lock: () => events.push('lock'), frame: amount => events.push(amount) });
  assert.equal(transition.start('galaxy'), true); assert.deepEqual(events, ['ready', 'lock']);
  assert.equal(manager.active.id, 'solar'); assert.equal(transition.start('galaxy'), false);
  transition.update(.65); assert.equal(manager.active.id, 'galaxy'); assert.equal(events.at(-1), 1);
  transition.update(.65); assert.equal(transition.busy, false);
  transition.start('solar', true); transition.update(.08); transition.update(.08);
  assert.equal(manager.active.id, 'solar'); assert.equal(transition.busy, false);
});
test('skip works in both phases, repeated switches reuse modes and dispose is idempotent', () => {
  let unlocked = 0;
  const { manager, transition } = setup({ unlock: () => unlocked++ });
  for (let i = 0; i < 6; i++) { transition.start(i % 2 ? 'solar' : 'galaxy'); if (i % 2) transition.update(.65); transition.skip(); }
  assert.equal(unlocked, 6); assert.equal(manager.initialized.size, 2);
  transition.start('galaxy'); transition.dispose(); transition.dispose(); assert.equal(unlocked, 7);
  assert.equal(transition.start('galaxy'), false);
});
test('preparation and activation failures unlock and preserve previous mode', () => {
  let errors = 0;
  const { manager, transition } = setup({ error: () => errors++, prepare: () => { throw Error('not ready'); } });
  transition.start('galaxy'); assert.equal(manager.active.id, 'solar'); assert.equal(transition.busy, false);
  transition.hooks.prepare = () => {};
  manager.modes.get('galaxy').activate = () => { throw Error('failed'); };
  transition.start('galaxy'); transition.skip(); assert.equal(manager.active.id, 'solar'); assert.equal(transition.busy, false); assert.equal(errors, 2);
});
