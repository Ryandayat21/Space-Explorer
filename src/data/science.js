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
// Mean radii in km, NASA/JPL SSD satellite physical parameters, accessed 2026-10-11.
// Keep unavailable mass, temperature and rotation values null rather than infer them.
const moonRadii = { moon: 1737.4, phobos: 11.08, deimos: 6.2, io: 1821.49, europa: 1560.8, ganymede: 2631.2, callisto: 2410.3, mimas: 198.2, enceladus: 252.1, tethys: 531.1, dione: 561.4, rhea: 763.5, titan: 2574.76, iapetus: 734.3, miranda: 235.8, ariel: 578.9, umbriel: 584.7, titania: 788.9, oberon: 761.4, triton: 1352.6, nereid: 170, proteus: 208 };
export function scienceFor(body) {
  if (body.type !== 'moon') return {
    ...body, diameterKm: diameters[body.id] || body.radiusKm * 2,
    gravity: gravity[body.id] ? `${gravity[body.id]} m/s² (ekuator, efektif)` : body.gravity,
    temperature: body.temperature.replaceAll('\u00b1', '\u2248'),
    rotation: body.rotation.replaceAll('\u00b1', '\u2248'),
    description: body.description + (body.id === 'venus' ? ' Peta visual menampilkan permukaan; awan nyata menyembunyikannya dari pandangan optik.' : ''),
    composition: compositions[body.id],
    moons: totals[body.id] ? `${totals[body.id]} (NASA, 18 Maret 2025)` : body.id === 'sun' ? 'Tidak berlaku' : body.moons,
    sources: [{ label: 'NASA Planetary Fact Sheet (18 Maret 2025)', url: factSheet }, { label: 'NASA Science', url: `https://science.nasa.gov/${body.id}/facts/` }],
  };
  const parent = body.parent === 'earth' ? 'Bumi' : body.parent;
  return {
    ...body, diameterKm: moonRadii[body.id] * 2,
    radiusKm: null, mass: body.id === 'moon' ? '7,3 × 10²² kg' : null,
    gravity: body.id === 'moon' ? '1,6 m/s²' : null, temperature: body.id === 'moon' ? '−20 °C (rata-rata)' : null,
    distance: body.id === 'moon' ? '384.000 km dari Bumi (rata-rata)' : `Mengorbit ${parent}; jarak belum diverifikasi`,
    rotation: body.id === 'moon' ? '655,7 jam (sinkron)' : null,
    orbitPeriod: body.id === 'moon' ? '27,3 hari' : null, moons: 'Tidak berlaku',
    composition: body.id === 'moon' ? 'Batuan silikat; inti logam kecil.' : 'Belum diverifikasi',
    description: `${body.name} merupakan satelit alami ${parent}. Tekstur procedural selain Bulan merupakan ilustrasi, bukan peta permukaan.`,
    fact: body.id === 'moon' ? 'Rotasi sinkron membuat sisi yang sama selalu menghadap Bumi.' : 'Nilai yang belum diverifikasi sengaja tidak ditampilkan sebagai angka ilmiah.',
    sources: [{ label: 'NASA — satelit alami', url: body.id === 'moon' ? 'https://science.nasa.gov/moon/facts/' : `https://science.nasa.gov/${body.parent}/moons/` }, { label: 'NASA/JPL — radius rata-rata bulan', url: 'https://ssd.jpl.nasa.gov/sats/phys_par/' }, { label: 'NASA Fact Sheet', url: factSheet }],
  };
}
