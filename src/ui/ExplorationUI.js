import { Favorites, comparisonData } from '../data/exploration.js';
import { searchObjects } from '../data/search.js';

const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};

export class ExplorationUI {
  constructor(ui) {
    this.ui = ui;
    this.favorites = new Favorites();
    this.catalog = searchObjects();
    this.bookmark = document.getElementById('bookmark-button');
    this.favoriteDialog = document.getElementById('favorites-dialog');
    this.compareDialog = document.getElementById('comparison-dialog');
    this.selects = [document.getElementById('compare-first'), document.getElementById('compare-second')];
    for (const select of this.selects) {
      select.add(new Option('Pilih objek', ''));
      for (const body of this.catalog) select.add(new Option(body.name, body.id));
      select.addEventListener('change', () => this.renderComparison());
    }
    this.bookmark.addEventListener('click', () => {
      this.favorites.toggle(ui.selectedId); this.refresh();
    });
    document.getElementById('favorites-button').addEventListener('click', () => {
      this.refresh(); this.favoriteDialog.showModal();
    });
    document.getElementById('compare-button').addEventListener('click', () => this.openComparison(ui.selectedId));
    document.getElementById('favorites-compare').addEventListener('click', () => {
      this.favoriteDialog.close(); this.openComparison(this.favorites.ids[0], document.getElementById('favorites-button'));
    });
    document.getElementById('close-favorites').addEventListener('click', () => this.favoriteDialog.close());
    document.getElementById('close-comparison').addEventListener('click', () => this.compareDialog.close());
    this.compareDialog.addEventListener('close', () => this.returnFocus?.focus());
    this.refresh();
  }

  refresh() {
    const saved = this.favorites.ids.includes(this.ui.selectedId);
    this.bookmark.textContent = saved ? '★ Hapus bookmark' : '☆ Bookmark';
    this.bookmark.setAttribute('aria-pressed', String(saved));
    document.getElementById('favorites-status').textContent = this.favorites.error;
    document.getElementById('bookmark-status').textContent = this.favorites.error;
    const list = document.getElementById('favorites-list');
    list.replaceChildren();
    document.getElementById('favorites-empty').hidden = this.favorites.ids.length > 0;
    for (const id of this.favorites.ids) {
      const body = this.catalog.find(body => body.id === id);
      const item = element('li'), visit = element('button', body.name, 'button button-ghost');
      visit.type = 'button'; visit.setAttribute('aria-label', `Kunjungi ${body.name}`);
      visit.addEventListener('click', () => { this.favoriteDialog.close(); this.ui.emit('select', id); });
      const remove = element('button', 'Hapus', 'button button-ghost'); remove.type = 'button';
      remove.setAttribute('aria-label', `Hapus ${body.name} dari favorit`);
      remove.addEventListener('click', () => {
        this.favorites.toggle(id); this.refresh();
        document.getElementById('close-favorites').focus();
      });
      item.append(visit, remove); list.append(item);
    }
  }

  openComparison(id, returnFocus = document.getElementById('compare-button')) {
    this.returnFocus = returnFocus;
    this.selects[0].value = id ?? '';
    this.selects[1].value = '';
    this.renderComparison();
    this.compareDialog.showModal();
  }

  renderComparison() {
    for (let index = 0; index < 2; index++) {
      for (const option of this.selects[index].options) option.disabled = !!option.value && option.value === this.selects[1 - index].value;
    }
    const data = comparisonData(this.selects.map(select => select.value));
    const table = document.getElementById('comparison-table'); table.replaceChildren();
    const header = element('tr');
    header.append(element('th', 'Parameter'));
    data.forEach(record => { const cell = element('th', record.name); cell.scope = 'col'; header.append(cell); });
    const head = element('thead'); head.append(header); table.append(head);
    const body = element('tbody');
    for (const [label, key] of [['Diameter', 'diameterKm'], ['Massa', 'mass'], ['Gravitasi', 'gravity'], ['Jarak dari Matahari', 'solarDistance'], ['Periode orbit', 'orbitPeriod']]) {
      const row = element('tr'), heading = element('th', label); heading.scope = 'row'; row.append(heading);
      for (const record of data) row.append(element('td', key === 'diameterKm'
        ? record.diameterKm ? `${record.diameterKm.toLocaleString('id-ID')} km` : 'Belum diverifikasi'
        : key === 'orbitPeriod' && record.orbitReference ? `${record[key]} — ${record.orbitReference}` : record[key]));
      body.append(row);
    }
    table.append(body); table.hidden = !data.length;
    document.getElementById('comparison-empty').hidden = data.length === 2;
    const visual = document.getElementById('comparison-visual'); visual.replaceChildren();
    const sources = document.getElementById('comparison-sources'); sources.replaceChildren();
    for (const record of data) {
      const figure = element('figure'), holder = element('div', undefined, 'comparison-circle-holder');
      const circle = element('div', undefined, 'comparison-circle');
      circle.style.width = circle.style.height = `${(record.sizeRatio ?? 0) * 140}px`;
      circle.setAttribute('aria-hidden', 'true'); holder.append(circle);
      figure.append(holder, element('figcaption', `${record.name}: ${record.diameterKm?.toLocaleString('id-ID') ?? 'Tidak diketahui'} km`));
      visual.append(figure);
      const group = element('div', record.name + ': ');
      for (const source of record.sources) {
        const link = element('a', source.label); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        group.append(link, document.createTextNode(' '));
      }
      sources.append(group);
    }
  }
}
