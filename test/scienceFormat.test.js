import test from 'node:test';
import assert from 'node:assert/strict';
import { formatScienceValue, scienceSections } from '../src/data/scienceFormat.js';

test('science formatter preserves zero and handles unavailable or invalid values', () => {
  for (const value of [null, undefined, NaN, Infinity, '', 'undefined', 'null', 'Belum diverifikasi', {}]) {
    assert.equal(formatScienceValue(value, 'km'), 'Data belum tersedia');
  }
  assert.equal(formatScienceValue(0, 'km'), '0 km');
  assert.equal(formatScienceValue('Tidak berlaku'), 'Tidak berlaku');
});

test('science formatter localizes numbers and scientific notation without losing source qualifiers', () => {
  assert.equal(formatScienceValue(1392680, 'km'), '1.392.680 km');
  assert.equal(formatScienceValue('7,35e+22 kg (perkiraan dari GM/G)'), '7,35 × 10²² kg (perkiraan dari GM/G)');
  assert.equal(formatScienceValue('9.8 m/s² (ekuator, efektif)'), '9,8 m/s² (ekuator, efektif)');
  assert.equal(formatScienceValue('17,94 AU dari Matahari'), '17,94 au dari Matahari');
  assert.equal(formatScienceValue('95–390 K (rentang harian)'), '95–390 K (rentang harian)');
});

test('sections distinguish parent distances and non-applicable solar orbit', () => {
  const moon = scienceSections({ type: 'moon', diameterKm: 1 });
  assert.equal(moon[1].rows[0][0], 'Jarak dari induk');
  assert.equal(moon[0].rows[1][1], 'Data belum tersedia');
  const sun = scienceSections({ type: 'star', orbitPeriod: '—' });
  assert.match(sun[1].rows[2][1], /Tidak berlaku/);
});
