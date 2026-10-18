import * as THREE from 'three';
import { galaxyLandmarks } from '../data/galaxyLandmarks.js';

/** Small screen-sized proxies; decorative galaxy particles remain non-selectable. */
export class GalaxyLandmarks extends THREE.Group {
  constructor() {
    super();
    const bytes = new Uint8Array(16 * 16 * 4);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4;
      bytes[i] = bytes[i + 1] = bytes[i + 2] = 255;
      bytes[i + 3] = Math.hypot(x - 7.5, y - 7.5) < 6 ? 255 : 0;
    }
    this.texture = new THREE.DataTexture(bytes, 16, 16); this.texture.needsUpdate = true;
    this.material = new THREE.SpriteMaterial({ map: this.texture, color: 0x72dcff, depthTest: false, depthWrite: false, toneMapped: false });
    this.selectedMaterial = this.material.clone(); this.selectedMaterial.color.set(0xffda7c);
    this.hitMaterial = new THREE.SpriteMaterial({ visible: false });
    this.pickables = []; this.markers = []; this.viewPosition = new THREE.Vector3();
    for (const data of galaxyLandmarks) {
      const marker = new THREE.Sprite(this.material); marker.position.fromArray(data.position.coordinates);
      marker.raycast = () => {}; marker.renderOrder = 5;
      const hit = new THREE.Sprite(this.hitMaterial); hit.position.copy(marker.position); hit.userData.landmark = data;
      this.add(marker, hit); this.markers.push(marker); this.pickables.push(hit);
    }
  }
  update(camera, height) {
    const factor = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.max(1, height);
    for (let i = 0; i < this.markers.length; i++) {
      this.viewPosition.copy(this.markers[i].position).applyMatrix4(camera.matrixWorldInverse);
      const unit = Math.max(.001, -this.viewPosition.z * factor);
      this.markers[i].scale.setScalar(unit * 10);
      this.pickables[i].scale.setScalar(unit * 24);
    }
  }
  select(id) {
    this.markers.forEach((marker, i) => { marker.material = this.pickables[i].userData.landmark.id === id ? this.selectedMaterial : this.material; });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.texture.dispose(); this.material.dispose(); this.selectedMaterial.dispose(); this.hitMaterial.dispose(); this.clear();
  }
}
