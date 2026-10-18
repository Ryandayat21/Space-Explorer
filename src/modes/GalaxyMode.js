import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GalaxyScene } from '../core/GalaxyScene.js';
export class GalaxyMode {
  id = 'galaxy';
  constructor({ canvas, quality = 'medium' }) { this.canvas = canvas; this.quality = quality; this.pickables = []; this.searchDataset = []; }
  initialize() {
    if (this.disposed) throw new Error('Mode disposed');
    if (this.scene) return;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x01030a);
    this.galaxy = new GalaxyScene(this.quality); this.scene.add(this.galaxy);
    this.camera = new THREE.PerspectiveCamera(50, 1, .1, 200);
    this.camera.position.set(0, 20, 30);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.minDistance = 2; this.controls.maxDistance = 100; this.controls.enabled = false;
  }
  activate() { this.controls.enabled = true; }
  setQuality(quality) { this.quality = quality; this.galaxy?.setQuality(quality); }
  deactivate() { if (this.controls) this.controls.enabled = false; }
  update() { this.controls.update(); }
  resize(width, height) { if (this.camera) { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); } }
  dispose() {
    if (this.disposed) return;
    this.deactivate(); this.controls?.dispose(); this.galaxy?.dispose(); this.galaxy = null; this.scene?.clear();
    this.scene = this.camera = this.controls = null; this.disposed = true;
  }
}
