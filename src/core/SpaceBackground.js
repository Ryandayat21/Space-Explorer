import * as THREE from 'three';

function randomSequence(seed) {
  let state = seed >>> 0;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
}

// Decorative sky only: fixed directions, no stellar catalog or galactic distances.
export class SpaceBackground extends THREE.Group {
  constructor(seed = 42042) {
    super();
    this.name = 'decorative-space-background';
    const random = randomSequence(seed), color = new THREE.Color();
    this.starLayers = [];
    const pixels = new Uint8Array(16 * 16 * 4);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const falloff = Math.max(0, 1 - Math.hypot((x - 7.5) / 7.5, (y - 7.5) / 7.5));
      const value = Math.round(255 * falloff * falloff);
      pixels.set([value, value, value, 255], (y * 16 + x) * 4);
    }
    const sprite = new THREE.DataTexture(pixels, 16, 16);
    sprite.magFilter = THREE.LinearFilter; sprite.needsUpdate = true;
    for (const [index, count] of [6000, 2400, 600].entries()) {
      const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const z = random() * 2 - 1, angle = random() * Math.PI * 2;
        const radial = Math.sqrt(1 - z * z);
        positions.set([1800 * radial * Math.cos(angle), 1800 * z, 1800 * radial * Math.sin(angle)], i * 3);
        const warmth = random();
        color.set(warmth < .18 ? 0xffe2c2 : warmth > .76 ? 0xd6e6ff : 0xf3f2ed);
        color.multiplyScalar(.25 + random() * .55);
        colors.set([color.r, color.g, color.b], i * 3);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({ map: sprite, size: [1.4, 2.2, 3.2][index],
        sizeAttenuation: false, vertexColors: true, blending: THREE.AdditiveBlending,
        depthTest: false, depthWrite: false, fog: false, toneMapped: false });
      const points = new THREE.Points(geometry, material);
      // Opaque render queue + additive blend: draw sky BEFORE every scene surface.
      points.renderOrder = -199; points.raycast = () => {};
      this.add(points); this.starLayers.push(points);
    }
    const geometry = new THREE.SphereGeometry(1900, 64, 32);
    const positions = geometry.attributes.position, colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) / 1900, y = positions.getY(i) / 1900, z = positions.getZ(i) / 1900;
      const band = Math.exp(-Math.pow((y + .35 * x) / .22, 2));
      const cloud = .5 + .25 * Math.sin(5 * x + 3 * z) + .25 * Math.sin(9 * z - 2 * x);
      color.setRGB(.0003 + band * cloud * .0015, .0006 + band * cloud * .002, .0015 + band * cloud * .004);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.haze = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true,
      side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
    this.haze.renderOrder = -200; this.haze.raycast = () => {};
    this.add(this.haze);
  }

  update(camera) { this.position.copy(camera.position); }

  setQuality(quality) {
    const fraction = quality === 'low' ? .28 : quality === 'medium' ? .56 : 1;
    for (const layer of this.starLayers) layer.geometry.setDrawRange(0, Math.floor(layer.geometry.attributes.position.count * fraction));
    this.haze.visible = quality !== 'low';
  }
}
