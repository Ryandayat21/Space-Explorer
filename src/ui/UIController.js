import { loadingScreen } from './loadingScreen.js';
import { SearchCombobox } from './SearchCombobox.js';
import { tour } from '../data/tour.js';
import { scienceFor } from '../data/science.js';
import { readQuality, saveQuality } from '../data/quality.js';
import { formatScienceValue, scienceSections } from '../data/scienceFormat.js';
import { ExplorationUI } from './ExplorationUI.js';
import { timeSpeeds, tourStops } from '../data/celestialBodies.js';

export class UIController extends EventTarget {
  constructor() {
    super();
    this.selectedId = null;
    this.tourIndex = 0;
    this.tourPaused = false;
    this.timeIndex = 1;
    this.paused = false;
    this.labelsVisible = true;
    this.#cacheElements();
    this.setQualityLabel(readQuality());
    this.#populateSearch();
    this.#bindEvents();
    this.search = new SearchCombobox(this);
    this.exploration = new ExplorationUI(this);
    for (const button of document.querySelectorAll('button')) {
      if (!button.hasAttribute('title') && !button.hasAttribute('aria-label')) button.title = button.textContent.trim();
      if (button.classList.contains('icon-button') && !button.hasAttribute('aria-label')) button.setAttribute('aria-label', button.title || button.textContent.trim());
    }
    this.syncFullscreen();
    this.#updateTimeLabel();
    for (const button of document.querySelectorAll('.rail-button, #orbit-toggle, #label-toggle, #flight-button')) {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    }
  }

  #cacheElements() {
    const ids = [
      'loading-screen', 'welcome-card', 'info-panel', 'close-info', 'object-symbol', 'object-type', 'object-name',
      'object-description', 'object-stats', 'object-fact', 'visit-button', 'follow-button',
      'explore-button', 'sun-button', 'tour-button', 'flight-button', 'help-button', 'fullscreen-button',
      'help-dialog', 'close-help', 'time-toggle', 'time-speed', 'time-label', 'orbit-toggle', 'label-toggle',
      'quality-button', 'tour-panel', 'tour-progress', 'tour-title', 'tour-copy', 'tour-prev', 'tour-pause',
      'tour-next', 'tour-exit', 'flight-hud', 'flight-speed', 'labels-layer'
    ];
    ids.forEach((id) => { this[id] = document.getElementById(id); });
  }

  #populateSearch() {
    this.search?.render(document.activeElement === document.getElementById('search-input'));
  }

  #bindEvents() {
    document.getElementById('starfield-toggle').addEventListener('click', event => {
      const visible = event.currentTarget.classList.toggle('active');
      event.currentTarget.setAttribute('aria-pressed', String(visible));
      this.emit('starfield-toggle', visible);
    });
    document.getElementById('hud-button').addEventListener('click', () => this.toggleHud());
    document.getElementById('flight-exit').addEventListener('click', () => this.emit('flight-toggle'));
    document.getElementById('tour-skip').addEventListener('click', () => this.stepTour(1));
    this['explore-button'].addEventListener('click', () => {
      this.hideWelcome();
      this.emit('overview');
    });
    this['sun-button'].addEventListener('click', () => this.emit('select', 'sun'));
    document.querySelector('.brand').addEventListener('click', (event) => {
      event.preventDefault();
      this.emit('select', 'sun');
    });
    this['close-info'].addEventListener('click', () => this.closeInfo());
    this['visit-button'].addEventListener('click', () => this.emit('visit', this.selectedId));
    this['follow-button'].addEventListener('click', () => this.emit('follow', this.selectedId));
    this['tour-button'].addEventListener('click', () => this.startTour());
    this['flight-button'].addEventListener('click', () => this.emit('flight-toggle'));
    this['help-button'].addEventListener('click', () => {
      this['help-dialog'].showModal(); this['close-help'].focus();
    });
    this['close-help'].addEventListener('click', () => this['help-dialog'].close());
    this['fullscreen-button'].addEventListener('click', () => this.toggleFullscreen());
    document.addEventListener('fullscreenchange', () => {
      const exited = this.fullscreenActive && !document.fullscreenElement;
      this.syncFullscreen();
      if (exited && document.body.classList.contains('hud-hidden')) this.toggleHud();
    });
    window.addEventListener('keydown', event => {
      if (event.code === 'Escape' && this.mode === 'galaxy') this.dispatchEvent(new Event('galaxy-tour-exit'));
      if (event.code !== 'Escape' || document.querySelector('dialog[open]')) return;
      const cinematic = document.body.classList.contains('hud-hidden');
      if (!cinematic && !document.fullscreenElement) {
        if (!document.pointerLockElement && this['info-panel'].classList.contains('open')) {
          this.closeInfo();
        }
        return;
      }
      event.preventDefault(); event.stopImmediatePropagation();
      if (document.pointerLockElement) document.exitPointerLock?.();
      if (cinematic) this.toggleHud();
      if (document.fullscreenElement) this.toggleFullscreen();
    }, { capture: true });
    this['time-toggle'].addEventListener('click', () => {
      this.paused = !this.paused;
      this['time-toggle'].textContent = this.paused ? '▶' : 'Ⅱ';
      this['time-toggle'].setAttribute('aria-label', this.paused ? 'Lanjutkan simulasi' : 'Jeda simulasi');
      this.emit('time-change', this.paused ? 0 : timeSpeeds[this.timeIndex]);
    });
    this['time-speed'].addEventListener('input', (event) => {
      this.timeIndex = Number(event.target.value);
      this.paused = false;
      this['time-toggle'].setAttribute('aria-label', 'Jeda simulasi');
      this['time-toggle'].textContent = 'Ⅱ';
      this.#updateTimeLabel();
      this.emit('time-change', timeSpeeds[this.timeIndex]);
    });
    this['orbit-toggle'].addEventListener('click', () => {
      const active = this['orbit-toggle'].classList.toggle('active');
      this['orbit-toggle'].setAttribute('aria-pressed', String(active));
      this.emit('orbits-toggle', active);
    });
    this['label-toggle'].addEventListener('click', () => {
      this.labelsVisible = this['label-toggle'].classList.toggle('active');
      this['label-toggle'].setAttribute('aria-pressed', String(this.labelsVisible));
      this['labels-layer'].hidden = !this.labelsVisible;
    });
    this['quality-button'].addEventListener('click', () => this.#cycleQuality());
    document.querySelectorAll('[data-region]').forEach(button => {
      button.addEventListener('click', () => {
        const visible = button.classList.toggle('active');
        button.setAttribute('aria-pressed', String(visible));
        this.emit('region-toggle', { id: button.dataset.region, visible });
      });
    });
    this['tour-prev'].addEventListener('click', () => this.stepTour(-1));
    this['tour-next'].addEventListener('click', () => this.stepTour(1));
    this['tour-pause'].addEventListener('click', () => {
      this.pauseTour(!this.tourPaused);
    });
    this['tour-exit'].addEventListener('click', () => this.stopTour());
    document.querySelectorAll('.rail-button').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.rail-button').forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-pressed', 'false'); });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        this.filter = button.dataset.filter;
        this.#populateSearch();
        this.emit('filter', this.filter);
      });
    });
    window.addEventListener('keydown', (event) => {
      if (document.querySelector('dialog[open]')) return;
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || document.activeElement.isContentEditable) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (event.code === 'KeyP') { event.preventDefault(); this['time-toggle'].click(); }
      if (event.code === 'KeyL') { event.preventDefault(); this.toggleFullscreen(); }
      if (event.code === 'KeyG' && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) this.startTour();
      if (event.code === 'KeyH' && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) this.toggleHud();
    });
  }

  #cycleQuality() {
    const current = this['quality-button'].dataset.quality || 'medium';
    const next = current === 'high' ? 'medium' : current === 'medium' ? 'low' : 'high';
    this.setQualityLabel(next);
    if (!saveQuality(next)) this.status('Pilihan kualitas berlaku untuk sesi ini; penyimpanan tidak tersedia.');
    this.emit('quality-change', next);
  }

  setQualityLabel(next) {
    this['quality-button'].dataset.quality = next;
    this['quality-button'].textContent = `Kualitas: ${next[0].toUpperCase()}${next.slice(1)}`;
    this['quality-button'].title = this['quality-button'].textContent;
  }

  toggleHud() {
    const hidden = document.body.classList.toggle('hud-hidden');
    for (const panel of document.querySelectorAll('.topbar, .left-rail, .welcome-card, .info-panel, .time-dock, .tour-panel')) panel.inert = hidden;
    this['info-panel'].inert = hidden || !this['info-panel'].classList.contains('open');
    this['welcome-card'].inert = hidden || this['welcome-card'].classList.contains('hidden');
    document.getElementById('flight-exit').inert = hidden;
    const button = document.getElementById('hud-button');
    button.setAttribute('aria-pressed', String(hidden));
    button.textContent = hidden ? 'Tampilkan UI · H' : 'Sinematik · H';
    button.title = hidden ? 'Tampilkan UI (H atau Escape)' : 'Aktifkan mode sinematik (H)';
    button.setAttribute('aria-label', button.title);
    button.focus();
    const indicator = document.getElementById('cinematic-status');
    clearTimeout(this.cinematicTimer);
    indicator.textContent = hidden ? 'Mode sinematik aktif · H atau Escape untuk kembali' : '';
    indicator.hidden = !hidden;
    if (hidden) this.cinematicTimer = setTimeout(() => { indicator.hidden = true; indicator.textContent = ''; }, 3000);
  }

  syncFullscreen() {
    this.fullscreenActive = !!document.fullscreenElement;
    const button = this['fullscreen-button'];
    button.setAttribute('aria-pressed', String(this.fullscreenActive));
    button.title = this.fullscreenActive ? 'Keluar layar penuh' : 'Layar penuh';
    button.setAttribute('aria-label', button.title);
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        if (!document.exitFullscreen) throw new Error('Fullscreen unavailable');
        await document.exitFullscreen();
      } else {
        if (!document.documentElement.requestFullscreen) throw new Error('Fullscreen unavailable');
        await document.documentElement.requestFullscreen();
      }
      this.syncFullscreen();
    } catch { this.status('Layar penuh tidak tersedia pada browser ini.'); this.syncFullscreen(); }
  }

  #updateTimeLabel() {
    const speed = timeSpeeds[this.timeIndex];
    this['time-speed'].setAttribute('aria-valuetext', `${speed.toLocaleString('id-ID')} hari simulasi per detik`);
    this['time-label'].textContent = speed < 1 ? `${speed} hari/detik` : `${speed} hari/detik`;
  }

  chooseSearch(id, mode) {
    this.search?.close();
    if (mode === 'solar-system' && this.mode === 'galaxy') { this.dispatchEvent(new CustomEvent('solar-search', { detail: id })); return; }
    if (mode === 'galaxy') this.dispatchEvent(new CustomEvent('galaxy-select', { detail: id }));
    else this.emit('select', id);
  }
  emit(name, detail) {
    if (this.mode === 'galaxy' && name !== 'quality-change') return;
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  setMode(id) {
    this.mode = id;
    const galaxy = id === 'galaxy';
    document.body.classList.toggle('galaxy-mode', galaxy);
    this.selectedId = null; this.closeInfo(); this.hideWelcome();
    this.status(''); this.filter = 'all';
    for (const button of document.querySelectorAll('.rail-button')) {
      const active = button.dataset.filter === 'all';
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    }
    for (const control of document.querySelectorAll('.left-rail button, .time-dock button, .time-dock input, #flight-button, #favorites-button')) control.disabled = galaxy;
    document.getElementById('search-input').value = '';
    this.#populateSearch();
    document.getElementById('galaxy-placeholder').hidden = !galaxy;
  }

  ready(message) { loadingScreen.ready(message); }

  hideWelcome() {
    this['welcome-card'].classList.add('hidden');
    this['welcome-card'].inert = true;
  }

  showInfo(data) {
    document.dispatchEvent(new CustomEvent('observer-selection', { detail: data.id }));
    const active = document.activeElement;
    const focusPanel = this['tour-panel'].hidden && !document.pointerLockElement &&
      (['search-input', 'space-canvas'].includes(active?.id) || active === document.body);
    if (!this['info-panel'].contains(active)) this.infoReturnFocus = active;
    data = scienceFor(data);
    this.hideWelcome();
    this.selectedId = data.id;
    this.exploration.refresh();
    this['object-symbol'].textContent = data.symbol || '●';
    this['object-symbol'].style.color = data.color || '#66d9ff';
    this['object-type'].textContent = { star: 'BINTANG', moon: 'SATELIT ALAMI', planet: 'PLANET', 'dwarf-planet': 'PLANET KATAI', comet: 'KOMET' }[data.type] ?? 'OBJEK';
    this['object-name'].textContent = data.name;
    this['object-description'].textContent = formatScienceValue(data.description);
    this['object-fact'].textContent = formatScienceValue(data.fact);
    this['object-stats'].replaceChildren(...scienceSections(data).map(section => {
      const container = document.createElement('section');
      const heading = document.createElement('h3'); heading.textContent = section.title;
      const list = document.createElement('dl'); list.className = 'stat-grid';
      list.append(...section.rows.map(([label, value]) => {
      const wrapper = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      wrapper.append(dt, dd);
      return wrapper;
      }));
      container.append(heading, list); return container;
    }));
    document.getElementById('object-sources').replaceChildren(...(data.sources ?? []).filter(source => source?.url && /^https?:\/\//i.test(source.url)).map(source => {
      const link = document.createElement('a'); link.href = source.url; link.textContent = source.label || source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
    }));
    if (!document.getElementById('object-sources').children.length) document.getElementById('object-sources').textContent = 'Data belum tersedia';
    this['info-panel'].inert = document.body.classList.contains('hud-hidden');
    this['info-panel'].scrollTop = 0;
    this['info-panel'].classList.add('open');
    this['info-panel'].setAttribute('aria-hidden', 'false');
    if (focusPanel && !this['info-panel'].inert) this['object-name'].focus({ preventScroll: true });
  }

  closeInfo() {
    const hadFocus = this['info-panel'].contains(document.activeElement);
    this['info-panel'].inert = true;
    this['info-panel'].classList.remove('open');
    this['info-panel'].setAttribute('aria-hidden', 'true');
    if (hadFocus) {
      const target = this.infoReturnFocus;
      if (target?.isConnected && target !== document.body && !target.closest('[inert]')) target.focus({ preventScroll: true });
      else document.getElementById(document.body.classList.contains('hud-hidden') ? 'hud-button' : 'search-input').focus({ preventScroll: true });
    }
  }

  setFlight(active, speed = 18) {
    if (active !== this.flightActive) {
      this.flightActive = active;
      this['flight-hud'].hidden = !active;
      document.getElementById('flight-exit').hidden = !active;
      this['flight-button'].classList.toggle('active', active);
      this['flight-button'].setAttribute('aria-pressed', String(active));
      this['flight-button'].title = active ? 'Keluar dari mode terbang bebas' : 'Aktifkan mode terbang bebas';
      this['flight-button'].setAttribute('aria-label', this['flight-button'].title);
      if (active) this.hideWelcome();
    }
    const displayedSpeed = Math.round(speed / 18 * 10);
    if (displayedSpeed !== this.displayedFlightSpeed) {
      this.displayedFlightSpeed = displayedSpeed;
      this['flight-speed'].textContent = `${(displayedSpeed / 10).toFixed(1)}×`;
    }
  }

  startTour() {
    if (this.mode === 'galaxy') { this.dispatchEvent(new Event('galaxy-tour-start')); return; }
    this.hideWelcome();
    this.tourIndex = 0;
    this.tourPaused = false;
    this['tour-pause'].textContent = 'Ⅱ';
    this['tour-pause'].setAttribute('aria-label', 'Jeda tur');
    this['tour-panel'].hidden = false;
    this.updateTourCopy();
    this.emit('tour-start', tourStops[this.tourIndex]);
  }

  stepTour(direction) {
    if (this.tourPaused) this.pauseTour(false);
    if (this.tourIndex + direction >= tourStops.length) { this.stopTour(); return; }
    this.tourIndex = Math.max(0, Math.min(tourStops.length - 1, this.tourIndex + direction));
    this.updateTourCopy();
    this.emit('tour-step', tourStops[this.tourIndex]);
  }

  updateTourCopy() {
    const body = tour[this.tourIndex];
    this['tour-prev'].disabled = this.tourIndex === 0;
    this['tour-progress'].textContent = `${this.tourIndex + 1} / ${tourStops.length}`;
    this['tour-title'].textContent = body.title;
    this['tour-copy'].textContent = body.narration;
  }

  status(message) { document.getElementById('app-status').textContent = message; }

  pauseTour(paused) {
    this.tourPaused = paused;
    this['tour-pause'].textContent = paused ? '▶' : 'Ⅱ';
    this['tour-pause'].setAttribute('aria-label', paused ? 'Lanjutkan tur' : 'Jeda tur');
    this.emit('tour-pause', paused);
  }

  stopTour() {
    this['tour-panel'].hidden = true;
    this.emit('tour-exit');
  }

  addLabel(data) {
    if (data.type === 'moon') return null;
    const label = document.createElement('div');
    label.className = 'space-label';
    label.textContent = data.name;
    label.style.setProperty('--label-color', data.color || '#66d9ff');
    this['labels-layer'].append(label);
    return label;
  }
}
