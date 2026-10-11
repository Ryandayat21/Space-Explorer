// Checked 2026-10-11. Scientific values ONLY: never use scene size/distance/period.
// Radius and GM: https://ssd.jpl.nasa.gov/sats/phys_par/
// Semi-major axes and mean-element periods: https://ssd.jpl.nasa.gov/sats/elem/sep.html
// G (SI, CODATA 2018): https://ssd.jpl.nasa.gov/astro_par.html
// Narrative, composition and temperatures: NASA Science links on each record.
export const moonRadiiKm = { moon: 1737.4, phobos: 11.08, deimos: 6.2, io: 1821.49, europa: 1560.8, ganymede: 2631.2, callisto: 2410.3, mimas: 198.2, enceladus: 252.1, tethys: 531.1, dione: 561.4, rhea: 763.5, titan: 2574.76, iapetus: 734.3, miranda: 235.8, ariel: 578.9, umbriel: 584.7, titania: 788.9, oberon: 761.4, triton: 1352.6, nereid: 170, proteus: 208 };

const physicalSource = { label: 'JPL: radius dan GM', url: 'https://ssd.jpl.nasa.gov/sats/phys_par/' };
const elementsSource = { label: 'JPL: elemen orbit rata-rata', url: 'https://ssd.jpl.nasa.gov/sats/elem/sep.html' };
const constantSource = { label: 'JPL: konstanta G', url: 'https://ssd.jpl.nasa.gov/astro_par.html' };
const lunarSource = { label: 'NASA Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' };
const nasa = path => ({ label: 'NASA Science', url: `https://science.nasa.gov/${path}/` });
const uranusComposition = 'Diperkirakan berupa campuran es air dan batuan silikat.';
const uranusSource = nasa('uranus/moons/ariel');

// GM in km^3/s^2; a in km (from parent center); P in Earth days.
// P is the JPL mean-element period, not a promise of a precise sidereal period.
// Rotation is only populated where verified independently; null means unverified.
const records = {
  moon: {
    gm: 4902.800, semiMajorAxisKm: 384400, orbitalPeriodDays: 27.3217,
    periodDefinition: 'periode sideris',
    rotation: '655,720 jam (sideris, sinkron)', temperature: '95–390 K (rentang harian di ekuator)',
    composition: 'Batuan silikat; inti kaya besi yang relatif kecil.',
    fact: 'Rotasi sinkron membuat sisi yang sama selalu menghadap Bumi.',
    source: nasa('moon/facts')
  },
  phobos: {
    gm: 0.0007087, semiMajorAxisKm: 9375, orbitalPeriodDays: 0.3187,
    temperature: '−112 hingga −4 °C (sisi malam dan siang terukur)',
    composition: 'Material gelap mirip batuan tipe C, dilapisi regolit.',
    fact: 'Kawah Stickney mendominasi permukaan Phobos, bulan terbesar Mars.',
    source: nasa('mars/moons/phobos')
  },
  deimos: {
    gm: 0.0000962, semiMajorAxisKm: 23457, orbitalPeriodDays: 1.2625,
    composition: 'Permukaan mirip material asteroid tipe C, dengan lapisan regolit tebal.',
    fact: 'Endapan debu yang mengisi sebagian kawah membuat Deimos tampak lebih halus daripada Phobos.',
    source: nasa('mars/moons/deimos')
  },
  io: {
    gm: 5959.91547, semiMajorAxisKm: 421800, orbitalPeriodDays: 1.762732,
    composition: 'Batuan silikat; permukaan memiliki lava silikat dan endapan vulkanik.',
    fact: 'Io memiliki ratusan gunung api dan aktivitas vulkanik paling intens di Tata Surya.',
    source: nasa('jupiter/jupiter-moons/io')
  },
  europa: {
    gm: 3202.71210, semiMajorAxisKm: 671100, orbitalPeriodDays: 3.525463,
    rotation: 'Sekitar 3,5 hari (sinkron)',
    composition: 'Kerak es air di atas interior berbatu; bukti kuat mendukung samudra bawah permukaan.',
    fact: 'Europa beresonansi dengan Io dan Ganymede; tarikan gravitasi membantu memanaskan interiornya.',
    source: nasa('jupiter/jupiter-moons/europa/europa-facts')
  },
  ganymede: {
    gm: 9887.83275, semiMajorAxisKm: 1070400, orbitalPeriodDays: 7.155588,
    composition: 'Dunia berlapis es dengan bukti kuat samudra air asin di bawah permukaan.',
    fact: 'Ganymede adalah bulan terbesar di Tata Surya dan memiliki medan magnet intrinsik.',
    source: nasa('jupiter/jupiter-moons/ganymede')
  },
  callisto: {
    gm: 7179.28340, semiMajorAxisKm: 1882700, orbitalPeriodDays: 16.690440,
    rotation: 'Sekitar 16,689 hari (sinkron)',
    composition: 'Campuran batuan dan es; kemungkinan menyimpan samudra bawah permukaan.',
    fact: 'Permukaan Callisto dipenuhi kawah tumbukan yang merekam sejarah sangat panjang.',
    source: nasa('jupiter/jupiter-moons/callisto/facts')
  },
  titan: {
    gm: 8978.13710, semiMajorAxisKm: 1221900, orbitalPeriodDays: 15.945448,
    rotation: 'Sekitar 16 hari (sinkron)', temperature: 'Sekitar −179 °C (permukaan)',
    composition: 'Es air dan batuan; atmosfer terutama nitrogen dengan metana.',
    fact: 'Danau dan laut di permukaan Titan berisi hidrokarbon cair seperti metana dan etana.',
    source: nasa('saturn/moons/titan/facts')
  },
  enceladus: {
    gm: 7.21037, semiMajorAxisKm: 238400, orbitalPeriodDays: 1.370218,
    composition: 'Kerak es air dengan samudra air asin di bawahnya.',
    fact: 'Semburan dari Enceladus membawa uap air dan partikel es ke ruang angkasa.',
    source: nasa('saturn/moons/enceladus')
  },
  rhea: {
    gm: 153.94175, semiMajorAxisKm: 527200, orbitalPeriodDays: 4.517503,
    rotation: 'Sekitar 4,5 hari (sinkron)', temperature: 'Sekitar −220 hingga −174 °C (teduh hingga tersinari)',
    composition: 'Didominasi es air dengan batuan; permukaan sangat berkawah.',
    fact: 'Cassini mendeteksi eksosfer sangat tipis yang mengandung oksigen dan karbon dioksida.',
    source: nasa('saturn/moons/rhea')
  },
  iapetus: {
    gm: 120.51511, semiMajorAxisKm: 3561700, orbitalPeriodDays: 79.331002,
    rotation: 'Sekitar 79 hari (sinkron)',
    composition: 'Diperkirakan didominasi es dengan sebagian batuan; material gelap menutupi satu sisi.',
    fact: 'Iapetus memiliki belahan terang dan gelap yang kontras serta punggungan pegunungan di ekuator.',
    source: nasa('saturn/moons/iapetus')
  },
  titania: {
    gm: 226.9, semiMajorAxisKm: 436298, orbitalPeriodDays: 8.705869,
    composition: uranusComposition, compositionSource: uranusSource,
    fact: 'Titania adalah bulan terbesar Uranus; lembah patahannya menunjukkan riwayat aktivitas geologi.',
    source: nasa('uranus/moons/titania')
  },
  oberon: {
    gm: 205.3, semiMajorAxisKm: 583511, orbitalPeriodDays: 13.463237,
    composition: uranusComposition,
    fact: 'Oberon adalah bulan terbesar kedua Uranus dengan permukaan yang dipenuhi kawah.',
    source: nasa('uranus/moons/oberon')
  },
  ariel: {
    gm: 83.5, semiMajorAxisKm: 190929, orbitalPeriodDays: 2.520379,
    composition: 'Es air dan batuan silikat; karbon dioksida juga terdeteksi.',
    fact: 'Lembah patahan membelah Ariel, yang menunjukkan jejak aktivitas geologi relatif muda.',
    source: uranusSource
  },
  umbriel: {
    gm: 85.1, semiMajorAxisKm: 265986, orbitalPeriodDays: 4.144177,
    composition: uranusComposition, compositionSource: uranusSource,
    fact: 'Umbriel adalah yang paling gelap di antara bulan-bulan besar Uranus.',
    source: nasa('uranus/moons/umbriel')
  },
  miranda: {
    gm: 4.3, semiMajorAxisKm: 129846, orbitalPeriodDays: 1.413479,
    composition: uranusComposition, compositionSource: uranusSource,
    fact: 'Miranda memiliki tiga wilayah corona berupa kumpulan punggungan dan lembah yang mencolok.',
    source: nasa('uranus/moons/miranda')
  },
  triton: {
    gm: 1428.49546, semiMajorAxisKm: 354800, orbitalPeriodDays: 5.876994,
    rotation: 'Sinkron dengan orbit retrograde', temperature: 'Sekitar −235 °C (permukaan, Voyager 2)',
    composition: 'Kerak nitrogen beku di atas mantel es; interior diperkirakan mengandung batuan dan logam.',
    fact: 'Triton mengorbit berlawanan arah dengan rotasi Neptunus; Voyager 2 juga mengamati geyser aktif.',
    source: nasa('neptune/moons/triton')
  }
};

export const moonScience = Object.fromEntries(Object.entries(records).map(([id, record]) => [id, {
  ...record, verifiedOn: '2026-10-11',
  radiusKm: moonRadiiKm[id], diameterKm: moonRadiiKm[id] * 2,
  // Derived physical estimates, NOT direct measurements or visual scaling.
  massKg: record.gm * 1e9 / 6.67430e-11,
  gravityMs2: record.gm * 1000 / moonRadiiKm[id] ** 2,
  temperature: record.temperature ?? null, rotation: record.rotation ?? null,
  sources: [record.source, physicalSource, constantSource,
    ...(id === 'moon' ? [lunarSource] : [elementsSource]), ...(record.compositionSource ? [record.compositionSource] : [])]
}]));
