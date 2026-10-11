import { bodies, moons, timeSpeeds, tourStops } from '../data/celestialBodies.js';

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
    this.#populateSearch();
    this.#bindEvents();
  }

  #cacheElements() {
    const ids = [
      'loading-screen', 'welcome-card', 'info-panel', 'close-info', 'object-symbol', 'object-type', 'object-name',
      'object-description', 'object-stats', 'object-fact', 'visit-button', 'follow-button', 'object-select',
      'explore-button', 'sun-button', 'tour-button', 'flight-button', 'help-button', 'fullscreen-button',
      'help-dialog', 'close-help', 'time-toggle', 'time-speed', 'time-label', 'orbit-toggle', 'label-toggle',
      'quality-button', 'tour-panel', 'tour-progress', 'tour-title', 'tour-copy', 'tour-prev', 'tour-pause',
      'tour-next', 'tour-exit', 'flight-hud', 'flight-speed', 'labels-layer'
    ];
    ids.forEach((id) => { this[id] = document.getElementById(id); });
  }

  #populateSearch() {
    const planetGroup = document.createElement('optgroup');
    planetGroup.label = 'Matahari & Planet';
    bodies.forEach((body) => {
      const option = document.createElement('option');
      option.value = body.id;
      option.textContent = body.name;
      planetGroup.append(option);
    });
    const moonGroup = document.createElement('optgroup');
    moonGroup.label = 'Bulan Utama';
    moons.forEach((moon) => {
      const option = document.createElement('option');
      option.value = moon.id;
      option.textContent = moon.name;
      moonGroup.append(option);
    });
    this['object-select'].append(planetGroup, moonGroup);
  }

  #bindEvents() {
    this['object-select'].addEventListener('change', (event) => {
      if (event.target.value) this.emit('select', event.target.value);
    });
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
    this['help-button'].addEventListener('click', () => this['help-dialog'].showModal());
    this['close-help'].addEventListener('click', () => this['help-dialog'].close());
    this['fullscreen-button'].addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
    this['time-toggle'].addEventListener('click', () => {
      this.paused = !this.paused;
      this['time-toggle'].textContent = this.paused ? '▶' : 'Ⅱ';
      this['time-toggle'].setAttribute('aria-label', this.paused ? 'Lanjutkan simulasi' : 'Jeda simulasi');
      this.emit('time-change', this.paused ? 0 : timeSpeeds[this.timeIndex]);
    });
    this['time-speed'].addEventListener('input', (event) => {
      this.timeIndex = Number(event.target.value);
      this.paused = false;
      this['time-toggle'].textContent = 'Ⅱ';
      this.#updateTimeLabel();
      this.emit('time-change', timeSpeeds[this.timeIndex]);
    });
    this['orbit-toggle'].addEventListener('click', () => {
      const active = this['orbit-toggle'].classList.toggle('active');
      this.emit('orbits-toggle', active);
    });
    this['label-toggle'].addEventListener('click', () => {
      this.labelsVisible = this['label-toggle'].classList.toggle('active');
      this['labels-layer'].hidden = !this.labelsVisible;
    });
    this['quality-button'].addEventListener('click', () => this.#cycleQuality());
    this['tour-prev'].addEventListener('click', () => this.stepTour(-1));
    this['tour-next'].addEventListener('click', () => this.stepTour(1));
    this['tour-pause'].addEventListener('click', () => {
      this.tourPaused = !this.tourPaused;
      this['tour-pause'].textContent = this.tourPaused ? '▶' : 'Ⅱ';
      this.emit('tour-pause', this.tourPaused);
    });
    this['tour-exit'].addEventListener('click', () => this.stopTour());
    document.querySelectorAll('.rail-button').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.rail-button').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        this.emit('filter', button.dataset.filter);
      });
    });
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyG' && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) this.startTour();
      if (event.code === 'KeyH' && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) document.body.classList.toggle('hud-hidden');
    });
  }

  #cycleQuality() {
    const current = this['quality-button'].dataset.quality || 'high';
    const next = current === 'high' ? 'medium' : current === 'medium' ? 'low' : 'high';
    this['quality-button'].dataset.quality = next;
    this['quality-button'].textContent = `Kualitas: ${next[0].toUpperCase()}${next.slice(1)}`;
    this.emit('quality-change', next);
  }

  #updateTimeLabel() {
    const speed = timeSpeeds[this.timeIndex];
    this['time-label'].textContent = speed < 1 ? `${speed} hari/detik` : `${speed} hari/detik`;
  }

  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  ready() {
    window.setTimeout(() => this['loading-screen'].classList.add('done'), 550);
  }

  hideWelcome() {
    this['welcome-card'].classList.add('hidden');
  }

  showInfo(data) {
    this.hideWelcome();
    this.selectedId = data.id;
    this['object-symbol'].textContent = data.symbol || '●';
    this['object-symbol'].style.color = data.color || '#66d9ff';
    this['object-type'].textContent = data.type === 'star' ? 'BINTANG' : data.type === 'moon' ? 'SATELIT ALAMI' : 'PLANET';
    this['object-name'].textContent = data.name;
    this['object-description'].textContent = data.description;
    this['object-fact'].textContent = data.fact;
    const stats = [
      ['Diameter', typeof data.radiusKm === 'number' ? `${(data.radiusKm * 2).toLocaleString('id-ID')} km` : data.radiusKm],
      ['Massa', data.mass], ['Gravitasi', data.gravity], ['Suhu', data.temperature],
      ['Jarak', data.distance], ['Rotasi', data.rotation], ['Revolusi', data.orbitPeriod], ['Bulan', data.moons]
    ];
    this['object-stats'].replaceChildren(...stats.map(([label, value]) => {
      const wrapper = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value ?? '—';
      wrapper.append(dt, dd);
      return wrapper;
    }));
    this['object-select'].value = data.id;
    this['info-panel'].classList.add('open');
    this['info-panel'].setAttribute('aria-hidden', 'false');
  }

  closeInfo() {
    this['info-panel'].classList.remove('open');
    this['info-panel'].setAttribute('aria-hidden', 'true');
  }

  setFlight(active, speed = 18) {
    this['flight-hud'].hidden = !active;
    this['flight-button'].classList.toggle('active', active);
    this['flight-button'].title = active ? 'Keluar dari mode terbang bebas' : 'Aktifkan mode terbang bebas';
    this['flight-speed'].textContent = `${(speed / 18).toFixed(1)}×`;
    if (active) this.hideWelcome();
  }

  startTour() {
    this.hideWelcome();
    this.tourIndex = 0;
    this.tourPaused = false;
    this['tour-pause'].textContent = 'Ⅱ';
    this['tour-panel'].hidden = false;
    this.updateTourCopy();
    this.emit('tour-start', tourStops[this.tourIndex]);
  }

  stepTour(direction) {
    this.tourIndex = Math.max(0, Math.min(tourStops.length - 1, this.tourIndex + direction));
    this.updateTourCopy();
    this.emit('tour-step', tourStops[this.tourIndex]);
  }

  updateTourCopy() {
    const body = bodies.find((item) => item.id === tourStops[this.tourIndex]);
    this['tour-progress'].textContent = `${this.tourIndex + 1} / ${tourStops.length}`;
    this['tour-title'].textContent = body.name;
    this['tour-copy'].textContent = body.description;
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
