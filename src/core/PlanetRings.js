import * as THREE from 'three';

// Illustrative radial bands in existing scene scale, not measured ring radii.
// One RGBA strip provides all layers without stacked meshes or external assets.
const profiles = {
  saturn: {
    inner: 1.25, outer: 2.25,
    bands: [
      [0.00, 0.12, 0.12, 151, 137, 119],
      [0.13, 0.34, 0.32, 183, 165, 137],
      [0.35, 0.68, 0.80, 216, 198, 159],
      // Wide dark division between the dense inner and outer bands.
      [0.73, 0.96, 0.57, 197, 178, 144],
      [0.98, 1.00, 0.20, 220, 204, 176]
    ]
  },
  uranus: {
    inner: 1.55, outer: 1.62,
    bands: [
      [0.05, 0.10, 0.10, 111, 120, 124],
      [0.27, 0.32, 0.12, 117, 126, 128],
      [0.52, 0.58, 0.13, 121, 130, 132],
      [0.86, 0.97, 0.22, 138, 146, 144]
    ]
  }
};

export function createPlanetRings(planetId, radius) {
  const profile = profiles[planetId];
  if (!profile || !Number.isFinite(radius) || radius <= 0) throw new RangeError('Invalid planet ring parameters');
  const width = 512;
  const pixels = new Uint8Array(width * 4);
  for (let index = 0; index < width; index++) {
    const radial = index / (width - 1);
    const band = profile.bands.find(([start, end]) => radial >= start && radial <= end);
    if (!band) continue;
    const [start, end, opacity, red, green, blue] = band;
    const edge = Math.min(1, (radial - start) * width / 2, (end - radial) * width / 2);
    const detail = 0.77 + 0.14 * Math.sin(index * 2.17) + 0.09 * Math.sin(index * 0.53);
    pixels.set([red, green, blue, Math.round(255 * opacity * edge * detail)], index * 4);
  }
  const texture = new THREE.DataTexture(pixels, width, 1, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const inner = radius * profile.inner, outer = radius * profile.outer;
  const geometry = new THREE.RingGeometry(inner, outer, 128);
  const positions = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let index = 0; index < positions.count; index++) {
    uv.setXY(index, (Math.hypot(positions.getX(index), positions.getY(index)) - inner) / (outer - inner), 0.5);
  }
  const material = new THREE.MeshStandardMaterial({
    map: texture, roughness: 1, metalness: 0, side: THREE.DoubleSide,
    transparent: true, depthWrite: false, depthTest: true, forceSinglePass: true
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.name = `${planetId}-rings`;
  ring.rotation.x = Math.PI / 2;
  // Decorative only, even if a future picker traverses planet children.
  ring.raycast = () => {};
  return ring;
}
