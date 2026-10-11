import * as THREE from 'three';

export class FlightControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = false;
    this.pointerLocked = false;
    this.speed = 18;
    this.keys = new Set();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.onKeyDown = (event) => {
      if (!this.enabled) return;
      this.keys.add(event.code);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') this.speed = 60;
    };

    this.onKeyUp = (event) => {
      this.keys.delete(event.code);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') this.speed = 18;
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
    };

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  activate() {
    this.enabled = true;
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.domElement.requestPointerLock?.();
  }

  deactivate() {
    this.enabled = false;
    this.keys.clear();
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  update(delta) {
    if (!this.enabled) return;

    const localVelocity = new THREE.Vector3();
    if (this.keys.has('KeyW')) localVelocity.z -= 1;
    if (this.keys.has('KeyS')) localVelocity.z += 1;
    if (this.keys.has('KeyA')) localVelocity.x -= 1;
    if (this.keys.has('KeyD')) localVelocity.x += 1;
    if (this.keys.has('Space')) localVelocity.y += 1;
    if (this.keys.has('ControlLeft') || this.keys.has('ControlRight')) localVelocity.y -= 1;

    if (localVelocity.lengthSq() > 0) {
      localVelocity.normalize().multiplyScalar(this.speed * delta);
      localVelocity.applyQuaternion(this.camera.quaternion);
      this.camera.position.add(localVelocity);
    }
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}
