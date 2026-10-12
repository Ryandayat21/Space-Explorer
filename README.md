# Milky Way Observer

Prototype simulasi 3D Tata Surya yang menggabungkan eksplorasi sinematik dan informasi ilmiah. Dibangun dengan Vite, Three.js, dan JavaScript modular untuk deployment statis di Vercel.

## Fitur saat ini

- Matahari dan delapan planet dengan orbit elips, inclination, serta rotasi.
- 22 bulan utama sebagai objek 3D.
- Lima planet katai: Ceres, Pluto, Haumea, Makemake dan Eris.
- Sabuk asteroid dan Sabuk Kuiper berbasis partikel seeded, dengan toggle terpisah dan batas kualitas.
- Guided tour dari Matahari sampai Neptunus.
- Free-flight dengan keyboard dan mouse.
- Pemilihan objek melalui klik atau pencarian.
- Panel informasi astronomi.
- Kontrol waktu, orbit, label, dan kualitas render.
- Tampilan desktop-first dan pemeriksaan WebGL 2.

## Menjalankan di VS Code

1. Buka folder proyek di VS Code.
2. Jalankan `npm install` pada terminal.
3. Jalankan `npm run dev`.
4. Buka URL lokal yang ditampilkan Vite.

Untuk menguji versi produksi:

```bash
npm run build
npm run preview
```

## Kontrol

- Klik objek: membuka detail.
- Pencarian: memilih dan mengunjungi objek.
- `W A S D`: bergerak dalam mode Free Flight.
- Mouse: melihat sekeliling.
- `Space` / `Ctrl`: naik / turun.
- `Shift`: boost.
- `F`: fokus ke objek terpilih.
- `G`: memulai guided tour.
- `H`: menyembunyikan HUD.
- `Esc`: melepas pointer.

## Deployment Vercel

1. Push proyek ke GitHub.
2. Buat proyek baru di Vercel dan pilih repository ini.
3. Vercel akan mendeteksi Vite secara otomatis.
4. Build command: `npm run build`.
5. Output directory: `dist`.

Alternatif CLI:

```bash
npm install -g vercel
vercel
```

## Struktur penting

- `src/core/SolarSystem.js`: pembuatan scene dan benda langit.
- `src/core/FlightControls.js`: kontrol terbang bebas.
- `src/data/celestialBodies.js`: data Matahari, planet, dan bulan.
- `src/ui/UIController.js`: HUD dan interaksi antarmuka.
- `src/main.js`: integrasi engine, kamera, raycasting, dan render loop.

## Catatan skala

Ukuran dan jarak visual sengaja disederhanakan agar seluruh Tata Surya tetap dapat dijelajahi. Nilai ilmiah pada panel informasi disimpan terpisah dari ukuran yang digunakan oleh scene 3D.

## Sumber data awal

- NASA Solar System Exploration: https://science.nasa.gov/solar-system/
- NASA Planetary Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/

Data ini merupakan fondasi konten dan perlu ditinjau kembali ketika detail ilmiah tiap bulan ditambahkan.

## Roadmap

- Detail ilmiah lengkap untuk 22 bulan utama.
- Tekstur planet berkualitas tinggi dengan lisensi yang sesuai.
- Mode perbandingan skala ilmiah.
- Guided tour dengan narasi lebih kaya.
- Planet katai, Sabuk Kuiper, dan komet.
- Galaxy Scene untuk peta 3D Bima Sakti.

## Phase 2 (11 Oktober 2026)

Pengembangan mempertahankan Vite, Three.js dan JavaScript modular; tidak ada proyek baru.

- Tekstur lokal Matahari, delapan planet dan Bulan; Matahari dimuat saat startup sebelum loading screen ditutup; objek lain dimuat ketika dekat kamera atau dipilih. Startup tetap terbuka setelah maksimal sekitar 4,5 detik jika request tekstur tertahan. Procedural texture tersedia langsung dan tetap dipakai ketika unduhan lokal gagal.
- Material berpencahayaan, sisi malam, corona lebih redup, cincin Saturnus dengan pita transparansi/celah, cincin Uranus tipis. Pencahayaan disetarakan untuk jarak visual terkompresi, bukan simulasi radiometri.
- Visit melakukan perjalanan lalu melepas target. Follow memindahkan kamera bersama target bergerak sambil tetap mendukung orbit manual. Input mouse/scroll membatalkan perjalanan; kamera dilindungi dari masuk permukaan benda langit.
- Free Flight: WASD, Space/Ctrl, scroll mengubah kecepatan dasar 1-180 unit visual/detik, Shift boost 3,5 kali, redaman percepatan dan perlambatan dekat permukaan. Escape melepas pointer; tombol Keluar Free Flight kembali ke observer. Kehilangan fokus mengosongkan tombol/kecepatan tersimpan.
- Pencarian nama Indonesia/ID Inggris; hasil dikelompokkan Bintang, Planet, Bulan; kategori memfilter hasil. Hit sphere kecil dan indikator seleksi, dengan pembeda klik dan drag.
- Tur 10 pemberhentian termasuk sabuk asteroid; Start, Pause/Resume, Previous, Next, Lewati, Exit. Durasi baca 12-16 detik setelah transisi. Kontrol kamera manual menjeda tur. Tidak ada audio/TTS.
- HUD toggle yang selalu dapat diakses, fullscreen dengan error state, bantuan, label, kualitas Low/Medium/High, status fallback, dan pemberitahuan desktop pada mobile.
- DPR dibatasi 0,85 / 1,25 / 1,75. Low mengurangi partikel dan menonaktifkan atmosfer/corona. Tidak ada post-processing mahal. Asteroid tetap satu particle system. Vector animation loop digunakan ulang; texture procedural pengganti dibuang, seluruh resource scene dibuang saat keluar halaman. Bundle Three.js tetap terpisah.

### Data ilmiah dan batas interpretasi

Sumber diverifikasi pada 11 Oktober 2026:

- [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), snapshot 18 Maret 2025. Diameter planet di panel memakai diameter ekuator dan gravitasi efektif ekuator; radius visual tetap terpisah. Jumlah bulan planet luar ditampilkan dengan tanggal snapshot, bukan diklaim sebagai jumlah penemuan terkini.
- [NASA Science Solar System](https://science.nasa.gov/solar-system/), [Sun](https://science.nasa.gov/sun/facts/), [Moon](https://science.nasa.gov/moon/facts/), dan halaman facts setiap planet untuk deskripsi/komposisi/fakta.
- [NASA/JPL Satellite Physical Parameters](https://ssd.jpl.nasa.gov/sats/phys_par/) untuk radius rata-rata 22 bulan. Diameter bulan dihitung 2 kali radius rata-rata; ini bukan diameter ekuator untuk satelit tak beraturan.

Panel menautkan sumbernya. Data ilmiah ditata oleh `src/data/science.js` dan dataset bulan/planet katai; `radiusEarth`, `visualRadius`, `size`, `distance` numerik pada katalog bulan, dan helper skala dipakai untuk scene saja. Periode pada katalog simulasi bulan tidak otomatis menjadi nilai ilmiah panel. Nilai yang belum diverifikasi tampil sebagai "Belum diverifikasi". Ukuran, jarak, waktu, elemen orbit sederhana dan fase awal adalah ilustrasi, bukan ephemeris tanggal nyata. Suhu raksasa gas merujuk lapisan atmosfer, bukan permukaan padat.

### Aset lokal dan lisensi

Seluruh JPEG berikut karya **Solar System Scope / INOVE**, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), berbasis data citra/elevasi NASA. Kredit dan URL unduhan tiap berkas dicatat di [public/textures/ATTRIBUTION.md](public/textures/ATTRIBUTION.md).

| Berkas public/textures | Objek | Sumber mirror |
| --- | --- | --- |
| sun.jpg | Matahari | homer-jay/solar-system-textures, 1K |
| earth.jpg | Bumi siang | homer-jay/solar-system-textures, 1K |
| moon.jpg | Bulan | homer-jay/solar-system-textures, 1K |
| mercury.jpg | Merkurius | elymas/solar-simulator, 2K |
| venus.jpg | Venus, visualisasi permukaan | elymas/solar-simulator, 2K |
| mars.jpg | Mars | elymas/solar-simulator, 2K |
| jupiter.jpg | Jupiter | elymas/solar-simulator, 2K |
| saturn.jpg | Saturnus | elymas/solar-simulator, 2K |
| uranus.jpg | Uranus | elymas/solar-simulator, 2K |
| neptune.jpg | Neptunus | elymas/solar-simulator, 2K |

[Sumber asli](https://ssi.solarsystemscope.com/textures/), [mirror A dan lisensi](https://github.com/homer-jay/solar-system-textures#license), [mirror B dan lisensi](https://github.com/elymas/solar-simulator#texture-sources). Server unduhan asli mengembalikan HTTP 403, sehingga salinan beratribusi dari mirror dipakai. Berkas hanya diganti nama; mirror A sudah menurunkan resolusi sebelumnya. Peta ditingkatkan warnanya dan beberapa area tak terpetakan diisi ilustrasi oleh pembuat. Venus menggunakan peta permukaan, bukan tampilan optik di atas awan. Seluruh 21 bulan lain, cincin dan corona memakai ilustrasi procedural. Tidak ada hotlink gambar atau font eksternal.

### Verifikasi

```bash
npm test
npm run build
npm run dev
npm run test:e2e
```

Pada PowerShell dengan execution policy yang memblokir npm.ps1 gunakan `npm.cmd`.
E2E memerlukan Chrome dan Edge desktop terinstal; config meluncurkan kedua browser headless dan memakai server dev yang sudah aktif atau menjalankannya sendiri. Screenshot berada di `test-results/` (diabaikan Git). Tidak perlu mengunduh Chromium tambahan.

Baseline: 4 unit test lulus dan build berhasil. Bug yang ditemukan: hidden panel ditimpa CSS, filter hanya memindahkan kamera, Follow tidak membawa kamera, tween menuju posisi lama objek, belum ada asteroid dalam tur, Shift menimpa kecepatan, orbit tidak tepat di garis, serta request font/favicon gagal.

Suite saat ini mencakup 27 unit test dan 9 skenario E2E pada masing-masing Edge 1366x768 dan Chrome 1920x1080 (18 eksekusi): pencarian/filter/empty state, Visit vs Follow, jarak aman, raycast, tur, Free Flight, startup/fallback tekstur, bulan, planet katai, orbit/waktu, cincin dan kedua sabuk. Pengujian resource membandingkan jumlah geometry/texture scene setelah tur berulang dan memastikan alokasi GPU tidak melebihi resource scene; ini bukan pengganti profiling heap jangka panjang atau benchmark FPS pada GPU fisik.

### File Phase 2

Diubah: `src/main.js`, `src/core/SolarSystem.js`, `src/core/FlightControls.js`, `src/ui/UIController.js`, `src/data/celestialBodies.js`, `src/styles.css`, `index.html`, `package.json`, `package-lock.json`, `.gitignore`, `README.md`.

Ditambahkan: `src/core/cameraMath.js`, `src/data/science.js`, `src/data/search.js`, `src/data/tour.js`, `test/phase2.test.js`, `e2e/observer.spec.js`, `playwright.config.js`, sepuluh JPEG dan `public/textures/ATTRIBUTION.md`.

### Fase berikutnya

- Peta permukaan berlisensi untuk 21 bulan lainnya dan peta awan Venus; verifikasi parameter ilmiah bulan yang masih kosong.
- Ephemeris dan mode perbandingan ukuran/jarak fisik, serta pembaruan jumlah bulan dengan versi sumber.
- Profiling heap/FPS jangka panjang pada beberapa GPU desktop; kualitas adaptif bila diperlukan.
- Charon, komet dan Galaxy Scene sesuai roadmap awal.

### Phase 3 dan pengukuran performa

Progres rinci dan batas ilmiah tersedia di [docs/phase-3-progress.md](docs/phase-3-progress.md).
Orbit elips menggunakan elemen sederhana, bukan n-body atau ephemeris tanggal nyata. Sebanyak 17 bulan memiliki data terverifikasi di `moonScience.js`; nilai yang belum diverifikasi tetap kosong. Lima planet katai memakai data ilmiah terpisah. Cincin Saturnus/Uranus procedural dan kedua sabuk tidak membutuhkan aset eksternal baru.

Tombol **Asteroid** dan **Kuiper** menyembunyikan/menampilkan partikel masing-masing, tanpa menghilangkan Ceres atau Pluto. Low/Medium/High memakai 600/1200/1900 partikel asteroid dan 900/1800/3600 partikel Kuiper. Distribusi dan ukuran merupakan ilustrasi dengan skala jarak terkompresi; partikel tidak dapat dipilih.

`npm run profile` menjalankan benchmark terpisah di Edge 1366×768 dan Chrome 1920×1080, membuka server Vite lokal, lalu menulis `docs/benchmarks/phase-3-performance.json`. Jalankan tanpa browser/test berat lain agar hasil sebanding. Benchmark mengukur interval animation frame, heap setelah garbage collection dan jumlah resource setelah Visit/tur/toggle berulang. Hasil headless hanya baseline mesin pengujian; bukan jaminan FPS atau bukti tidak adanya memory leak jangka panjang. Tidak ada dependency baru.
