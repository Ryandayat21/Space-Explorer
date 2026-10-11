import * as THREE from 'three';
import { proximityFactor } from './cameraMath.js';

export class FlightControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = false;
    this.pointerLocked = false;
    this.speed = 18;
    this.velocity = new THREE.Vector3();
    this.localVelocity = new THREE.Vector3();
    this.effectiveSpeed = 18;
    this.keys = new Set();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.onKeyDown = (event) => {
      if (this.enabled && event.code === 'Escape') {
        if (document.pointerLockElement) document.exitPointerLock?.();
        this.reset();
        return;
      }
      if (!this.enabled || !this.pointerLocked || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
      if (['Space', 'ControlLeft', 'ControlRight'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
    };

    this.onKeyUp = (event) => {
      this.keys.delete(event.code);
    };

    this.onMouseMove = (event) => {
      if (!this.enabled || !this.pointerLocked) return;
      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= event.movementX * 0.0017;
      this.euler.x -= event.movementY * 0.0017;
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    };

    this.onPointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
      if (!this.pointerLocked) this.reset();
    };
    this.onBlur = () => this.reset();
    this.onWheel = (event) => {
      if (!this.enabled) return;
      event.preventDefault();
      this.speed = THREE.MathUtils.clamp(this.speed * Math.exp(-event.deltaY * 0.001), 1, 180);
    };
    window.addEventListener('blur', this.onBlur);
    domElement.addEventListener('wheel', this.onWheel, { passive: false });

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  activate() {
    this.enabled = true;
    this.euler.setFromQuaternion(this.camera.quaternion);
    try {
      this.domElement.requestPointerLock?.()?.catch(() => this.reset());
    } catch { this.reset(); }
  }

  deactivate() {
    this.enabled = false;
    this.reset();
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  reset() { this.keys.clear(); this.velocity.set(0, 0, 0); }

  update(delta, clearance = 100) {
    if (!this.enabled || !this.pointerLocked) return;

    const localVelocity = this.localVelocity.set(0, 0, 0);
    if (this.keys.has('KeyW')) localVelocity.z -= 1;
    if (this.keys.has('KeyS')) localVelocity.z += 1;
    if (this.keys.has('KeyA')) localVelocity.x -= 1;
    if (this.keys.has('KeyD')) localVelocity.x += 1;
    if (this.keys.has('Space')) localVelocity.y += 1;
    if (this.keys.has('ControlLeft') || this.keys.has('ControlRight')) localVelocity.y -= 1;

    this.effectiveSpeed = this.speed * proximityFactor(clearance) * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 3.5 : 1);
    if (localVelocity.lengthSq() > 0) {
      localVelocity.normalize().multiplyScalar(this.effectiveSpeed);
      localVelocity.applyQuaternion(this.camera.quaternion);
    }
    this.velocity.lerp(localVelocity, 1 - Math.exp(-10 * delta));
    this.camera.position.addScaledVector(this.velocity, delta);
  }

  dispose() {
    this.deactivate();
    window.removeEventListener('blur', this.onBlur);
    this.domElement.removeEventListener('wheel', this.onWheel);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}
