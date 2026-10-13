// Verified 2026-10-13. Rounded historical elements, not a current ephemeris:
// https://nssdc.gsfc.nasa.gov/planetary/factsheet/cometfact.html (2016 table).
export const cometScience = {
  halley: {
    semiMajorAxisAu: 17.94, eccentricity: .967, inclinationDegrees: 162.2,
    orbitalPeriodYears: 76.1, diameterKm: 11, mass: null, gravity: null,
    temperature: null, rotation: 'Sekitar 2,2 hari (ringkasan NASA)', moons: 'Tidak berlaku',
    composition: 'Inti komet mengandung es dan debu; gas dan debu membentuk coma saat aktif.',
    fact: 'Halley bergerak retrograde. Intinya memanjang, sekitar 15 × 8 km; diameter 11 km adalah ukuran ringkasan NASA, bukan bentuk bola yang presisi.',
    sources: [
      { label: 'NASA: Comet Fact Sheet (2016)', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/cometfact.html' },
      { label: 'NASA: 1P/Halley', url: 'https://science.nasa.gov/solar-system/comets/1p-halley/' }
    ]
  }
};

export const comets = [{
  id: 'halley', name: 'Komet Halley', type: 'comet', symbol: '☄', color: '#99d8df',
  visualRadius: .7, visitFraming: 28, initialAngle: .12, visualEccentricity: .92
}];

export function cometScienceFor(body) {
  const data = cometScience[body.id];
  return { ...body, ...data,
    distance: `${data.semiMajorAxisAu.toLocaleString('id-ID')} AU dari Matahari (sumbu semi-mayor)`,
    orbitPeriod: `${data.orbitalPeriodYears.toLocaleString('id-ID')} tahun (perkiraan historis)`,
    description: '1P/Halley adalah komet periodik. Ukuran inti, coma dan ekor diperbesar; jarak dikompresi. Eksentrisitas ilmiah 0,967 ditampilkan sebagai 0,92 agar perihelion berada di luar Matahari visual. Inclination 162,2°. Fase awal bukan posisi tanggal nyata. Ekor lurus menjauhi Matahari merupakan ilustrasi ekor ion, bukan rekonstruksi ekor debu.'
  };
}
