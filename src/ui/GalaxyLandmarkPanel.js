import { galaxyLandmarks, landmarkPositionNotice } from '../data/galaxyLandmarks.js';

export class GalaxyLandmarkPanel {
  constructor(onSelect) {
    this.element = document.createElement('section');
    this.element.id = 'galaxy-landmark-panel'; this.element.className = 'galaxy-landmark-panel glass-panel';
    this.element.hidden = true; this.element.setAttribute('aria-label', 'Informasi landmark galaksi');
    const node = (tag, text) => { const el = document.createElement(tag); el.textContent = text; this.element.append(el); return el; };
    this.closeButton = node('button', 'Tutup ×'); this.closeButton.title = 'Tutup informasi landmark (Escape)';
    this.closeButton.setAttribute('aria-label', 'Tutup informasi landmark');
    this.title = node('h2', ''); this.aliases = node('p', ''); this.description = node('p', '');
    this.distance = node('p', ''); node('p', landmarkPositionNotice).className = 'landmark-note';
    this.sources = node('div', ''); document.body.append(this.element);
    this.list = document.createElement('details'); this.list.className = 'galaxy-landmark-list';
    const summary = document.createElement('summary'); summary.textContent = 'Landmark (13)'; this.list.append(summary);
    for (const data of galaxyLandmarks) {
      const button = document.createElement('button'); button.textContent = data.name; button.title = `Informasi ${data.name}`;
      button.dataset.landmark = data.id; this.list.append(button);
    }
    document.querySelector('#galaxy-placeholder').append(this.list);
    this.onList = e => { const id = e.target.closest('button')?.dataset.landmark; if (id) onSelect(id); };
    this.onClose = () => { this.hide(true); onSelect(null); };
    this.onKey = e => { if (e.key === 'Escape' && !this.element.hidden) this.onClose(); };
    this.list.addEventListener('click', this.onList); this.closeButton.addEventListener('click', this.onClose);
    window.addEventListener('keydown', this.onKey);
  }
  show(data) {
    if (this.element.hidden) this.returnFocus = document.activeElement;
    this.title.textContent = data.name; this.aliases.textContent = `${data.category}${data.aliases.length ? ' · ' + data.aliases.join(', ') : ''}`;
    this.description.textContent = data.description;
    const d = data.science.distance;
    this.distance.textContent = d ? `Jarak dari Bumi: sekitar ${new Intl.NumberFormat('id-ID').format(d.value)} tahun cahaya (perkiraan).` : 'Jarak tunggal: tidak berlaku untuk marker wilayah ini.';
    this.sources.replaceChildren();
    for (const source of data.sources) { const a = document.createElement('a'); a.textContent = source.title; a.href = source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; this.sources.append(a); }
    this.element.hidden = false; this.closeButton.focus({ preventScroll: true });
  }
  hide(restore = false) { this.element.hidden = true; if (restore && this.returnFocus?.isConnected) this.returnFocus.focus({ preventScroll: true }); }
  dispose() { this.list.removeEventListener('click', this.onList); this.closeButton.removeEventListener('click', this.onClose); window.removeEventListener('keydown', this.onKey); this.list.remove(); this.element.remove(); }
}
