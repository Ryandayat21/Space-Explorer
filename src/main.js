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
orbitControls.minDistance = 9;
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

const labels = new Map();
for (const [id, object] of solarSystem.objects) {
  const label = ui.addLabel(object.data);
  if (label) labels.set(id, label);
}

function setCameraDestination(id, duration = 1.65, follow = true) {
  const object = solarSystem.getObject(id);
  if (!object) return;
  const target = solarSystem.getWorldPosition(id, new THREE.Vector3());
  const direction = camera.position.clone().sub(target).normalize();
  if (!Number.isFinite(direction.x) || direction.lengthSq() < 0.1) direction.set(1, 0.4, 1).normalize();
  const distance = Math.max(object.radius * 5.2, object.data.type === 'star' ? 34 : 9);
  const destination = target.clone().add(direction.multiplyScalar(distance)).add(new THREE.Vector3(0, object.radius * 0.65, 0));
  cameraTween = {
    start: performance.now(),
    duration: duration * 1000,
    fromPosition: camera.position.clone(),
    toPosition: destination,
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
  ui.showInfo(object.data);
  if (moveCamera) setCameraDestination(id);
}

function updateCameraTween(now) {
  if (!cameraTween) return;
  const progress = Math.min(1, (now - cameraTween.start) / cameraTween.duration);
  const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;
  const target = solarSystem.getWorldPosition(cameraTween.objectId, new THREE.Vector3());
  camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
  orbitControls.target.lerpVectors(cameraTween.fromTarget, target, eased);
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
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  for (const [id, label] of labels) {
    const position = solarSystem.getWorldPosition(id, new THREE.Vector3());
    const toObject = position.clone().sub(camera.position);
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
  if (flightActive) {
    if (!flightControls.pointerLocked) flightControls.activate();
    else pickObject(0, 0, true);
  } else pickObject(event.clientX, event.clientY);
});

ui.addEventListener('select', (event) => selectObject(event.detail, true));
ui.addEventListener('visit', (event) => setCameraDestination(event.detail, 1.65, false));
ui.addEventListener('follow', (event) => {
  if (solarSystem.getObject(event.detail)) setCameraDestination(event.detail, 1.2, true);
});
ui.addEventListener('overview', () => {
  cameraTween = {
    start: performance.now(), duration: 1450,
    fromPosition: camera.position.clone(), toPosition: new THREE.Vector3(100, 62, 155),
    fromTarget: orbitControls.target.clone(), objectId: 'sun'
  };
});
ui.addEventListener('time-change', (event) => { timeScale = event.detail; });
ui.addEventListener('orbits-toggle', (event) => solarSystem.setOrbitsVisible(event.detail));
ui.addEventListener('filter', (event) => {
  const destinations = { all: null, star: 'sun', planet: 'earth', moon: 'moon' };
  const id = destinations[event.detail];
  if (id) selectObject(id, true);
  else {
    ui.closeInfo();
    ui.emit('overview');
  }
});
ui.addEventListener('quality-change', (event) => {
  const quality = event.detail;
  const ratios = { low: 0.85, medium: 1.25, high: 1.75 };
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratios[quality]));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
ui.addEventListener('flight-toggle', () => {
  flightActive = !flightActive;
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
  selectObject(event.detail, true);
});
ui.addEventListener('tour-step', (event) => selectObject(event.detail, true));
ui.addEventListener('tour-pause', (event) => { tourPaused = event.detail; });
ui.addEventListener('tour-exit', () => { tourActive = false; tourPaused = false; });

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyF' && selectedObject && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) {
    setCameraDestination(selectedObject.data.id);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTourAdvance = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  solarSystem.update(delta * timeScale, delta);

  if (flightActive) {
    flightControls.update(delta);
    ui.setFlight(true, flightControls.speed);
  } else {
    if (followedObject && !cameraTween) orbitControls.target.copy(solarSystem.getWorldPosition(followedObject.data.id, new THREE.Vector3()));
    updateCameraTween(now);
    orbitControls.update();
  }

  if (tourActive && !tourPaused && !cameraTween && now - lastTourAdvance > 8500) {
    if (ui.tourIndex < 8) ui.stepTour(1);
    else ui.stopTour();
    lastTourAdvance = now;
  }
  if (cameraTween) lastTourAdvance = now;

  updateLabels();
  renderer.render(scene, camera);
}

ui.ready();
requestAnimationFrame(animate);
