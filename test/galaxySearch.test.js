import test from 'node:test';
import assert from 'node:assert/strict';
import { searchGalaxy, modeSearch, galaxyInfo, galaxyGroups, galaxyCategory } from '../src/data/galaxySearch.js';
import { galaxyLandmarks } from '../src/data/galaxyLandmarks.js';
test('galaxy search matches aliases, grouped categories, case and whitespace without duplicates', () => {
  assert.equal(searchGalaxy('  SGR A* ')[0].id, 'galactic-center');
  assert.equal(searchGalaxy('seven sisters')[0].id, 'pleiades');
  assert.equal(searchGalaxy('does not exist').length, 0);
  assert.equal(new Set(searchGalaxy().map(x => x.id)).size, 13);
  assert.deepEqual(new Set(galaxyLandmarks.map(galaxyCategory)), new Set(galaxyGroups));
});
test('mode catalogs remain separate and solar fallback is explicit', () => {
  assert.equal(modeSearch('earth', 'solar-system').mode, 'solar-system');
  assert.equal(modeSearch('sirius', 'solar-system').mode, 'galaxy');
  assert.equal(modeSearch('', 'solar-system').results.some(x => x.id === 'solar-system-region'), false);
  assert.equal(modeSearch('earth', 'galaxy').results.length, 0);
});
test('galaxy information formats distance, schematic coordinates, breadcrumb and missing values', () => {
  const item = galaxyLandmarks.find(x => x.id === 'sirius'); const info = galaxyInfo(item);
  assert.match(info.distance, /8,6/); assert.match(info.position, /approximate/);
  assert.match(info.breadcrumb, /^Milky Way > .* > Sirius$/); assert.equal(info.category, 'Star System');
  const absent = galaxyInfo({ ...item, science: {}, position: null });
  assert.match(absent.distance, /belum tersedia/); assert.match(absent.position, /belum tersedia/);
  assert.doesNotMatch(JSON.stringify(absent), /undefined|null/);
});
