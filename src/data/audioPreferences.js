import { reportFailure } from '../core/failures.js';
export const audioStorageKey = 'milky-way-observer.audio.v1';
export function normalizeAudioPreferences(value) {
  return {
    muted: typeof value?.muted === 'boolean' ? value.muted : false,
    volume: typeof value?.volume === 'number' && Number.isFinite(value.volume)
      ? Math.max(0, Math.min(1, value.volume)) : .15
  };
}
export function readAudioPreferences(getStorage = () => globalThis.localStorage) {
  try { return normalizeAudioPreferences(JSON.parse(getStorage().getItem(audioStorageKey))); }
  catch (error) { reportFailure('storage-audioPreferences', error); return normalizeAudioPreferences(null); }
}
export function saveAudioPreferences(value, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(audioStorageKey, JSON.stringify(normalizeAudioPreferences(value))); return true; }
  catch (error) { reportFailure('storage-audioPreferences', error); return false; }
}
