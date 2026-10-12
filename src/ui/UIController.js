import { tour } from '../data/tour.js';
import { searchObjects } from '../data/search.js';
import { scienceFor } from '../data/science.js';
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
    const select = this['object-select'];
    select.replaceChildren(new Option('Pilih hasil pencarian...', ''));
    const results = searchObjects(document.getElementById('search-input').value, this.filter || 'all');
    for (const [type, label] of [['star', 'Bintang'], ['planet', 'Planet'], ['dwarf-planet', 'Planet katai'], ['moon', 'Bulan']]) {
      const group = document.createElement('optgroup'); group.label = label;
      results.filter(body => (body.type || 'moon') === type).forEach(body => group.append(new Option(body.name, body.id)));
      if (group.children.length) select.append(group);
    }
    document.getElementById('search-status').textContent = results.length ? results.length + ' objek' : 'Tidak ada objek yang cocok';
    if (!results.length) select.options[0].textContent = 'Tidak ada objek yang cocok';
  }

  #bindEvents() {
    document.getElementById('search-input').addEventListener('input', () => this.#populateSearch());
    document.getElementById('search-input').addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        const result = searchObjects(event.target.value, this.filter || 'all')[0];
        if (result) this.emit('select', result.id);
      }
    });
    document.getElementById('hud-button').addEventListener('click', () => document.body.classList.toggle('hud-hidden'));
    document.getElementById('flight-exit').addEventListener('click', () => this.emit('flight-toggle'));
    document.getElementById('tour-skip').addEventListener('click', () => this.stepTour(1));
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
      const request = !document.fullscreenElement ? document.documentElement.requestFullscreen?.() : document.exitFullscreen?.();
      request?.catch(() => this.status('Layar penuh tidak tersedia pada browser ini.'));
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
        document.querySelectorAll('.rail-button').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        this.filter = button.dataset.filter;
        this.#populateSearch();
        this.emit('filter', this.filter);
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
    data = scienceFor(data);
    this.hideWelcome();
    this.selectedId = data.id;
    this['object-symbol'].textContent = data.symbol || '●';
    this['object-symbol'].style.color = data.color || '#66d9ff';
    this['object-type'].textContent = { star: 'BINTANG', moon: 'SATELIT ALAMI', planet: 'PLANET', 'dwarf-planet': 'PLANET KATAI' }[data.type] ?? 'OBJEK';
    this['object-name'].textContent = data.name;
    this['object-description'].textContent = data.description;
    this['object-fact'].textContent = data.fact;
    const stats = [
      ['Diameter', data.diameterKm ? `${data.diameterKm.toLocaleString('id-ID')} km` : null],
      ['Massa', data.mass], ['Gravitasi', data.gravity], ['Suhu', data.temperature],
      ['Jarak', data.distance], ['Rotasi', data.rotation], ['Revolusi', data.orbitPeriod], ['Bulan', data.moons], ['Komposisi', data.composition]
    ];
    this['object-stats'].replaceChildren(...stats.map(([label, value]) => {
      const wrapper = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value ?? 'Belum diverifikasi';
      wrapper.append(dt, dd);
      return wrapper;
    }));
    document.getElementById('object-sources').replaceChildren(...data.sources.map(source => {
      const link = document.createElement('a'); link.href = source.url; link.textContent = source.label; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
    }));
    this['object-select'].value = data.id;
    this['info-panel'].inert = false;
    this['info-panel'].scrollTop = 0;
    this['info-panel'].classList.add('open');
    this['info-panel'].setAttribute('aria-hidden', 'false');
  }

  closeInfo() {
    this['info-panel'].inert = true;
    this['info-panel'].classList.remove('open');
    this['info-panel'].setAttribute('aria-hidden', 'true');
  }

  setFlight(active, speed = 18) {
    this['flight-hud'].hidden = !active;
    document.getElementById('flight-exit').hidden = !active;
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
