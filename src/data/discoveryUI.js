import { modeSearch, galaxyCategory, galaxyInfo } from './galaxySearch.js';
import { searchObjects } from './search.js';
export const searchCategory = (item, mode) => mode === 'galaxy' ? (galaxyCategory(item) === 'Galactic Center' ? 'Galactic Structure' : galaxyCategory(item)) : 'Solar System Object';
export const categoryIcon = category => ({ 'Galactic Structure': '◎', 'Star System': '✧', Star: '✦', Nebula: '◌', 'Star Cluster': '⁙', 'Solar System Object': '◉' })[category] || '◎';
export function autocompleteResults(query, mode, filter = 'all', recent = []) {
  let result = modeSearch(query, mode, filter);
  if (mode === 'galaxy' && query.trim() && !result.results.length) result = { mode: 'solar-system', results: searchObjects(query) };
  if (!result.results.length && query.trim()) {
    const term = query.trim().toLocaleLowerCase('id');
    const categories = { star: 'star bintang', planet: 'planet', moon: 'moon bulan', 'dwarf-planet': 'dwarf planet katai', comet: 'comet komet' };
    result = { mode: 'solar-system', results: searchObjects('', filter).filter(item => term === 'solar system object' || categories[item.type || 'moon']?.includes(term)) };
  }
  const rows = result.results.map(item => ({ item, mode: result.mode, category: searchCategory(item, result.mode) }));
  if (!query.trim()) rows.sort((a, b) => recent.indexOf(b.item.id) - recent.indexOf(a.item.id));
  return rows;
}
export function informationRows(item = {}) {
  item ??= {};
  const info = galaxyInfo({ ...item, name: item.name || '—' });
  const distance = item.science?.distance;
  const number = value => Number.isFinite(value) ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(value).replace('-', '−') : '—';
  return {
    category: info.category, region: info.region, breadcrumb: info.breadcrumb,
    distance: Number.isFinite(distance?.value) ? `${distance.approximate ? '≈ ' : ''}${number(distance.value)} tahun cahaya` : '—',
    coordinates: ['X', 'Y', 'Z'].map((label, index) => [label, number(item.position?.coordinates?.[index])]),
    approximate: Boolean(item.position?.approximate || distance?.approximate),
  };
}
