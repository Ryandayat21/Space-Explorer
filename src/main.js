import { reportFailure, watchGraphicsContext } from './core/failures.js';
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { loadingScreen, paintLoading } from './ui/loadingScreen.js';
import { waitForOptionalAsset, loadingStages } from './core/loading.js';
import { qualityPresets, readQuality } from './data/quality.js';
import { ModeController } from './core/ModeController.js';
import { ModeTransition } from './core/ModeTransition.js';
import { renderStats } from './core/renderStats.js';
import { SolarSystemMode } from './modes/SolarSystemMode.js';
import { lazyModule } from './core/lazyModule.js';
import { UIController } from './ui/UIController.js';
import { initializeAudioControls } from './ui/AudioControls.js';
export async function start() {
if (!WebGL.isWebGL2Available()) {
  const error = new Error('WebGL 2 unavailable'); error.code = 'WEBGL_UNAVAILABLE'; throw error;
}
loadingScreen.stage('scene', 'Inisialisasi renderer dan scene Tata Surya wajib.');
await paintLoading();
if (loadingScreen.failed) return;
const canvas = document.getElementById('space-canvas');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (cause) { const error = new Error('WebGLRenderer initialization failed', { cause }); error.code = 'RENDERER_INIT'; throw error; }
let frameId, stopped = false;
let stopAudio = () => {};
let stopMode = () => {};
const stopRendering = () => {
  if (stopped) return;
  stopped = true; cancelAnimationFrame(frameId);
  for (const cleanup of [stopMode, stopAudio]) {
    try { cleanup(); } catch (error) { reportFailure('failure-cleanup', error); }
  }
};
window.addEventListener('observer-fatal', stopRendering);
const removeContextListeners = watchGraphicsContext(canvas, { stop: stopRendering, status: message => loadingScreen.fail(message) });
window.addEventListener('pagehide', event => {
  if (!event.persisted) {
    stopRendering(); removeContextListeners();
    window.removeEventListener('observer-fatal', stopRendering);
  }
});
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
try { stopAudio = initializeAudioControls() ?? stopAudio; }
catch (error) {
  reportFailure('audio-initialization', error);
  document.getElementById('audio-status').textContent = 'Audio unavailable. Simulasi tetap dapat digunakan.';
  for (const id of ['audio-play', 'audio-mute', 'audio-volume']) document.getElementById(id).disabled = true;
}
const solar = new SolarSystemMode({ canvas, ui, renderer, quality: renderQuality });
let galaxy;
const importGalaxy = lazyModule(() => import('./modes/GalaxyMode.js'));
const modes = new ModeController([solar]);
stopMode = () => modes.active?.deactivate();
modes.activate('solar-system');
const clock = new THREE.Clock();
function resizeRenderer() {
  if (stopped || loadingScreen.failed) return;
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
  renderQuality = event.detail; solar.setQuality(renderQuality); galaxy?.setQuality(renderQuality); resizeRenderer();
});
const switchButton = document.getElementById('mode-toggle');
const curtain = document.createElement('div'); curtain.id = 'mode-transition'; curtain.hidden = true;
curtain.innerHTML = '<div class="mode-transition-shade"></div><div class="mode-transition-actions"><p role="status" aria-live="polite">Inisialisasi</p><button type="button" title="Lewati animasi transisi" aria-label="Skip transition">Skip</button></div>';
document.body.append(curtain);
const skipButton = curtain.querySelector('button'), shade = curtain.firstElementChild;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const renderCamera = new THREE.PerspectiveCamera(), basePosition = new THREE.Vector3(), retreat = new THREE.Vector3();
const inertState = new Map();
let pendingLandmark = null;
let pendingSolar = null;
transition = new ModeTransition(modes, {
  load(id) {
    if (id !== 'galaxy' || galaxy) return;
    return importGalaxy().then(({ GalaxyMode }) => {
      if (stopped) return;
      galaxy = new GalaxyMode({ canvas, quality: renderQuality });
      galaxy.onEnterSolarSystem = () => requestMode('solar-system');
      modes.modes.set('galaxy', galaxy);
    });
  },
  stage(stage) {
    const label = transition.target === 'galaxy' ? 'Galaxy Mode' : 'Solar System Mode';
    curtain.querySelector('[role=status]').textContent = `${loadingStages[stage]} — ${label}${stage === 'assets' ? ': modul dan aset lokal/procedural, tanpa unduhan audio' : ''}`;
    curtain.dataset.stage = stage;
    skipButton.disabled = stage !== 'ready';
    if (stage === 'ready') skipButton.focus({ preventScroll: true });
  },
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
    if (!stopped && pendingLandmark && modes.active.id === 'galaxy') galaxy.visitLandmark(pendingLandmark);
    if (!stopped && pendingSolar && modes.active.id === 'solar-system') ui.emit('select', pendingSolar);
    pendingSolar = null;
    pendingLandmark = null;
  },
  error(error) { reportFailure('mode-transition', error); stopRendering(); loadingScreen.fail('Modul atau scene tujuan gagal disiapkan. Periksa koneksi lalu Muat Ulang untuk mencoba kembali dengan instance baru yang bersih.'); }
});
stopMode = () => {
  pendingLandmark = pendingSolar = null;
  transition.dispose();
  modes.active?.deactivate();
};
const requestMode = id => transition.start(id, motion.matches);
const onSwitch = () => requestMode(modes.active.id === 'solar-system' ? 'galaxy' : 'solar-system');
const onSkip = () => transition.skip();
const onMotion = () => { if (motion.matches) transition.duration = .08; };
switchButton.addEventListener('click', onSwitch); skipButton.addEventListener('click', onSkip); motion.addEventListener('change', onMotion);
const onSolarSearch = event => {
  if (transition.busy) return;
  pendingSolar = event.detail;
  if (!requestMode('solar-system')) pendingSolar = null;
};
ui.addEventListener('solar-search', onSolarSearch);
const onGalaxySelect = event => {
  if (transition.busy) return;
  if (modes.active.id === 'galaxy') galaxy.visitLandmark(event.detail);
  else { pendingLandmark = event.detail; if (!requestMode('galaxy')) pendingLandmark = null; }
};
ui.addEventListener('galaxy-select', onGalaxySelect);
const onGalaxyTour = () => { if (!transition.busy && modes.active.id === 'galaxy') galaxy.tour.start(); };
ui.addEventListener('galaxy-tour-start', onGalaxyTour);
const onGalaxyTourExit = () => galaxy?.tour?.exit();
ui.addEventListener('galaxy-tour-exit', onGalaxyTourExit);
const fpsDebug = import.meta.env.DEV && new URLSearchParams(location.search).has('debug');
let fpsNode, fpsFrames = 0, fpsStart = performance.now();
if (fpsDebug) {
  fpsNode = document.createElement('output'); fpsNode.id = 'debug-fps';
  fpsNode.style.cssText = 'position:fixed;left:8px;top:88px;z-index:99;color:white;background:#000c;padding:4px;pointer-events:none';
  document.body.append(fpsNode);
}
function animate(now) {
  if (stopped || loadingScreen.failed) return;
  if (fpsDebug && ++fpsFrames && now - fpsStart >= 1000) {
    const stats = renderStats(renderer, modes.active);
    fpsNode.textContent = `${Math.round(fpsFrames * 1000 / (now - fpsStart))} FPS | ${stats.calls} calls | ${stats.triangles} triangles | ${stats.points}/${stats.particles} points | ${stats.geometries} geometries | ${stats.materials} materials`;
    fpsFrames = 0; fpsStart = now;
  }
  frameId = requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), .05);
  if (document.hidden) return; // Keep one RAF; skip simulation/render while hidden, consume clock delta.
  try {
    if (transition.busy) transition.update(delta); else modes.update(delta, now);
    if (stopped || loadingScreen.failed) { cancelAnimationFrame(frameId); return; }
    renderer.render(modes.active.scene, transition.busy ? renderCamera : modes.active.camera);
  } catch (error) {
    stopRendering(); reportFailure('render-loop', error);
    if (transition.busy) transition.fail(error);
    else loadingScreen.fail('Tampilan scene gagal disiapkan. Muat ulang untuk memulihkan aplikasi.');
  }
}
renderer.render(modes.active.scene, modes.active.camera);
loadingScreen.stage('assets', 'Memuat tekstur Matahari opsional. Material procedural sudah tersedia; audio menunggu interaksi.');
const sunResult = await waitForOptionalAsset(solar.integration.loadSun());
if (loadingScreen.failed) return;
loadingScreen.stage('scene', 'Menyiapkan tampilan pertama dengan aset yang tersedia.');
await paintLoading();
if (loadingScreen.failed) return;
renderer.render(modes.active.scene, modes.active.camera);
const fallbackNotice = sunResult === 'deferred' ? 'Tekstur Matahari masih tertunda; simulasi memakai material procedural.' : sunResult === 'fallback' ? 'Tekstur Matahari gagal dimuat; simulasi memakai material procedural.' : '';
if (fallbackNotice) ui.status(fallbackNotice);
ui.ready(fallbackNotice || 'Tata Surya siap. Audio tetap opt-in.');
frameId = requestAnimationFrame(animate);
if (import.meta.env.DEV) window.__observer = {
  performance: () => renderStats(renderer, modes.active),
  ...solar.integration.diagnostics,
  galaxyCamera: () => galaxy?.camera ? ({ position: galaxy.camera.position.toArray(), flight: !!galaxy.controls.flight, tween: !!galaxy.controls.tween, multiplier: galaxy.controls.multiplier }) : null,
  mode: () => ({ id: modes.active.id, transitioning: transition.busy, aspect: modes.active.camera.aspect, sceneObjects: modes.active.scene.children.length, galaxyParticles: galaxy?.galaxy?.particleCount }),
  rendering: () => ({ pixelRatio: renderer.getPixelRatio(), aspect: modes.active.camera.aspect,
    exposure: renderer.toneMappingExposure, colorSpace: renderer.outputColorSpace,
    toneMapping: renderer.toneMapping, quality: renderQuality })
};
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  cancelAnimationFrame(frameId); transition.dispose(); modes.dispose(); renderer.dispose();
  ui.search.dispose();
  ui.removeEventListener('solar-search', onSolarSearch);
  ui.removeEventListener('galaxy-select', onGalaxySelect);
  ui.removeEventListener('galaxy-tour-start', onGalaxyTour);
  ui.removeEventListener('galaxy-tour-exit', onGalaxyTourExit);
  for (const type of gateTypes) window.removeEventListener(type, gateInput, true);
  switchButton.removeEventListener('click', onSwitch); skipButton.removeEventListener('click', onSkip); motion.removeEventListener('change', onMotion); curtain.remove();
  window.removeEventListener('resize', resizeRenderer);
  document.removeEventListener('fullscreenchange', resizeRenderer);
  removeContextListeners();
});
}
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
