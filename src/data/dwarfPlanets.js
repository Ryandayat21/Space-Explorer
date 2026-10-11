// Checked 2026-10-11. Physical content: NASA Science pages in each record.
// Rounded orbital snapshot: JPL SBDB API, sstr=1/134340/136108/136472/136199.
// Epoch JD 2461200.5 except Pluto JD 2457588.5. Not a common-epoch ephemeris.
// Scene sizes, axial orientations and initial phases below are illustrative.
const entries = [
  ['ceres', 'Ceres', '#9e9990', 1, 2.77, .0797, 10.6, 1680, 952, 9,
    'Batuan, es air dan endapan garam.', 'Dawn mengunjungi Ceres pada 2015, kunjungan pertama wahana ke sebuah planet katai.', 0],
  ['pluto', 'Pluto', '#bfa78c', 134340, 39.6, .252, 17.1, 91000, 2377, 153,
    'Interior berbatu dengan es air; permukaan mengandung es nitrogen dan metana.', 'Pluto mempunyai lima bulan; Charon adalah yang terbesar.', 5],
  ['haumea', 'Haumea', '#c8c5bb', 136108, 43.1, .194, 28.2, 103000, 1740, 4,
    'Diperkirakan berupa batuan dengan lapisan es.', 'Rotasi cepat membuat bentuk Haumea memanjang; Haumea juga memiliki cincin.', 2],
  ['makemake', 'Makemake', '#b68c77', 136472, 45.6, .159, 29, 112000, 1430, 22.5,
    'Es metana dan etana terdeteksi di permukaan; interior belum dipastikan.', 'Hubble menemukan bulan kecil Makemake yang dijuluki MK 2.', 1],
  ['eris', 'Eris', '#d2d3d1', 136199, 67.9, .438, 43.9, 205000, 2400, null,
    'Komposisi interior belum dipastikan; permukaan sangat dingin.', 'Penemuan Eris ikut memicu peninjauan definisi planet pada 2006.', 1]
];

export const dwarfPlanetScience = Object.fromEntries(entries.map(([id, name, color, number, a, e, i, period, diameter, rotation, composition, fact, moonCount]) => [id, {
  diameterKm: diameter, diameterNote: id === 'haumea' ? 'perkiraan diameter ekuator NASA; bentuk memanjang' : 'perkiraan NASA',
  semiMajorAxisAu: a, eccentricity: e, inclinationDegrees: i, orbitalPeriodDays: period,
  epochJD: id === 'pluto' ? 2457588.5 : 2461200.5,
  rotationHours: rotation, mass: null, gravity: null,
  temperature: id === 'eris' ? 'Sekitar −243 hingga −217 °C (perkiraan permukaan)' : null,
  composition, fact, moonCount, verifiedOn: '2026-10-11',
  sources: [
    { label: 'NASA Science', url: `https://science.nasa.gov/dwarf-planets/${id}/${['ceres', 'pluto'].includes(id) ? 'facts/' : ''}` },
    { label: 'JPL SBDB: orbit', url: `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${number}` }
  ]
}]));

// Visual radius is deliberately independent of diameter; preserve legibility.
// Eris rotation left static until a reliable current period is verified.
export const dwarfPlanets = entries.map(([id, name, color], index) => ({
  id, name, color, type: 'dwarf-planet', symbol: '◇',
  visualRadius: [1.1, 1.5, 1.35, 1.3, 1.5][index],
  axialTilt: 0, rotationDays: dwarfPlanetScience[id].rotationHours ? (id === 'pluto' ? -1 : 1) * dwarfPlanetScience[id].rotationHours / 24 : Infinity,
  initialAngle: index * 1.2 + .4
}));

export function dwarfScienceFor(body) {
  const data = dwarfPlanetScience[body.id];
  return {
    ...body, ...data,
    rotation: data.rotationHours ? `Sekitar ${data.rotationHours.toLocaleString('id-ID')} jam` : null,
    distance: `${data.semiMajorAxisAu.toLocaleString('id-ID')} AU dari Matahari (sumbu semi-mayor)`,
    orbitPeriod: `${data.orbitalPeriodDays.toLocaleString('id-ID')} hari (elemen JPL dibulatkan)`,
    moons: `${data.moonCount} (snapshot NASA, 11 Oktober 2026; tidak dimodelkan)`,
    description: `${body.name} adalah planet katai. ${data.composition} Diameter: ${data.diameterNote}. Ukuran diperbesar dan jarak orbit dikompresi, tidak proporsional. Bentuk dan tekstur procedural merupakan ilustrasi.`,
  };
}
