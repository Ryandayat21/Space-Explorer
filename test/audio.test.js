import test from 'node:test';
import assert from 'node:assert/strict';
import { readAudioPreferences, saveAudioPreferences, normalizeAudioPreferences } from '../src/data/audioPreferences.js';
import { AudioManager } from '../src/core/AudioManager.js';

test('audio preferences validate corrupt, missing, out-of-range and denied storage', () => {
  for (const raw of ['{broken', 'null', '[]', '"loud"', '{"volume":"1","muted":1}'])
    assert.deepEqual(readAudioPreferences(() => ({ getItem: () => raw })), { volume: .15, muted: false });
  assert.deepEqual(normalizeAudioPreferences({ volume: Infinity, muted: true }), { volume: .15, muted: true });
  assert.equal(normalizeAudioPreferences({ volume: 9 }).volume, 1);
  assert.equal(normalizeAudioPreferences({ volume: -1 }).volume, 0);
  const denied = () => { throw new Error('denied'); };
  assert.equal(saveAudioPreferences({}, denied), false);
  assert.equal(readAudioPreferences(denied).volume, .15);
  let saved;
  const storage = () => ({ getItem: () => saved, setItem: (key, value) => { saved = value; } });
  assert.equal(saveAudioPreferences({ muted: true, volume: 0, playing: true }, storage), true);
  assert.deepEqual(JSON.parse(saved), { muted: true, volume: 0 });
  assert.deepEqual(readAudioPreferences(storage), { muted: true, volume: 0 });
});

class FakeAudio extends EventTarget {
  currentTime = 17; calls = 0; paused = true;
  async play() { this.calls++; this.paused = false; }
  pause() { this.paused = true; }
  removeAttribute() {} load() {}
}
const setup = () => {
  const audio = new FakeAudio(), document = new EventTarget(); document.hidden = false;
  const manager = new AudioManager({ audio, document, getStorage: () => ({ getItem: () => null, setItem() {} }) });
  return { audio, document, manager };
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
test('audio starts only on request, fades, resumes only prior playback and keeps timeline', async () => {
  const { audio, document, manager } = setup();
  try {
    assert.equal(audio.calls, 0); assert.equal(audio.loop, true); assert.equal(audio.preload, 'none');
    await manager.play(); await wait(520); assert.equal(audio.volume, .15);
    manager.setPreferences({ muted: true }); await wait(520); assert.equal(audio.volume, 0);
    document.hidden = true; document.dispatchEvent(new Event('visibilitychange')); assert.equal(audio.paused, true);
    document.hidden = false; document.dispatchEvent(new Event('visibilitychange')); await wait(0);
    assert.equal(audio.calls, 2); assert.equal(audio.currentTime, 17);
    manager.pause(); await wait(520); assert.equal(audio.paused, true);
    document.hidden = true; document.dispatchEvent(new Event('visibilitychange'));
    document.hidden = false; document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(audio.calls, 2);
  } finally { manager.dispose(); }
  document.dispatchEvent(new Event('visibilitychange')); assert.equal(audio.calls, 2);
});
test('autoplay denial is retryable; media failure is terminal without repeated play attempts', async () => {
  const { audio, manager } = setup();
  try {
    audio.play = async () => { throw Object.assign(new Error(), { name: 'NotAllowedError' }); };
    await manager.play(); assert.equal(manager.state, 'blocked'); assert.equal(manager.wantsPlayback, false);
    audio.play = FakeAudio.prototype.play; await manager.play(); assert.equal(manager.state, 'playing');
    audio.dispatchEvent(new Event('error')); assert.equal(manager.state, 'unavailable');
    await manager.play(); assert.equal(audio.calls, 1); assert.equal(audio.paused, true);
  } finally { manager.dispose(); }
});
