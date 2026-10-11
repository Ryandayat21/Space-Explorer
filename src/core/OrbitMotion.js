import * as THREE from 'three';
import { orbitalPosition, positionAtEccentricAngle, validateOrbit } from './orbitMath.js';

// A stationary reference frame under the moving parent; body tilt/spin must
// live below `group`, never on this frame. Lines and motion share local axes.
export class OrbitMotion {
  constructor(parent, elements, { equatorialTilt = 0, color = 0x315177, opacity = 0.28 } = {}) {
    this.elements = validateOrbit(elements);
    this.frame = new THREE.Group();
    this.frame.rotation.z = elements.referencePlane === 'equatorial' ? equatorialTilt : 0;
    parent.add(this.frame);
    this.group = new THREE.Group();
    this.frame.add(this.group);
    const points = [];
    for (let index = 0; index <= 160; index++) {
      points.push(positionAtEccentricAngle(elements, index / 160 * Math.PI * 2, new THREE.Vector3()));
    }
    this.line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
    );
    this.frame.add(this.line);
    this.update(0);
  }

  update(elapsedDays) {
    orbitalPosition(this.elements, elapsedDays, this.group.position);
  }
}
