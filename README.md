# Milky Way Observer

Eksplorasi 3D Tata Surya dan peta Bima Sakti edukatif dengan scene serta skala koordinat terpisah. Dibangun dengan Vite, Three.js, dan JavaScript modular untuk deployment statis di Vercel. Cakupan Phase 3: 37 objek mandiri, 36 orbit dan dua sabuk dekoratif; audit final 14 Oktober 2026 dicatat di [progres proyek](docs/phase-3-progress.md#17-finalisasi-phase-3---14-oktober-2026).

## Fitur saat ini

Phase 4 menambahkan rendering sRGB/ACES dengan exposure 1, pencahayaan Matahari, atmosfer rim glow dan corona ringan dengan fallback, starfield berlapis seeded serta haze dekoratif. Kamera Visit/Follow/tur memakai transisi bersama dengan perlindungan permukaan dan cincin. Mode sinematik, fullscreen, panel ilmiah berkelompok, fokus keyboard dan prefers-reduced-motion tersedia. Catatan verifikasi dan batas implementasi ada di [progres Phase 4](docs/phase-4-progress.md).

Verifikasi historis Phase 4 (17 Oktober 2026): **43/43 unit test**, **52/52 E2E** (Edge 1366×768 dan Chrome 1920×1080), serta production build berhasil. Perencanaan Visit antarbulan diperbaiki agar memakai volume tabrakan cincin aktual dan endpoint aman. Tidak ditemukan warning/error console aplikasi dalam skenario yang diuji. Batas validasi dan pekerjaan Phase 5 tercatat di dokumen progres.

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

## Phase 5: Interactive Milky Way Map

Galaxy Mode menyediakan core/bulge, central bar, disk, halo, spiral arms dan Orion Spur prosedural seeded. Sebanyak 13 landmark dapat dipilih lewat klik, daftar keyboard atau search enam kategori. Panel menyajikan sumber, jarak ilmiah, posisi skematis dan breadcrumb. Bookmark/perbandingan serta kontrol waktu tetap khusus Tata Surya.

- Kamera galaksi: orbit, free-flight, kecepatan adaptif, empat preset dan reset view. Kontrol serta batas 80 unit model terpisah dari Solar System.
- View Milky Way / Enter Solar System: fade dan gerakan kamera lokal, swap scene setelah siap, tombol Skip serta reduced motion. Aksi masuk solar juga tersedia pada marker Solar System.
- Guided Tour/G mengikuti mode aktif. Tur galaksi berisi 10 stop dengan Previous, Next, Pause/Resume dan Exit; Escape keluar. Panel ringkas di bawah otomatis collapsed ketika kamera bergerak; Minimize/Expand tidak menghentikan tur. Waktu baca 12 detik sesudah kamera tiba.
- H menyembunyikan HUD; L fullscreen. Tab/Enter dan panah digunakan pada kontrol native; Escape menutup hasil/panel atau keluar tur/flight sesuai konteks. Enter search tidak mengaktifkan tombol Tutup panel secara tidak sengaja.

**Batas ilmiah:** visual galaksi disederhanakan, titik bukan satu bintang katalog atau katalog lengkap, dan koordinat menggunakan unit model pada disk XZ dengan tinggi Y. Tidak ada transform kpc/astrometri terverifikasi atau zoom fisik dari planet ke galaksi. Jarak visual tidak proporsional; marker lokal sengaja direnggangkan agar bisa dipilih. Jarak ilmiah pada panel tetap terpisah dan diberi status perkiraan. Gunakan sumber panel untuk data, bukan jarak antar titik model.

Validasi final dan hasil pengukuran dicatat di [progres Phase 5](docs/phase-5-progress.md#17-finalisasi-phase-5---19-oktober-2026). Jalankan `npm test`, `npm run build`, `npm run test:e2e` untuk unit/build/seluruh regresi browser; `node scripts/audit-phase5.mjs` memeriksa siklus mode, RAF/listener/resource/heap dan smoke test production (jalankan build dahulu). Script E2E memiliki server Vite sendiri agar lifecycle tes Windows tidak bergantung pada wrapper npm.

Finalisasi 19 Oktober 2026: **63/63 unit test**, production build dan smoke preview berhasil. Full E2E menghasilkan 69/70 lulus; satu assertion roundoff kamera diperbaiki, lalu seluruh file regresi terkait lulus **6/6** pada Edge/Chrome. Semua skenario terverifikasi melalui run tersebut. Audit 30 siklus per browser menunjukkan RAF/listener/resource stabil; kenaikan heap kecil masih perlu profiling sesi panjang.

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

- **View Milky Way / Enter Solar System** di kiri bawah: beralih antara Solar System Mode dan Galaxy Mode. Galaxy menampilkan core, bulge, bar, empat lengan spiral ilustratif, Orion Spur, disk dan halo halus. Titik adalah sampel visual edukatif, bukan bintang katalog. Low/Medium/High memakai 12.600/30.240/50.400 titik; ubah preset di Tata Surya sebelum masuk galaksi. Tersedia 13 landmark selectable melalui klik atau daftar keyboard, dengan panel bersumber NASA. Posisi marker skematis dan approximate, bukan koordinat astronomis; objek lokal direnggangkan. Pencarian mengikuti mode aktif, dengan enam kelompok landmark galaksi. Query solar tanpa hasil lokal menawarkan landmark Milky Way; Enter memilih, ArrowDown menuju daftar, Escape menutup hasil/panel. Pemilihan hasil galaksi mengaktifkan mode bila perlu, mengarahkan kamera dan membuka panel dengan breadcrumb serta posisi skematis. Seleksi/tur/Follow/flight dihentikan saat switch; waktu solar dibekukan dan audio tetap memakai instance yang sama.

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

Kamera **Galaxy Mode**: gunakan preset Top view, Angled overview, Galactic center atau Solar System region (posisi ilustratif, belum terverifikasi). **Reset view** kembali ke overview. **Free Flight** mengaktifkan WASD + mouse, Space/Ctrl naik/turun, Shift boost 3× dan scroll pengali kecepatan 0,25–4×. Kecepatan adaptif dihitung dari jarak ke pusat model, terpisah dari Tata Surya; kamera dibatasi radius 80 unit model. Escape membatalkan transisi atau keluar flight; drag/scroll mengambil alih transisi. Preset memakai easing 1,4 detik (150 ms untuk reduced motion). Klik marker atau gunakan daftar Landmark untuk membuka informasi; Escape menutup panel. Guided Tour/G di Galaxy memulai tur edukatif 10 stop: overview hingga pusat, struktur, wilayah lokal dan landmark pilihan, lalu kembali overview. Previous/Next, Pause/Resume dan Exit tersedia; Escape menutup tur. Waktu baca 12 detik setelah kamera tiba. Drag/scroll, preset, search atau flight mengambil alih dan menutup tur; reduced motion mengikuti transisi kamera existing. Sumber dan batas interpretasi tercantum pada docs/phase-5-progress.md bagian 11.

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
| Bintang dekoratif Tata Surya | 2.520 | 5.040 | 9.000 |
| Partikel Galaxy Mode | 12.600 | 30.240 | 50.400 |
| Asteroid dekoratif | 600 | 1.200 | 1.900 |
| Objek Kuiper dekoratif | 900 | 1.800 | 3.600 |
| Atmosfer, glow, coma dan haze | Nonaktif | Aktif | Aktif |

Pergantian kualitas membuang geometry sphere lama dan memakai ulang buffer sabuk/bintang; tidak membuat ulang scene setiap frame. Low tetap mempertahankan alokasi buffer maksimum dan tekstur yang sudah dimuat. Tekstur lokal dimuat sesuai kebutuhan dengan fallback procedural. Tidak ada bloom atau shadow map mahal. Statistik FPS, draw calls, triangles, points, geometry dan material hanya tersedia pada server development melalui `/?debug`, bukan build produksi.

## Deployment Vercel

1. Push proyek ke GitHub.
2. Buat proyek baru di Vercel dan pilih repository ini.
3. Vercel akan mendeteksi Vite secara otomatis.
4. Build command: `npm run build`.
5. Output directory: `dist`. Konfigurasi sudah tersedia di `vercel.json`; tidak membutuhkan backend atau environment secret. Mode memakai state aplikasi pada satu URL, sehingga tidak memerlukan route server terpisah.
6. Build lokal diverifikasi dengan Node 22.20.0. Gunakan versi Node yang memenuhi engines dependency Vite.
7. Sebelum rilis publik, selesaikan sumber/lisensi audio lokal yang masih belum diverifikasi pada `public/audio/README.md`. File MP3 saat ini ikut tersalin ke dist; build berhasil tidak berarti izin distribusi aset sudah diverifikasi.

Dukungan platform: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite). Kesiapan ini berbasis build dan preview lokal; deployment Vercel/CDN/domain belum dilakukan atau diuji pada tugas finalisasi.

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

## Pekerjaan lanjutan Phase 6

- Melengkapi parameter ilmiah yang masih kosong, lima bulan tambahan, serta aset bulan/awan Venus berlisensi.
- Kalender/epoch, elemen orbit lengkap, ephemeris, kebijakan tab background/catch-up dan tidal locking.
- Charon/pendamping lain dan rute tur tambahan. Galaxy Scene, tur galaksi dan lifecycle lintas-scene sudah tersedia pada Phase 5.
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
- Charon sesuai roadmap awal; Halley dan Galaxy Scene sudah tersedia.

### Phase 3 dan pengukuran performa

Finalisasi 14 Oktober 2026: **34/34 unit test**, **32/32 E2E** pada Edge/Chrome dan production build berhasil. Seluruh skenario E2E bebas console warning/error dan pageerror, termasuk fallback tekstur, resize dan keyboard. Laporan [benchmark final](docs/benchmarks/phase-3-final.json) mencatat resource stabil selama pengulangan; heap masih meningkat sedikit, sehingga bukan klaim bebas leak jangka panjang. Untuk menulis laporan terpisah gunakan `npm run profile -- docs/benchmarks/phase-3-final.json`.

Progres rinci dan batas ilmiah tersedia di [docs/phase-3-progress.md](docs/phase-3-progress.md).
Orbit elips menggunakan elemen sederhana, bukan n-body atau ephemeris tanggal nyata. Sebanyak 17 bulan memiliki data terverifikasi di `moonScience.js`; nilai yang belum diverifikasi tetap kosong. Lima planet katai memakai data ilmiah terpisah. Cincin Saturnus/Uranus procedural dan kedua sabuk tidak membutuhkan aset eksternal baru.

Tombol **Asteroid** dan **Kuiper** menyembunyikan/menampilkan partikel masing-masing, tanpa menghilangkan Ceres atau Pluto. Low/Medium/High memakai 600/1200/1900 partikel asteroid dan 900/1800/3600 partikel Kuiper. Distribusi dan ukuran merupakan ilustrasi dengan skala jarak terkompresi; partikel tidak dapat dipilih.

`npm run profile` menjalankan benchmark terpisah di Edge 1366×768 dan Chrome 1920×1080, membuka server Vite lokal, lalu menulis `docs/benchmarks/phase-3-performance.json`. Jalankan tanpa browser/test berat lain agar hasil sebanding. Benchmark mengukur interval animation frame, heap setelah garbage collection dan jumlah resource setelah Visit/tur/toggle berulang. Hasil headless hanya baseline mesin pengujian; bukan jaminan FPS atau bukti tidak adanya memory leak jangka panjang. Tidak ada dependency baru.

Transisi mode: **View Milky Way** membuka galaksi dengan fade dan gerakan kamera lokal; panel marker **Solar System** menyediakan **Enter Solar System**. **Skip** melewati animasi. Input dikunci sementara, lalu fokus kembali ke tombol mode. Durasi normal sekitar 1,3 detik; prefers-reduced-motion sekitar 160 ms tanpa gerakan kamera. Kedua scene tetap menggunakan koordinat terpisah, dan pose kamera sebelumnya dipertahankan.

## Identitas halaman, About dan Credits (Phase 6)

Nama publik: **Milky Way Observer**. Halaman menyediakan title, deskripsi berbahasa Indonesia, theme-color navy, favicon SVG lokal, Open Graph (website, nama, judul, deskripsi, locale) dan Twitter summary card. Favicon dibuat khusus dalam proyek; tidak memakai layanan favicon atau aset unduhan.

Buka tombol **? — Bantuan, About dan Credits**, lalu expand **About / Credits — Milky Way Observer**. Bagian ini dapat dioperasikan dengan keyboard (Tab, Enter/Space; Escape menutup bantuan) dan memakai dialog bantuan existing. Tersedia tujuan edukatif, batas skala, landmark skematis, penjelasan partikel bukan katalog bintang, tautan sumber NASA/JPL, serta catatan attribution tekstur dan audio lokal. Teks pengantar HTML dan noscript tetap menjelaskan proyek saat JavaScript tidak tersedia. Pemberitahuan desktop pada layar kecil tidak menangkap klik; tidak ada kontrol mobile penuh.

**Domain produksi dikonfirmasi pengguna (21 Oktober 2026):** canonical dan og:url menggunakan `https://space-explorer-kappa-azure.vercel.app/` secara konsisten, termasuk pada build Preview. Jangan gunakan URL deployment unik atau preview branch. Jika custom domain digunakan nanti, perbarui kedua metadata dan pengujiannya. Setelah gambar sosial yang berizin disiapkan, isi og:image, twitter:image, alt text terkait (dan dimensi gambar bila tersedia) menggunakan URL absolut. Field gambar sosial tersebut sengaja belum diterbitkan; tidak ada domain/gambar contoh atau akun Twitter yang dikarang. Tampilan kartu sosial tanpa gambar bergantung platform dan belum diuji melalui crawler publik.

Catatan tekstur lokal mencantumkan Solar System Scope / INOVE dan CC BY 4.0; provenance serta kelengkapan attribution belum diverifikasi ulang. Audio `Interstellar Main Theme.mp3` berasal dari berkas pengguna dan **lisensi/izin rekaman serta komposisi belum terverifikasi**. Penyelesaian izin dan attribution adalah pekerjaan sebelum publikasi; menampilkan kredit tidak menggantikan izin. Detail: [kredit tekstur](public/textures/ATTRIBUTION.md), [catatan audio](public/audio/README.md). Tidak ada analytics, cookie banner, atau layanan eksternal yang ditambahkan.

## Status finalisasi Phase 6 — 21 Oktober 2026

Test lokal terbaru: **77/77 lulus**, build berhasil. Alias publik yang diberikan pengguna lolos **6/6 pemeriksaan online** untuk alur utama, audio, reload, aset dan respons 404. Namun hash entry alias berbeda dari build lokal; deployment Preview spesifik mengarah ke login Vercel dan belum dapat diuji. Hasil alias bukan acceptance branch Phase 6.

Status merge rilis masih **tertahan** sampai Preview kandidat dapat diakses secara sah/SHA dikonfirmasi dan izin audio serta provenance aset diselesaikan. Domain produksi kini dikonfirmasi pengguna; canonical/og:url menggunakan `https://space-explorer-kappa-azure.vercel.app/`. Detail dan bukti: [release checklist](docs/release-checklist.md), [progres Phase 6](docs/phase-6-progress.md), [draft ringkasan PR](docs/phase-6-pr-summary.md). Zoom browser native 200%, tab background OS dan beberapa pemeriksaan manual tetap belum diuji.
