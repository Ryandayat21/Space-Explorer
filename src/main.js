import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import './styles.css';
import { qualityPresets, readQuality } from './data/quality.js';
import { ModeController } from './core/ModeController.js';
import { ModeTransition } from './core/ModeTransition.js';
import { SolarSystemMode } from './modes/SolarSystemMode.js';
import { GalaxyMode } from './modes/GalaxyMode.js';
import { UIController } from './ui/UIController.js';
import { initializeAudioControls } from './ui/AudioControls.js';
if (!WebGL.isWebGL2Available()) {
  document.body.replaceChildren(WebGL.getWebGL2ErrorMessage());
  throw new Error('WebGL 2 tidak tersedia pada perangkat ini.');
}
const canvas = document.getElementById('space-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
THREE.ColorManagement.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
let renderQuality = readQuality();
let transition;
// Register before UI/camera shortcuts so no input reaches either mode during a switch.
const gateTypes = ['keydown', 'keyup', 'pointerdown', 'pointerup', 'mousemove', 'wheel', 'click'];
const gateInput = event => {
  if (!transition?.busy) return;
  if (event.target.closest?.('#mode-transition')) {
    if (event.type === 'keydown' || event.type === 'keyup') {
      event.stopImmediatePropagation();
      if (!['Tab', 'Enter', ' '].includes(event.key)) event.preventDefault();
    }
    return;
  }
  event.preventDefault(); event.stopImmediatePropagation();
};
for (const type of gateTypes) window.addEventListener(type, gateInput, { capture: true, passive: false });
const ui = new UIController();
initializeAudioControls();
const onContextLost = event => {
  event.preventDefault(); ui.status('Konteks grafis terputus. Muat ulang halaman untuk memulihkan simulasi.');
};
canvas.addEventListener('webglcontextlost', onContextLost);
const solar = new SolarSystemMode({ canvas, ui, renderer, quality: renderQuality });
const galaxy = new GalaxyMode({ canvas, quality: renderQuality });
const modes = new ModeController([solar, galaxy]);
modes.activate('solar-system');
const clock = new THREE.Clock();
function resizeRenderer() {
  const width = Math.max(1, innerWidth), height = Math.max(1, innerHeight);
  modes.resize(width, height);
  const ratio = Math.min(devicePixelRatio || 1, qualityPresets[renderQuality].pixelRatio);
  if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
}
resizeRenderer();
window.addEventListener('resize', resizeRenderer);
document.addEventListener('fullscreenchange', resizeRenderer);
ui.addEventListener('quality-change', event => {
  renderQuality = event.detail; solar.setQuality(renderQuality); galaxy.setQuality(renderQuality); resizeRenderer();
});
const switchButton = document.getElementById('mode-toggle');
const curtain = document.createElement('div'); curtain.id = 'mode-transition'; curtain.hidden = true;
curtain.innerHTML = '<div class="mode-transition-shade"></div><div class="mode-transition-actions"><p role="status">Berpindah mode...</p><button type="button" title="Lewati animasi transisi" aria-label="Skip transition">Skip</button></div>';
document.body.append(curtain);
const skipButton = curtain.querySelector('button'), shade = curtain.firstElementChild;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const renderCamera = new THREE.PerspectiveCamera(), basePosition = new THREE.Vector3(), retreat = new THREE.Vector3();
const inertState = new Map();
transition = new ModeTransition(modes, {
  prepare(next) { renderer.compile(next.scene, next.camera); },
  lock() {
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    for (const popover of document.querySelectorAll(':popover-open')) popover.hidePopover();
    for (const element of document.body.children) if (element !== curtain) { inertState.set(element, element.inert); element.inert = true; }
    document.body.classList.add('mode-transitioning'); curtain.hidden = false; shade.style.opacity = '0';
    skipButton.focus();
  },
  scene(mode) {
    renderCamera.copy(mode.camera); basePosition.copy(mode.camera.position);
    retreat.set(0, 0, mode.id === 'galaxy' ? 2 : 8).applyQuaternion(mode.camera.quaternion);
    if (transition.phase === 'in' && !motion.matches) renderCamera.position.add(retreat);
  },
  frame(amount) {
    shade.style.opacity = String(amount);
    const eased = amount * amount * (3 - 2 * amount);
    renderCamera.position.copy(basePosition).addScaledVector(retreat, motion.matches ? 0 : eased);
    renderCamera.aspect = modes.active.camera.aspect; renderCamera.updateProjectionMatrix();
  },
  changed(id) {
    ui.setMode(id);
    switchButton.textContent = id === 'galaxy' ? 'Enter Solar System' : 'View Milky Way';
    switchButton.setAttribute('aria-pressed', String(id === 'galaxy'));
  },
  unlock() {
    curtain.hidden = true; document.body.classList.remove('mode-transitioning');
    for (const [element, previous] of inertState) element.inert = previous;
    inertState.clear(); clock.getDelta(); switchButton.focus({ preventScroll: true });
  },
  error() { ui.status('Mode tidak dapat dibuka. Mode sebelumnya dipertahankan.'); }
});
const requestMode = id => transition.start(id, motion.matches);
const onSwitch = () => requestMode(modes.active.id === 'solar-system' ? 'galaxy' : 'solar-system');
const onSkip = () => transition.skip();
const onMotion = () => { if (motion.matches) transition.duration = .08; };
switchButton.addEventListener('click', onSwitch); skipButton.addEventListener('click', onSkip); motion.addEventListener('change', onMotion);
galaxy.onEnterSolarSystem = () => requestMode('solar-system');
const fpsDebug = import.meta.env.DEV && new URLSearchParams(location.search).has('debug');
let fpsNode, fpsFrames = 0, fpsStart = performance.now();
if (fpsDebug) {
  fpsNode = document.createElement('output'); fpsNode.id = 'debug-fps';
  fpsNode.style.cssText = 'position:fixed;left:8px;top:88px;z-index:99;color:white;background:#000c;padding:4px;pointer-events:none';
  document.body.append(fpsNode);
}
let frameId;
function animate(now) {
  if (fpsDebug && ++fpsFrames && now - fpsStart >= 1000) {
    fpsNode.textContent = `${Math.round(fpsFrames * 1000 / (now - fpsStart))} FPS`;
    fpsFrames = 0; fpsStart = now;
  }
  frameId = requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), .05);
  if (transition.busy) transition.update(delta); else modes.update(delta, now);
  renderer.render(modes.active.scene, transition.busy ? renderCamera : modes.active.camera);
}
renderer.render(modes.active.scene, modes.active.camera);
const startupTimeout = setTimeout(() => ui.ready(), 4000);
solar.integration.loadSun().then(() => { clearTimeout(startupTimeout); ui.ready(); });
frameId = requestAnimationFrame(animate);
if (import.meta.env.DEV) window.__observer = {
  ...solar.integration.diagnostics,
  galaxyCamera: () => galaxy.camera ? ({ position: galaxy.camera.position.toArray(), flight: !!galaxy.controls.flight, tween: !!galaxy.controls.tween, multiplier: galaxy.controls.multiplier }) : null,
  mode: () => ({ id: modes.active.id, transitioning: transition.busy, aspect: modes.active.camera.aspect, sceneObjects: modes.active.scene.children.length, galaxyParticles: galaxy.galaxy?.particleCount }),
  rendering: () => ({ pixelRatio: renderer.getPixelRatio(), aspect: modes.active.camera.aspect,
    exposure: renderer.toneMappingExposure, colorSpace: renderer.outputColorSpace,
    toneMapping: renderer.toneMapping, quality: renderQuality })
};
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  clearTimeout(startupTimeout); cancelAnimationFrame(frameId); transition.dispose(); modes.dispose(); renderer.dispose();
  for (const type of gateTypes) window.removeEventListener(type, gateInput, true);
  switchButton.removeEventListener('click', onSwitch); skipButton.removeEventListener('click', onSkip); motion.removeEventListener('change', onMotion); curtain.remove();
  window.removeEventListener('resize', resizeRenderer);
  document.removeEventListener('fullscreenchange', resizeRenderer);
  canvas.removeEventListener('webglcontextlost', onContextLost);
});
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
