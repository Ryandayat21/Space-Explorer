import { galaxyLandmarks, landmarkPositionNotice } from '../data/galaxyLandmarks.js';
import { informationRows, searchCategory, categoryIcon } from '../data/discoveryUI.js';
const node = (tag, text = '', className = '') => { const el = document.createElement(tag); el.textContent = text; el.className = className; return el; };
const action = (text, label) => { const el = node('button', text); el.type = 'button'; el.title = label; el.setAttribute('aria-label', label); return el; };
export class GalaxyLandmarkPanel {
  constructor(onSelect, onEnterSolarSystem, onFocus) {
    this.element = node('section', '', 'galaxy-landmark-panel glass-panel'); this.element.id = 'galaxy-landmark-panel';
    this.element.hidden = true; this.element.setAttribute('aria-labelledby', 'landmark-title');
    const header = node('header', '', 'landmark-header');
    this.badge = node('span', '', 'category-badge'); this.title = node('h2'); this.title.id = 'landmark-title'; this.aliases = node('p', '', 'landmark-aliases');
    this.closeButton = action('×', 'Tutup panel informasi'); this.closeButton.className = 'landmark-close icon-button';
    header.append(this.closeButton, this.badge, this.title, this.aliases);
    this.content = node('div', '', 'landmark-content');
    const actions = node('div', '', 'landmark-actions'); this.focusButton = action('◎ Focus / View', 'Fokus ke landmark');
    this.enterButton = action('Enter Solar System', 'Enter Solar System'); this.enterButton.hidden = true; actions.append(this.focusButton, this.enterButton);
    this.content.append(actions); this.element.append(header, this.content);
    this.onEnter = onEnterSolarSystem; this.enterButton.addEventListener('click', this.onEnter);
    this.onFocus = () => onFocus?.(this.selectedId); this.focusButton.addEventListener('click', this.onFocus);
    document.body.append(this.element);
    this.list = node('details', '', 'galaxy-landmark-list');
    this.list.append(node('summary', `Landmarks · ${galaxyLandmarks.length}`));
    const groups = new Map();
    for (const data of galaxyLandmarks) {
      const category = searchCategory(data, 'galaxy'); let group = groups.get(category);
      if (!group) { group = node('details', '', 'landmark-category'); group.open = true; group.append(node('summary', category)); this.list.append(group); groups.set(category, group); }
      const button = action('', `Informasi ${data.name}`); button.dataset.landmark = data.id; button.setAttribute('aria-pressed', 'false');
      const icon = node('span', categoryIcon(category), 'category-icon'); icon.setAttribute('aria-hidden', 'true');
      const copy = node('span'); copy.append(node('strong', data.name), node('small', category)); button.append(icon, copy); group.append(button);
    }
    document.querySelector('#galaxy-placeholder').append(this.list);
    this.onList = e => { const id = e.target.closest('button')?.dataset.landmark; if (id) onSelect(id); };
    this.onToggle = e => { if (e.target === this.list && this.list.open) this.revealSelection(); };
    this.list.addEventListener('toggle', this.onToggle);
    this.onClose = () => { this.hide(true); onSelect(null); };
    this.onKey = e => { if (e.key === 'Escape' && !this.element.hidden && !document.fullscreenElement && !document.body.classList.contains('mode-transitioning')) this.onClose(); };
    this.list.addEventListener('click', this.onList); this.closeButton.addEventListener('click', this.onClose); window.addEventListener('keydown', this.onKey);
  }
  show(data) {
    clearTimeout(this.hideTimer); this.element.classList.remove('closing'); this.element.inert = false;
    if (this.element.hidden) this.returnFocus = document.activeElement;
    this.selectedId = data.id;
    if (matchMedia('(max-width: 900px)').matches) this.list.open = false;
    document.dispatchEvent(new CustomEvent('observer-selection', { detail: data.id }));
    this.list.querySelectorAll('[data-landmark]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.landmark === data.id)));
    this.revealSelection();
    this.enterButton.hidden = data.id !== 'solar-system-region';
    const info = informationRows(data); this.badge.textContent = info.category; this.title.textContent = data.name;
    this.aliases.textContent = data.aliases?.join(' · ') || ''; this.aliases.hidden = !this.aliases.textContent;
    this.content.querySelectorAll('section').forEach(section => section.remove());
    const section = title => { const section = node('section'); section.append(node('h3', title)); this.content.append(section); return section; };
    const rows = (parent, values) => { const dl = node('dl', '', 'information-rows'); for (const [label, value] of values) dl.append(node('dt', label), node('dd', value ?? '—')); parent.append(dl); };
    section('Overview').append(node('p', data.description || '—'));
    const location = section('Location'); rows(location, [['Wilayah', info.region]]);
    const crumb = node('nav', info.breadcrumb, 'landmark-breadcrumb'); crumb.setAttribute('aria-label', 'Breadcrumb mode'); location.append(crumb);
    const science = section('Scientific Data'); rows(science, [['Jarak astronomi dari Bumi', info.distance], ['Kategori', info.category]]);
    science.append(node('h4', 'Posisi visual / model (unit model)')); rows(science, info.coordinates);
    const notice = section('Accuracy Notice'); notice.className = 'accuracy-notice'; notice.append(node('p', `${info.approximate ? 'Approximate / skematis. ' : ''}${landmarkPositionNotice}`));
    const sources = section('Sources'), ul = node('ul');
    for (const source of data.sources || []) { const li = node('li'), a = node('a', source.title); a.href = source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.append(a); ul.append(li); }
    if (!ul.children.length) ul.append(node('li', '—')); sources.append(ul);
    this.element.hidden = false; this.element.scrollTop = 0; this.closeButton.focus({ preventScroll: true });
  }
  revealSelection() {
    const button = this.list.querySelector('[aria-pressed=true]');
    if (button && this.list.open) { button.closest('details').open = true; button.scrollIntoView({ block: 'nearest' }); }
  }
  hide(restore = false) {
    if (!restore && this.element.classList.contains('closing')) return;
    clearTimeout(this.hideTimer); this.selectedId = null;
    this.list.querySelectorAll('[data-landmark]').forEach(button => button.setAttribute('aria-pressed', 'false'));
    if (restore) {
      this.element.classList.add('closing'); this.element.inert = true;
      this.hideTimer = setTimeout(() => { this.element.hidden = true; this.element.classList.remove('closing'); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 140);
      if (this.returnFocus?.isConnected && !this.element.contains(this.returnFocus)) this.returnFocus.focus({ preventScroll: true });
      document.dispatchEvent(new Event('observer-panel-closed'));
    } else this.element.hidden = true;
  }
  dispose() { clearTimeout(this.hideTimer); this.list.removeEventListener('toggle', this.onToggle); this.focusButton.removeEventListener('click', this.onFocus); this.enterButton.removeEventListener('click', this.onEnter); this.list.removeEventListener('click', this.onList); this.closeButton.removeEventListener('click', this.onClose); window.removeEventListener('keydown', this.onKey); this.list.remove(); this.element.remove(); }
}
