// Illustrative region extents, not individual measured asteroid orbits.
// Kuiper overview: https://science.nasa.gov/solar-system/kuiper-belt/facts/
// Its main region is roughly 30-50 AU; our inner edge is 32 AU to visually
// separate it from Neptune in the existing compressed orbital scale.
export const smallBodyRegions = [
  { id: 'asteroid-belt', innerAu: 2.1, outerAu: 3.25, halfHeight: 1.05,
    seed: 81517, counts: { low: 600, medium: 1200, high: 1900 },
    color: 0x7f8793, size: 0.18, opacity: 0.48, angularSpeed: 0.002 },
  { id: 'kuiper-belt', innerAu: 32, outerAu: 50, halfHeight: 5,
    seed: 90317, counts: { low: 900, medium: 1800, high: 3600 },
    color: 0x91abc3, size: 0.32, opacity: 0.5, angularSpeed: 0.00006 }
];
