import * as THREE from 'three';
import { safeCameraRadius } from './cameraMath.js';

// Camera-only collision volumes; never changes body transforms or materials.
export class CameraSafety {
  constructor(system) {
    this.system = system;
    this.local = new THREE.Vector3();
    this.center = new THREE.Vector3();
    this.start = new THREE.Vector3();
    this.travel = new THREE.Vector3();
    this.rings = [];
    for (const object of system.objects.values()) {
      const ring = object.mesh.getObjectByName(`${object.data.id}-rings`);
      if (ring) this.rings.push(ring);
    }
  }

  resolve(position, previous) {
    if (previous) {
      this.travel.subVectors(position, previous);
      const lengthSquared = this.travel.lengthSq();
      if (lengthSquared > 1e-12) {
        let fraction = 1;
        for (const object of this.system.objects.values()) {
          object.group.getWorldPosition(this.center);
          this.start.subVectors(previous, this.center);
          const radius = safeCameraRadius(object.radius);
          const c = this.start.lengthSq() - radius * radius;
          const b = this.start.dot(this.travel);
          const discriminant = b*b - lengthSquared*c;
          if (c > 0 && b < 0 && discriminant >= 0) {
            const hit = (-b - Math.sqrt(discriminant)) / lengthSquared;
            if (hit >= 0 && hit < fraction) fraction = Math.max(0, hit - 1e-5);
          }
        }
        for (const ring of this.rings) {
          ring.updateWorldMatrix(true, false);
          ring.worldToLocal(this.start.copy(previous));
          ring.worldToLocal(this.local.copy(position));
          const side = Math.sign(this.start.z), boundary = side * .301;
          if (Math.abs(this.start.z) >= .3 && side * this.local.z < .301) {
            const hit = (boundary - this.start.z) / (this.local.z - this.start.z);
            const x = this.start.x + (this.local.x - this.start.x)*hit;
            const y = this.start.y + (this.local.y - this.start.y)*hit;
            const radial = Math.hypot(x,y), { innerRadius, outerRadius } = ring.geometry.parameters;
            if (hit >= 0 && hit < fraction && radial > innerRadius-.3 && radial < outerRadius+.3) fraction = Math.max(0, hit-1e-5);
          }
        }
        if (fraction < 1) position.copy(previous).addScaledVector(this.travel, fraction);
      }
    }
    // Revisit overlaps caused by compressed scene distances.
    for (let pass = 0; pass < 8; pass++) {
      let corrected = false;
      for (const object of this.system.objects.values()) {
        object.group.getWorldPosition(this.center);
        this.local.subVectors(position, this.center);
        const distance = this.local.length(), safe = safeCameraRadius(object.radius);
        if (distance < safe) {
          if (distance < 1e-8) this.local.set(0, 1, 0); else this.local.divideScalar(distance);
          position.copy(this.center).addScaledVector(this.local, safe + 1e-5);
          corrected = true;
        }
      }
      for (const ring of this.rings) {
        ring.updateWorldMatrix(true, false);
        ring.worldToLocal(this.local.copy(position));
        const radial = Math.hypot(this.local.x, this.local.y);
        const { innerRadius, outerRadius } = ring.geometry.parameters;
        if (radial > innerRadius - .3 && radial < outerRadius + .3 && Math.abs(this.local.z) < .3) {
          this.local.z = this.local.z < 0 ? -.301 : .301;
          position.copy(ring.localToWorld(this.local)); corrected = true;
        }
      }
      if (!corrected) break;
    }
    return position;
  }
}
