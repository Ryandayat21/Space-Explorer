import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import './styles.css';
import { qualityPresets, readQuality } from './data/quality.js';
import { ModeController } from './core/ModeController.js';
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
switchButton.addEventListener('click', () => {
  const id = modes.active.id === 'solar-system' ? 'galaxy' : 'solar-system';
  try {
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    for (const popover of document.querySelectorAll(':popover-open')) popover.hidePopover();
    modes.activate(id); ui.setMode(id); clock.getDelta();
    switchButton.textContent = id === 'galaxy' ? 'Tata Surya' : 'Galaxy · Dev';
    switchButton.setAttribute('aria-pressed', String(id === 'galaxy'));
  } catch { ui.status('Mode tidak dapat dibuka. Mode sebelumnya dipertahankan.'); }
});
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
  modes.update(Math.min(clock.getDelta(), .05), now);
  renderer.render(modes.active.scene, modes.active.camera);
}
renderer.render(modes.active.scene, modes.active.camera);
const startupTimeout = setTimeout(() => ui.ready(), 4000);
solar.integration.loadSun().then(() => { clearTimeout(startupTimeout); ui.ready(); });
frameId = requestAnimationFrame(animate);
if (import.meta.env.DEV) window.__observer = {
  ...solar.integration.diagnostics,
  galaxyCamera: () => galaxy.camera ? ({ position: galaxy.camera.position.toArray(), flight: !!galaxy.controls.flight, tween: !!galaxy.controls.tween, multiplier: galaxy.controls.multiplier }) : null,
  mode: () => ({ id: modes.active.id, aspect: modes.active.camera.aspect, sceneObjects: modes.active.scene.children.length, galaxyParticles: galaxy.galaxy?.particleCount }),
  rendering: () => ({ pixelRatio: renderer.getPixelRatio(), aspect: modes.active.camera.aspect,
    exposure: renderer.toneMappingExposure, colorSpace: renderer.outputColorSpace,
    toneMapping: renderer.toneMapping, quality: renderQuality })
};
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  clearTimeout(startupTimeout); cancelAnimationFrame(frameId); modes.dispose(); renderer.dispose();
  window.removeEventListener('resize', resizeRenderer);
  document.removeEventListener('fullscreenchange', resizeRenderer);
  canvas.removeEventListener('webglcontextlost', onContextLost);
});
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
