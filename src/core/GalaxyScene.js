import * as THREE from 'three';
import { galaxyVisual, galaxyQuality } from '../data/galaxyVisual.js';
import { validQuality } from '../data/quality.js';

// Each point is a visual density sample, NOT one real catalog star.
// Static buffers: no per-frame animation, allocation, or pickable landmarks.
export class GalaxyScene extends THREE.Group {
  constructor(quality = 'medium', seed = galaxyVisual.seed) {
    super(); this.name = 'educational-galaxy'; this.pointLayers = [];
    let state = seed >>> 0;
    const random = () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
    const normal = () => Math.max(-3, Math.min(3, Math.sqrt(-2 * Math.log(Math.max(1e-9, random()))) * Math.cos(2 * Math.PI * random())));
    const pixels = new Uint8Array(16 * 16 * 4);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const falloff = Math.max(0, 1 - Math.hypot((x - 7.5) / 7.5, (y - 7.5) / 7.5));
      pixels.set([255, 255, 255, Math.round(255 * falloff * falloff)], (y * 16 + x) * 4);
    }
    this.sprite = new THREE.DataTexture(pixels, 16, 16);
    this.sprite.magFilter = THREE.LinearFilter; this.sprite.needsUpdate = true;
    // All seven components encode brightness in vertex colors; only size differs.
    this.materials = [1.5, 2.5, 4].map(size => new THREE.PointsMaterial({ map: this.sprite, size,
      sizeAttenuation: false, vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.matrixAutoUpdate = false;
    const color = new THREE.Color();
    for (const [component, total] of Object.entries(galaxyVisual.counts)) {
      for (let sizeBin = 0; sizeBin < 3; sizeBin++) {
        const count = total / 3, positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          let x, y, z;
          if (component === 'arms' || component === 'spur') {
            const arm = component === 'spur' ? galaxyVisual.spur : galaxyVisual.arms[Math.floor(random() * galaxyVisual.arms.length)];
            const r = arm.inner + (arm.outer - arm.inner) * random();
            const angle = arm.phase + Math.log(r / arm.inner) / Math.tan(arm.pitch);
            x = r * Math.cos(angle) + normal() * arm.width;
            z = -r * Math.sin(angle) + normal() * arm.width;
            y = normal() * arm.height * (.5 + r / 14);
          } else if (component === 'disk') {
            const r = 14 * Math.sqrt(random()) * Math.sqrt(random()), angle = random() * Math.PI * 2;
            x = r * Math.cos(angle); z = -r * Math.sin(angle); y = normal() * (.12 + r * .012);
          } else {
            const scale = { core: [.48, .35, .48], bulge: [1.65, .8, 1.25], bar: [2.5, .25, .4], halo: [5.5, 3.5, 5.5] }[component];
            const a = normal() * scale[0], b = normal() * scale[2];
            x = a * Math.cos(galaxyVisual.barAngle) + b * Math.sin(galaxyVisual.barAngle);
            z = -a * Math.sin(galaxyVisual.barAngle) + b * Math.cos(galaxyVisual.barAngle);
            y = normal() * scale[1];
          }
          positions.set([x, y, z], i * 3);
          const warm = ['core', 'bulge', 'bar'].includes(component);
          color.set(warm ? (random() < .75 ? 0xffd7a0 : 0xfff0d8) : (random() < .65 ? 0x9bbfff : 0xf6e4df));
          const intensity = component === 'halo' ? .045 : component === 'disk' ? .13 : .35;
          color.multiplyScalar(intensity * (.45 + random() * .8));
          colors.set([color.r, color.g, color.b], i * 3);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeBoundingSphere();
        const material = this.materials[sizeBin];
        const points = new THREE.Points(geometry, material);
        points.matrixAutoUpdate = false; // Positions are static buffer data.
        points.frustumCulled = true; // Per-layer bounds computed above; no per-point CPU work.
        points.name = component; points.raycast = () => {};
        this.pointLayers.push(points); this.add(points);
      }
    }
    this.setQuality(quality);
  }
  setQuality(quality) {
    this.quality = validQuality(quality);
    for (const layer of this.pointLayers)
      layer.geometry.setDrawRange(0, Math.round(layer.geometry.attributes.position.count * galaxyQuality[this.quality]));
  }
  get particleCount() { return this.pointLayers.reduce((sum, layer) => sum + layer.geometry.drawRange.count, 0); }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const layer of this.pointLayers) layer.geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.sprite.dispose(); this.clear(); this.pointLayers.length = 0;
  }
}
