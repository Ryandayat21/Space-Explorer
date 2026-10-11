const TAU = Math.PI * 2;

// Angles in radians; distances in scene units; signed periods in simulation days.
export function validateOrbit(elements) {
  const { semiMajorAxis, eccentricity, inclination, orbitalPeriod, initialAngle } = elements;
  if (![semiMajorAxis, eccentricity, inclination, orbitalPeriod, initialAngle].every(Number.isFinite)
    || semiMajorAxis <= 0 || eccentricity < 0 || eccentricity >= 1 || orbitalPeriod === 0) {
    throw new RangeError('Invalid elliptical orbital elements');
  }
  return elements;
}

export function positionAtEccentricAngle(elements, angle, target) {
  const { semiMajorAxis: a, eccentricity: e, inclination: i } = elements;
  const minor = a * Math.sqrt(1 - e * e) * Math.sin(angle);
  target.x = a * (Math.cos(angle) - e);
  target.y = minor * Math.sin(i);
  target.z = -minor * Math.cos(i);
  return target;
}

export function orbitalPosition(elements, elapsedDays, target) {
  if (!Number.isFinite(elapsedDays)) throw new RangeError('Simulation time must be finite');
  // Reduce before multiplication to keep phases finite even at very large times.
  const phase = (elements.initialAngle % TAU) + (elapsedDays % elements.orbitalPeriod) / elements.orbitalPeriod * TAU;
  const mean = ((phase + Math.PI) % TAU + TAU) % TAU - Math.PI;
  const e = elements.eccentricity;
  let lower = -Math.PI, upper = Math.PI, angle = mean;
  // Safeguarded Newton solve of E - e sin(E) = M; bisection handles high e.
  for (let iteration = 0; iteration < 48; iteration++) {
    const residual = angle - e * Math.sin(angle) - mean;
    if (Math.abs(residual) < 1e-12) break;
    if (residual > 0) upper = angle; else lower = angle;
    const next = angle - residual / (1 - e * Math.cos(angle));
    angle = next > lower && next < upper ? next : (lower + upper) / 2;
  }
  return positionAtEccentricAngle(elements, angle, target);
}
