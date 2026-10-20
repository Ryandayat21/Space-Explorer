import { loadingStages } from '../core/loading.js';
// Presents the existing startup overlay; scene switching still uses ModeTransition.
const screen = document.getElementById('loading-screen');
const title = document.getElementById('loading-title'), detail = document.getElementById('loading-detail');
const recovery = document.getElementById('loading-reload');
const previousInert = new Map();
let failed = false, readyTimer;
function lock() {
  const app = document.getElementById('app');
  for (const node of [...app.children, ...document.body.children]) {
    if (node === app || node === screen || node.tagName === 'SCRIPT') continue;
    if (!previousInert.has(node)) previousInert.set(node, node.inert);
    node.inert = true;
  }
}
function unlock() { for (const [node, value] of previousInert) node.inert = value; previousInert.clear(); }
export const loadingScreen = {
  get failed() { return failed; },
  stage(stage, message) {
    if (failed) return;
    screen.dataset.stage = stage; screen.setAttribute('aria-busy', String(stage !== 'ready'));
    title.textContent = loadingStages[stage]; detail.textContent = message; lock();
  },
  ready(message) {
    if (failed) return;
    this.stage('ready', message); clearTimeout(readyTimer);
    readyTimer = setTimeout(() => { if (failed) return; screen.classList.add('done'); unlock(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550);
  },
  fail(message) {
    failed = true; clearTimeout(readyTimer); lock(); screen.inert = false;
    screen.classList.remove('done'); screen.dataset.stage = 'error'; screen.setAttribute('aria-busy', 'false');
    title.textContent = loadingStages.error; detail.textContent = message;
    recovery.textContent = 'Muat Ulang'; recovery.focus({ preventScroll: true });
  }
};
window.addEventListener('keydown', event => {
  if (screen.classList.contains('done')) return;
  event.stopImmediatePropagation();
  if (!['Tab', 'Enter'].includes(event.key)) event.preventDefault();
}, { capture: true });
// Yield one paint, not a second animation loop, before synchronous scene setup.
export const paintLoading = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
