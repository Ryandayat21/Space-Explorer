import * as THREE from 'three';
import { GalaxyCameraControls } from '../core/GalaxyCameraControls.js';
import { GalaxyScene } from '../core/GalaxyScene.js';
import { GalaxyLandmarks } from '../core/GalaxyLandmarks.js';
import { GalaxyLandmarkPanel } from '../ui/GalaxyLandmarkPanel.js';
import { galaxyLandmarks } from '../data/galaxyLandmarks.js';
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
    this.landmarks = new GalaxyLandmarks(); this.scene.add(this.landmarks); this.pickables = this.landmarks.pickables;
    this.panel = new GalaxyLandmarkPanel(id => this.select(id));
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.hits = [];
    this.onDown = e => { this.downX = e.clientX; this.downY = e.clientY; };
    this.onClick = e => {
      if (!this.active || this.controls.flight || document.body.classList.contains('hud-hidden') || Math.hypot(e.clientX - this.downX, e.clientY - this.downY) > 5) return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
      this.camera.updateMatrixWorld(); this.landmarks.updateMatrixWorld(true);
      this.raycaster.setFromCamera(this.pointer, this.camera); this.hits.length = 0;
      this.raycaster.intersectObjects(this.pickables, false, this.hits);
      if (this.hits.length) this.select(this.hits[0].object.userData.landmark.id);
    };
    this.canvas.addEventListener('pointerdown', this.onDown); this.canvas.addEventListener('click', this.onClick);
  }
  select(id) { const data = galaxyLandmarks.find(item => item.id === id); this.landmarks.select(id); if (data) this.panel.show(data); else this.panel.hide(); }
  activate() { this.active = true; this.controls.activate(); }
  setQuality(quality) { this.quality = quality; this.galaxy?.setQuality(quality); }
  deactivate() { this.active = false; this.controls?.deactivate(); this.panel?.hide(); this.landmarks?.select(null); }
  update(delta, now) { this.controls.update(delta, now); this.camera.updateMatrixWorld(); this.landmarks.update(this.camera, this.canvas.clientHeight); }
  resize(width, height) { if (this.camera) { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); } }
  dispose() {
    if (this.disposed) return;
    this.deactivate(); this.controls?.dispose(); this.galaxy?.dispose(); this.galaxy = null; this.scene?.clear();
    this.canvas.removeEventListener('pointerdown', this.onDown); this.canvas.removeEventListener('click', this.onClick);
    this.panel?.dispose(); this.landmarks?.dispose(); this.pickables = [];
    this.scene = this.camera = this.controls = null; this.disposed = true;
  }
}
