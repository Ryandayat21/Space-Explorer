import { bodies } from './celestialBodies.js';
import { moonScience, moonRadiiKm } from './moonScience.js';
import { dwarfScienceFor } from './dwarfPlanets.js';
import { cometScienceFor } from './comets.js';

// Scientific content is independent of scene radius, orbit spacing and time scale.
// Moon totals are a dated NASA snapshot, not a claim of current discovery totals.
export const factSheet = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/';
const compositions = {
  sun: 'Plasma, terutama hidrogen dan helium.', mercury: 'Batuan silikat dan inti logam besar.',
  venus: 'Batuan; atmosfer terutama karbon dioksida, awan asam sulfat.',
  earth: 'Batuan, inti besi, air; atmosfer nitrogen dan oksigen.', mars: 'Batuan; atmosfer tipis terutama karbon dioksida.',
  jupiter: 'Terutama hidrogen dan helium.', saturn: 'Terutama hidrogen dan helium; cincin terutama es air.',
  uranus: 'Hidrogen, helium, metana; interior kaya material air, amonia, dan metana.',
  neptune: 'Hidrogen, helium, metana; interior kaya material air, amonia, dan metana.',
};
const totals = { jupiter: 95, saturn: 274, uranus: 28, neptune: 16 };
const diameters = { mercury: 4879, venus: 12104, earth: 12756, mars: 6792, jupiter: 142984, saturn: 120536, uranus: 51118, neptune: 49528 };
const gravity = { mercury: 3.7, venus: 8.9, earth: 9.8, mars: 3.7, jupiter: 23.1, saturn: 9, uranus: 8.7, neptune: 11 };
export function scienceFor(body) {
  if (body.type === 'comet') return cometScienceFor(body);
  if (body.type === 'dwarf-planet') return dwarfScienceFor(body);
  if (body.type !== 'moon' && !body.parent) return {
    ...body, diameterKm: diameters[body.id] || body.radiusKm * 2,
    gravity: gravity[body.id] ? `${gravity[body.id]} m/s² (ekuator, efektif)` : body.gravity,
    temperature: body.temperature.replaceAll('\u00b1', '\u2248'),
    rotation: body.rotation.replaceAll('\u00b1', '\u2248'),
    description: body.description + (body.id === 'venus' ? ' Peta visual menampilkan permukaan; awan nyata menyembunyikannya dari pandangan optik.' : ''),
    composition: compositions[body.id],
    moons: totals[body.id] ? `${totals[body.id]} (NASA, 18 Maret 2025)` : body.id === 'sun' ? 'Tidak berlaku' : body.moons,
    sources: [{ label: 'NASA Planetary Fact Sheet (18 Maret 2025)', url: factSheet }, { label: 'NASA Science', url: `https://science.nasa.gov/${body.id}/facts/` }],
  };
  const parent = bodies.find(planet => planet.id === body.parent)?.name ?? body.parent;
  const data = moonScience[body.id];
  const number = value => value.toLocaleString('id-ID', { maximumFractionDigits: 4 });
  return {
    ...body, type: 'moon', diameterKm: data?.diameterKm ?? (moonRadiiKm[body.id] ? moonRadiiKm[body.id] * 2 : null),
    radiusKm: data?.radiusKm ?? null,
    mass: data ? `${data.massKg.toExponential(2).replace('.', ',')} kg (perkiraan dari GM/G)` : null,
    gravity: data ? `${Number(data.gravityMs2.toPrecision(3)).toLocaleString('id-ID', { maximumSignificantDigits: 3 })} m/s² (GM/R²; pendekatan bola)` : null,
    temperature: data?.temperature ?? null,
    distance: data ? `${number(data.semiMajorAxisKm)} km dari pusat ${parent} (${data.distanceDefinition ?? 'sumbu semi-mayor'})` : `Mengorbit ${parent}; jarak belum diverifikasi`,
    rotation: data?.rotation ?? null,
    orbitPeriod: data ? `${number(data.orbitalPeriodDays)} hari (${data.periodDefinition ?? 'elemen rata-rata JPL'})` : null,
    moons: 'Tidak berlaku', composition: data?.composition ?? 'Belum diverifikasi',
    description: `${body.name} merupakan satelit alami ${parent}. ${data?.composition ?? 'Detail komposisi belum diverifikasi.'} ${body.id === 'moon' ? 'Jika peta lokal gagal dimuat, material procedural tetap digunakan.' : 'Tekstur procedural merupakan ilustrasi, bukan peta permukaan.'}`,
    fact: data?.fact ?? 'Nilai yang belum diverifikasi sengaja tidak ditampilkan sebagai angka ilmiah.',
    sources: data?.sources ?? [{ label: 'NASA/JPL — radius rata-rata bulan', url: 'https://ssd.jpl.nasa.gov/sats/phys_par/' }],
  };
}
