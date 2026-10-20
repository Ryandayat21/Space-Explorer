import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cinematicEase } from './cameraMath.js';
import { galaxyAdaptiveSpeed, galaxyBoundaryScale, galaxyCameraPresets } from './galaxyCameraMath.js';

export class GalaxyCameraControls {
  constructor(camera, canvas) {
    this.camera = camera; this.canvas = canvas; this.keys = new Set(); this.multiplier = 1;
    this.orbit = new OrbitControls(camera, canvas);
    this.orbit.minDistance = .4; this.orbit.maxDistance = 60; this.orbit.enablePan = false; this.orbit.enabled = false;
    this.velocity = new THREE.Vector3(); this.direction = new THREE.Vector3(); this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.fromPosition = new THREE.Vector3(); this.fromTarget = new THREE.Vector3();
    this.toPosition = new THREE.Vector3(); this.toTarget = new THREE.Vector3();
    this.fromRotation = new THREE.Quaternion(); this.lookCamera = camera.clone();
    this.motion = matchMedia('(prefers-reduced-motion: reduce)'); this.listeners = [];
    this.button = document.getElementById('galaxy-flight');
    const listen = (target, type, handler, options) => {
      target.addEventListener(type, handler, options);
      this.listeners.push(() => target.removeEventListener(type, handler, options));
    };
    listen(this.button, 'click', () => { if (this.active) this.flight ? this.leaveFlight() : this.enterFlight(); });
    listen(document.getElementById('galaxy-reset'), 'click', () => this.preset('overview'));
    for (const button of document.querySelectorAll('[data-galaxy-view]'))
      listen(button, 'click', () => this.preset(button.dataset.galaxyView));
    listen(window, 'keydown', event => {
      if (!this.active || document.querySelector('dialog[open]')) return;
      if (event.code === 'Escape') { this.cancel(); this.leaveFlight(); return; }
      if (!this.flight || document.pointerLockElement !== canvas || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName) || event.target.isContentEditable) return;
      if (['Space', 'ControlLeft', 'ControlRight'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
    });
    listen(window, 'keyup', event => this.keys.delete(event.code));
    listen(window, 'blur', () => this.resetMovement());
    listen(document, 'visibilitychange', () => { if (document.hidden && this.active) { this.cancel(); this.leaveFlight(); } });
    listen(document, 'pointerlockchange', () => {
      if (this.flight && document.pointerLockElement !== canvas) this.leaveFlight();
    });
    listen(document, 'mousemove', event => {
      if (!this.active || !this.flight || document.pointerLockElement !== canvas) return;
      this.euler.setFromQuaternion(camera.quaternion);
      this.euler.y -= event.movementX * .0017;
      this.euler.x = THREE.MathUtils.clamp(this.euler.x - event.movementY * .0017, -Math.PI / 2, Math.PI / 2);
      camera.quaternion.setFromEuler(this.euler);
    });
    listen(canvas, 'pointerdown', () => { if (this.active) this.cancel(); }, { capture: true });
    listen(canvas, 'wheel', event => {
      if (!this.active) return;
      this.cancel();
      if (this.flight) { event.preventDefault(); this.multiplier = THREE.MathUtils.clamp(this.multiplier * Math.exp(-event.deltaY * .001), .25, 4); }
    }, { capture: true, passive: false });
    listen(this.motion, 'change', () => {
      if (this.tween && this.motion.matches) {
        this.fromPosition.copy(camera.position); this.fromTarget.copy(this.orbit.target); this.fromRotation.copy(camera.quaternion);
        this.start = performance.now(); this.duration = 150;
      }
    });
    this.sync();
  }
  sync() {
    this.button.textContent = this.flight ? 'Kembali ke orbit' : 'Free Flight';
    this.button.setAttribute('aria-pressed', String(!!this.flight));
  }
  resetMovement() { this.keys.clear(); this.velocity.set(0, 0, 0); }
  activate() { this.active = true; this.orbit.enabled = true; }
  deactivate() { this.cancel(); this.leaveFlight(); this.active = false; this.orbit.enabled = false; }
  cancel() {
    if (!this.tween) return;
    this.tween = false;
    this.camera.getWorldDirection(this.direction);
    this.orbit.target.copy(this.camera.position).addScaledVector(this.direction, Math.max(.4, this.camera.position.distanceTo(this.orbit.target)));
    this.orbit.enabled = this.active && !this.flight;
  }
  async enterFlight() {
    this.cancel(); this.resetMovement(); this.flight = true; this.orbit.enabled = false; this.sync();
    try {
      if (!this.canvas.requestPointerLock) throw new Error('Unavailable');
      await this.canvas.requestPointerLock();
      if (!this.active || !this.flight) {
        if (document.pointerLockElement === this.canvas) document.exitPointerLock();
      }
    } catch {
      this.leaveFlight();
      if (this.active) document.getElementById('app-status').textContent = 'Pointer lock tidak tersedia. Gunakan kamera orbit.';
    }
  }
  leaveFlight() {
    if (this.flight) {
      this.camera.getWorldDirection(this.direction);
      this.orbit.target.copy(this.camera.position).addScaledVector(this.direction, 5);
    }
    this.flight = false; this.resetMovement();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.orbit.enabled = !!this.active && !this.tween; this.sync();
  }
  preset(id) {
    if (!this.active || !galaxyCameraPresets[id]) return;
    this.cancel(); this.leaveFlight();
    this.fromPosition.copy(this.camera.position); this.fromTarget.copy(this.orbit.target); this.fromRotation.copy(this.camera.quaternion);
    this.toPosition.fromArray(galaxyCameraPresets[id].position); this.toTarget.fromArray(galaxyCameraPresets[id].target);
    this.start = performance.now(); this.duration = this.motion.matches ? 150 : 1400;
    this.tween = true; this.orbit.enabled = false;
  }
  update(delta, now) {
    if (!this.active) return;
    if (this.tween) {
      const t = Math.min(1, (now - this.start) / this.duration), eased = cinematicEase(t);
      this.camera.position.lerpVectors(this.fromPosition, this.toPosition, eased);
      this.orbit.target.lerpVectors(this.fromTarget, this.toTarget, eased);
      this.lookCamera.position.copy(this.camera.position); this.lookCamera.lookAt(this.orbit.target);
      this.camera.quaternion.slerpQuaternions(this.fromRotation, this.lookCamera.quaternion, eased);
      if (t === 1) { this.tween = false; this.orbit.enabled = true; }
    } else if (this.flight) {
      this.direction.set(Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')),
        Number(this.keys.has('Space')) - Number(this.keys.has('ControlLeft') || this.keys.has('ControlRight')),
        Number(this.keys.has('KeyS')) - Number(this.keys.has('KeyW')));
      const speed = galaxyAdaptiveSpeed(this.camera.position.length(), this.multiplier) * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 3 : 1);
      this.direction.normalize().applyQuaternion(this.camera.quaternion).multiplyScalar(speed);
      this.velocity.lerp(this.direction, 1 - Math.exp(-8 * delta));
      this.camera.position.addScaledVector(this.velocity, delta);
    } else this.orbit.update();
    const scale = galaxyBoundaryScale(this.camera.position.length());
    if (scale < 1) { this.camera.position.multiplyScalar(scale); this.velocity.set(0, 0, 0); }
  }
  dispose() { this.deactivate(); this.listeners.forEach(remove => remove()); this.listeners.length = 0; this.orbit.dispose(); }
}
