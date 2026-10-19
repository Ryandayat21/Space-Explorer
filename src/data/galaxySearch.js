import { galaxyLandmarks } from './galaxyLandmarks.js';
import { searchObjects } from './search.js';
export const galaxyGroups = ['Galactic Center', 'Galactic Structure', 'Star System', 'Star', 'Nebula', 'Star Cluster'];
export function galaxyCategory(item) {
  if (['solar-system-region', 'alpha-centauri', 'sirius'].includes(item.id)) return 'Star System';
  return ({ 'galactic-center': 'Galactic Center', spur: 'Galactic Structure', 'spiral-arm': 'Galactic Structure', star: 'Star', nebula: 'Nebula', 'star-cluster': 'Star Cluster' })[item.category] || 'Galactic Structure';
}
const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id').trim();
export function searchGalaxy(query = '') {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return galaxyLandmarks.filter(item => {
    const text = normalize([item.name, item.id, ...item.aliases, galaxyCategory(item)].join(' '));
    return terms.every(term => text.includes(term));
  });
}
// Active catalog takes precedence. Explicitly labelled galaxy fallback only for
// a nonempty solar query with no local matches; never merge duplicate catalogs.
export function modeSearch(query = '', mode = 'solar-system', filter = 'all') {
  if (mode === 'galaxy') return { mode, results: searchGalaxy(query) };
  const results = searchObjects(query, filter);
  return results.length || !normalize(query) ? { mode: 'solar-system', results } : { mode: 'galaxy', results: searchGalaxy(query) };
}
export function galaxyInfo(item) {
  const category = galaxyCategory(item);
  const region = item.category === 'galactic-center' ? 'Pusat galaksi' : category === 'Galactic Structure' ? 'Disk galaksi (skematis)' : 'Wilayah lokal (skematis)';
  const d = item.science?.distance;
  const distance = d && Number.isFinite(d.value) ? `Jarak dari Bumi: ${d.approximate ? 'sekitar ' : ''}${new Intl.NumberFormat('id-ID').format(d.value)} tahun cahaya${d.approximate ? ' (perkiraan)' : ''}.` : 'Jarak tunggal: data belum tersedia atau tidak berlaku untuk wilayah.';
  const p = item.position;
  const position = p?.coordinates?.length === 3 && p.coordinates.every(Number.isFinite) ? `Posisi model X/Y/Z: ${p.coordinates.join(' / ')} unit model${p.approximate ? ' (approximate / skematis)' : ''}. Bukan koordinat astrometri.` : 'Posisi: Data belum tersedia';
  return { category, region, distance, position, breadcrumb: `Milky Way > ${region} > ${item.name}` };
}
