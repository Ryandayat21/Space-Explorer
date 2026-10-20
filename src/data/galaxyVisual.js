// Educational illustration, not an observational fit or a catalog of real stars.
// Radii/heights are model units independent of SolarSystem's compressed AU scale.
export const galaxyVisual = {
  seed: 512018,
  barAngle: .35,
  arms: [0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((phase, index) => ({
    id: `illustrative-arm-${index + 1}`, phase: phase + .35,
    inner: 3.2, outer: 14, pitch: .35, width: .38, height: .16
  })),
  spur: { phase: 1.15, inner: 7.1, outer: 9.8, pitch: .35, width: .22, height: .12 },
  counts: { core: 2400, bulge: 6000, bar: 3600, arms: 24000, spur: 2400, disk: 9600, halo: 2400 }
};
export const galaxyQuality = { low: .25, medium: .6, high: 1 };
