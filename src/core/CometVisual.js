import * as THREE from 'three';

// Inputs must share a coordinate frame. Reuse target in animation loops.
export function tailDirection(comet, sun, target) {
  target.subVectors(comet, sun);
  return target.lengthSq() > 1e-20 ? target.normalize() : target.set(1, 0, 0);
}

export class CometVisual extends THREE.Group {
  constructor(radius) {
    super();
    this.nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1),
      new THREE.MeshStandardMaterial({ color: 0x514b46, roughness: 1 }));
    this.add(this.nucleus);
    this.coma = new THREE.Mesh(new THREE.SphereGeometry(radius * 2.4, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x9bdcdd, transparent: true, opacity: .12,
        depthWrite: false, blending: THREE.AdditiveBlending }));
    this.coma.raycast = () => {};
    this.add(this.coma);
    // One open tapered mesh, fading to zero alpha at the far end. No particles.
    const geometry = new THREE.CylinderGeometry(1.8, .35, 1, 12, 1, true);
    geometry.translate(0, .5, 0);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 4);
    for (let index = 0; index < positions.count; index++) {
      colors.set([.55, .8, 1, (1 - positions.getY(index)) * .12], index * 4);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    this.tail = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true
    }));
    this.tail.raycast = () => {};
    this.add(this.tail);
    this.direction = new THREE.Vector3();
    this.axis = new THREE.Vector3(0, 1, 0);
    this.origin = new THREE.Vector3();
  }

  update(position) {
    // OrbitMotion's frame is centered on the Sun; root tilt is inherited by
    // both the position and tail, so local direction remains correct in world space.
    tailDirection(position, this.origin, this.direction);
    this.tail.quaternion.setFromUnitVectors(this.axis, this.direction);
    const activity = Math.min(1, 35 / Math.max(1, position.length()));
    this.tail.scale.set(1, 4 + 14 * activity, 1);
    this.tail.material.opacity = .25 + .75 * activity;
    this.coma.material.opacity = .04 + .08 * activity;
  }
}
