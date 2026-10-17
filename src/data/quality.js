export const qualityPresets = {
  low: { pixelRatio: .85, sphere: [24, 16], moon: [12, 8], stars: .28, effects: false },
  medium: { pixelRatio: 1.25, sphere: [40, 24], moon: [16, 12], stars: .56, effects: true },
  high: { pixelRatio: 1.75, sphere: [64, 40], moon: [24, 16], stars: 1, effects: true }
};
export const qualityStorageKey = 'milky-way-observer.quality.v1';
export function validQuality(value) { return typeof value === 'string' && Object.hasOwn(qualityPresets, value) ? value : 'medium'; }
export function readQuality(getStorage = () => globalThis.localStorage) {
  try { return validQuality(JSON.parse(getStorage().getItem(qualityStorageKey))); }
  catch { return 'medium'; }
}
export function saveQuality(value, getStorage = () => globalThis.localStorage) {
  try { getStorage().setItem(qualityStorageKey, JSON.stringify(validQuality(value))); return true; }
  catch { return false; }
}
