# Phase 5 — Interactive Milky Way Map

Tanggal audit: 17 Oktober 2026 (Asia/Jakarta). Baseline Git: `7e6e951`.
Status: **arsitektur dua mode, visual galaksi, kamera dan 13 landmark skematis selectable tersedia; pencarian dan guided tour galaksi tersedia**. Bagian 1–7 adalah baseline/rancangan awal; hasil implementasi ada di bagian 8-16; audit final dan batas rilis ada di bagian 17.

## 1. Baseline dan verifikasi

Working tree bersih saat audit dimulai. Perubahan tugas ini hanya dokumen ini. README, package.json, progres Phase 4, struktur src dan modul integrasi terkait diperiksa. Tidak ada penghapusan/reset perubahan pengguna atau git commit.

Stack tetap Vite + Three.js + JavaScript ES modules. package.json meminta Three.js ^0.180.0, Vite ^7.1.7 dan Playwright ^1.64.0. Build lokal memakai Vite 7.3.7; konfigurasi Vite memisahkan bundle Three.js. Tidak membutuhkan library atau renderer kedua.

| Verifikasi pada audit ini | Hasil |
| --- | --- |
| `npm.cmd test` | 46/46 lulus, 0 gagal, exit 0 |
| `npm.cmd run build` | Berhasil, 36 modul, exit 0, tanpa warning/error build |
| Output sebelum gzip | HTML 13,82 kB; CSS 15,23 kB; aplikasi 102,47 kB; Three.js 499,98 kB |
| Output gzip | HTML 4,01 kB; CSS 4,35 kB; aplikasi 33,06 kB; Three.js 126,49 kB |

Browser/E2E dan profiling tidak dijalankan ulang pada audit dokumen ini. Hasil historis Phase 4: 52 E2E penuh lulus sebelum audio, lalu 10 E2E terkait audio/accessibility/cinematic dan 2 E2E audio setelah pemindahan kontrol. README masih menyebut suite 43 unit/52 E2E pada bagian verifikasi historis; unit terkini berjumlah 46. Jangan memperlakukan angka historis sebagai hasil regresi Phase 5.

Scene sekarang memiliki 37 objek mandiri, 36 orbit dan dua sabuk dekoratif. Tersedia orbit elips, bulan/katai/komet, cincin, Visit/Follow/Free Flight, tur 10 tahap, panel ilmiah, favorit/perbandingan, cinematic/fullscreen, reduced motion, kualitas persisten, fallback aset dan ambient audio. Starfield/haze Phase 4 bukan peta Bima Sakti.

## 2. Audit integrasi

| Area / file | Kondisi sekarang | Implikasi dua mode |
| --- | --- | --- |
| `main.js`: startup | Membuat renderer, scene/fog, satu camera, OrbitControls, FlightControls, SolarSystem, CameraSafety, UI dan audio. Startup menunggu tekstur Matahari dengan timeout | Pertahankan satu bootstrap aplikasi; kesiapan mode baru tidak boleh bergantung pada tekstur Matahari |
| `SolarSystem.js` | Constructor langsung membuat semua objek/procedural map. Root berotasi -2,5°; hemisphere light, background dan indikator seleksi ditambahkan langsung ke scene, bukan semuanya ke root | Menyembunyikan root saja tidak memisahkan scene. Pilih dedicated Scene untuk masing-masing mode agar perubahan kecil dan kepemilikan jelas |
| Kamera | FOV 53°, near 0,05/far 2200, min/max orbit 0,3/720 dalam skala visual Tata Surya; tween/Follow/clearance di main | Kamera/configuration milik mode. Jangan membawa clipping, posisi, flight speed atau radius collision langsung ke galaksi |
| `FlightControls.js` | Kamera ditangkap saat konstruksi; listener document/window/canvas, activate/deactivate/reset/dispose tersedia; slowdown memakai clearance lokal, speed 1–180 | Jangan membuat ulang setiap activate tanpa dispose. Awalnya flight hanya capability solar-system; dukungan galaksi perlu konfigurasi satuan/kecepatan khusus, bukan reuse angka solar |
| Animation loop | Satu RAF; delta Clock dibatasi 0,05 detik. Orbit memakai delta × hari/detik, tween memakai waktu RAF, tur memakai delta real dibatasi. Update camera/safety/detail/label lalu render | Satu loop aplikasi, hanya active mode update/render. Mode inactive dibekukan; jangan melakukan catch-up orbit otomatis ketika kembali |
| `UIController.js` | Instance tunggal, EventTarget; import langsung searchObjects/scienceFor/tour/timeSpeeds, kategori solar hardcoded. Banyak listener anonymous, belum dispose | Pertahankan instance UI global; tambahkan provider mode dan capability sedikit demi sedikit. Jangan membuat UIController baru setiap switch |
| Selection/raycast | Raycaster memakai camera dan solarSystem.pickables, userData.bodyId; klik/drag dibedakan; indikator dan selectedObject global di main | Seleksi harus scoped ke mode, daftar pickables diganti atomik. Particle dekoratif galaksi tidak ikut raycasting |
| `data/search.js` | Membentuk katalog bodies + dwarfPlanets + comets + moons, alias solar; UI grouping tipe tetap | Pertahankan API solar existing; provider galaksi terpisah. Jangan menyisipkan objek galaksi ke celestialBodies atau memberi field planet palsu |
| Tur | Narasi terpisah di tour.js; UI memakai tourStops, main mempunyai rute khusus asteroid-belt dan target sun | Tur solar tetap utuh; stop saat switch. Galaxy tour tidak otomatis tersedia; tombol/shortcut harus mengikuti capability |
| Kualitas | Medium default; DPR 0,85/1,25/1,75; sphere replacement/dispose dan drawRange partikel; efek Low mati | Nama preset/preferensi global, budget konten per mode. DPR tetap milik renderer; jangan memakai jumlah/ukuran sphere planet untuk galaksi |
| Disposal | SolarSystem traverse seluruh scene, dispose Set resource, scene.clear; callback sukses texture memeriksa disposed. Cache/effects/root masih dapat menahan referensi; error callback tetap mengirim event global | Dedicated scene wajib untuk pola dispose sekarang. Saat dispose final, lepaskan referensi mode/cache/effects dan saring callback yang terlambat agar status UI mode baru tidak tertimpa |
| Main teardown | pagehide melepas flight/orbit/system/renderer; tidak mendefinisikan lifecycle pergantian mode. Resize/fullscreen listener tetap satu | Event global didaftarkan satu kali, diteruskan ke active mode. Listener milik mode harus dapat dicabut atau tetap disabled ketika inactive |
| Favorit/perbandingan | ExplorationUI dan exploration.js mengunci katalog solar; validFavorites memfilter ID berdasarkan katalog itu | Jangan memasukkan ID galaksi ke storage v1 yang akan membuangnya. Pada tahap awal fitur ini solar-only, data favorit lama tetap utuh |
| Audio | Singleton getAudioManager, independen scene; kontrol popover toolbar, visibility pause/resume, disposal hanya pagehide | Pertahankan instance/timeline saat switch. Jangan memanggil dispose audio pada deactivate mode |

Temuan ini adalah batas arsitektur untuk perubahan mendatang, bukan bukti seluruh fitur existing sedang rusak. Konfigurasi visual, data ilmiah dan orbit tidak diubah pada audit.

## 3. Arsitektur yang direkomendasikan

**Satu WebGLRenderer/canvas dan satu RAF; dua mode dengan Scene, PerspectiveCamera, state serta katalog sendiri.** Scene terpisah lebih aman daripada sekadar root.visible karena SolarSystem memiliki objek di luar root dan membersihkan scene secara menyeluruh.

```text
main.js — bootstrap, renderer, resize, satu RAF
  ├─ ModeController — active mode, switch, status/error
  │   ├─ SolarSystemMode — Scene + camera + controls + SolarSystem
  │   └─ GalaxyMode      — Scene + camera + controls + GalaxyMap (lazy)
  ├─ UIController — satu shell, provider/capabilities mode aktif
  └─ AudioManager — satu instance sepanjang umur aplikasi
```

Kontrak minimum berupa plain object/class JS dengan JSDoc; tidak perlu framework, abstract base class atau event bus baru:

| Member | Tanggung jawab |
| --- | --- |
| `id` | Literal `solar-system` atau `galaxy` |
| `scene`, `camera` | Referensi mode; renderer tidak dimiliki mode |
| `activate(context)` | Siapkan/aktifkan mode idempotent, terapkan quality dan viewport terbaru, restore pose; boleh async untuk lazy load |
| `deactivate()` | Hentikan tween/Follow/tur, reset input/velocity, lepas pointer lock, disable controls dan sembunyikan label. Tidak dispose aset |
| `update(deltaSeconds, nowMs)` | Update mode aktif saja. Solar mengonversi detik menjadi hari lewat timeScale internal; Galaxy awalnya peta statis, bukan orbit jutaan tahun |
| `resize(width, height)` | Aspect/projection camera; renderer size/DPR ditangani aplikasi sekali |
| `setQuality(preset)` | Budget resource/efek per mode, tanpa rebuild setiap frame |
| `getSearchProvider()` | Query/kategori/detail record khusus mode, tanpa bergantung pada UI DOM |
| `pick(raycaster)` / `select(id)` | Raycast subset interaktif milik mode; return ID atau null, bukan objek mode lain |
| `visit(id)` | Navigasi memakai framing dan satuan mode sendiri; helper easing murni dapat digunakan ulang |
| `capabilities` | Misalnya timeControls, follow, flight, tour, bookmark, compare. UI dan shortcut memakai capability yang sama |
| `dispose()` | Idempotent: deactivate, cancel async ownership, lepas listener/DOM mode, dispose resource milik mode saja |

Provider solar awal membungkus fungsi existing; provider galaksi akan memberi label, ringkasan, data jarak/ukuran, sumber dan ketidakpastian yang sesuai objek galaksi. Formatter umum boleh dipakai ulang, tetapi scienceFor/planet stats bukan schema universal. ID internal boleh tetap `earth`; referensi lintas mode berbentuk `{ modeId, objectId }`, misalnya marker `{ modeId: 'galaxy', objectId: 'solar-system' }` yang mempunyai aksi masuk mode solar-system. Jangan mengonversi posisi marker menjadi posisi planet.

### Prosedur switch dan pemulihan kegagalan

1. Abaikan request ke mode yang sudah aktif; serialisasi switch dan gunakan generation token untuk menolak hasil async dari request lama. Jangan izinkan dua RAF/dua input controller aktif.
2. Simpan pose, target, pilihan objek, timeScale/pause dan toggle solar. Tutup popover/dialog/panel transient, hentikan tur/tween/Follow, lepaskan pointer lock; deactivate mode lama. Orbit berhenti pada elapsedDays terakhir.
3. Lazy create/activate tujuan. Tampilkan status loading; renderer dapat mempertahankan frame lama. Async activation yang gagal harus membersihkan instance parsial lalu mengaktifkan kembali mode lama dengan status error.
4. Setelah siap, resize dengan ukuran terbaru, apply quality, pasang dataset/pickables/capabilities, bersihkan search/filter dan seleksi UI dari mode sebelumnya, lalu commit active mode. Gunakan label/fokus mode selector untuk feedback keyboard.
5. Saat kembali ke solar, pulihkan pose, elapsedDays, timeScale/pause dan pilihan valid. Jangan memulai tur/Follow/flight/pointer lock otomatis; perlu interaksi pengguna. Reset delta agar waktu switch tidak dihitung sebagai simulasi.
6. Pertahankan kedua instance setelah first use untuk menghindari churn; hanya satu di-update/render. Sebelum resource galaksi besar ditambahkan, ukur memori dua mode. Jika cache tidak layak, tambahkan evict mode inactive dengan snapshot data ringan, bukan hidden scene yang tetap berjalan.

Renderer setting yang global (color space, tone mapping, exposure, DPR) tetap satu kebijakan awal. Fog/background/lights per Scene; solar light tidak menerangi Galaxy Scene. Jika nanti exposure per mode diperlukan, apply eksplisit saat activate dan restore saat switch, bukan efek samping constructor.

## 4. Konvensi koordinat galaksi (rancangan, bukan data observasi)

- Scene galaksi **tidak memakai** helper AU/radiusEarth atau skala visual SolarSystem. Tidak ada animasi zoom kontinu dari planet ke galaksi memakai satu koordinat dunia.
- Usulan satuan: **1 unit scene galaksi = 1 kpc** untuk posisi peta. Simpan posisi sumber dalam record ilmiah terpisah lengkap unit, frame, sumber, versi/epoch jika relevan dan uncertainty; hanya fungsi konversi yang menghasilkan posisi render. Ukuran marker minimum layar bukan ukuran fisik bintang/region.
- Origin `(0,0,0)` adalah pusat model galaksi. Scene right-handed, disk pada XZ, +Y ke arah utara model galaksi. +X menuju proyeksi posisi Matahari pada disk; +Z dipilih untuk melengkapi basis right-handed. Ini konvensi aplikasi, bukan klaim otomatis kompatibel dengan koordinat IAU atau library astronomi.
- Definisikan basis sumber Cartesian right-handed `(gx, gy, gz)`, dengan gz utara model; pemetaan render `(X,Y,Z) = (gx,gz,-gy)` dalam kpc menjaga handedness. Sudut model theta dari +X menghasilkan `(R cos(theta), h, -R sin(theta))`. Nyatakan unit radian pada kalkulasi dan uji tanda/sumbu; sudut model bukan otomatis longitude galaktik heliosentris.
- Posisi Matahari baru diisi setelah jarak pusat/tinggi disk dan konvensi sumber diverifikasi. Jangan mengarang R0, kemiringan, radius/arm pitch, koordinat landmark atau ketidakpastian pada fase audit. Transform heliosentris/galaktosentris harus eksplisit, bukan sekadar mengganti nama field.
- Anggaran awal engineering: usahakan koordinat render dalam ratusan unit; tetapkan near/far/min/max orbit dari bounding radius dataset setelah tersedia. Jangan menyalin near 0,05/far 2200 atau clearance planet ke peta galaksi tanpa pengukuran.
- Ketebalan disk, kecerahan, arm shape dan marker yang disederhanakan harus ditandai ilustratif. Partikel seeded dekoratif bukan bintang katalog yang telah diukur. Warna/luminositas dekoratif tidak boleh ditampilkan sebagai data ilmiah.

Tidak ada angka astronomi baru atau sumber eksternal yang diverifikasi dalam audit ini. Verifikasi NASA/ESA atau sumber primer dataset, frame, unit, ketidakpastian dan lisensi merupakan gerbang sebelum pengisian katalog/visual galaksi.

## 5. Struktur file yang diusulkan

Semua file berikut masih rencana, tidak dibuat pada tugas ini:

```text
src/core/ModeController.js          registry, active mode, switch/rollback
src/modes/modeContract.js           JSDoc kontrak/capabilities (jika membantu)
src/modes/SolarSystemMode.js        adapter scene/kamera/state existing
src/modes/GalaxyMode.js             lifecycle/kamera/pick khusus galaxy
src/core/GalaxyMap.js               hanya konstruksi dan resource peta
src/data/galaxyObjects.js           katalog ilmiah dan metadata sumber
src/data/galaxyVisual.js            seed, marker, budget dan parameter ilustrasi
src/data/galaxyCoordinates.js       konversi murni dan validasi unit/frame
src/data/galaxySearch.js            query/alias/kategori katalog galaksi
test/modes.test.js                 lifecycle, rollback dan mode isolation
test/galaxyCoordinates.test.js      finite, origin, handedness, scale
test/galaxyData.test.js             ID, schema, sumber dan unit
e2e/modes.spec.js                   switch, input, search, audio, disposal
```

File existing yang kemungkinan berubah bertahap: main.js untuk delegasi loop/input, UIController.js untuk provider/capabilities, index.html/styles.css untuk selector mode kecil, quality.js untuk budget galaksi bila diperlukan. SolarSystem.js hanya untuk batas kepemilikan/disposal yang terbukti perlu; jangan memindahkan data orbit/tekstur. FlightControls.js hanya jika galactic flight diminta kemudian. ExplorationUI/exploration.js tetap solar-only awalnya; ekspansi favorit lintas mode membutuhkan schema storage/version migration tersendiri.

Tidak perlu mengekstrak seluruh kamera/tur menjadi framework generik dahulu. Pindahkan blok integrasi solar existing ke adapter secara mekanis dalam langkah tersendiri; pertahankan perilaku dan diagnostic __observer untuk regresi. Helper murni cameraMath tetap dipakai ulang. GalaxyMode tidak memakai collision loop seluruh objek SolarSystem.

## 6. Risiko performa, presisi dan lifecycle

| Risiko | Mitigasi / bukti yang dibutuhkan |
| --- | --- |
| Skala AU dan kpc dicampur, Float32 GPU kehilangan detail | Dua scene; konversi unit eksplisit, Number untuk metadata, Float32 hanya posisi render terkompresi. Tidak perlu floating origin/log depth pada langkah awal; ukur dahulu |
| Near terlalu kecil dibanding far | Frustum per mode dan batas zoom terukur; uji jitter/z-fighting top-down dan edge-on. Jangan mengaktifkan logarithmicDepthBuffer global tanpa kebutuhan |
| Particle count/overdraw/haze | Points/BufferGeometry atau instancing, beberapa draw calls, seeded buffer sekali; Low mengurangi drawRange/efek. Tetapkan budget berdasarkan profiling, bukan janji FPS atau jumlah bintang real |
| Raycasting semua partikel dan ribuan DOM label | Hanya landmark interaktif dengan proxy terpisah; label terpilih/prioritas dibatasi. Tidak satu mesh/DOM node per bintang dekoratif |
| Memori dua scene + aset | Lazy import/construction GalaxyMode, resource counts sebelum/sesudah switch, warmup lalu repeated cycles/GC. Low drawRange tidak otomatis membebaskan buffer |
| Listener/RAF ganda | Satu event routing dan RAF global; controls deactivate/reset/dispose teruji; UI/audio singleton. Uji input saat switch dalam flight/tur/modal |
| Async loader mengubah mode yang sudah ditinggal | Token/generation untuk callback UI, disposed guard dan dispose aset terlambat; jangan membuang aset yang masih dimiliki cached mode |
| Salah dispose scene lain/shared texture | Dedicated scene ownership, Set disposal, jangan dispose renderer/audio pada switch; shared resource harus mempunyai owner eksplisit |
| Shader/fallback dan mode gagal aktif | Pertahankan mode lama sebagai rollback sampai tujuan siap; status error yang dapat dibaca, tidak meninggalkan UI setengah berpindah |
| Kontrol solar aktif di galaksi | Capability diterapkan pada tombol dan shortcut/event handler; tidak hanya display:none. No-op terkontrol untuk ID yang tidak ada |
| Scientific overclaim | Pisahkan procedural visual dari katalog bersumber; unit/frame/uncertainty eksplisit; peta ilustratif bukan ephemeris atau navigasi astronomis presisi |

## 7. Checklist dan urutan implementasi paling aman

- [x] Audit README/package/progres Phase 4/struktur dan integrasi src.
- [x] Identifikasi coupling scene, kamera, UI/search/tour dan disposal.
- [x] Rancang dua mode, lifecycle, coordinate boundary dan file modular.
- [x] Jalankan 46 unit test dan production build; dokumentasikan hasil tanpa perubahan runtime.
- [x] P5-01a: lifecycle sinkron + ModeController dengan test doubles: deactivate, update active-only, resize, switch berulang, rollback dan dispose idempotent (bagian 8).
- [ ] P5-01b: async activation/cancellation dan latest-request-wins jika mode membutuhkan lazy import/aset async; belum diperlukan placeholder lokal.
- [x] P5-02: adapter SolarSystemMode dan delegasi main; integrasi existing dipertahankan dan seluruh 54 E2E existing lulus. Sesuai tugas terbaru, mode kedua berupa placeholder turut disediakan (bagian 8).
- [x] P5-03: provider UI/search/detail serta capability solar; audit shortcut/dialog/fokus, pertahankan favorit lama. Validasi semua fitur solar tetap tersedia.
- [x] P5-04a: katalog kecil bersumber, metadata approximate, unit model XZ/Y, posisi finite, ID unik dan pemisahan science/visual; diuji. Tidak ada aset katalog eksternal baru.
- [ ] P5-04b (Phase 6): transform astrometri kpc/handedness terverifikasi dan katalog observasional presisi; tidak mengklaim layout model sebagai koordinat ilmiah.
- [x] P5-05a: GalaxyMode kosong dengan scene/kamera sendiri, selector mode, lazy initialize sinkron dan rollback; pengujian switch/state/waktu/audio tersedia (bagian 8).
- [ ] P5-05b: lazy activation async dan pemulihan kegagalan aset galaksi; menunggu kebutuhan dataset/visual.
- [x] P5-06: visual peta seeded yang ringan dan budget Low/Medium/High; model disk/struktur hanya setelah data/parameter ilustratif dijelaskan. Particle dekoratif non-pickable.
- [x] P5-07: marker terpilih, pencarian dataset galaksi, panel bersumber dan aksi marker Tata Surya untuk kembali ke mode solar-system. Framing/camera limits galaksi terpisah.
- [x] P5-08: E2E dua viewport, resize/fullscreen, reduced motion, keyboard, mode switch saat tur/flight/texture pending, search/filter isolation, error/fallback, kualitas dan timeline audio. Seluruh suite dijalankan; hasil dan pengulangan tes yang diperbaiki dicatat di bagian 17.
- [x] P5-09a: 30 siklus per browser, sampling resource/listener/RAF/heap, draw calls, production smoke dan dokumentasi final.
- [ ] P5-09b (Phase 6): profil sesi panjang/heap snapshots dan matriks GPU/perangkat; drift heap kecil belum dijelaskan secara definitif.

**Rekomendasi awal audit P5-01/P5-02 sudah dikerjakan pada bagian 8.** Berikutnya pisahkan provider katalog/detail (P5-03) dan verifikasi konvensi/data (P5-04) sebelum membuat visual. Jangan memakai starfield dekoratif sebagai katalog galaksi.

Backlog Phase 4 seperti awan Venus, ephemeris, Charon, sinkronisasi favorit, screen reader menyeluruh dan adaptive quality tidak otomatis menjadi lingkup implementasi peta galaksi. Galactic flight/tour dan bookmark lintas mode memerlukan tugas tersendiri; capability awalnya nonaktif dengan penjelasan, bukan tombol kosong.

## 8. Implementasi arsitektur mode — 17 Oktober 2026

Tugas ini membuat batas lifecycle dan Galaxy placeholder saja. Tidak membuat peta, partikel, katalog atau data ilmiah galaksi. Integrasi solar di main dipindahkan secara mekanis ke closure dalam SolarSystemMode; solver orbit, material, kamera/tween, collision, tur dan data existing dipertahankan.

### Kepemilikan dan lifecycle

- `src/core/ModeController.js`: registry, initialize sekali/lazy, activate/deactivate, update active-only, resize kedua mode yang sudah diinisialisasi, rollback aktivasi gagal dan dispose idempotent. ID asing ditolak sebelum mode aktif dinonaktifkan.
- `src/modes/SolarSystemMode.js`: mempunyai Scene, kamera, OrbitControls, FlightControls, SolarSystem, safety, state tween/tur/follow dan raycasting sendiri. Event callback digate oleh active dan dicabut saat dispose. Tidak membuat renderer atau RAF.
- `src/modes/GalaxyMode.js`: Scene kosong, PerspectiveCamera dan OrbitControls tersendiri; `pickables` dan `searchDataset` kosong. Tidak memakai root/skala solar. Clipping 0,1–200 dan orbit distance 2–100 hanya konfigurasi placeholder, bukan angka astronomi.
- `src/main.js`: satu renderer, satu rantai RAF, resize/fullscreen global, routing quality, context-lost dan switch. Per frame memanggil controller.update lalu render scene/camera aktif. Diagnostic solar existing tetap tersedia untuk regresi; diagnostic mode ditambahkan pada development.
- `UIController.setMode`: bersihkan panel/search/filter/seleksi, nonaktifkan kontrol solar di galaxy, tampilkan placeholder. Shortcut tur/time tidak bisa mengubah solar saat galaxy aktif. Tombol fullscreen, bantuan, audio dan cinematic tetap global. Provider galaksi lengkap belum dibuat karena belum ada katalog.
- AudioManager tidak dibuat ulang/dispose ketika mode berpindah. Setiap mode/control dibuat sekali, listener tidak ditambahkan ulang setiap activate. Dua OrbitControls terkait kamera berbeda, hanya satu enabled. Renderer dan audio hanya dilepas ketika halaman ditutup, bukan pada switch.

### Perilaku pergantian

Tombol **Galaxy · Dev** di kiri bawah masuk placeholder; tombol berubah menjadi **Tata Surya** untuk kembali. Tombol native memiliki title/aria-label/pressed state dan bisa digunakan dengan Tab/Enter. Placeholder menerangkan bahwa peta dan objek belum tersedia. Tidak ada kontrol galaksi palsu yang memanggil fungsi solar.

Saat meninggalkan solar, tur/tween/Follow dihentikan, flight/velocity/pointer lock dilepas, seleksi mesh dan panel dibersihkan. Pose kamera, elapsedDays, pause/timeScale dan resource solar disimpan di instance yang sama. Solar tidak update saat inactive dan tidak mengejar waktu yang terlewat. Kembali tidak otomatis memulai tur/Follow/flight. Search solar dibangun ulang tanpa pilihan/filter lama. Dialog/popover transient ditutup ketika switch.

Lifecycle saat ini **sinkron** karena kedua mode dibuat dari kode lokal tanpa async activation. Tidak mengklaim implementasi latest-request-wins atau pembatalan async loader mode: bagian itu ditunda hingga Galaxy membutuhkan lazy import/aset async. Callback texture solar inactive tidak boleh menimpa status UI galaxy; guard active menangani event fallback. Solar tetap memakai cache tekstur existing.

### Checklist implementasi tahap ini

- [x] Scene/camera solar dan galaxy terpisah, satu renderer dan satu RAF.
- [x] Lifecycle initialize/activate/deactivate/update/resize/dispose dan unit test transisi/rollback.
- [x] Integrasi solar dipindahkan ke adapter; Galaxy hanya placeholder tanpa visual baru.
- [x] Tombol development, clear selection, input gating, UI sesuai mode dan persistensi instance audio.
- [x] Seluruh 54 regresi browser existing lulus; test mode baru lulus di kedua browser setelah koreksi sinkronisasi assertion resize.
- [ ] Provider katalog/panel galaksi, async activation/cancellation dan budget galaksi: tahap selanjutnya, bukan fitur selesai pada tugas ini.

File baru: ModeController.js, modes/SolarSystemMode.js, modes/GalaxyMode.js, test/modes.test.js, e2e/modes.spec.js. File berubah: main.js, UIController.js, index.html, styles.css, README.md dan dokumen ini. Tidak ada dependency baru, reset atau git commit.

Validasi: **49/49 unit test lulus**. **Production build berhasil**, 39 modul; HTML 14,36 kB, CSS 15,64 kB, aplikasi 108,03 kB (gzip 34,97 kB), Three.js tetap terpisah 499,98 kB (gzip 126,49 kB). Tidak ada warning/error build.

`npm.cmd run test:e2e` menjalankan 56 eksekusi pada Edge 1366×768 dan Chrome 1920×1080: 55 lulus, satu test mode Edge membaca aspect sebelum event resize selesai. Assertion diperbaiki memakai expect.poll tanpa mengubah runtime; `npm.cmd run test:e2e -- e2e/modes.spec.js` kemudian **2/2 lulus**. Jadi seluruh 54 regresi existing dan kedua test mode telah terverifikasi, bukan klaim satu run penuh 56/56 setelah koreksi test. Tidak ada console warning/error aplikasi atau pageerror pada skenario yang lulus; warning NO_COLOR/FORCE_COLOR berasal dari environment runner.

E2E baru memeriksa scene kosong, clear selection, solar time freeze, kamera kembali, resize, input/shortcut, resource count, audio singleton, keluar tur/flight dan pencarian setelah kembali. Pengujian resource singkat bukan bukti bebas leak sesi panjang. Screenshot placeholder juga diperiksa; belum ada visual galaksi yang perlu divalidasi.


## 9. Visual dasar galaksi ? 18 Oktober 2026

- [x] Core, bulge, central bar, empat lengan spiral ilustratif, Local/Orion Spur, disk dan halo sangat halus menggunakan Points + BufferGeometry.
- [x] Seed tetap 512018; posisi, kecerahan, warna dan elevasi deterministik. Tiga ukuran titik per komponen: 21 draw calls, bukan satu Mesh per titik.
- [x] Struktur lengan/spur (phase, inner/outer radius, pitch, lebar dan tinggi) serta jumlah sampel berada di `src/data/galaxyVisual.js`.
- [x] Preset kualitas diteruskan ke mode aktif maupun instance galaksi yang belum diinisialisasi. Mengubah drawRange, tidak membangun ulang buffer.
- [x] Raycast seluruh lapisan dinonaktifkan; tidak menambah selection, landmark, navigasi atau dataset ilmiah. Kontrol kamera existing tidak diubah.
- [x] Geometry/material dan sprite shared dibuang tepat sekali saat dispose. Tidak ada update galaksi atau object allocation tambahan pada animation loop.

| Komponen | Low | Medium | High |
| --- | ---: | ---: | ---: |
| Core | 600 | 1.440 | 2.400 |
| Bulge | 1.500 | 3.600 | 6.000 |
| Bar | 900 | 2.160 | 3.600 |
| Lengan utama | 6.000 | 14.400 | 24.000 |
| Local/Orion Spur | 600 | 1.440 | 2.400 |
| Disk | 2.400 | 5.760 | 9.600 |
| Halo | 600 | 1.440 | 2.400 |
| **Total** | **12.600** | **30.240** | **50.400** |

Semua preset mempertahankan buffer maksimum 50.400 titik: posisi + warna sekitar 1,21 MB sebelum overhead geometry/driver. Low mengurangi kerja render, bukan ukuran buffer resident. Setiap subset tetap berisi seluruh struktur karena drawRange diterapkan per komponen dan ukuran. Tidak ada tekstur eksternal, shader khusus atau dependency baru; sprite radial 16?16 dibuat lokal di memori.

Visual ini representasi edukatif, **bukan hasil fit observasi, peta katalog, atau posisi bintang nyata**. Nama Local/Orion Spur merupakan label komponen ilustrasi; phase/pitch/ukuran model bukan klaim nilai astronomi. Parameter berada dalam unit model galaksi terpisah dari skala solar. Sumbu Y adalah tinggi, disk pada XZ; konvensi sumber ilmiah dan konversi kpc tetap belum diimplementasikan. Data primer tetap perlu diverifikasi pada P5-04 sebelum landmark ilmiah ditambahkan.

Core/bulge/bar menggunakan distribusi Gaussian terbatas dengan sumbu berbeda; lengan memakai spiral logarithmic berlebar/elevasi bervariasi; disk lebih padat ke pusat; halo tiga dimensi sangat redup. Warna hangat pusat dan biru-putih lengan bersifat ilustratif. Panel placeholder diperkecil dan dipindah ke pojok agar tidak menutupi galaksi serta menampilkan batas interpretasi.

Validasi: **51/51 unit test lulus**, termasuk seeded buffers, finite coordinates, distribusi pipih, non-pickability, hitungan preset, reuse dan disposal. **Production build berhasil**, 41 modul; aplikasi 110,94 kB (gzip 36,01 kB), Three.js terpisah 499,98 kB. **2/2 E2E mode lulus** pada Edge/Chrome tanpa warning/error console aplikasi; seluruh suite E2E tidak diulang. Ketiga jumlah preset diperiksa di browser dan screenshot disimpan di test-results (diabaikan Git). Profiling GPU lintas perangkat/sesi panjang belum dilakukan; tidak mengklaim FPS tertentu.

File baru: `src/core/GalaxyScene.js`, `src/data/galaxyVisual.js`, `test/galaxyScene.test.js`. File berubah: GalaxyMode.js, main.js (routing kualitas/diagnostic), index.html/styles.css (catatan edukatif), e2e/modes.spec.js (expectation visual), README dan dokumen ini. Tidak ada perubahan orbit, material solar, data ilmiah atau git commit.

P5-06 visual dasar telah diterapkan; pengukuran budget lintas GPU masih terbuka. P5-03/04/07 (provider, verifikasi data dan landmark) tetap belum selesai dan tidak dibuat pada tugas ini.


## 10. Kamera Galaxy Mode ? 18 Oktober 2026

- [x] Orbit strategis dengan target preset, zoom 0,4?60 unit terhadap target; pan dimatikan agar target tidak hanyut. Tidak mengubah orbit controls solar.
- [x] GalaxyCameraControls terpisah, memakai velocity damping dan pointer lock; WASD, Space/Ctrl, Shift boost 3?, scroll pengali kecepatan 0,25?4?. Tidak mengubah FlightControls.js Tata Surya.
- [x] Kecepatan dasar adaptif `min(32, (0.4 + min(distance, 80) * 0.18) * multiplier)` unit model/detik sebelum boost. Jarak mengacu pusat galaksi, bukan posisi planet atau AU.
- [x] Kamera dibatasi bola radius 80 unit dari pusat model, baik flight maupun orbit; velocity dihentikan di batas. Ini batas navigasi, bukan collision dengan titik/bintang.
- [x] Tombol Free Flight/Kembali ke orbit, Reset view, Top view, Angled overview, Galactic center dan Solar System region. Semua native button dengan title/aria-label dan fokus existing.
- [x] Preset posisi/target berada di galaxyCameraMath.js. Posisi region solar `[8,0,0]` adalah pilihan framing ilustratif, **bukan koordinat astronomis terverifikasi**; UI memberi penjelasan. Tidak membuat landmark/objek selectable atau guided tour.
- [x] Transisi smootherstep dan quaternion slerp selama 1,4 detik; reduced motion 150 ms termasuk perubahan preferensi saat transisi berlangsung. Escape, drag atau scroll membatalkan; free-flight mengambil alih dari pose saat ini.
- [x] Escape/pointer unlock mengembalikan mode orbit tanpa reset posisi; Reset kembali `[0,20,30]` menuju pusat. Tab tersembunyi keluar flight/cancel tween, kehilangan fokus mereset gerakan. Penolakan pointer lock ditangkap dengan status dan fallback orbit.
- [x] Deactivate membatalkan tween, melepas pointer lock dan mereset input. Listener dibuat sekali per instance dan dilepas saat dispose. Scratch vector/quaternion digunakan ulang pada update; tidak ada renderer/RAF baru.

File baru: `src/core/GalaxyCameraControls.js`, `src/core/galaxyCameraMath.js`, `test/galaxyCamera.test.js`, `e2e/galaxyCamera.spec.js`. File berubah: GalaxyMode.js, main.js (diagnostic development), index.html/styles.css (kontrol kamera), README dan dokumen ini. Visual galaksi, data solar, solver orbit, kamera solar, audio dan tur tidak diubah. Tidak ada git commit.

Verifikasi: **53/53 unit test lulus**; helper diuji untuk monotonic adaptive speed, clamp pengali, input nonfinite, batas radius dan preset finite. **Production build berhasil**, 43 modul; aplikasi 116,66 kB (gzip 37,49 kB), Three.js tetap terpisah 499,98 kB. **4/4 E2E targeted lulus** (galaxyCamera dan modes) pada Edge 1366?768/Chrome 1920?1080 dalam 44 detik, tanpa console warning/error aplikasi atau pageerror. Seluruh suite E2E tidak diulang. Cakupan mencakup preset, Escape, pointer lock/gerak, scroll, reset/reduced motion dan isolasi solar; unit test memeriksa batas matematis.

Manual: masuk Galaxy, pilih keempat preset lalu batalkan satu transisi dengan Escape. Mulai Free Flight, WASD/mouse dan scroll, lalu Escape; Reset harus kembali ke overview. Pilih preset region solar untuk framing ilustratif. Kembali Tata Surya harus mempertahankan kecepatan kontrol solar. Uji reduced motion melalui preferensi sistem. Tidak mengklaim posisi preset sebagai hasil observasi atau navigasi fisik.

## 11. Dataset struktur dan landmark � 18 Oktober 2026

- [x] 13 ID unik: Galactic Center/Sgr A*, Solar System, Local/Orion Spur, Scutum�Centaurus, Perseus, Sagittarius, Norma, Alpha Centauri, Sirius, Betelgeuse, Pleiades, Orion Nebula, Crab Nebula.
- [x] Dataset terpisah `src/data/galaxyLandmarks.js`: nama, alias, kategori, deskripsi, posisi model dengan `approximate: true`, data jarak jika relevan dan URL sumber/tanggal akses.
- [x] Metadata posisi dan data ilmiah dipisahkan. Semua posisi adalah layout skematis XZ/Y, bukan koordinat galaktosentris terukur. Tidak ada konversi unit model ke kpc. Objek lokal sengaja direnggangkan; jarak maupun arah antarmarker tidak dapat diukur sebagai data fisik.
- [x] Marker sprite 10 CSS px dengan proxy raycast 24 px, highlight terpilih, panel informasi bersumber, serta daftar tombol native untuk keyboard. Partikel dekoratif tetap tidak selectable. Klik saat drag/free-flight/cinematic diabaikan.
- [x] Panel ditutup dengan tombol/Escape, fokus kembali ke pemicu; deactivate membersihkan selection/panel. Listener dilepas dan texture/material milik modul di-dispose. Geometry Sprite shared bawaan Three.js tidak dimusnahkan oleh modul.
- [x] Update memakai scratch vector; tidak membuat objek setiap frame. Tidak menambah RAF, renderer atau mengubah kamera/orbit solar.
- [x] Unit test ID/kategori/data wajib/finite posisi, ukuran proxy, selection dan disposal.
- [ ] Search, guided tour, aksi marker menuju mode solar, transform astrometri dan katalog lebih rinci tetap tugas berikutnya. P5-04/P5-07 baru sebagian selesai; checklist gabungan sebelumnya tidak ditandai penuh.

Sumber primer: [struktur Spitzer NASA](https://science.nasa.gov/resource/the-milky-way-galaxy/), [Sgr A*](https://www.nasa.gov/image-article/supermassive-black-hole-sagittarius/), [Alpha Centauri](https://science.nasa.gov/mission/webb/science-overview/science-explainers/what-is-the-center-of-our-galaxy-like/), [Sirius](https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/), [Betelgeuse](https://science.nasa.gov/universe/what-is-betelgeuse-inside-the-strange-volatile-star/), [M45](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45/), [M42](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-42/), [Crab](https://science.nasa.gov/asset/hubble/crab-nebula-3/). Diakses 18 Oktober 2026. Deskripsi merupakan ringkasan; tidak mengunduh aset gambar/katalog. Sumber mendukung fakta, bukan koordinat layout. Nilai jarak dibulatkan dan mengikuti sumber yang ditautkan; estimasi lain dapat berbeda. Empat label lengan tidak berarti empat lengan sama dominan: model Spitzer membedakan dua utama dan dua lebih kecil; struktur masih diteliti. Visual spiral existing tidak diubah menjadi fit ilmiah.

Verifikasi: **55/55 unit test lulus**, production build berhasil (46 modul; aplikasi 125,26 kB/gzip 40,44 kB; Three.js tetap bundle terpisah 499,98 kB). Browser targeted memeriksa raycast pusat, panel/sumber, keyboard, restore fokus, switch mode dan resource stability. Tidak mengklaim pengujian seluruh suite browser atau profiling GPU sesi panjang.

Manual: buka Galaxy, klik titik biru (pusat membuka Galactic Center), baca catatan posisi dan tautan sumber. Buka daftar Landmark lalu Tab/Enter pada Sirius; Escape menutup panel dan mengembalikan fokus. Zoom/pilih preset untuk memeriksa marker tidak membesar berlebihan; kembali Tata Surya dan masuk Galaxy lagi harus membersihkan pilihan.

Hasil browser: kedua test landmark lulus pada Edge 1366×768 dan Chrome 1920×1080 tanpa console warning/error aplikasi. Regresi mode awal lulus di Edge tetapi gagal di Chrome karena assertion koordinat identik (selisih floating point sekitar 1e-14). Assertion diubah menjadi toleransi 10 digit; rerun regresi mode **2/2 lulus**. Total dua skenario pada dua browser terverifikasi, bukan klaim satu run penuh 4/4 setelah perbaikan. Warning NO_COLOR/FORCE_COLOR berasal dari runner, bukan aplikasi.

File baru: src/data/galaxyLandmarks.js, src/core/GalaxyLandmarks.js, src/ui/GalaxyLandmarkPanel.js, test/galaxyLandmarks.test.js, e2e/galaxyLandmarks.spec.js. File diubah: src/modes/GalaxyMode.js, index.html, src/styles.css, e2e/modes.spec.js, README.md dan dokumen ini. Tidak ada git commit.

## 12. Transisi antar-mode - 18 Oktober 2026

- [x] Tombol View Milky Way dari Tata Surya dan Enter Solar System pada panel marker Solar System; tombol mode global tetap dapat dipakai kembali.
- [x] ModeTransition dengan state preparing/out/in/idle, driven oleh RAF existing. Request berulang diabaikan selama transisi; scene/renderer/listener dipakai ulang.
- [x] Initialize, resize dan compile tujuan selesai sebelum sumber dinonaktifkan. Scene ditukar pada fade gelap penuh; kegagalan persiapan/aktivasi memulihkan input dan mode sebelumnya.
- [x] Fade UI dan curtain, dengan easing kamera tampilan lokal: mundur 8 unit solar / 2 unit galaxy, mendekat di scene tujuan. Kamera tampilan adalah salinan sehingga pose kamera pengguna dipertahankan. Tidak menginterpolasi koordinat solar ke galaksi.
- [x] Durasi 650 ms keluar + 650 ms masuk. Reduced motion 80 ms per bagian tanpa gerakan kamera, termasuk perubahan preferensi selama transisi.
- [x] Input capture guard sebelum shortcut UI dan inert sementara. Skip tetap bisa diakses keyboard. Fokus kembali ke tombol mode; Skip bekerja pada kedua bagian transisi.
- [x] Tur/follow/selection/flight dihentikan melalui lifecycle existing; waktu simulasi berhenti selama transisi. Audio singleton tidak diganti. Kontrol solar kembali aktif sesudah masuk.
- [x] Disposal melepas listener, overlay dan inert; tidak ada timer animasi/RAF tambahan. Resize memperbarui aspect kamera tampilan.
- [x] Unit test readiness sebelum activation, midpoint, reduced duration, skip, repeated request, reuse, rollback dan disposal.
- [ ] Search, tur galaksi dan koordinat astrometri tetap ditunda. P5-07 masih parsial walaupun aksi marker menuju solar kini selesai.

Validasi: 58/58 unit test lulus; production build berhasil (47 modul; aplikasi 128,91 kB/gzip 41,67 kB; Three.js terpisah 499,98 kB). Profiling GPU/sesi panjang bukan cakupan tugas ini.

File baru: src/core/ModeTransition.js, test/modeTransition.test.js, e2e/modeTransition.spec.js. Integrasi: main.js, GalaxyMode.js, GalaxyLandmarkPanel.js, index.html/styles.css. Tes browser mode/kamera/landmark menunggu transisi sebelum assertion. README dan dokumen ini diperbarui. Encoding campuran pada dokumen progress dinormalisasi ke UTF-8 tanpa menghapus isi. Tidak ada git commit.

Manual: klik View Milky Way, coba Skip dengan Tab/Enter; pilih marker Solar System lalu Enter Solar System. Ulangi dengan transisi penuh dan reduced motion. Sesudah kembali, coba search, Visit, Follow, time controls, tur dan flight. Resize saat fade; H/P/W tidak boleh mengendalikan aplikasi selama overlay aktif.

Browser: 8/8 skenario targeted lulus pada Edge 1366x768 dan Chrome 1920x1080 (kamera galaksi, landmark, regresi mode dan transisi baru), tanpa console warning/error aplikasi. Pengujian mencakup Skip, marker entry, reduced motion, request berulang, isolasi input, pose/resources/audio serta kontrol solar setelah kembali. Seluruh suite browser tidak dijalankan ulang. Warning NO_COLOR/FORCE_COLOR berasal dari environment runner.
Catatan runner Windows: seluruh delapan test sudah melaporkan ok, tetapi proses tetap menunggu saat teardown dev server; proses runner dihentikan setelah hasil test selesai. Karena itu hasil browser merujuk laporan per-test, bukan exit code sukses keseluruhan runner.

## 13. Search, selection dan informasi galaksi - 19 Oktober 2026

- [x] Search memahami mode aktif. Galaxy mencari nama, ID, alias dan kategori dalam katalog 13 landmark. Query solar tanpa hasil lokal dan tidak kosong menawarkan hasil galaksi berlabel Milky Way; katalog tidak digabung sehingga tidak menampilkan duplikat lintas-mode.
- [x] Enam optgroup: Galactic Center, Galactic Structure, Star System, Star, Nebula, Star Cluster. Solar System, Alpha Centauri dan Sirius dikelompokkan sebagai Star System pada presentation mapping; dataset sumber tidak diubah.
- [x] Enter memilih hasil pertama; ArrowDown/Tab menuju native select. Escape menyembunyikan hasil atau menutup panel; panel mengembalikan fokus ke pemicu. Empty state menjelaskan hasil tidak ditemukan.
- [x] Pemilihan hasil galaksi dari solar menunggu transisi mode selesai (termasuk Skip), lalu memakai tween preset existing untuk framing lokal landmark, memilih marker dan membuka panel. Tidak mengubah generator atau GalaxyCameraControls; tidak ada kamera/RAF baru.
- [x] Panel menampilkan nama, kategori, alias, deskripsi, jarak bersumber, koordinat model X/Y/Z, approximate, sumber dan breadcrumb Milky Way > Region > Object. Wilayah lokal/disk diberi label skematis; tidak diklaim sebagai lokasi astrometri terverifikasi. Field kosong ditampilkan dengan keterangan data belum tersedia/tidak berlaku.
- [x] P5-07 selesai untuk katalog ilustratif yang tersedia; pencarian dan panel solar tetap terpisah. P5-03 audit keseluruhan capability/favorit serta P5-08 suite penuh masih terbuka.
- [x] Unit test alias/case/whitespace, kategori, ID tanpa duplikat, isolasi mode/fallback, formatter jarak/posisi/missing value/breadcrumb.

Validasi: 61/61 unit test lulus; production build berhasil (48 modul, aplikasi sekitar 131,66 kB/gzip 42,43 kB; Three.js terpisah 499,98 kB). Empat skenario browser search/landmark melaporkan lulus pada Edge 1366x768 dan Chrome 1920x1080 tanpa warning/error console aplikasi. Tidak mengklaim seluruh suite E2E telah diulang.

File baru: src/data/galaxySearch.js, test/galaxySearch.test.js, e2e/galaxySearch.spec.js. Perubahan: UIController.js, GalaxyLandmarkPanel.js, GalaxyMode.js, main.js, index.html, assertion E2E modes/landmarks, README dan dokumen ini. Tidak ada git commit.

Manual: dari Tata Surya cari Sirius, tekan Enter, tunggu/Skip transisi; marker dan panel Sirius harus tampil dengan kamera terarah. Di Galaxy cari M42 atau Seven Sisters, gunakan Enter atau ArrowDown/native select. Coba query kosong dan tidak cocok; Escape menutup hasil/panel. Kembali ke Tata Surya lalu cari earth untuk memastikan panel Bumi tetap bekerja. Search/tur katalog besar dan koordinat astrometri bukan cakupan tugas ini.

Regresi pergantian mode tambahan: 2/2 lulus (exit code 0) pada Edge/Chrome, termasuk time/input isolation, resource stability, audio singleton, tur/flight dan pencarian solar setelah kembali. Total enam eksekusi browser targeted melaporkan lulus. Runner search/landmark pertama tetap menunggu teardown dev server sesudah empat hasil ok dan dihentikan; tidak dilaporkan sebagai exit code sukses runner. Warning NO_COLOR/FORCE_COLOR berasal dari environment, bukan aplikasi.

## 14. Guided tour Galaxy Mode - 19 Oktober 2026

- [x] Konfigurasi terpisah src/data/galaxyTour.js: overview, disk/halo, Galactic Center, central bar, spiral arms, Local Spur, Solar System, Alpha Centauri, Orion Nebula, kembali overview. Tahap landmark berisi dua stop sehingga total 10 stop.
- [x] Setiap stop memiliki ID, judul, penjelasan singkat, preset/posisi kamera atau ID landmark dan durasi baca 12 detik. Timer dimulai setelah tween selesai, berhenti saat pause/tab tersembunyi. Stop terakhir menutup tur setelah waktu baca.
- [x] Tombol Guided Tour dan shortcut G mengikuti mode aktif. Kontrol native Previous, Next, Pause/Resume, Exit dengan indikator progres. Escape membatalkan, termasuk saat cinematic mode menyembunyikan UI.
- [x] GalaxyTour memakai tween GalaxyCameraControls existing (smootherstep/quaternion), bukan controller/RAF baru. Reduced motion mengikuti durasi 150 ms existing, termasuk perubahan preferensi saat tween berjalan.
- [x] Pause membatalkan tween di pose saat ini dan menghentikan timer; Resume mengarahkan kembali ke stop yang sama dari pose saat ini. Next/Previous ketika paused mengganti narasi tanpa menjalankan kamera sampai Resume.
- [x] Free-flight dinonaktifkan saat kamera tur bergerak. Saat berhenti, pengguna dapat mengambil alih melalui flight, preset, drag/scroll, pencarian atau klik marker; tur berakhir. Exit memulihkan kontrol orbit tanpa memaksa pointer lock.
- [x] Pergantian mode menutup tur dan selection, listener dibuat sekali serta dilepas saat dispose. Scratch/tween kamera existing dipakai ulang; DOM status diperbarui hanya ketika state berubah.
- [x] Narasi menjelaskan bahwa visual/posisi bersifat skematis. Sumber konteks struktur tercantum di konfigurasi; fakta landmark tetap merujuk katalog bersumber. Tidak ada voice-over atau perubahan sistem audio.
- [x] Unit test memvalidasi urutan, ID unik, ID landmark, preset, posisi finite dan durasi baca.

Validasi: 62/62 unit test lulus; production build berhasil (50 modul; aplikasi 138,69 kB/gzip 44,28 kB; Three.js tetap terpisah 499,98 kB). Pengujian browser targeted mencakup navigasi seluruh stop, pause/resume, Escape, exit, reduced motion, switch mode dan tur solar. Tidak menjalankan seluruh suite browser atau profiling sesi panjang.

File baru: src/data/galaxyTour.js, src/ui/GalaxyTour.js, test/galaxyTour.test.js, e2e/galaxyTour.spec.js. Perubahan integrasi: GalaxyMode.js, UIController.js, main.js, styles.css, README dan dokumen ini. Tidak mengubah generator galaksi, dataset landmark, solver orbit, atau menambahkan audio/library. Tidak ada git commit.

Manual: masuk Galaxy lalu Guided Tour/G. Coba Next/Previous, Pause saat kamera bergerak, Resume, dan Escape. Tunggu satu stop untuk melihat auto-advance. Coba reduced motion, sembunyikan HUD dengan H lalu Escape, serta kembali ke Tata Surya saat tur berlangsung. Tur Tata Surya tetap memakai konfigurasi sebelumnya.
Hasil browser final: 2/2 lulus dengan exit code 0 di Edge 1366x768 dan Chrome 1920x1080, termasuk Escape saat HUD tersembunyi. Tidak ada console warning/error aplikasi; warning NO_COLOR/FORCE_COLOR berasal dari runner. Run awal juga melaporkan kedua test lulus tetapi tertahan saat teardown server; run final memakai server tersebut dan selesai normal.

## 15. Performa Galaxy Mode - 19 Oktober 2026

- [x] Audit scene: 21 Points layers dan 13 marker Sprite dengan proxy raycast. Overview memakai 34 draw calls dan 26 triangles; partikel diproses sebagai points, bukan sphere mesh.
- [x] Tiga ukuran PointsMaterial kini shared antar tujuh komponen: material partikel berkurang dari 21 menjadi 3 tanpa mengubah seeded buffers/warna/ukuran. Total resource material milik galaksi 6 (3 points + normal/selected/hit Sprite). Statistik traversal menghitung 5 saat tidak ada selection, 6 ketika selected material terpasang.
- [x] 21 geometry partikel + 1 Sprite geometry shared Three.js = 22 geometry pada scene galaksi. Attribute/index buffers sekitar 1.209.692 byte (1,21 MB), bukan total VRAM. Sprite geometry shared engine tidak di-dispose per marker.
- [x] Low 12.600, Medium 30.240, High 50.400 points melalui drawRange. Buffer maksimum tetap resident untuk menghindari rebuild saat kualitas berubah. DPR maksimum .85 / 1.25 / 1.75 tetap mengikuti preset proyek.
- [x] Frustum culling per layer memakai bounding sphere yang sudah dihitung sekali. Transform lokal Points statis tidak dihitung ulang setiap frame. Tidak memakai culling CPU per titik; bounds seluruh layer konservatif saat kamera di dalam disk.
- [x] Ukuran marker/hit proxy dihitung ulang hanya ketika view matrix, FOV atau tinggi viewport berubah. Selection dan resize tetap memakai objek/buffer yang sama. Tidak menambah Vector3/Color/array per frame pada jalur baru.
- [x] ModeController hanya meng-update mode aktif. Tambahan guard GalaxyMode menolak update saat inactive; solar orbit/time/detail tidak berjalan ketika Galaxy aktif. Main loop melewati update dan render saat document.hidden tanpa menambah RAF.
- [x] Resource scene inactive sengaja dipertahankan untuk transisi ulang; tidak dibangun/dibuang setiap switch. Saat teardown, geometry/material/texture milik modul di-dispose satu kali; unit test diperbarui untuk shared materials. Resize hanya mengubah proyeksi/ukuran renderer, bukan rebuild galaksi.
- [x] Development URL /?debug menampilkan FPS, draw calls, triangles, submitted/configured points, geometry dan attached material. Statistik sampling sekitar 1 Hz; traversal/Set alokasi hanya saat debug atau diagnostic manual, bukan render normal. Statistik tidak tampil tanpa query dan tidak diaktifkan pada build production.

Bottleneck tersisa: transparent additive overdraw di pusat/disk, resolusi/DPR, 21 draw calls partikel ditambah 13 marker, serta buffer maksimum resident pada Low. Sharing material mengurangi jumlah resource, bukan jumlah draw call. Belum mengklaim peningkatan FPS tertentu atau bebas leak sesi panjang tanpa profil GPU/heap lintas perangkat. Mode solar yang sudah diinisialisasi tetap menyimpan geometry/texture; resident renderer counters mencakup kedua mode, bukan kebocoran otomatis.

Validasi akhir: 63/63 unit test lulus; production build berhasil (51 modul; aplikasi 139,10 kB/gzip 44,39 kB; Three.js terpisah 499,99 kB). Test baru memeriksa marker cache invalidation, bounds/static transforms dan shared disposal. Tes browser memeriksa preset, resize tanpa rebuild, solar time freeze, selection, debug gating, dan regresi search/transisi.

File baru: src/core/renderStats.js, e2e/galaxyPerformance.spec.js. File berubah: GalaxyScene.js, GalaxyLandmarks.js, GalaxyMode.js, main.js, test/galaxyScene.test.js dan dokumen ini. Tidak ada git commit.

Manual: jalankan npm run dev, buka /?debug, masuk Galaxy; ubah kualitas dari Tata Surya lalu masuk kembali. Periksa jumlah points, resize, klik marker dan pencarian landmark. Buka URL tanpa query untuk memastikan statistik tidak muncul. FPS bergantung perangkat dan posisi kamera; jumlah points adalah sampel visual, bukan bintang katalog.
Browser final: test performa 2/2 lulus dengan exit code 0 pada Edge 1366x768 dan Chrome 1920x1080. Ketiga preset mencatat 34 calls/26 triangles, 22 geometry, 5 attached material dan 1.209.692 byte buffers; resident renderer 92 geometry/20 texture pada sesi ini mencakup solar cache. Search/transisi 2/2 juga melaporkan lulus tanpa console error/warning aplikasi. Assertion awal audit dikoreksi karena material selected belum attached dan urutan siklus kualitas existing adalah Medium-Low-High; tidak mengubah runtime untuk menyesuaikan tes. Runner awal tertahan saat teardown setelah hasil selesai dan dihentikan; run performa final selesai normal. Tidak menjalankan seluruh suite E2E.

## 16. Layout Guided Tour Galaxy - 19 Oktober 2026

- [x] Panel dipindahkan ke bawah-tengah desktop, bottom max(18px, safe-area), width min(600px, 100vw - 380px). Ruang horizontal disisakan untuk Enter Solar System dan Cinematic Mode di sudut.
- [x] Padding 12x16px, judul 17px, deskripsi 13px, tinggi mengikuti isi dengan maksimum min(260px, 32dvh) dan internal scroll. Background navy alpha .78 + backdrop blur 12px mempertahankan kontras.
- [x] Progress, judul, deskripsi dan kontrol Previous/Pause/Next/Exit tetap berurutan; kontrol normal dalam satu baris. Panel hanya menerima pointer pada footprint sendiri, tanpa wrapper fullscreen yang memblokir canvas.
- [x] Saat tween kamera existing aktif, UI otomatis collapsed: progress/judul, minimize dan Exit tetap tersedia; deskripsi serta navigasi disembunyikan. Tidak menambahkan Skip karena kontrol tersebut belum tersedia pada tur; tidak mengubah navigasi kamera.
- [x] Setelah tween selesai, deskripsi kembali dengan fade ringan 160ms kecuali pengguna memilih Minimize. Pill manual (maksimum 540px desktop) berisi progress, judul dan Expand; tur/timer/kamera terus berjalan. Expand saat kamera bergerak menunggu kamera tiba sebelum menampilkan deskripsi. Escape tetap keluar.
- [x] Judul/deskripsi aria-live polite, semua tombol memiliki title/aria-label; aria-expanded/controls pada minimize. Fokus dipindah hanya jika tombol yang sedang fokus akan disembunyikan. Tidak ada focus trap.
- [x] Di bawah 900px, panel menjadi compact bottom sheet: width min(600px, 100vw - 24px), bottom minimal 82px agar tombol sudut tetap tersedia, maksimum min(220px, 29dvh); kontrol boleh wrap. Reduced motion mematikan animasi deskripsi.
- [x] Data/urutan/durasi tur, renderer, sistem kamera dan logika next/previous/pause/resume tidak diubah.

Validasi: npm test 63/63 lulus; npm run build berhasil (51 modul; aplikasi 140,49 kB/gzip 44,74 kB). Tes browser layout dan regresi tur memeriksa collapse selama tween, minimize keyboard, expand, Escape, reduced motion, posisi panel terhadap pusat/left panel/tombol sudut pada desktop serta ukuran compact 390x844.

File task ini: src/ui/GalaxyTour.js, src/styles.css, e2e/galaxyTourLayout.spec.js dan docs/phase-5-progress.md. Tidak ada git commit. Perubahan performa sebelumnya tidak dihapus/reset.
Hasil browser: 4/4 test melaporkan lulus pada Edge 1366x768 dan Chrome 1920x1080, termasuk resize ke 390x844, tanpa console warning/error aplikasi. Runner Windows tertahan saat teardown server setelah hasil selesai dan dihentikan; bukan klaim exit code sukses runner. Warning NO_COLOR/FORCE_COLOR berasal dari environment.

## 17. Finalisasi Phase 5 - 19 Oktober 2026

Cakupan fungsional Phase 5 selesai untuk peta edukatif skematis. Tidak menambah fitur besar, deploy, atau git commit. Bagian 1-16 tetap catatan historis; hasil di bagian ini mengungguli angka verifikasi sebelumnya.

Audit integrasi mencakup dua scene/lifecycle, partikel seeded, kamera/preset/free-flight, 13 landmark, raycast/search/panel, transisi masuk/keluar solar, guided tour, kualitas dan layout ringkas. Satu renderer dan satu RAF dimiliki main; hanya mode aktif di-update. Listener mode dibuat sekali saat initialize dan dicabut pada dispose. Scene inactive sengaja di-cache untuk digunakan kembali, bukan di-dispose tiap switch. Geometry/material/texture milik modul mempunyai disposal teruji; Sprite geometry shared engine tidak dibuang oleh marker individual. UI/audio global adalah singleton sepanjang umur halaman.

Temuan dan perbaikan:
- Enter pada search dapat memindahkan fokus ke tombol Tutup lalu memicu aksi bawaan tombol itu, sehingga panel Galaxy langsung tertutup. Ditambahkan preventDefault pada Enter input/select; regresi diperluas untuk Enter ketika Galaxy sudah aktif. Terlihat pada smoke production dan telah diperbaiki tanpa mengubah kamera/data.
- Launcher E2E Windows sebelumnya tertahan ketika menutup proses server. scripts/test-browser.mjs kini memiliki instance Vite sendiri, menjalankan Playwright tanpa shell npm child-server, dan menutup server melalui finally. Konfigurasi menerima URL server dari launcher; pemanggilan langsung Playwright masih memiliki fallback webServer.

Verifikasi teknis: npm test 63/63 lulus; npm run build berhasil (51 modul; aplikasi 140,53 kB/gzip 44,75 kB; Three.js terpisah 499,99 kB). Smoke preview production lulus: boot, switch, search Enter Sirius, panel, tur/Exit, kembali solar/Bumi; diagnostic __observer dan debug HUD tidak tersedia pada production walaupun URL memakai ?debug. Node lokal 22.20.0.

Seluruh 70 skenario E2E dijalankan pada Edge 1366x768 dan Chrome 1920x1080: 69 lulus, satu assertion perbandingan gagal hanya karena roundoff kamera sekitar 1e-14. Assertion kamera/target kemudian memakai toleransi 10 desimal; selection, waktu, resource dan status tur tetap dibandingkan persis. Pengulangan seluruh exploration.spec.js lulus 6/6 dengan exit code 0 pada kedua browser. Jadi seluruh skenario telah terverifikasi melalui full run dan targeted rerun, bukan klaim satu full run 70/70. Launcher selesai normal. Tidak ditemukan console warning/error dari aplikasi pada skenario yang lulus; warning NO_COLOR/FORCE_COLOR berasal dari environment runner.

Pemeriksaan tambahan: switch ke Galaxy saat texture Bumi masih pending, kemudian respons gambar invalid, tidak mengganggu mode/pencarian dan tidak memunculkan error. Inspeksi visual stop Central Bar pada 1366x768 menunjukkan pusat galaksi tetap terbuka dengan panel tur di bawah. Tes mencakup keyboard, reduced motion, fullscreen/resize, fallback texture, storage rusak, free-flight, bookmark, comparison dan time controls. Pemindaian API lama outputEncoding/sRGBEncoding/useLegacyLights/physicallyCorrectLights/GammaEncoding tidak menemukan penggunaan di src (Three.js 0.180.0).

Performa dan resource: scripts/audit-phase5.mjs menjalankan 30 siklus bolak-balik pada masing-masing Edge/Chrome dengan tur/search/selection di setiap siklus. Setelah dua siklus pemanasan: 1 pending RAF, 168 JS event listener, renderer resident 92 geometry/20 texture tetap stabil. Resource resident mencakup cache dua mode. Scene Galaxy memakai 22 geometry; 5 material attached tanpa highlight, 6 bila highlight terpasang. Overview semua marker terlihat: 34 calls/26 triangles; view dekat Sirius pada audit: 29 calls/16 triangles karena culling. Point budget Low/Medium/High 12.600/30.240/50.400, buffer sekitar 1,21 MB. Heap sesudah GC naik dari sekitar 8,41 ke 8,93 MB (Edge), 8,43 ke 9,04 MB (Chrome); bukan bukti bebas leak dan belum diatribusikan ke retained objects/JIT. Tidak terlihat pertumbuhan listener/GPU resource/RAF. Tidak mengklaim target FPS lintas perangkat.

Hasil mentah: docs/benchmarks/phase-5-finalization.json (versi browser, tiap sampel heap/DOM/listener/resource/RAF dan production smoke). Profiling ini singkat, bukan sesi berjam-jam atau seluruh jenis GPU.

DOM counter audit dengan input browser naik sekitar satu node per siklus (1239 ke 1266 setelah pemanasan). Kontrol diagnostik 12 siklus Chrome dengan pengisian value dan dispatch input/keydown, tanpa native editing Playwright fill, menghasilkan 1232 node konstan. Ini mempersempit penyelidikan ke jalur editing/automation tetapi belum membuktikan penyebab retained heap. Tetap ditunda untuk analisis heap jangka panjang, bukan disembunyikan sebagai hasil bebas leak.

Keterbatasan ilmiah sudah tampil pada panel mode, panel landmark dan tur: struktur/skala disederhanakan, partikel adalah sampel visual bukan katalog bintang lengkap, posisi model bukan astrometri. Tata Surya dan galaksi tidak berbagi skala fisik; jarak visual dipadatkan/disederhanakan dan marker lokal direnggangkan untuk keterbacaan. Data jarak ilmiah dan sumber dipisahkan dari posisi display.

Phase 6 / pekerjaan yang sengaja ditunda:
- Async mode import/asset cancellation jika katalog eksternal kelak diperlukan; konten galaksi sekarang lokal dan sinkron.
- Katalog observasional/transform koordinat terverifikasi, ketidakpastian dan pemetaan lengan lebih akurat.
- Heap snapshots dan soak test panjang, profiling GPU rendah/menengah/tinggi, optimasi overdraw/buffer resident bila diperlukan.
- Favorit/perbandingan lintas-mode dan mobile penuh; fitur tersebut tetap solar-only/desktop-first sekarang.
- Uji deployment Vercel nyata, CDN, jaringan lambat dan kompatibilitas Safari/mobile di lingkungan target.

Kesiapan rilis: kode/build siap untuk staging desktop berbasis WebGL2. vercel.json sudah memilih vite, build npm run build, output dist; tidak perlu backend/secret atau route per-mode. Build preview lokal teruji, tetapi tidak ada deployment Vercel/domain/CDN pada tugas ini. Sebelum publikasi, sumber/lisensi MP3 12,55 MB yang sudah ada tetap perlu diselesaikan (public/audio/README.md); tidak dihapus atau diunduh ulang. Lisensi aset belum dianggap terverifikasi hanya karena build berhasil. Sumber dukungan platform: https://vercel.com/docs/frameworks/frontend/vite .

File finalisasi: src/ui/UIController.js, e2e/galaxySearch.spec.js, e2e/exploration.spec.js, package.json, playwright.config.js, scripts/test-browser.mjs, scripts/audit-phase5.mjs, docs/benchmarks/phase-5-finalization.json, README.md dan dokumen ini.
