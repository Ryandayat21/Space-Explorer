import test from 'node:test';
import assert from 'node:assert/strict';
import { autocompleteResults, searchCategory, informationRows } from '../src/data/discoveryUI.js';
import { galaxyLandmarks } from '../src/data/galaxyLandmarks.js';
test('autocomplete reuses catalogs, aliases, filters and cross-mode fallback', () => {
  assert.equal(autocompleteResults('M42', 'galaxy')[0].item.id, 'orion-nebula');
  assert.equal(autocompleteResults('earth', 'galaxy')[0].mode, 'solar-system');
  assert.equal(autocompleteResults('Sirius', 'solar-system')[0].mode, 'galaxy');
  assert.ok(autocompleteResults('planet', 'solar-system').every(row => ['planet', 'dwarf-planet'].includes(row.item.type)));
  assert.equal(autocompleteResults('unknownxxx', 'galaxy').length, 0);
  assert.ok(autocompleteResults('', 'solar-system', 'moon').every(row => !row.item.type || row.item.type === 'moon'));
});
test('category groups and recent selection have unique IDs', () => {
  const rows = autocompleteResults('', 'galaxy', 'all', ['sirius']);
  assert.equal(rows[0].item.id, 'sirius'); assert.equal(rows.length, 13);
  assert.equal(new Set(rows.map(row => row.item.id)).size, 13);
  assert.equal(searchCategory(galaxyLandmarks[0], 'galaxy'), 'Galactic Structure');
  assert.deepEqual(new Set(rows.map(row => row.category)), new Set(['Galactic Structure', 'Star System', 'Star', 'Nebula', 'Star Cluster']));
});
test('information rows separate scientific distances and model coordinates, tolerating absent values', () => {
  const info = informationRows(galaxyLandmarks.find(item => item.id === 'orion-spur'));
  assert.deepEqual(info.coordinates, [['X','7'], ['Y','0'], ['Z','−2']]); assert.equal(info.distance, '—'); assert.equal(info.approximate, true);
  assert.match(informationRows(galaxyLandmarks.find(item => item.id === 'sirius')).distance, /8,6 tahun cahaya/);
  for (const item of [{}, { position: null, science: null }, { position: { coordinates: [NaN, undefined, Infinity] } }]) {
    const rows = informationRows(item); assert.ok(rows.coordinates.every(([, value]) => value === '—')); assert.equal(rows.distance, '—'); assert.doesNotMatch(JSON.stringify(rows), /undefined|null|NaN|Infinity/);
  }
});
