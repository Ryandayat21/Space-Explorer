import { tour } from './data/tour.js';
import { visitDistance } from './core/cameraMath.js';
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './styles.css';
import { SolarSystem } from './core/SolarSystem.js';
import { FlightControls } from './core/FlightControls.js';
import { UIController } from './ui/UIController.js';

if (!WebGL.isWebGL2Available()) {
  document.body.replaceChildren(WebGL.getWebGL2ErrorMessage());
  throw new Error('WebGL 2 tidak tersedia pada perangkat ini.');
}

const canvas = document.getElementById('space-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01030a);
scene.fog = new THREE.FogExp2(0x02040d, 0.00042);

const camera = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, 0.05, 2200);
camera.position.set(96, 58, 142);

const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.055;
orbitControls.minDistance = 0.3;
orbitControls.maxDistance = 720;
orbitControls.target.set(0, 0, 0);

const flightControls = new FlightControls(camera, canvas);
const solarSystem = new SolarSystem(scene);
const ui = new UIController();
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let timeScale = 1;
let flightActive = false;
let selectedObject = null;
let followedObject = null;
let cameraTween = null;
let tourActive = false;
let tourPaused = false;
let tourElapsed = 0;
let tweenSuspendedAt = 0;
const targetScratch = new THREE.Vector3();
const offsetScratch = new THREE.Vector3();
const labelPosition = new THREE.Vector3();
const labelDirection = new THREE.Vector3();
const cameraDirection = new THREE.Vector3();
let pointerStart = { x: 0, y: 0 };
let frameId;
function leaveFlight() {
  if (!flightActive) return;
  flightActive = false; flightControls.deactivate(); orbitControls.enabled = true;
  camera.getWorldDirection(targetScratch);
  orbitControls.target.copy(camera.position).addScaledVector(targetScratch, 8);
  ui.setFlight(false);
}
function manualTakeover() {
  if (cameraTween || tourActive) followedObject = null;
  cameraTween = null;
  if (tourActive) ui.pauseTour(true);
}
canvas.addEventListener('pointerdown', event => { pointerStart.x = event.clientX; pointerStart.y = event.clientY; manualTakeover(); });
canvas.addEventListener('wheel', manualTakeover, { passive: true });
window.addEventListener('texture-fallback', event => ui.status('Tekstur ' + event.detail + ' tidak tersedia. Menggunakan tekstur procedural.'));
canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); ui.status('Konteks grafis terputus. Muat ulang halaman untuk memulihkan simulasi.'); });

const labels = new Map();
for (const [id, object] of solarSystem.objects) {
  const label = ui.addLabel(object.data);
  if (label) labels.set(id, label);
}

function setCameraDestination(id, duration = 1.65, follow = false, framing = 5.2) {
  leaveFlight();
  const object = solarSystem.getObject(id);
  if (!object) return;
  const target = solarSystem.getWorldPosition(id, new THREE.Vector3());
  const direction = camera.position.clone().sub(target).normalize();
  if (!Number.isFinite(direction.x) || direction.lengthSq() < 0.1) direction.set(1, 0.4, 1).normalize();
  const distance = visitDistance(object.radius, framing);
  const destination = target.clone().add(direction.multiplyScalar(distance)).add(new THREE.Vector3(0, object.radius * 0.65, 0));
  cameraTween = {
    start: performance.now(),
    duration: duration * 1000,
    fromPosition: camera.position.clone(),
    toPosition: destination,
    offset: destination.clone().sub(target),
    fromTarget: orbitControls.target.clone(),
    objectId: id,
    follow
  };
  followedObject = null;
}

function selectObject(id, moveCamera = false) {
  const object = solarSystem.getObject(id);
  if (!object) return;
  selectedObject = object;
  solarSystem.select(id);
  ui.showInfo(object.data);
  if (moveCamera) setCameraDestination(id);
}

function updateCameraTween(now) {
  if (!cameraTween || (tourActive && tourPaused)) return;
  const progress = Math.min(1, (now - cameraTween.start) / cameraTween.duration);
  const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;
  const target = solarSystem.getWorldPosition(cameraTween.objectId, targetScratch);
  if (cameraTween.offset) cameraTween.toPosition.copy(target).add(cameraTween.offset);
  camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
  orbitControls.target.lerpVectors(cameraTween.fromTarget, target, eased);
  camera.lookAt(orbitControls.target);
  if (progress >= 1) {
    const completedTween = cameraTween;
    orbitControls.target.copy(target);
    followedObject = completedTween.follow ? (solarSystem.getObject(completedTween.objectId) ?? null) : null;
    cameraTween = null;
  }
}

function updateLabels() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.getWorldDirection(cameraDirection);
  for (const [id, label] of labels) {
    const position = solarSystem.getWorldPosition(id, labelPosition);
    const toObject = labelDirection.subVectors(position, camera.position);
    const visible = toObject.dot(cameraDirection) > 0 && toObject.length() < 600;
    if (!visible || !ui.labelsVisible) {
      label.style.opacity = '0';
      continue;
    }
    position.project(camera);
    label.style.left = `${(position.x * 0.5 + 0.5) * width}px`;
    label.style.top = `${(-position.y * 0.5 + 0.5) * height}px`;
    label.style.opacity = String(Math.min(1, Math.max(0.25, 1 - toObject.length() / 600)));
  }
}

function pickObject(clientX, clientY, center = false) {
  if (center) pointer.set(0, 0);
  else {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  }
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(solarSystem.pickables, false)[0];
  if (hit?.object.userData.bodyId) selectObject(hit.object.userData.bodyId, false);
}

canvas.addEventListener('click', (event) => {
  if (!flightActive && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
  if (flightActive) {
    if (!flightControls.pointerLocked) flightControls.activate();
    else pickObject(0, 0, true);
  } else pickObject(event.clientX, event.clientY);
});

ui.addEventListener('select', (event) => { if (tourActive) ui.stopTour(); selectObject(event.detail, true); });
ui.addEventListener('visit', (event) => { if (tourActive) ui.stopTour(); setCameraDestination(event.detail, 1.65, false); });
ui.addEventListener('follow', (event) => {
  if (tourActive) ui.stopTour();
  if (solarSystem.getObject(event.detail)) setCameraDestination(event.detail, 1.2, true);
});
ui.addEventListener('overview', () => {
  leaveFlight(); if (tourActive) ui.stopTour(); followedObject = null;
  cameraTween = {
    start: performance.now(), duration: 1450,
    fromPosition: camera.position.clone(), toPosition: new THREE.Vector3(100, 62, 155),
    fromTarget: orbitControls.target.clone(), objectId: 'sun'
  };
});
ui.addEventListener('time-change', (event) => { timeScale = event.detail; });
ui.addEventListener('orbits-toggle', (event) => solarSystem.setOrbitsVisible(event.detail));
ui.addEventListener('filter', (event) => {
  ui.hideWelcome();
  ui.status(event.detail === 'all' ? '' : 'Kategori aktif: pilih objek pada hasil pencarian.');
});
ui.addEventListener('quality-change', (event) => {
  const quality = event.detail;
  solarSystem.setQuality(quality);
  const ratios = { low: 0.85, medium: 1.25, high: 1.75 };
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratios[quality]));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
ui.addEventListener('flight-toggle', () => {
  if (tourActive) ui.stopTour();
  if (flightActive) { leaveFlight(); return; }
  flightActive = true;
  orbitControls.enabled = !flightActive;
  cameraTween = null;
  followedObject = null;
  if (flightActive) flightControls.activate();
  else flightControls.deactivate();
  ui.setFlight(flightActive, flightControls.speed);
});
ui.addEventListener('tour-start', (event) => {
  tourActive = true;
  tourPaused = false;
  if (flightActive) {
    flightActive = false;
    flightControls.deactivate();
    orbitControls.enabled = true;
    ui.setFlight(false);
  }
  goTour(event.detail);
});
ui.addEventListener('tour-step', (event) => goTour(event.detail));
ui.addEventListener('tour-pause', (event) => {
  if (event.detail && !tourPaused) tweenSuspendedAt = performance.now();
  if (!event.detail && tourPaused) {
    if (cameraTween) cameraTween.start += performance.now() - tweenSuspendedAt;
    else if (!followedObject && tour[ui.tourIndex].id !== 'asteroid-belt') {
      setCameraDestination(tour[ui.tourIndex].id, 1.2, true, tour[ui.tourIndex].framing);
    }
  }
  tourPaused = event.detail;
});
ui.addEventListener('tour-exit', () => { tourActive = false; tourPaused = false; cameraTween = null; followedObject = null; });
function goTour(id) {
  tourElapsed = 0;
  if (id === 'asteroid-belt') {
    ui.closeInfo(); followedObject = null;
    cameraTween = { start: performance.now(), duration: 2200, fromPosition: camera.position.clone(), toPosition: new THREE.Vector3(90, 95, 110), fromTarget: orbitControls.target.clone(), objectId: 'sun', follow: false };
  } else {
    selectObject(id);
    setCameraDestination(id, 2.2, true, tour[ui.tourIndex].framing);
  }
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyF' && selectedObject && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) {
    if (tourActive) ui.stopTour();
    setCameraDestination(selectedObject.data.id);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});



function animate(now) {
  frameId = requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  solarSystem.update(delta * timeScale, delta);

  if (flightActive) {
    flightControls.update(delta, solarSystem.clearance(camera.position));
    ui.setFlight(true, flightControls.effectiveSpeed);
  } else {
    if (followedObject && !cameraTween) {
      solarSystem.getWorldPosition(followedObject.data.id, targetScratch);
      offsetScratch.subVectors(targetScratch, orbitControls.target);
      camera.position.add(offsetScratch);
      orbitControls.target.copy(targetScratch);
    }
    updateCameraTween(now);
    if (!cameraTween) orbitControls.update();
  }

  solarSystem.clearance(camera.position, true);
  solarSystem.updateDetail(camera);
  if (tourActive && !tourPaused && !cameraTween) {
    tourElapsed += delta * 1000;
    if (tourElapsed >= tour[ui.tourIndex].duration) ui.stepTour(1);
  }

  updateLabels();
  renderer.render(scene, camera);
}

renderer.render(scene, camera);
// The Sun is the initial focal object, so load its final texture before revealing the scene.
// A stalled request must not leave the application trapped on the loading screen.
const startupTimeout = setTimeout(() => ui.ready(), 4000);
solarSystem.loadTexture('sun').then(() => {
  clearTimeout(startupTimeout);
  ui.ready();
});
frameId = requestAnimationFrame(animate);
// Read-only diagnostics for browser regression and allocation checks.
if (import.meta.env.DEV) window.__observer = {
  resources: () => {
    const geometries = new Set(), textures = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) for (const material of [object.material].flat())
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    });
    return { geometries: geometries.size, textures: textures.size };
  },
  snapshot: () => ({ sunTextureLoaded: !!solarSystem.getObject('sun').mesh.material.map.image?.src?.endsWith('/textures/sun.jpg'), selected: selectedObject?.data.id, followed: followedObject?.data.id, flight: flightActive, pointerLocked: flightControls.pointerLocked, speed: flightControls.speed, effectiveSpeed: flightControls.effectiveSpeed, tween: !!cameraTween, tourActive, tourPaused, clearance: solarSystem.clearance(camera.position), camera: camera.position.toArray(), target: orbitControls.target.toArray(), memory: { ...renderer.info.memory } }),
  project: id => { const v = solarSystem.getWorldPosition(id, new THREE.Vector3()).project(camera); return { x: (v.x + 1) * innerWidth / 2, y: (1 - v.y) * innerHeight / 2 }; }
};
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  cancelAnimationFrame(frameId); flightControls.dispose(); orbitControls.dispose(); solarSystem.dispose(); renderer.dispose();
});
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
