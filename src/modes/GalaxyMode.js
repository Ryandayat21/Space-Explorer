import * as THREE from 'three';
import { GalaxyCameraControls } from '../core/GalaxyCameraControls.js';
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
    this.controls = new GalaxyCameraControls(this.camera, this.canvas);
  }
  activate() { this.controls.activate(); }
  setQuality(quality) { this.quality = quality; this.galaxy?.setQuality(quality); }
  deactivate() { this.controls?.deactivate(); }
  update(delta, now) { this.controls.update(delta, now); }
  resize(width, height) { if (this.camera) { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); } }
  dispose() {
    if (this.disposed) return;
    this.deactivate(); this.controls?.dispose(); this.galaxy?.dispose(); this.galaxy = null; this.scene?.clear();
    this.scene = this.camera = this.controls = null; this.disposed = true;
  }
}
