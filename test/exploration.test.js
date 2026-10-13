import test from 'node:test';
import assert from 'node:assert/strict';
import { Favorites, FAVORITES_KEY, validFavorites, comparisonData } from '../src/data/exploration.js';

test('favorites sanitize corruption, duplicate and unknown IDs and persist only IDs', () => {
  assert.deepEqual(validFavorites(['earth', 'earth', 1, 'missing', 'halley']), ['earth', 'halley']);
  for (const raw of ['{', '{}', 'null', '12']) {
    const store = new Favorites(() => ({ getItem: () => raw }));
    assert.deepEqual(store.ids, []); assert.ok(store.error);
  }
  let value = null;
  const storage = () => ({ getItem: () => value, setItem: (key, next) => { assert.equal(key, FAVORITES_KEY); value = next; } });
  const favorites = new Favorites(storage);
  favorites.toggle('earth'); favorites.toggle('halley'); favorites.toggle('earth');
  assert.equal(value, '["halley"]');
  assert.deepEqual(new Favorites(storage).ids, ['halley']);
  assert.equal(favorites.toggle('unknown'), false);
});

test('unavailable storage and quota errors retain session favorites', () => {
  const favorites = new Favorites(() => { throw new Error('SecurityError'); });
  favorites.toggle('moon'); assert.deepEqual(favorites.ids, ['moon']); assert.ok(favorites.error);
  const quota = new Favorites(() => ({ getItem: () => '[]', setItem: () => { throw new Error('QuotaExceededError'); } }));
  quota.toggle('earth'); assert.deepEqual(quota.ids, ['earth']); assert.ok(quota.error);
});

test('comparison limits to two distinct valid objects with scientific diameter ratios', () => {
  const result = comparisonData(['earth', 'earth', 'unknown', 'jupiter', 'mars']);
  assert.deepEqual(result.map(row => row.id), ['earth', 'jupiter']);
  assert.equal(result[0].diameterKm, 12756);
  assert.equal(result[1].diameterKm, 142984);
  assert.equal(result[0].sizeRatio, 12756 / 142984);
  assert.equal(result[1].sizeRatio, 1);
  for (const row of result) for (const key of ['mass', 'gravity', 'solarDistance', 'orbitPeriod', 'sources']) assert.ok(row[key]);
  assert.deepEqual(comparisonData([]), []);
});

test('comparison does not mislabel moon-parent distances or fabricate unknown masses', () => {
  const [moon, pluto] = comparisonData(['moon', 'pluto']);
  assert.match(moon.solarDistance, /Belum tersedia/);
  assert.match(moon.orbitReference, /Bumi/);
  assert.equal(pluto.mass, 'Belum diverifikasi');
  const [sun] = comparisonData(['sun']);
  assert.equal(sun.solarDistance, '0 km (pusat acuan)');
  assert.match(sun.orbitPeriod, /Tidak berlaku/);
});
