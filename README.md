# Milky Way Observer

Simulasi 3D Tata Surya yang menggabungkan eksplorasi sinematik dan informasi ilmiah. Dibangun dengan Vite, Three.js, dan JavaScript modular untuk deployment statis di Vercel. Cakupan Phase 3: 37 objek mandiri, 36 orbit dan dua sabuk dekoratif; audit final 14 Oktober 2026 dicatat di [progres proyek](docs/phase-3-progress.md#17-finalisasi-phase-3---14-oktober-2026).

## Fitur saat ini

Phase 4 menambahkan rendering sRGB/ACES dengan exposure 1, pencahayaan Matahari, atmosfer rim glow dan corona ringan dengan fallback, starfield berlapis seeded serta haze dekoratif. Kamera Visit/Follow/tur memakai transisi bersama dengan perlindungan permukaan dan cincin. Mode sinematik, fullscreen, panel ilmiah berkelompok, fokus keyboard dan prefers-reduced-motion tersedia. Catatan verifikasi dan batas implementasi ada di [progres Phase 4](docs/phase-4-progress.md).

Finalisasi 17 Oktober 2026: **43/43 unit test**, **52/52 E2E** (Edge 1366×768 dan Chrome 1920×1080), serta production build berhasil. Perencanaan Visit antarbulan diperbaiki agar memakai volume tabrakan cincin aktual dan endpoint aman. Tidak ditemukan warning/error console aplikasi dalam skenario yang diuji. Batas validasi dan pekerjaan Phase 5 tercatat di dokumen progres.

- Matahari dan delapan planet dengan orbit elips, inclination, serta rotasi.
- 22 bulan utama sebagai objek 3D.
- Lima planet katai: Ceres, Pluto, Haumea, Makemake dan Eris.
- Sabuk asteroid dan Sabuk Kuiper berbasis partikel seeded, dengan toggle terpisah dan batas kualitas.
- Komet Halley dengan orbit elips miring, nucleus, coma dan ekor anti-Matahari; cari `Halley` atau `1P/Halley` pada kategori Semua.
- Guided tour dari Matahari sampai Neptunus.
- Free-flight dengan keyboard dan mouse.
- Pemilihan objek melalui klik atau pencarian.
- Panel informasi astronomi.
- Bookmark objek dan daftar favorit lokal; perbandingan maksimal dua objek dengan rasio diameter ilmiah.
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

- **View Milky Way / Enter Solar System** di kiri bawah: beralih scene untuk pengembangan Phase 5. Galaxy menampilkan core, bulge, bar, empat lengan spiral ilustratif, Orion Spur, disk dan halo halus. Titik adalah sampel visual edukatif, bukan bintang katalog. Low/Medium/High memakai 12.600/30.240/50.400 titik; ubah preset di Tata Surya sebelum masuk galaksi. Tersedia 13 landmark selectable melalui klik atau daftar keyboard, dengan panel bersumber NASA. Posisi marker skematis dan approximate, bukan koordinat astronomis; objek lokal direnggangkan. Pencarian galaksi belum tersedia. Seleksi/tur/Follow/flight dihentikan saat switch; waktu solar dibekukan dan audio tetap memakai instance yang sama.

- Klik objek: membuka detail.
- Pencarian: memilih dan mengunjungi objek.
- **Kunjungi objek / F**: transisi kamera lalu melepas target; **Ikuti orbit**: kamera mengikuti posisi objek.
- **Bookmark** di panel: tambah/hapus favorit. **☆** pada header: buka daftar favorit dan kunjungi objek tersimpan.
- **Bandingkan**: pilih maksimal dua objek untuk tabel diameter, massa, gravitasi, jarak dari Matahari dan periode orbit; lingkaran memakai rasio diameter ilmiah. Scene tidak diganti atau diatur ulang.
- **Jeda / slider waktu**: pause/resume atau pilih 0,1 / 1 / 10 / 50 / 200 hari simulasi per detik.
- **Orbit / Label / Bintang / Asteroid / Kuiper**: tampilkan/sembunyikan masing-masing; **Kualitas**: Medium → Low → High → Medium.
- **Guided Tour**: mulai, jeda/lanjut, sebelumnya, berikutnya, lewati, keluar; input kamera manual mengambil alih.
- `W A S D`: bergerak dalam mode Free Flight.
- Mouse: melihat sekeliling.
- `Space` / `Ctrl`: naik / turun.
- `Shift`: boost.
- `F`: fokus ke objek terpilih.
- `G`: memulai guided tour.
- `H`: mode sinematik; menyembunyikan HUD, panel, pencarian, kontrol waktu dan label. Tekan lagi atau gunakan tombol HUD untuk memulihkan UI. Mode ini tidak disimpan saat reload.
- `P`: jeda/lanjut simulasi. `L`: aktif/nonaktif fullscreen.
- `Esc`: menutup dialog/panel, membatalkan transisi atau Follow, melepas pointer, atau keluar dari cinematic/fullscreen sesuai keadaan aktif. Tombol **Keluar Free Flight** kembali ke observer.
- `Tab` / `Shift+Tab`, `Enter` / `Space`: navigasi dan aktivasi tombol; panah memilih opsi dropdown. Kontrol HUD tersembunyi tidak menerima fokus. Shortcut huruf tidak aktif saat dialog terbuka atau mengetik dalam input.
- Scroll: zoom pada observer, ubah kecepatan pada Free Flight. Tombol `?` membuka bantuan; tombol layar penuh mengaktifkan fullscreen.

Favorit hanya menyimpan ID di localStorage pada browser/origin yang sama, tanpa akun. Data rusak diabaikan; bila storage ditolak, favorit berlaku selama sesi dengan pesan. Jarak bulan pada katalog relatif planet induk, sehingga perbandingan tidak menyebutnya sebagai jarak dari Matahari. Angka yang belum diverifikasi tetap ditandai.

Drag/scroll mengambil alih transisi kamera dan menjeda tur. Preferensi sistem **reduced motion** memendekkan transisi kamera menjadi 150 ms dan menonaktifkan animasi UI dekoratif, tanpa mengubah kecepatan orbit.

Kamera **Galaxy Mode**: gunakan preset Top view, Angled overview, Galactic center atau Solar System region (posisi ilustratif, belum terverifikasi). **Reset view** kembali ke overview. **Free Flight** mengaktifkan WASD + mouse, Space/Ctrl naik/turun, Shift boost 3× dan scroll pengali kecepatan 0,25–4×. Kecepatan adaptif dihitung dari jarak ke pusat model, terpisah dari Tata Surya; kamera dibatasi radius 80 unit model. Escape membatalkan transisi atau keluar flight; drag/scroll mengambil alih transisi. Preset memakai easing 1,4 detik (150 ms untuk reduced motion). Klik marker atau gunakan daftar Landmark untuk membuka informasi; Escape menutup panel. Guided tour galaksi belum tersedia. Sumber dan batas interpretasi tercantum pada docs/phase-5-progress.md bagian 11.

Klik tombol **♪ Pengaturan ambience** pada toolbar atas, lalu **Enable Ambience** untuk mulai musik lokal. Panel hanya muncul saat dibuka; klik di luar atau tekan Escape untuk menutupnya tanpa menghentikan musik. Tersedia Play/Pause, Mute/Unmute dan slider volume (default 15%). Kontrol mendukung Tab, Enter/Space dan tombol panah pada slider. Fade volume berlangsung sekitar 450 ms. Kontrol ikut tersembunyi pada mode sinematik; tekan H untuk menampilkannya lagi.

Audio tidak autoplay saat startup/reload. Hanya volume dan mute disimpan di `milky-way-observer.audio.v1`; storage rusak/ditolak tidak menghentikan aplikasi. Saat tab tersembunyi audio langsung dijeda untuk menghindari suara di background, kemudian dilanjutkan hanya jika sebelumnya pengguna sedang memutarnya. Jika browser menolak pemutaran, tekan Play lagi. Pause/resume dan perpindahan scene tidak mereset posisi track; AudioManager tunggal dimiliki aplikasi, bukan Solar System/Galaxy scene.

Ganti `public/audio/Interstellar Main Theme.mp3` dengan MP3 berizin menggunakan nama yang sama, atau sesuaikan URL di `src/core/AudioManager.js`. Sumber/lisensi file yang diberikan pengguna belum diketahui; lihat [catatan aset audio](public/audio/README.md). Tidak ada musik yang diunduh atau ditambahkan oleh implementasi ini. Vite menyalin aset public ke build, jadi pastikan izin distribusi sebelum deployment. Jika file gagal, kontrol menampilkan **Audio unavailable** tanpa retry berulang; fitur simulasi tetap berjalan.

## Quality presets

Default **Medium**. Pilihan disimpan di localStorage; data rusak atau storage tidak tersedia kembali ke Medium pada startup.

| Pengaturan | Low | Medium | High |
| --- | --- | --- | --- |
| Batas device pixel ratio | 0,85 | 1,25 | 1,75 |
| Segmen sphere planet | 24 × 16 | 40 × 24 | 64 × 40 |
| Segmen sphere bulan | 12 × 8 | 16 × 12 | 24 × 16 |
| Bintang | 2.520 | 5.040 | 9.000 |
| Asteroid dekoratif | 600 | 1.200 | 1.900 |
| Objek Kuiper dekoratif | 900 | 1.800 | 3.600 |
| Atmosfer, glow, coma dan haze | Nonaktif | Aktif | Aktif |

Pergantian kualitas membuang geometry sphere lama dan memakai ulang buffer sabuk/bintang; tidak membuat ulang scene setiap frame. Low tetap mempertahankan alokasi buffer maksimum dan tekstur yang sudah dimuat. Tekstur lokal dimuat sesuai kebutuhan dengan fallback procedural. Tidak ada bloom atau shadow map mahal. Penghitung FPS hanya tersedia pada server development melalui `/?debug`, bukan build produksi.

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

Kecepatan waktu, fase awal dan elemen orbit adalah ilustrasi, bukan ephemeris tanggal nyata atau simulasi gravitasi n-body. Pencahayaan memakai jarak terkompresi, bukan radiometri inverse-square. Atmosfer, ekor komet dan starfield bersifat dekoratif; starfield bukan peta Bima Sakti. Perlindungan kamera menggunakan batas konservatif, bukan perencana lintasan fisik lengkap. Panel ilmiah membagi ringkasan, karakteristik fisik, orbit dan fakta/sumber; nilai kosong ditampilkan sebagai **Data belum tersedia**.

## Sumber data awal

- NASA Solar System Exploration: https://science.nasa.gov/solar-system/
- NASA Planetary Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/

Data sumber dan tanggal verifikasi tersimpan dalam modul data serta panel. Dari 22 bulan, 17 mempunyai pengayaan sains; nilai yang belum diverifikasi tidak diisi dengan nilai visual. Finalisasi ini tidak memperbarui angka astronomi atau mengklaim posisi ephemeris saat ini.

## Ditunda ke Phase 5

- Melengkapi parameter ilmiah yang masih kosong, lima bulan tambahan, serta aset bulan/awan Venus berlisensi.
- Kalender/epoch, elemen orbit lengkap, ephemeris, kebijakan tab background/catch-up dan tidal locking.
- Charon/pendamping lain, rute tur tambahan dan Galaxy Scene beserta lifecycle lintas-scene.
- Perluasan perbandingan jarak fisik; sinkronisasi favorit antar-tab/perangkat jika diperlukan.
- Profiling interaktif panjang lintas GPU, retained-heap analysis dan kualitas adaptif. Benchmark headless satu mesin tidak menggantikannya.
- Audit screen reader/zoom dan perpindahan monitor fisik; penghindaran overlap/occlusion label serta matriks screenshot deterministik seluruh objek/kualitas.

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

Panel menautkan sumbernya. Data ilmiah ditata oleh `src/data/science.js` dan dataset bulan/planet katai; `radiusEarth`, `visualRadius`, `size`, `distance` numerik pada katalog bulan, dan helper skala dipakai untuk scene saja. Periode pada katalog simulasi bulan tidak otomatis menjadi nilai ilmiah panel. Nilai yang belum diverifikasi ditandai; sejak Phase 4 panel detail memakai "Data belum tersedia", sedangkan tabel perbandingan dapat memakai "Belum diverifikasi". Ukuran, jarak, waktu, elemen orbit sederhana dan fase awal adalah ilustrasi, bukan ephemeris tanggal nyata. Suhu raksasa gas merujuk lapisan atmosfer, bukan permukaan padat.

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

Suite mencakup 43 unit test dan 26 skenario E2E pada masing-masing Edge 1366×768 dan Chrome 1920×1080 (52 eksekusi): seluruh jenis objek/orbit, cincin/sabuk/komet, bookmark/storage/perbandingan, kamera/tur/flight, resize, keyboard, cinematic/fullscreen, reduced motion, quality presets, shader, startup dan kegagalan tekstur. Fixture bersama memeriksa pageerror serta console error/warning; tidak menonaktifkan console. Untuk Windows, jalankan `npm run dev` di terminal pertama lalu `npm run test:e2e` di terminal kedua agar runner memakai server existing dan tidak tertahan cleanup proses npm. Pengujian resource bukan pengganti profiling heap jangka panjang atau benchmark FPS lintas GPU.

### File Phase 2

Diubah: `src/main.js`, `src/core/SolarSystem.js`, `src/core/FlightControls.js`, `src/ui/UIController.js`, `src/data/celestialBodies.js`, `src/styles.css`, `index.html`, `package.json`, `package-lock.json`, `.gitignore`, `README.md`.

Ditambahkan: `src/core/cameraMath.js`, `src/data/science.js`, `src/data/search.js`, `src/data/tour.js`, `test/phase2.test.js`, `e2e/observer.spec.js`, `playwright.config.js`, sepuluh JPEG dan `public/textures/ATTRIBUTION.md`.

### Fase berikutnya

- Peta permukaan berlisensi untuk 21 bulan lainnya dan peta awan Venus; verifikasi parameter ilmiah bulan yang masih kosong.
- Ephemeris, perluasan perbandingan jarak fisik, serta pembaruan jumlah bulan dengan versi sumber.
- Profiling heap/FPS jangka panjang pada beberapa GPU desktop; kualitas adaptif bila diperlukan.
- Charon dan Galaxy Scene sesuai roadmap awal; Halley sudah tersedia sebagai komet representatif.

### Phase 3 dan pengukuran performa

Finalisasi 14 Oktober 2026: **34/34 unit test**, **32/32 E2E** pada Edge/Chrome dan production build berhasil. Seluruh skenario E2E bebas console warning/error dan pageerror, termasuk fallback tekstur, resize dan keyboard. Laporan [benchmark final](docs/benchmarks/phase-3-final.json) mencatat resource stabil selama pengulangan; heap masih meningkat sedikit, sehingga bukan klaim bebas leak jangka panjang. Untuk menulis laporan terpisah gunakan `npm run profile -- docs/benchmarks/phase-3-final.json`.

Progres rinci dan batas ilmiah tersedia di [docs/phase-3-progress.md](docs/phase-3-progress.md).
Orbit elips menggunakan elemen sederhana, bukan n-body atau ephemeris tanggal nyata. Sebanyak 17 bulan memiliki data terverifikasi di `moonScience.js`; nilai yang belum diverifikasi tetap kosong. Lima planet katai memakai data ilmiah terpisah. Cincin Saturnus/Uranus procedural dan kedua sabuk tidak membutuhkan aset eksternal baru.

Tombol **Asteroid** dan **Kuiper** menyembunyikan/menampilkan partikel masing-masing, tanpa menghilangkan Ceres atau Pluto. Low/Medium/High memakai 600/1200/1900 partikel asteroid dan 900/1800/3600 partikel Kuiper. Distribusi dan ukuran merupakan ilustrasi dengan skala jarak terkompresi; partikel tidak dapat dipilih.

`npm run profile` menjalankan benchmark terpisah di Edge 1366×768 dan Chrome 1920×1080, membuka server Vite lokal, lalu menulis `docs/benchmarks/phase-3-performance.json`. Jalankan tanpa browser/test berat lain agar hasil sebanding. Benchmark mengukur interval animation frame, heap setelah garbage collection dan jumlah resource setelah Visit/tur/toggle berulang. Hasil headless hanya baseline mesin pengujian; bukan jaminan FPS atau bukti tidak adanya memory leak jangka panjang. Tidak ada dependency baru.

Transisi mode: **View Milky Way** membuka galaksi dengan fade dan gerakan kamera lokal; panel marker **Solar System** menyediakan **Enter Solar System**. **Skip** melewati animasi. Input dikunci sementara, lalu fokus kembali ke tombol mode. Durasi normal sekitar 1,3 detik; prefers-reduced-motion sekitar 160 ms tanpa gerakan kamera. Kedua scene tetap menggunakan koordinat terpisah, dan pose kamera sebelumnya dipertahankan.
