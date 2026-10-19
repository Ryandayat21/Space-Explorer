import { galaxyTour } from '../data/galaxyTour.js';
import { galaxyLandmarks } from '../data/galaxyLandmarks.js';

export class GalaxyTour {
  constructor(mode) {
    this.mode = mode; this.controls = mode.controls;
    this.element = document.createElement('section'); this.element.id = 'galaxy-tour-panel';
    this.element.className = 'galaxy-tour-panel glass-panel'; this.element.hidden = true;
    this.element.setAttribute('aria-label', 'Guided tour Bima Sakti');
    this.element.innerHTML = '<p data-progress></p><h2 tabindex="-1"></h2><p data-narration></p><div><button data-action="previous" title="Stop sebelumnya">Previous</button><button data-action="pause" title="Pause atau resume tur">Pause</button><button data-action="next" title="Stop berikutnya">Next</button><button data-action="exit" title="Tutup tur (Escape)">Exit</button></div>';
    document.body.append(this.element);
    this.heading = this.element.querySelector('h2'); this.text = this.element.querySelector('[data-narration]');
    this.progress = this.element.querySelector('[data-progress]'); this.progress.setAttribute('aria-live', 'polite');
    this.pauseButton = this.element.querySelector('[data-action="pause"]');
    this.previous = this.element.querySelector('[data-action="previous"]'); this.next = this.element.querySelector('[data-action="next"]');
    this.onClick = e => {
      const action = e.target.dataset.action;
      if (action === 'exit') this.exit();
      if (action === 'pause') this.togglePause();
      if (action === 'previous') this.go(this.index - 1);
      if (action === 'next') this.go(this.index + 1);
    };
    this.onKey = e => { if (this.active && e.key === 'Escape') this.exit(); };
    this.onManual = e => {
      if (e.target.closest?.('#galaxy-flight') && this.controls.button.disabled) return;
      if (this.active && (e.target === mode.canvas || e.target.closest?.('[data-galaxy-view], #galaxy-reset, #galaxy-flight'))) this.exit(false);
    };
    this.onHidden = () => { if (document.hidden && this.active && !this.paused) this.togglePause(); };
    this.element.addEventListener('click', this.onClick); window.addEventListener('keydown', this.onKey);
    window.addEventListener('pointerdown', this.onManual, true); window.addEventListener('wheel', this.onManual, true);
    window.addEventListener('click', this.onManual, true); document.addEventListener('visibilitychange', this.onHidden);
  }
  start() {
    if (!this.mode.active) return;
    this.returnFocus = document.activeElement; this.active = true; this.paused = false;
    this.mode.panel.hide(); this.element.hidden = false; this.go(0); this.heading.focus();
  }
  go(index) {
    if (!this.active || index < 0 || index >= galaxyTour.length) return;
    this.index = index; this.elapsed = 0;
    const stop = galaxyTour[index];
    this.heading.textContent = stop.title; this.text.textContent = stop.text;
    this.progress.textContent = `${index + 1} / ${galaxyTour.length}`;
    this.previous.disabled = index === 0; this.next.disabled = index === galaxyTour.length - 1;
    this.mode.landmarks.select(stop.landmarkId);
    this.controls.cancel();
    if (!this.paused) this.frameStop();
    this.sync();
  }
  frameStop() {
    const stop = galaxyTour[this.index];
    this.controls.preset(stop.preset || 'solar');
    const landmark = galaxyLandmarks.find(item => item.id === stop.landmarkId);
    if (landmark) {
      this.controls.toTarget.fromArray(landmark.position.coordinates);
      this.controls.toPosition.copy(this.controls.toTarget); this.controls.toPosition.y += 3; this.controls.toPosition.z += 5;
    } else if (stop.position) {
      this.controls.toPosition.fromArray(stop.position); this.controls.toTarget.fromArray(stop.target);
    }
  }
  togglePause() {
    this.paused = !this.paused;
    if (this.paused) this.controls.cancel(); else this.frameStop();
    this.sync();
  }
  sync() {
    const moving = !!(this.active && this.controls.tween);
    if (this.lastPaused === this.paused && this.lastMoving === moving) return;
    this.lastPaused = this.paused; this.lastMoving = moving;
    this.pauseButton.textContent = this.paused ? 'Resume' : 'Pause';
    this.pauseButton.setAttribute('aria-pressed', String(this.paused));
    this.controls.button.disabled = moving;
  }
  update(delta) {
    if (!this.active) return;
    this.sync();
    if (this.paused || this.controls.tween || document.hidden) return;
    this.elapsed += delta;
    if (this.elapsed >= galaxyTour[this.index].seconds) {
      if (this.index < galaxyTour.length - 1) this.go(this.index + 1); else this.exit();
    }
  }
  exit(restore = true) {
    if (!this.active) return;
    this.active = false; this.controls.cancel(); this.controls.button.disabled = false;
    this.lastMoving = undefined;
    this.mode.landmarks.select(null); this.element.hidden = true;
    if (restore && this.returnFocus?.isConnected) this.returnFocus.focus({ preventScroll: true });
  }
  dispose() {
    this.exit(false); this.element.removeEventListener('click', this.onClick); window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('pointerdown', this.onManual, true); window.removeEventListener('wheel', this.onManual, true);
    window.removeEventListener('click', this.onManual, true); document.removeEventListener('visibilitychange', this.onHidden); this.element.remove();
  }
}
