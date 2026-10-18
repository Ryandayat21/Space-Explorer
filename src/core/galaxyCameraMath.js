export const galaxyCameraLimit = 80;
export function galaxyAdaptiveSpeed(distance, multiplier = 1) {
  const d = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  const m = Number.isFinite(multiplier) ? Math.max(.25, Math.min(4, multiplier)) : 1;
  return Math.min(32, (.4 + Math.min(d, galaxyCameraLimit) * .18) * m);
}
// Scale a vector back onto the allowed sphere, without allocating a vector.
export function galaxyBoundaryScale(distance) {
  return Number.isFinite(distance) && distance > galaxyCameraLimit ? galaxyCameraLimit / distance : 1;
}
export const galaxyCameraPresets = {
  top: { position: [0, 36, .01], target: [0, 0, 0] },
  overview: { position: [0, 20, 30], target: [0, 0, 0] },
  center: { position: [0, 3, 5], target: [0, 0, 0] },
  // Illustrative region only, not a verified galactocentric solar coordinate.
  solar: { position: [8, 3, 5], target: [8, 0, 0] }
};
