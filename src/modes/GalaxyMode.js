import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export class GalaxyMode {
  id = 'galaxy';
  constructor({ canvas }) { this.canvas = canvas; this.pickables = []; this.searchDataset = []; }
  initialize() {
    if (this.disposed) throw new Error('Mode disposed');
    if (this.scene) return;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x01030a);
    this.camera = new THREE.PerspectiveCamera(50, 1, .1, 200);
    this.camera.position.set(0, 20, 30);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.minDistance = 2; this.controls.maxDistance = 100; this.controls.enabled = false;
  }
  activate() { this.controls.enabled = true; }
  deactivate() { if (this.controls) this.controls.enabled = false; }
  update() { this.controls.update(); }
  resize(width, height) { if (this.camera) { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); } }
  dispose() {
    if (this.disposed) return;
    this.deactivate(); this.controls?.dispose(); this.scene?.clear();
    this.scene = this.camera = this.controls = null; this.disposed = true;
  }
}
