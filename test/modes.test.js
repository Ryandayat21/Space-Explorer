import test from 'node:test';
import assert from 'node:assert/strict';
import { ModeController } from '../src/core/ModeController.js';
function fake(id) {
  const calls = [];
  return { id, calls, initialize() { calls.push('init'); }, activate() { calls.push('on'); },
    deactivate() { calls.push('off'); }, update(dt) { calls.push(dt); },
    resize(w, h) { calls.push([w, h]); }, dispose() { calls.push('dispose'); } };
}
test('modes initialize once, update only active mode and retain latest resize', () => {
  const a = fake('solar-system'), b = fake('galaxy'), manager = new ModeController([a, b]);
  manager.resize(1366, 768); manager.activate(a.id); manager.update(.02, 1);
  manager.activate(b.id); manager.update(.03, 2); manager.activate(a.id); manager.activate(a.id);
  assert.equal(a.calls.filter(x => x === 'init').length, 1);
  assert.equal(a.calls.filter(x => x === 'on').length, 2);
  assert.ok(a.calls.includes(.02)); assert.ok(!a.calls.includes(.03));
  assert.deepEqual(b.calls, ['init', [1366, 768], 'on', .03, 'off']);
  manager.deactivate(); manager.update(.04, 3); assert.ok(!a.calls.includes(.04));
  manager.dispose(); manager.dispose();
  assert.equal(a.calls.filter(x => x === 'dispose').length, 1);
  assert.throws(() => manager.activate(a.id));
});
test('failed activation rolls back; invalid IDs do not deactivate active mode', () => {
  const a = fake('solar-system'), b = fake('galaxy'), manager = new ModeController([a,b]);
  manager.activate(a.id);
  assert.throws(() => manager.activate('missing')); assert.equal(manager.active, a);
  b.activate = () => { throw new Error('activation failed'); };
  assert.throws(() => manager.activate(b.id)); assert.equal(manager.active, a);
  assert.equal(a.calls.at(-1), 'on'); assert.equal(b.calls.at(-1), 'off');
  manager.dispose();
});
test('failed initialize cleans partial mode while leaving current mode active', () => {
  const a = fake('solar-system'), b = fake('galaxy'), manager = new ModeController([a,b]);
  manager.activate(a.id); b.initialize = () => { throw new Error('init failed'); };
  assert.throws(() => manager.activate(b.id)); assert.equal(manager.active, a);
  assert.deepEqual(b.calls, ['dispose']); manager.dispose();
});
