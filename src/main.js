import { tour } from './data/tour.js';
import { visitDistance, clearApproach, cinematicEase } from './core/cameraMath.js';
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './styles.css';
import { SolarSystem } from './core/SolarSystem.js';
import { CameraSafety } from './core/CameraSafety.js';
import { FlightControls } from './core/FlightControls.js';
import { UIController } from './ui/UIController.js';

if (!WebGL.isWebGL2Available()) {
  document.body.replaceChildren(WebGL.getWebGL2ErrorMessage());
  throw new Error('WebGL 2 tidak tersedia pada perangkat ini.');
}

const canvas = document.getElementById('space-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
// Color textures are tagged sRGB by SolarSystem; lighting works in linear space.
THREE.ColorManagement.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
const pixelRatioCaps = { low: 0.85, medium: 1.25, high: 1.75 };
let renderQuality = 'high';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01030a);
scene.fog = new THREE.FogExp2(0x02040d, 0.00042);

const camera = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, 0.05, 2200);
camera.position.set(96, 58, 142);

function resizeRenderer() {
  const width = Math.max(1, window.innerWidth), height = Math.max(1, window.innerHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const ratio = Math.min(window.devicePixelRatio || 1, pixelRatioCaps[renderQuality]);
  if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
}
resizeRenderer();

const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.055;
orbitControls.minDistance = 0.3;
orbitControls.maxDistance = 720;
orbitControls.target.set(0, 0, 0);

const flightControls = new FlightControls(camera, canvas);
const solarSystem = new SolarSystem(scene);
const safety = new CameraSafety(solarSystem);
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
const lookCamera = camera.clone();
const savedPosition = new THREE.Vector3();
const savedRotation = new THREE.Quaternion();
const previousCameraPosition = new THREE.Vector3();
function resetObserver() {
  savedPosition.copy(camera.position); savedRotation.copy(camera.quaternion);
  orbitControls.enableDamping = false; orbitControls.update();
  orbitControls.enableDamping = true;
  camera.position.copy(savedPosition); camera.quaternion.copy(savedRotation);
  orbitControls.enabled = !flightActive;
}
function beginTween(tween) {
  resetObserver();
  tween.fromRotation = camera.quaternion.clone();
  // Plan a bounded detour using conservative body/ring envelopes, once per visit.
  const obstacles = [...solarSystem.objects.values()].map(body => {
    const ring = body.mesh.getObjectByName(`${body.data.id}-rings`);
    return { center: solarSystem.getWorldPosition(body.data.id).toArray(),
      radius: ring ? ring.geometry.parameters.outerRadius + .4 : body.radius + Math.max(.3, body.radius * .1) };
  });
  const from = tween.fromPosition, to = tween.toPosition;
  if (!clearApproach(from.toArray(), to.toArray(), obstacles)) {
    const midpoint = from.clone().add(to).multiplyScalar(.5);
    const span = Math.max(15, from.distanceTo(to));
    for (const axis of [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)]) {
      const control = midpoint.clone().addScaledVector(axis, span);
      let previous = from.clone(), valid = true;
      for (let i = 1; i <= 32; i++) {
        const t = i / 32;
        const point = from.clone().multiplyScalar((1-t)**2).addScaledVector(control, 2*t*(1-t)).addScaledVector(to, t*t);
        if (!clearApproach(previous.toArray(), point.toArray(), obstacles)) { valid = false; break; }
        previous = point;
      }
      if (valid) { tween.control = control; break; }
    }
  }
  cameraTween = tween; orbitControls.enabled = false;
}
function leaveFlight() {
  if (!flightActive) return;
  flightActive = false; flightControls.deactivate(); orbitControls.enabled = true;
  camera.getWorldDirection(targetScratch);
  orbitControls.target.copy(camera.position).addScaledVector(targetScratch, 8);
  ui.setFlight(false);
}
function manualTakeover() {
  if (cameraTween) {
    const distance = Math.max(1, camera.position.distanceTo(orbitControls.target));
    camera.getWorldDirection(targetScratch);
    orbitControls.target.copy(camera.position).addScaledVector(targetScratch, distance);
  }
  if (cameraTween || tourActive) followedObject = null;
  cameraTween = null; resetObserver();
  if (tourActive) ui.pauseTour(true);
}
canvas.addEventListener('pointerdown', event => { pointerStart.x = event.clientX; pointerStart.y = event.clientY; manualTakeover(); }, { capture: true });
canvas.addEventListener('wheel', manualTakeover, { passive: true, capture: true });
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
  const distance = visitDistance(object.radius, object.data.visitFraming ?? framing);
  const destination = target.clone().add(direction.multiplyScalar(distance)).add(new THREE.Vector3(0, object.radius * 0.65, 0));
  const obstacles = [...solarSystem.objects.values()].filter(body => body !== object).map(body => ({
    center: solarSystem.getWorldPosition(body.data.id).toArray(),
    radius: Math.max(body.radius + Math.max(.25, body.radius * .08), .75)
  }));
  if (!clearApproach(target.toArray(), destination.toArray(), obstacles)) {
    // Compressed orbits can place another planet across the incoming view.
    // Search a bounded set of directions at the same framing distance.
    for (let index = 0; index < 64; index++) {
      const y = 1 - 2 * (index + .5) / 64;
      const radial = Math.sqrt(1 - y * y), angle = index * 2.399963229728653;
      const candidate = target.clone().add(new THREE.Vector3(
        radial * Math.cos(angle), y, radial * Math.sin(angle)).multiplyScalar(distance));
      if (clearApproach(target.toArray(), candidate.toArray(), obstacles)) {
        destination.copy(candidate);
        break;
      }
    }
  }
  beginTween({
    start: performance.now(),
    duration: duration * 1000,
    fromPosition: camera.position.clone(),
    toPosition: destination,
    offset: destination.clone().sub(target),
    fromTarget: orbitControls.target.clone(),
    objectId: id,
    follow
  });
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
  const eased = cinematicEase(progress);
  const target = solarSystem.getWorldPosition(cameraTween.objectId, targetScratch);
  if (cameraTween.offset) cameraTween.toPosition.copy(target).add(cameraTween.offset);
  camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
  if (cameraTween.control) camera.position.copy(cameraTween.fromPosition).multiplyScalar((1-eased)**2)
    .addScaledVector(cameraTween.control, 2*eased*(1-eased)).addScaledVector(cameraTween.toPosition, eased*eased);
  orbitControls.target.lerpVectors(cameraTween.fromTarget, target, eased);
  safety.resolve(camera.position, previousCameraPosition);
  lookCamera.position.copy(camera.position); lookCamera.lookAt(orbitControls.target);
  camera.quaternion.slerpQuaternions(cameraTween.fromRotation, lookCamera.quaternion, eased);
  if (progress >= 1) {
    const completedTween = cameraTween;
    orbitControls.target.copy(target);
    followedObject = completedTween.follow ? (solarSystem.getObject(completedTween.objectId) ?? null) : null;
    cameraTween = null; resetObserver();
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
  beginTween({
    start: performance.now(), duration: 1450,
    fromPosition: camera.position.clone(), toPosition: new THREE.Vector3(100, 62, 155),
    fromTarget: orbitControls.target.clone(), objectId: 'sun'
  });
});
ui.addEventListener('time-change', (event) => { timeScale = event.detail; });
ui.addEventListener('orbits-toggle', (event) => solarSystem.setOrbitsVisible(event.detail));
ui.addEventListener('region-toggle', event => solarSystem.setRegionVisible(event.detail.id, event.detail.visible));
ui.addEventListener('starfield-toggle', event => { solarSystem.background.visible = event.detail; });
ui.addEventListener('filter', (event) => {
  ui.hideWelcome();
  ui.status(event.detail === 'all' ? '' : 'Kategori aktif: pilih objek pada hasil pencarian.');
});
ui.addEventListener('quality-change', (event) => {
  const quality = event.detail;
  solarSystem.setQuality(quality);
  renderQuality = quality;
  resizeRenderer();
});
ui.addEventListener('flight-toggle', () => {
  if (tourActive) ui.stopTour();
  if (flightActive) { leaveFlight(); return; }
  manualTakeover(); flightControls.reset();
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
ui.addEventListener('tour-exit', () => { tourActive = false; tourPaused = false; cameraTween = null; followedObject = null; resetObserver(); });
function goTour(id) {
  tourElapsed = 0;
  if (id === 'asteroid-belt') {
    ui.closeInfo(); followedObject = null;
    beginTween({ start: performance.now(), duration: 2200, fromPosition: camera.position.clone(), toPosition: new THREE.Vector3(90, 95, 110), fromTarget: orbitControls.target.clone(), objectId: 'sun', follow: false });
  } else {
    selectObject(id);
    setCameraDestination(id, 2.2, true, tour[ui.tourIndex].framing);
  }
}

window.addEventListener('keydown', (event) => {
  if (document.querySelector('dialog[open]')) return;
  if (event.code === 'Escape') { manualTakeover(); followedObject = null; return; }
  if (event.repeat || flightActive) return;
  if (event.code === 'KeyF' && selectedObject && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) {
    if (tourActive) ui.stopTour();
    setCameraDestination(selectedObject.data.id);
  }
});

window.addEventListener('resize', resizeRenderer);
document.addEventListener('fullscreenchange', resizeRenderer);



function animate(now) {
  frameId = requestAnimationFrame(animate);
  previousCameraPosition.copy(camera.position);
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

  safety.resolve(camera.position, previousCameraPosition);
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
  rendering: () => ({ pixelRatio: renderer.getPixelRatio(), aspect: camera.aspect,
    exposure: renderer.toneMappingExposure, colorSpace: renderer.outputColorSpace,
    toneMapping: renderer.toneMapping, quality: renderQuality }),
  elapsedDays: () => solarSystem.elapsedDays,
  regions: () => [...solarSystem.regions].map(([id, region]) => ({ id, visible: region.visible, count: region.geometry.drawRange.count, rotation: region.rotation.y })),
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
