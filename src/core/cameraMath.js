export function visitDistance(radius, framing = 5.2) {
  return Math.max(radius * framing, radius + 1.2);
}
export function proximityFactor(clearance) {
  return Math.max(0.025, Math.min(1, clearance / 18));
}
