# Phase 5 — Interactive Milky Way Map

Tanggal audit: 17 Oktober 2026 (Asia/Jakarta). Baseline Git: `7e6e951`.
Status: **arsitektur dua mode sudah diimplementasikan; Galaxy Mode masih scene kosong dengan placeholder**. Bagian 1–7 adalah baseline/rancangan awal; hasil implementasi terbaru ada di bagian 8.

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
- [ ] P5-03: provider UI/search/detail serta capability solar; audit shortcut/dialog/fokus, pertahankan favorit lama. Validasi semua fitur solar tetap tersedia.
- [ ] P5-04: verifikasi sumber/lisensi katalog dan konvensi koordinat; tulis helper murni beserta test finite, unit, sumbu, handedness, ID unik dan pemisahan science/visual.
- [x] P5-05a: GalaxyMode kosong dengan scene/kamera sendiri, selector mode, lazy initialize sinkron dan rollback; pengujian switch/state/waktu/audio tersedia (bagian 8).
- [ ] P5-05b: lazy activation async dan pemulihan kegagalan aset galaksi; menunggu kebutuhan dataset/visual.
- [ ] P5-06: visual peta seeded yang ringan dan budget Low/Medium/High; model disk/struktur hanya setelah data/parameter ilustratif dijelaskan. Particle dekoratif non-pickable.
- [ ] P5-07: marker terpilih, pencarian dataset galaksi, panel bersumber dan aksi marker Tata Surya untuk kembali ke mode solar-system. Framing/camera limits galaksi terpisah.
- [ ] P5-08: E2E dua viewport, resize/fullscreen, reduced motion, keyboard, mode switch saat tur/flight/texture pending, search/filter isolation, error/fallback, kualitas dan timeline audio. Ulang seluruh suite unit/build/E2E.
- [ ] P5-09: profil switch berulang dan sesi panjang, resource/heap/draw calls, audit visual/perangkat; dokumentasikan batas dan finalisasi README/progres.

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
