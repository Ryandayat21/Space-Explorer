import { bodies, moons, orbitRadiusFromAu, visualRadiusFromEarth } from './celestialBodies.js';
import { validateOrbit } from '../core/orbitMath.js';
import { dwarfPlanets, dwarfPlanetScience } from './dwarfPlanets.js';

const DEG = Math.PI / 180;
// NASA Planetary Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/
const planetInclinations = { mercury: 7, venus: 3.4, earth: 0, mars: 1.8, jupiter: 1.3, saturn: 2.5, uranus: 0.8, neptune: 1.8 };
// Rounded mean elements: https://ssd.jpl.nasa.gov/sats/elem/sep.html
// Moon uses NASA's ecliptic values. Laplace planes are approximated by the
// parent's equatorial plane; no ascending node, precession or calendar epoch.
const satelliteElements = {
  moon: [0.055, 5.1], phobos: [0.015, 1.1], deimos: [0, 1.8],
  io: [0.004, 0], europa: [0.009, 0.5], ganymede: [0.001, 0.2], callisto: [0.007, 0.3],
  mimas: [0.020, 1.6], enceladus: [0.005, 0], tethys: [0.001, 1.1], dione: [0.002, 0],
  rhea: [0.001, 0.3], titan: [0.029, 0.3], iapetus: [0.028, 7.6],
  miranda: [0.001, 4.4], ariel: [0.001, 0], umbriel: [0.004, 0.1], titania: [0.002, 0.1], oberon: [0.002, 0.1],
  triton: [0, 157.3], nereid: [0.751, 5.1], proteus: [0, 0]
};

export const orbitalElements = Object.fromEntries([
  ...dwarfPlanets.map(body => {
    const science = dwarfPlanetScience[body.id];
    return [body.id, validateOrbit({
      parent: 'sun', semiMajorAxis: orbitRadiusFromAu(science.semiMajorAxisAu),
      eccentricity: science.eccentricity, inclination: science.inclinationDegrees * DEG,
      orbitalPeriod: science.orbitalPeriodDays, initialAngle: body.initialAngle,
      referencePlane: 'ecliptic'
    })];
  }),
  ...bodies.filter(body => body.type === 'planet').map(body => [body.id, validateOrbit({
    parent: 'sun', semiMajorAxis: orbitRadiusFromAu(body.orbitAu),
    eccentricity: body.eccentricity, inclination: planetInclinations[body.id] * DEG,
    orbitalPeriod: body.orbitalPeriodDays,
    initialAngle: [...body.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.13,
    referencePlane: 'ecliptic'
  })]),
  ...moons.map(moon => {
    const siblings = moons.filter(other => other.parent === moon.parent);
    const parent = bodies.find(body => body.id === moon.parent);
    const [sourceEccentricity, sourceInclination] = satelliteElements[moon.id];
    // Compressed moon distances and enlarged bodies would put Nereid inside
    // Neptune at periapsis. Keep the existing semi-major axis, limit visual e.
    const maximumE = Math.max(0, 1 - (visualRadiusFromEarth(parent.radiusEarth) + moon.size + 0.35) / moon.distance);
    return [moon.id, validateOrbit({
      parent: moon.parent, semiMajorAxis: moon.distance,
      eccentricity: Math.min(sourceEccentricity, maximumE), sourceEccentricity,
      // Retrograde direction already lives in the signed catalog period.
      inclination: (moon.period < 0 ? 180 - sourceInclination : sourceInclination) * DEG,
      sourceInclinationDegrees: sourceInclination, orbitalPeriod: moon.period,
      initialAngle: siblings.indexOf(moon) / siblings.length * Math.PI * 2,
      referencePlane: ['moon', 'nereid'].includes(moon.id) ? 'ecliptic' : 'equatorial'
    })];
  })
]);
