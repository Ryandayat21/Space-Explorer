import * as THREE from 'three';
import { orbitRadiusFromAu } from '../data/celestialBodies.js';

export class SmallBodyRegion extends THREE.Points {
  constructor(config) {
    let seed = config.seed % 2147483647;
    if (seed <= 0) seed += 2147483646;
    const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
    const positions = new Float32Array(config.counts.high * 3);
    const inner = orbitRadiusFromAu(config.innerAu), outer = orbitRadiusFromAu(config.outerAu);
    for (let index = 0; index < config.counts.high; index++) {
      const angle = random() * Math.PI * 2;
      // Area-uniform annulus, with density concentrated near the midplane.
      const radius = Math.sqrt(inner * inner + random() * (outer * outer - inner * inner));
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (random() - random()) * config.halfHeight;
      positions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    const material = new THREE.PointsMaterial({
      color: config.color, size: config.size, transparent: true,
      opacity: config.opacity, depthWrite: false, sizeAttenuation: true
    });
    super(geometry, material);
    this.name = config.id;
    this.config = config;
    this.raycast = () => {}; // Decorative regions never intercept body picking.
    this.setQuality('high');
  }

  setQuality(quality) {
    this.geometry.setDrawRange(0, this.config.counts[quality] ?? this.config.counts.high);
  }

  update(deltaDays) {
    // Only one transform per belt; no per-particle updates or allocations.
    this.rotation.y = (this.rotation.y + deltaDays * this.config.angularSpeed) % (Math.PI * 2);
  }
}
