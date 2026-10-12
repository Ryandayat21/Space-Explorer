export function visitDistance(radius, framing = 5.2) {
  return Math.max(radius * framing, radius + 1.2);
}
export function proximityFactor(clearance) {
  return Math.max(0.025, Math.min(1, clearance / 18));
}

// Used only when planning a visit, not in the animation loop. Ignore the
// selected body's own surface; every other body can occlude the approach.
export function clearApproach(target, destination, obstacles) {
  const delta = destination.map((value, index) => value - target[index]);
  const lengthSquared = delta.reduce((sum, value) => sum + value * value, 0);
  if (!lengthSquared) return false;
  return obstacles.every(({ center, radius }) => {
    const t = Math.max(0, Math.min(1, center.reduce((sum, value, index) =>
      sum + (value - target[index]) * delta[index], 0) / lengthSquared));
    return Math.hypot(...center.map((value, index) =>
      value - target[index] - t * delta[index])) > radius;
  });
}
