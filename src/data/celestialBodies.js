export const bodies = [
  {
    id: 'sun', name: 'Matahari', type: 'star', symbol: '☀', color: '#ffb53d', radiusEarth: 109.2,
    radiusKm: 696340, mass: '1,989 × 10³⁰ kg', gravity: '274 m/s²', temperature: '±5.500 °C (permukaan)',
    distance: 'Pusat Tata Surya', rotation: '±27 hari', orbitPeriod: '—', moons: '8 planet mengorbit',
    description: 'Bintang deret utama yang menyimpan hampir seluruh massa Tata Surya dan menyediakan cahaya serta energi bagi dunia-dunia di sekitarnya.',
    fact: 'Cahaya Matahari membutuhkan sekitar 8 menit 20 detik untuk mencapai Bumi.',
    visualRadius: 8, orbitAu: 0, orbitalPeriodDays: 0, rotationDays: 27, axialTilt: 7.25, emissive: true
  },
  {
    id: 'mercury', name: 'Merkurius', type: 'planet', symbol: '☿', color: '#9b938a', radiusEarth: 0.383,
    radiusKm: 2439.7, mass: '3,301 × 10²³ kg', gravity: '3,7 m/s²', temperature: '−180 hingga 430 °C',
    distance: '57,9 juta km', rotation: '58,6 hari', orbitPeriod: '88 hari', moons: '0',
    description: 'Planet terkecil dan terdekat dengan Matahari, dengan permukaan berbatu penuh kawah dan perubahan suhu yang ekstrem.',
    fact: 'Satu hari Matahari di Merkurius berlangsung sekitar dua tahun Merkurius.',
    orbitAu: 0.387, orbitalPeriodDays: 87.97, rotationDays: 58.65, axialTilt: 0.034, eccentricity: 0.2056
  },
  {
    id: 'venus', name: 'Venus', type: 'planet', symbol: '♀', color: '#d6a65b', radiusEarth: 0.949,
    radiusKm: 6051.8, mass: '4,867 × 10²⁴ kg', gravity: '8,87 m/s²', temperature: '±465 °C',
    distance: '108,2 juta km', rotation: '243 hari (retrograde)', orbitPeriod: '224,7 hari', moons: '0',
    description: 'Dunia berbatu yang diselimuti atmosfer karbon dioksida sangat tebal dan awan asam sulfat.',
    fact: 'Venus berotasi berlawanan arah dibandingkan kebanyakan planet.',
    orbitAu: 0.723, orbitalPeriodDays: 224.7, rotationDays: -243, axialTilt: 177.4, eccentricity: 0.0068
  },
  {
    id: 'earth', name: 'Bumi', type: 'planet', symbol: '⊕', color: '#4d92d9', radiusEarth: 1,
    radiusKm: 6371, mass: '5,972 × 10²⁴ kg', gravity: '9,81 m/s²', temperature: '±15 °C (rata-rata)',
    distance: '149,6 juta km', rotation: '23 jam 56 menit', orbitPeriod: '365,25 hari', moons: '1',
    description: 'Planet samudra yang menjadi satu-satunya dunia yang diketahui memiliki kehidupan dan air cair melimpah di permukaannya.',
    fact: 'Sekitar 71% permukaan Bumi tertutup oleh lautan.',
    orbitAu: 1, orbitalPeriodDays: 365.25, rotationDays: 0.997, axialTilt: 23.44, eccentricity: 0.0167
  },
  {
    id: 'mars', name: 'Mars', type: 'planet', symbol: '♂', color: '#c85b3d', radiusEarth: 0.532,
    radiusKm: 3389.5, mass: '6,417 × 10²³ kg', gravity: '3,71 m/s²', temperature: '±−63 °C',
    distance: '227,9 juta km', rotation: '24 jam 37 menit', orbitPeriod: '687 hari', moons: '2',
    description: 'Planet merah yang dingin, berdebu, dan menyimpan bukti bahwa air cair pernah mengalir di permukaannya.',
    fact: 'Olympus Mons di Mars adalah gunung berapi terbesar yang diketahui di Tata Surya.',
    orbitAu: 1.524, orbitalPeriodDays: 686.98, rotationDays: 1.026, axialTilt: 25.19, eccentricity: 0.0934
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'planet', symbol: '♃', color: '#d7b18a', radiusEarth: 11.21,
    radiusKm: 69911, mass: '1,898 × 10²⁷ kg', gravity: '24,79 m/s²', temperature: '±−110 °C',
    distance: '778,5 juta km', rotation: '9 jam 56 menit', orbitPeriod: '11,86 tahun', moons: 'Banyak; 4 bulan Galilea',
    description: 'Planet terbesar di Tata Surya, berupa raksasa gas dengan atmosfer bergaris dan badai raksasa yang berlangsung lama.',
    fact: 'Bintik Merah Besar adalah badai yang lebih lebar daripada Bumi.',
    orbitAu: 5.203, orbitalPeriodDays: 4332.59, rotationDays: 0.414, axialTilt: 3.13, eccentricity: 0.0489
  },
  {
    id: 'saturn', name: 'Saturnus', type: 'planet', symbol: '♄', color: '#d8c58f', radiusEarth: 9.45,
    radiusKm: 58232, mass: '5,683 × 10²⁶ kg', gravity: '10,44 m/s²', temperature: '±−140 °C',
    distance: '1,43 miliar km', rotation: '10 jam 42 menit', orbitPeriod: '29,45 tahun', moons: 'Banyak; Titan terbesar',
    description: 'Raksasa gas berwarna keemasan yang dikelilingi sistem cincin es dan batu paling mencolok di Tata Surya.',
    fact: 'Kerapatan rata-rata Saturnus lebih rendah daripada air.',
    orbitAu: 9.537, orbitalPeriodDays: 10759.22, rotationDays: 0.444, axialTilt: 26.73, eccentricity: 0.0565, rings: true
  },
  {
    id: 'uranus', name: 'Uranus', type: 'planet', symbol: '♅', color: '#86d4db', radiusEarth: 4.01,
    radiusKm: 25362, mass: '8,681 × 10²⁵ kg', gravity: '8,69 m/s²', temperature: '±−195 °C',
    distance: '2,87 miliar km', rotation: '17 jam 14 menit (retrograde)', orbitPeriod: '84 tahun', moons: '5 bulan utama',
    description: 'Raksasa es biru pucat yang berputar hampir menyamping, kemungkinan akibat tumbukan besar pada masa awal.',
    fact: 'Kemiringan sumbu Uranus sekitar 98 derajat.',
    orbitAu: 19.191, orbitalPeriodDays: 30688.5, rotationDays: -0.718, axialTilt: 97.77, eccentricity: 0.0463, rings: true
  },
  {
    id: 'neptune', name: 'Neptunus', type: 'planet', symbol: '♆', color: '#456fe1', radiusEarth: 3.88,
    radiusKm: 24622, mass: '1,024 × 10²⁶ kg', gravity: '11,15 m/s²', temperature: '±−200 °C',
    distance: '4,5 miliar km', rotation: '16 jam 6 menit', orbitPeriod: '164,8 tahun', moons: 'Triton dan bulan lainnya',
    description: 'Planet utama terjauh dari Matahari, berupa raksasa es dengan angin tercepat yang pernah diukur di Tata Surya.',
    fact: 'Angin di Neptunus dapat melaju lebih dari 2.000 km/jam.',
    orbitAu: 30.07, orbitalPeriodDays: 60182, rotationDays: 0.671, axialTilt: 28.32, eccentricity: 0.0097
  }
];

export const moons = [
  { id: 'moon', name: 'Bulan', parent: 'earth', color: '#c9ccd2', size: 0.54, distance: 5, period: 27.3 },
  { id: 'phobos', name: 'Phobos', parent: 'mars', color: '#8f7d6e', size: 0.22, distance: 3.6, period: 0.32 },
  { id: 'deimos', name: 'Deimos', parent: 'mars', color: '#a49480', size: 0.17, distance: 5, period: 1.26 },
  { id: 'io', name: 'Io', parent: 'jupiter', color: '#e8cf62', size: 0.46, distance: 6.2, period: 1.77 },
  { id: 'europa', name: 'Europa', parent: 'jupiter', color: '#d9c8a1', size: 0.42, distance: 8.2, period: 3.55 },
  { id: 'ganymede', name: 'Ganymede', parent: 'jupiter', color: '#8b8177', size: 0.58, distance: 10.5, period: 7.15 },
  { id: 'callisto', name: 'Callisto', parent: 'jupiter', color: '#756c63', size: 0.54, distance: 13, period: 16.69 },
  { id: 'mimas', name: 'Mimas', parent: 'saturn', color: '#c6c2b8', size: 0.2, distance: 7.3, period: 0.94 },
  { id: 'enceladus', name: 'Enceladus', parent: 'saturn', color: '#e4edf0', size: 0.25, distance: 8.6, period: 1.37 },
  { id: 'tethys', name: 'Tethys', parent: 'saturn', color: '#d8d5cb', size: 0.27, distance: 9.8, period: 1.89 },
  { id: 'dione', name: 'Dione', parent: 'saturn', color: '#bbb9b3', size: 0.28, distance: 11, period: 2.74 },
  { id: 'rhea', name: 'Rhea', parent: 'saturn', color: '#bcbab5', size: 0.32, distance: 12.4, period: 4.52 },
  { id: 'titan', name: 'Titan', parent: 'saturn', color: '#d99846', size: 0.62, distance: 15, period: 15.95 },
  { id: 'iapetus', name: 'Iapetus', parent: 'saturn', color: '#918a80', size: 0.31, distance: 18, period: 79.32 },
  { id: 'miranda', name: 'Miranda', parent: 'uranus', color: '#b8b7b1', size: 0.22, distance: 4.8, period: 1.41 },
  { id: 'ariel', name: 'Ariel', parent: 'uranus', color: '#d6d7d2', size: 0.29, distance: 6, period: 2.52 },
  { id: 'umbriel', name: 'Umbriel', parent: 'uranus', color: '#777a79', size: 0.28, distance: 7.2, period: 4.14 },
  { id: 'titania', name: 'Titania', parent: 'uranus', color: '#a9a6a0', size: 0.34, distance: 8.8, period: 8.71 },
  { id: 'oberon', name: 'Oberon', parent: 'uranus', color: '#8c8179', size: 0.33, distance: 10.5, period: 13.46 },
  { id: 'triton', name: 'Triton', parent: 'neptune', color: '#c7b6ad', size: 0.42, distance: 6.2, period: -5.88 },
  { id: 'nereid', name: 'Nereid', parent: 'neptune', color: '#8c9297', size: 0.2, distance: 9.2, period: 360.1 },
  { id: 'proteus', name: 'Proteus', parent: 'neptune', color: '#777a80', size: 0.23, distance: 4.7, period: 1.12 }
];

export const tourStops = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

export const timeSpeeds = [0.1, 1, 10, 50, 200];

export function orbitRadiusFromAu(au) {
  return 22 + Math.sqrt(au) * 37;
}

export function visualRadiusFromEarth(radiusEarth) {
  return 0.7 + Math.cbrt(radiusEarth) * 1.45;
}
