// Science references support descriptions/distances, NOT the schematic display coordinates.
// XZ is the model disk, Y is height. No kpc conversion or astrometric transform is implied.
const structure = 'https://science.nasa.gov/resource/the-milky-way-galaxy/';
const messier = id => `https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-${id}/`;
export const landmarkCategories = ['galactic-center', 'solar-system', 'spur', 'spiral-arm', 'star', 'star-cluster', 'nebula'];
export const landmarkPositionNotice = 'Posisi marker skematis dan perkiraan, bukan koordinat astronomis. Objek dekat Matahari direnggangkan agar dapat dipilih. Jarak dan arah antarmarker tidak dapat digunakan untuk pengukuran.';
function landmark(id, name, aliases, category, coordinates, description, url, distance = null) {
  return { id, name, aliases, category, description,
    position: { coordinates, frame: 'galaxy-model-xz', unit: 'model', approximate: true, method: 'schematic-layout' },
    science: { distance: distance === null ? null : { value: distance, unit: 'light-year', reference: 'Earth', approximate: true } },
    sources: [{ title: 'NASA Science', url, accessed: '2026-10-18' }] };
}
export const galaxyLandmarks = [
  landmark('galactic-center', 'Galactic Center', ['Sagittarius A*', 'Sgr A*'], 'galactic-center', [0, 0, 0], 'Pusat Bima Sakti memuat Sagittarius A*, sebuah lubang hitam supermasif.', 'https://www.nasa.gov/image-article/supermassive-black-hole-sagittarius/', 26000),
  landmark('solar-system-region', 'Solar System', ['Tata Surya'], 'solar-system', [8, 0, 0], 'Tata Surya berada di wilayah Orion Spur, di antara lengan Sagittarius dan Perseus.', structure),
  landmark('orion-spur', 'Local Spur', ['Orion Spur', 'Orion Arm'], 'spur', [7, 0, -2], 'Cabang spiral lokal tempat wilayah Tata Surya berada. Marker menandai struktur yang luas, bukan satu bintang.', structure),
  landmark('scutum-centaurus-arm', 'Scutum–Centaurus Arm', [], 'spiral-arm', [-6, 0, -4], 'Salah satu lengan yang dominan dalam ilustrasi struktur berbasis pengamatan inframerah Spitzer. Posisi label hanya ilustratif.', structure),
  landmark('perseus-arm', 'Perseus Arm', [], 'spiral-arm', [10, 0, -6], 'Salah satu lengan utama dalam model Spitzer. Pemetaan struktur Bima Sakti terus berkembang.', structure),
  landmark('sagittarius-arm', 'Sagittarius Arm', [], 'spiral-arm', [4, 0, 4], 'Lengan yang digambarkan lebih kecil dalam model Spitzer, di sisi dalam wilayah Orion Spur.', structure),
  landmark('norma-arm', 'Norma Arm', [], 'spiral-arm', [-3, 0, 6], 'Lengan yang kurang dominan dalam ilustrasi inframerah Spitzer. Marker merupakan label wilayah skematis.', structure),
  landmark('alpha-centauri', 'Alpha Centauri', [], 'star', [8.8, 0, 1], 'Sistem bintang tetangga Matahari. Jarak dibulatkan; posisi marker diperlebar untuk keterbacaan.', 'https://science.nasa.gov/mission/webb/science-overview/science-explainers/what-is-the-center-of-our-galaxy-like/', 4.3),
  landmark('sirius', 'Sirius', ['Dog Star'], 'star', [7.2, 0, 1], 'Sistem Sirius mencakup Sirius A dan pendampingnya Sirius B.', 'https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/', 8.6),
  landmark('betelgeuse', 'Betelgeuse', ['Alpha Orionis'], 'star', [9.4, .1, 2.4], 'Bintang superraksasa merah di rasi Orion. Jarak sekitar 700 tahun cahaya mengikuti estimasi pada sumber NASA ini.', 'https://science.nasa.gov/universe/what-is-betelgeuse-inside-the-strange-volatile-star/', 700),
  landmark('pleiades', 'Pleiades', ['M45', 'Seven Sisters'], 'star-cluster', [6.5, .2, 2.5], 'Gugus bintang terbuka di Taurus. Estimasi jaraknya tidak disepakati secara universal; nilai ini mengikuti katalog Hubble NASA.', messier(45), 445),
  landmark('orion-nebula', 'Orion Nebula', ['M42'], 'nebula', [8, -.1, 3.6], 'Wilayah pembentukan bintang di Orion. Jarak dibulatkan mengikuti katalog Hubble NASA.', messier(42), 1500),
  landmark('crab-nebula', 'Crab Nebula', ['M1'], 'nebula', [11, .2, 4.5], 'Sisa supernova yang dikenal sebagai Nebula Kepiting.', 'https://science.nasa.gov/asset/hubble/crab-nebula-3/', 6500),
];
