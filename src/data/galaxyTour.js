// Educational narration: schematic model, not an astrometric map.
// Structure context: https://science.nasa.gov/resource/the-milky-way-galaxy/
// Landmark facts and individual sources remain in galaxyLandmarks.js.
export const galaxyTour = [
  { id: 'overview', title: 'Rumah kita: Bima Sakti', text: 'Lihat model keseluruhan galaksi. Titik-titik ini adalah sampel visual, bukan bintang katalog. Bentuk, warna dan ukuran disederhanakan untuk belajar.', preset: 'overview' },
  { id: 'disk-halo', title: 'Galactic disk dan halo', text: 'Dari sudut rendah, disk tampak pipih. Lapisan halo digambarkan sangat redup di sekelilingnya. Kepadatan titik dan ketebalan pada model ini bersifat ilustratif.', position: [0, 4, 30], target: [0, 0, 0] },
  { id: 'center', title: 'Galactic Center', text: 'Pusat Bima Sakti memuat Sagittarius A*, lubang hitam supermasif. Marker pusat hanya penunjuk wilayah, bukan gambar atau ukuran fisik lubang hitam.', landmarkId: 'galactic-center' },
  { id: 'bar', title: 'Central bar', text: 'Model menampilkan struktur memanjang di sekitar pusat: central bar. Orientasi dan dimensinya pada visual ini merupakan penyederhanaan, bukan hasil pengukuran.', position: [0, 13, 8], target: [0, 0, 0] },
  { id: 'arms', title: 'Lengan spiral', text: 'Perhatikan lengan spiral pada disk. Model Spitzer membedakan lengan yang dominan dan yang lebih kecil. Keempat jalur ilustratif di sini tidak memiliki bobot ilmiah yang sama.', preset: 'top' },
  { id: 'local-spur', title: 'Local atau Orion Spur', text: 'Orion Spur adalah struktur lokal di antara lengan Sagittarius dan Perseus. Marker menandai wilayah yang luas, bukan satu bintang.', landmarkId: 'orion-spur' },
  { id: 'solar-region', title: 'Posisi Tata Surya', text: 'Tata Surya berada di wilayah Orion Spur. Posisi marker dibuat skematis; kita tidak memakai ukuran planet dan galaksi dalam satu skala koordinat.', landmarkId: 'solar-system-region' },
  { id: 'neighbor', title: 'Tetangga: Alpha Centauri', text: 'Alpha Centauri adalah sistem bintang tetangga Matahari. Marker objek lokal sengaja direnggangkan agar terlihat, sehingga jarak antar titik bukan jarak fisik.', landmarkId: 'alpha-centauri' },
  { id: 'nebula', title: 'Orion Nebula', text: 'Orion Nebula, atau M42, merupakan wilayah pembentukan bintang. Warna marker dan posisinya pada model ini bersifat skematis; data ilmiah tersedia melalui panel landmark.', landmarkId: 'orion-nebula' },
  { id: 'return-overview', title: 'Kembali ke overview', text: 'Kini hubungkan pusat, bar, disk, lengan dan wilayah lokal dalam satu pandangan. Tutup tur untuk menjelajah sendiri; selalu bedakan ilustrasi model dari data observasi.', preset: 'overview' },
].map(stop => ({ seconds: 12, ...stop }));
