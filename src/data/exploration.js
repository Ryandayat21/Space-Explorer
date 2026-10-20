import { reportFailure } from '../core/failures.js';
import { searchObjects } from './search.js';
import { scienceFor } from './science.js';

export const FAVORITES_KEY = 'milky-way-observer.favorites.v1';
const catalog = new Map(searchObjects().map(body => [body.id, body]));
export function validFavorites(value) {
  return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && catalog.has(id)))] : [];
}

export class Favorites {
  constructor(storage = () => window.localStorage) {
    this.storage = storage;
    this.ids = [];
    this.error = '';
    try {
      const raw = storage().getItem(FAVORITES_KEY);
      const value = raw === null ? [] : JSON.parse(raw);
      this.ids = validFavorites(value);
      if (!Array.isArray(value) || this.ids.length !== value.length) this.error = 'Data favorit tidak valid telah diabaikan.';
    } catch (error) { reportFailure('storage-exploration', error);
      this.error = 'Favorit tersimpan tidak dapat dibaca. Daftar sementara tetap dapat digunakan.';
    }
  }

  toggle(id) {
    if (!catalog.has(id)) return false;
    this.ids = this.ids.includes(id) ? this.ids.filter(value => value !== id) : [...this.ids, id];
    try {
      this.storage().setItem(FAVORITES_KEY, JSON.stringify(this.ids));
      this.error = '';
    } catch (error) { reportFailure('storage-exploration', error);
      this.error = 'Favorit hanya tersimpan untuk sesi ini; penyimpanan browser tidak tersedia.';
    }
    return true;
  }
}

export function comparisonData(ids) {
  const records = validFavorites(ids).slice(0, 2).map(id => {
    const body = catalog.get(id), data = scienceFor(body);
    const diameterKm = Number.isFinite(data.diameterKm) && data.diameterKm > 0 ? data.diameterKm : null;
    return { id, name: data.name, diameterKm,
      mass: data.mass ?? 'Belum diverifikasi', gravity: data.gravity ?? 'Belum diverifikasi',
      solarDistance: id === 'sun' ? '0 km (pusat acuan)' : body.parent
        ? 'Belum tersedia; jarak katalog bulan mengacu pada planet induk.' : data.distance ?? 'Belum diverifikasi',
      orbitPeriod: id === 'sun' ? 'Tidak berlaku (orbit terhadap Matahari)' : data.orbitPeriod ?? 'Belum diverifikasi',
      orbitReference: id === 'sun' ? '' : body.parent ? `Mengelilingi ${catalog.get(body.parent)?.name ?? body.parent}` : 'Mengelilingi Matahari',
      sources: data.sources };
  });
  const largest = Math.max(0, ...records.map(record => record.diameterKm ?? 0));
  return records.map(record => ({ ...record, sizeRatio: record.diameterKm && largest ? record.diameterKm / largest : null }));
}
