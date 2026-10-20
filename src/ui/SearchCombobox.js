import { autocompleteResults, categoryIcon } from '../data/discoveryUI.js';
export class SearchCombobox {
  constructor(ui) {
    this.events = new AbortController();
    const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: this.events.signal });
    this.ui = ui; this.input = document.getElementById('search-input'); this.root = this.input.parentElement;
    this.list = document.getElementById('search-results'); this.clear = document.getElementById('search-clear'); this.recent = [];
    listen(this.input, 'input', () => this.render(true));
    listen(this.input, 'focus', () => this.render(true));
    listen(this.input, 'keydown', event => {
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault(); if (this.list.hidden) this.render(true);
        this.index = !this.rows.length ? -1 : this.index < 0 ? (event.key === 'ArrowDown' ? 0 : this.rows.length - 1) : (this.index + (event.key === 'ArrowDown' ? 1 : -1) + this.rows.length) % this.rows.length; this.highlight();
      } else if (event.key === 'Enter') { event.preventDefault(); this.choose(this.index < 0 ? 0 : this.index); }
      else if (event.key === 'Escape') { this.close(); event.preventDefault(); }
      else if (event.key === 'Tab') this.close();
    });
    listen(this.clear, 'click', () => { this.input.value = ''; this.input.focus(); this.render(true); });
    listen(this.list, 'pointerdown', event => event.preventDefault());
    listen(this.list, 'click', event => { const option = event.target.closest('[role=option]'); if (option) this.choose(Number(option.dataset.index)); });
    listen(this.root, 'focusout', event => { if (!this.root.contains(event.relatedTarget)) this.close(); });
    listen(document, 'pointerdown', event => { if (!this.root.contains(event.target)) this.close(); });
    listen(window, 'keydown', event => {
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !document.pointerLockElement && !document.querySelector('dialog[open]') && !document.body.classList.contains('mode-transitioning') && !document.body.classList.contains('hud-hidden') && !['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName) && !event.target.isContentEditable) { event.preventDefault(); this.input.focus(); }
    });
    listen(document, 'observer-selection', event => { this.recent = [...this.recent.filter(id => id !== event.detail), event.detail].slice(-5); });
    listen(document, 'observer-panel-closed', () => this.close());
    this.render(false);
  }
  dispose() { this.events.abort(); this.close(); }
  close() { this.list.hidden = true; this.input.setAttribute('aria-expanded', 'false'); this.input.removeAttribute('aria-activedescendant'); }
  choose(index) { const row = this.rows[index]; if (!row) return; this.close(); this.ui.chooseSearch(row.item.id, row.mode); }
  highlight() {
    this.list.querySelectorAll('[role=option]').forEach((node, index) => node.setAttribute('aria-selected', String(index === this.index)));
    const active = this.list.querySelector(`[data-index="${this.index}"]`);
    if (active) { this.input.setAttribute('aria-activedescendant', active.id); active.scrollIntoView({ block: 'nearest' }); }
  }
  mark(element, value) {
    const query = this.input.value.trim(), start = query ? value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) : -1;
    if (start < 0) { element.textContent = value; return; }
    element.append(value.slice(0, start)); const mark = document.createElement('mark'); mark.textContent = value.slice(start, start + query.length); element.append(mark, value.slice(start + query.length));
  }
  render(open = false) {
    this.rows = autocompleteResults(this.input.value, this.ui.mode, this.ui.filter || 'all', this.recent); this.index = -1;
    const order = [...new Set(this.rows.map(row => row.category))];
    this.rows.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
    this.clear.hidden = !this.input.value; this.list.replaceChildren(); this.input.removeAttribute('aria-activedescendant');
    const groups = new Map();
    for (const [index, row] of this.rows.entries()) {
      let group = groups.get(row.category);
      if (!group) {
        group = document.createElement('div'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', row.category);
        const heading = document.createElement('div'); heading.className = 'search-group'; heading.textContent = row.category; heading.setAttribute('role', 'presentation'); group.append(heading); this.list.append(group); groups.set(row.category, group);
      }
      const option = document.createElement('div'); option.id = `search-option-${index}`; option.dataset.index = index; option.dataset.objectId = row.item.id; option.setAttribute('role', 'option'); option.setAttribute('aria-selected', 'false');
      const icon = document.createElement('i'); icon.textContent = categoryIcon(row.category); icon.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('span'), name = document.createElement('strong'), meta = document.createElement('small');
      this.mark(name, row.item.name);
      this.mark(meta, [row.category, row.item.aliases?.join(', ') || (row.mode === 'galaxy' ? 'Milky Way' : row.item.type || 'Bulan'), this.recent.includes(row.item.id) ? 'Terakhir dipilih' : ''].filter(Boolean).join(' · '));
      copy.append(name, meta); option.append(icon, copy); group.append(option);
    }
    const status = document.getElementById('search-status');
    status.textContent = this.rows.length ? `${this.rows.length} ${this.rows[0].mode === 'galaxy' ? 'landmark Milky Way' : 'objek Tata Surya'}` : 'Objek tidak ditemukan. Coba nama atau kategori lain.';
    if (!this.rows.length) { const empty = document.createElement('div'); empty.className = 'search-empty'; empty.textContent = status.textContent; this.list.append(empty); }
    this.list.hidden = !open; this.input.setAttribute('aria-expanded', String(open));
  }
}
