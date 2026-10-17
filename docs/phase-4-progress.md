# Phase 4 — Scientific & Cinematic Polish

Tanggal audit: 14 Oktober 2026 (Asia/Jakarta). Baseline Git: `f694554`.
Status: **Phase 4 selesai untuk cakupan implementasi dan regresi desktop yang diuji; siap menjadi baseline Phase 5**. Baseline audit di bagian 1–6 merupakan riwayat; implementasi di bagian 7–14 dan finalisasi di bagian 15. Pekerjaan lanjutan yang belum diverifikasi tetap tidak dicentang.

## 1. Baseline dan batas audit

- Vite, Three.js dan JavaScript ES modules tetap dipertahankan. package.json meminta Three.js ^0.180.0, Vite ^7.1.7 dan Playwright ^1.64.0; build lokal memakai Vite 7.3.7.
- Working tree bersih saat audit dimulai. Tugas ini hanya menambahkan dokumen ini; tidak mengubah runtime, dependency, aset atau data ilmiah. Tidak ada reset maupun git commit. Build menghasilkan ulang dist yang diabaikan Git.
- Dibaca: README, package.json, progres Phase 3, main, SolarSystem, FlightControls, cameraMath, OrbitMotion, PlanetRings, SmallBodyRegion, CometVisual, UIController, ExplorationUI, styles, serta bagian data sains/orbit/tur yang terkait. Struktur src, index.html, konfigurasi Vite/Playwright dan cakupan unit test juga diperiksa.
- Scene existing: 37 objek (Matahari, delapan planet, 22 bulan, lima planet katai, Halley), 36 orbit dan dua sabuk dekoratif. Bookmark, perbandingan, pencarian dan tur tetap merupakan fondasi yang digunakan kembali.
- Audit ini berbasis kode dan test/build, **bukan inspeksi visual browser baru**. E2E, screenshot, contrast measurement, screen reader dan benchmark tidak dijalankan ulang. Temuan rendering yang memerlukan penilaian gambar dicatat sebagai risiko/pekerjaan validasi, bukan cacat visual yang telah direproduksi.
- Sumber ilmiah dan lisensi dibaca sebagai metadata repository; tidak diverifikasi ulang daring. Tidak ada rekomendasi mengganti angka ilmiah tanpa verifikasi sumber pada tugas implementasinya.

### Verifikasi pada audit ini

| Perintah | Hasil |
| --- | --- |
| `npm.cmd test` | 34/34 lulus, 0 gagal |
| `npm.cmd run build` | Berhasil, exit code 0, 28 modul |

Build: HTML 11,64 kB; CSS 13,88 kB; JS aplikasi 84,32 kB (gzip 27,04 kB); Three.js terpisah 499,85 kB (gzip 126,44 kB). Tidak ada error/warning build.

Hasil **historis** finalisasi Phase 3: 32/32 E2E pada Edge 1366×768 dan Chrome 1920×1080, tanpa console warning/error pada skenario yang diuji. [Benchmark final Phase 3](benchmarks/phase-3-final.json) mencatat resource 125 geometry/39 texture stabil selama pengulangan, median interval RAF 6,9–7,0 ms dan kenaikan heap setelah GC sekitar 106–118 kB. Angka headless tersebut bukan biaya GPU langsung, jaminan FPS, atau bukti bebas leak. Gunakan metode yang sama untuk perbandingan berikutnya.

## 2. Fondasi visual yang sudah tersedia — jangan dibuat ulang

| Area | Implementasi existing | Batas saat ini |
| --- | --- | --- |
| Renderer | WebGL2 guard, antialias, high-performance preference, sRGB output, ACESFilmic, exposure 1,05; perspective FOV 53°, near 0,05/far 2200 | Satu pass render; belum ada post-processing/shadow map. Ini pilihan hemat biaya, bukan fitur rusak |
| Kualitas | DPR cap High 1,75 / Medium 1,25 / Low 0,85; bintang 9000/5000/2500; draw range kedua sabuk; efek atmosfer/corona/coma mati di Low | Geometry/tekstur tetap dialokasikan pada kualitas rendah; antialias dan blur CSS tidak berubah |
| Cahaya Matahari | PointLight hangat intensity 3,2, decay 0; HemisphereLight intensity 0,22; Matahari MeshBasicMaterial | Eksposur ilustratif untuk jarak terkompresi, bukan inverse-square/radiometri; tidak ada bayangan planet pada cincin |
| Material | MeshStandardMaterial planet/bulan, metalness planet 0, roughness Bumi 0,74, planet lain 0,9, bulan 1 | Peta warna saja; belum normal/roughness map, awan terpisah atau night map Bumi; bulan mesh 20×14 dapat tampak bersegi saat dekat |
| Tekstur | Sepuluh JPEG lokal, sRGB, anisotropy 4; cache Promise, lazy load dekat kamera/seleksi, procedural langsung tersedia, dispose map pengganti | Loader hanya mengizinkan Matahari/planet/Bulan; 21 bulan lain dan katai procedural; Venus memakai peta permukaan |
| Startup/fallback | Matahari diminta sebelum loading ditutup, timeout 4 detik ditambah delay ready 550 ms; error memakai procedural | Tidak retry otomatis; request lambat dapat mengganti tampilan setelah fallback sudah terlihat |
| Atmosfer/glow | Shell BackSide additive pada Bumi/Venus/Uranus/Neptunus, opacity 0,065; sprite glow Matahari opacity 0,32 + corona 0,12; indikator seleksi | Belum Fresnel atau terminator-aware; jangan menambah shell/glow kedua tanpa mengevaluasi yang existing |
| Cincin/komet | Satu ring mesh + RGBA strip procedural per planet, transparansi/celah/kemiringan; koma/ekor ringan anti-Matahari | Efek ilustratif; tidak perlu particle simulation tambahan untuk polish |
| Background | FogExp2 density 0,00042; 9000 bintang seeded dalam shell radius 450–1300; haze BackSide radius 1000 | Bintang berwarna dominan biru, bukan katalog; shell berada di dunia, bukan background tak hingga |
| Kamera | Cubic ease Visit/Follow, target bergerak, framing radius, pencarian endpoint bebas penghalang, manual takeover; OrbitControls damping | Visit bukan path planner seluruh lintasan; tidak ada reduced-motion JavaScript |
| Free Flight/tur | Velocity damping delta-based, proximity slowdown, boost, scroll, pointer lock/exit; tur 10 tahap dengan kontrol lengkap dan narasi terpisah | Penolakan pointer lock tidak memberi pesan khusus; jam tur dan tween berbeda basis |
| HUD/sains | Panel scroll, sumber/unknown state, skala nonproporsional, native dialog, favorit lokal aman, perbandingan dua objek tanpa mengubah scene | Data beberapa bulan belum lengkap; sumber bukan bukti semua parameter terkini |
| Accessibility | Focus-visible, native button/select/dialog, live status, info/HUD inert, shortcut modal guard, reduced-motion CSS | Belum audit screen reader/zoom/kontras menyeluruh; status toggle tidak semuanya semantik |
| Resize/fullscreen | Aspect/projection dan renderer size diperbarui; fullscreen toggle menangkap Promise rejection | DPR tidak dihitung ulang pada resize; state fullscreen tidak disinkronkan melalui fullscreenchange |
| Loop/lifecycle | Scratch vector, reuse buffer, pause melewati solver, cache tekstur, HUD speed hanya saat berubah, disposal pagehide | Label DOM dan beberapa world transform tetap dihitung setiap frame; teardown lintas-scene belum menyeluruh |

## 3. Temuan visual, UX dan performa

Prioritas berikut berdasarkan pemeriksaan kode; reproduksi browser menjadi bagian tugas implementasi pertama.

### P1 — perbaikan kecil sebelum efek baru

1. **Welcome tersembunyi masih dapat menerima fokus.** `hideWelcome()` hanya menambah class hidden dengan opacity/pointer-events. Tidak mengatur inert/hidden pada welcome. `toggleHud()` juga mengaktifkan kembali semua panel saat HUD ditampilkan. Uji Tab setelah Mulai Menjelajah, pemilihan objek dan siklus HUD; pastikan tombol yang tak terlihat tidak mendapat fokus.
2. **Reduced motion belum menjangkau kamera.** CSS memendekkan animasi UI, tetapi tween 1,2–2,2 detik dan tur otomatis tetap berjalan. Rencanakan kebijakan transisi minimal untuk preferensi tersebut, termasuk perubahan preferensi saat aplikasi terbuka; jangan diam-diam mengubah waktu orbit ilmiah.
3. **Semantik kontrol belum seragam.** Orbit/Label dan kategori hanya memakai class active; HUD baru mendapat aria-pressed setelah toggle pertama. Slider mengekspos indeks 0–4, belum aria-valuetext hari/detik. Help dialog belum punya aria-labelledby. Fokus setelah menutup info perlu diperiksa. Tambahkan semantik pada kontrol existing, tanpa redesign.
4. **Resize/fullscreen lintas monitor belum lengkap.** DPR diterapkan saat startup/perubahan kualitas, bukan resize. Fullscreen button tidak mencerminkan state saat Escape/browser keluar fullscreen; API yang tidak tersedia dilewati tanpa pesan. Rencanakan satu jalur pembaruan ukuran/DPR yang tetap mematuhi cap kualitas dan status fullscreen.

### P2 — polish yang perlu referensi gambar dan pengukuran

5. **Atmosfer masih shell warna seragam.** Tidak mempertimbangkan arah cahaya/sudut pandang. Evaluasi terminator dan tepi planet dengan view tetap sebelum memilih shader ringan; pertahankan fallback dan Low tanpa efek.
6. **Corona memakai depthWrite default aktif**, berbeda dari sprite/atmosfer yang eksplisit false. Ini risiko interaksi transparansi, bukan artefak yang sudah direproduksi pada audit ini. Periksa Matahari dari dekat/jauh dengan orbit dan objek di belakang sebelum mengubah depth/blending/tone mapping.
7. **Warna dan detail permukaan perlu kalibrasi, bukan exposure global langsung.** ACES, tint, cahaya dan peta ilustratif saling memengaruhi. Venus surface map tidak sama dengan penampakan awan. Prioritaskan definisi ilmiah/atribusi, lalu aset lokal terbatas; jangan membuat angka atau klaim true color tanpa sumber.
8. **Background dapat terasa seperti objek dekat.** Free Flight tidak dibatasi radius shell; kamera bisa melewati volume bintang/haze, menyebabkan parallax atau hilangnya lapisan. Fog juga berlaku global. Nilai estetika/kontras perlu screenshot yang sama pada beberapa jarak; jangan mengganti starfield menjadi Galaxy Scene dalam polish ini.
9. **Label tidak punya penghindaran overlap/occlusion.** `updateLabels()` hanya menguji arah dan jarak <600; menulis left/top/opacity tiap frame, menghitung length dua kali dan tetap melakukan sebagian kerja ketika label/HUD tersembunyi. Kandidat: early return, cache nilai, threshold atau update terukur; jangan mengorbankan akurasi saat kamera bergerak.
10. **Kamera berpotensi koreksi mendadak di lintasan padat.** `clearApproach` memeriksa target–endpoint, bukan jalur dari kamera awal; clearance kemudian mendorong kamera keluar permukaan. Reproduksi transisi antarbulan/planet sebelum penyesuaian. Damping OrbitControls dipanggil tanpa delta, sedangkan flight delta-based; bandingkan rasa kontrol pada refresh rate berbeda.
11. **Dua basis waktu.** Simulasi/tur memakai delta dibatasi 0,05 s, tween memakai performance.now. Tab background/FPS rendah dapat membuat kemajuan tween dan waktu baca berbeda. Kebijakan suspend/resume harus eksplisit sebelum menambah kalender; jangan mengubah solver orbit dalam tugas visual.
12. **Low belum merupakan pengurangan memori.** Semua map procedural dibuat saat konstruksi, geometry sama, blur HUD tetap. Profil CPU startup, GPU transparansi, DOM label dan retained heap terpisah. Clearance juga membaca world position seluruh objek (dua kali saat flight). Optimalkan hanya hotspot yang terukur; jangan menambah adaptive quality dulu.
13. **Keterbacaan perlu audit langsung.** Beberapa label/kategori 8–10 px; panel transparan bergantung pada latar. Belum ada bukti rasio kontras/aksesibilitas 200% zoom atau screen reader. Pemeriksaan kedua viewport existing perlu ditambah kondisi zoom dan reduced motion, tanpa janji kepatuhan WCAG sebelum pengukuran.

## 4. Checklist Phase 4 dan urutan paling aman

Checklist berikut membedakan implementasi yang telah diverifikasi dari pekerjaan lanjutan yang ditunda ke Phase 5. Temuan baseline di atas dipertahankan sebagai riwayat, bukan daftar bug aktif.

### Audit selesai

- [x] Baca baseline, konfigurasi dan implementasi relevan.
- [x] Petakan fitur existing agar tidak dibuat ulang.
- [x] Identifikasi risiko renderer/cahaya/material/efek/background/kamera/HUD/accessibility/loop/resize.
- [x] Jalankan 34 unit test dan production build.
- [x] Dokumentasikan rencana tanpa mengubah kode aplikasi/reset/commit.

### Implementasi bertahap

- [x] P4-R7: preset kualitas persisten, detail sphere/disposal, default Medium dan FPS debug (bagian 14). Profiling GPU/heap panjang P4-08 tetap terpisah.

- [x] P4-R6: panel informasi ilmiah berkelompok, formatter, nilai kosong, sumber dan fokus/Escape (bagian 12). Tidak menambah angka ilmiah.

- [x] P4-R5: mode sinematik, pemulihan UI, indikator singkat dan fullscreen aman (bagian 11). Tidak menyimpan preferensi sembunyikan UI saat reload.

- [x] P4-R4: easing/transisi kamera bersama, pembatalan, Follow dan perlindungan body/cincin (bagian 10). Reduced motion P4-03 tetap tugas terpisah.

- [x] P4-R3: lingkungan dekoratif berlapis, haze halus, posisi relatif kamera, seeded distribution dan toggle Bintang (bagian 9). Bukan Galaxy Scene Phase 5.

- [x] P4-R2: atmosfer rim glow, corona ringan, material matte, fallback shader/tekstur, parent dan raycasting (bagian 8). Tidak mencakup aurora atau scattering fisik.

- [x] P4-R1 (cakupan tugas pengguna): rendering/color space/exposure/pencahayaan dan resize ber-DPR cap; lihat bagian 7. P4-02/P4-05 tetap belum dicentang karena cakupannya lebih luas dari tugas ini.

- [x] P4-01: fokus welcome tersembunyi, status toggle/slider dan nama dialog diperbaiki; E2E keyboard targeted tersedia (bagian 11–13).
- [x] P4-02a: sinkronisasi resize/DPR/fullscreen, Escape dan kegagalan API diuji pada kedua viewport serta seluruh cap kualitas.
- [ ] Phase 5 / P4-02b: uji zoom browser dan perpindahan monitor fisik dengan DPR berbeda.
- [x] P4-03: reduced motion pada jalur tween bersama, termasuk perubahan preferensi ketika berjalan; kontrol kamera existing dipertahankan (bagian 13).
- [ ] Phase 5 / P4-04: matriks screenshot deterministik seluruh objek referensi dan Low/Medium/High. Screenshot E2E saat ini belum mencakup seluruh kombinasi.
- [x] P4-05: pencahayaan/material/transparansi, atmosfer/corona ringan dan fallback diimplementasikan serta diuji (bagian 7–8); tidak menambah bloom/shadow pipeline.
- [ ] Phase 5 / P4-06: verifikasi sumber dan aset awan Venus/bulan sebelum menambah map lokal, dengan lisensi/fallback/disposal.
- [x] P4-07a: starfield/haze, panel lebih terbaca, focus state dan reduced motion tersedia (bagian 9, 12–13).
- [ ] Phase 5 / P4-07b: penghindaran overlap/occlusion label, pengukuran kontras menyeluruh dan audit screen reader.
- [ ] Phase 5 / P4-08: profiling loop/startup/heap sesi panjang lintas GPU. Pengujian disposal/resource singkat bukan pengganti profiling tersebut.
- [x] P4-09: regresi akhir unit/build/E2E, texture failure, keyboard/reduced motion, resize/fullscreen, console dan README (hasil final di bagian 15). Zoom fisik dicatat terpisah pada P4-02b.

**Rekomendasi awal audit (sudah dilaksanakan): P4-01, fokus welcome yang tersembunyi**, kemudian semantik kontrol. Lihat hasil implementasi di bagian 11–13; jangan mengulang pekerjaan yang sudah tersedia.

Kriteria tiap tahap: tidak menghapus fitur Phase 3; test relevan dan build lulus; browser console bersih pada skenario terkait; perubahan visual dibandingkan pada view identik; Low tetap ringan dan fallback berfungsi. Jangan mencentang tahap karena kode sudah ditulis saja.

## 5. File yang kemungkinan berubah

| Tujuan | Berkas kandidat |
| --- | --- |
| Fokus/semantik/keterbacaan | src/ui/UIController.js, src/ui/ExplorationUI.js bila perlu, index.html, src/styles.css; e2e/finalization.spec.js, e2e/exploration.spec.js |
| Resize/render/reduced motion | src/main.js; src/core/FlightControls.js dan cameraMath.js hanya jika hasil reproduksi memerlukan; e2e/observer.spec.js |
| Cahaya/material/atmosfer/background | src/core/SolarSystem.js; PlanetRings.js/CometVisual.js hanya untuk regresi atau masalah spesifik; e2e/rings.spec.js, e2e/comets.spec.js |
| Aset/sains | public/textures, ATTRIBUTION.md, src/data/science.js, moonScience.js, celestialBodies.js sesuai objek; test/phase2.test.js dan test bulan terkait; README |
| Profiling/label | src/main.js, src/core/SolarSystem.js, scripts/profile.mjs, docs/benchmarks; fixture console existing tetap digunakan |
| Catatan final | README.md, docs/phase-4-progress.md |

Tidak perlu proyek/dependency baru atau refactor besar main/UIController untuk memulai. Modul shader/manifest kecil baru hanya dipertimbangkan saat kebutuhan nyata muncul; jangan membuat sistem paralel untuk kualitas, kamera atau tekstur.

## 6. Backlog lama yang bukan otomatis cakupan polish

README/Phase 3 menyimpan backlog lebih luas: ephemeris/epoch/kalender/node/periapsis, tidal locking, Charon/objek baru, rute tur tambahan, Galaxy Scene/lifecycle lintas-scene, sinkronisasi favorit, perbandingan jarak fisik dan adaptive quality. Semuanya **tetap belum dikerjakan**, tetapi tidak otomatis menjadi syarat Scientific & Cinematic Polish ini. Pisahkan tugas dan kriteria penerimaannya bila kelak diminta. Pelengkapan data ilmiah yang kosong juga harus bertahap dengan sumber terverifikasi, tanpa migrasi besar skema.

## 7. Rendering pipeline dan pencahayaan — 14 Oktober 2026

Implementasi terbatas pada `src/main.js`, `src/core/SolarSystem.js`, pengujian baru `e2e/rendering.spec.js` dan dokumen ini. Tidak mengubah orbit, katalog objek, guided tour, layout UI atau dependency. Tidak melakukan git commit.

| Konfigurasi | Nilai dan alasan |
| --- | --- |
| Renderer | WebGLRenderer WebGL2, antialias true, powerPreference high-performance; satu render pass tanpa bloom/shadow map tambahan |
| Color management | ColorManagement.enabled true, outputColorSpace SRGBColorSpace. JPEG/peta warna procedural tetap sRGB; CanvasTexture glow kini juga ditandai sRGB agar warna CSS gradient tidak dianggap linear. Alpha tetap sebagai transparansi |
| Tone mapping | ACESFilmicToneMapping dipertahankan, exposure 1,00 (sebelumnya 1,05), menjaga rentang highlight tanpa mengangkat exposure semua planet |
| DPR | min(devicePixelRatio, cap): Low 0,85; Medium 1,25; High 1,75. Satu fungsi resize mengatur ukuran buffer, aspect/projection dan DPR saat startup, quality-change, resize dan fullscreenchange; ukuran CSS tetap dikelola stylesheet |
| Sumber utama | PointLight di pusat Matahari, warna 0xfff4e4, intensity 3,0 (sebelumnya 3,2), distance 0, decay 0. Cahaya berarah dari pusat menghasilkan terminator planet; tidak ada lampu yang mengikuti kamera |
| Fill | HemisphereLight 0xffffff / 0x606878, intensity 0,035; fill netral sangat kecil untuk sisi malam. Menggantikan fill biru 0x18284e / 0x020204 intensity 0,22; angka intensity berbeda warna tidak berarti rasio luminansi yang sama |
| Permukaan Matahari | MeshBasicMaterial dengan multiplier RGB linear 1,3, tetap tone-mapped. Sama pada fallback dan JPEG; mengangkat tampilan Matahari tanpa mengubah intensitas cahaya yang diterima planet |
| Corona | Opacity existing 0,12, depthWrite false; glow sprite opacity 0,32 tetap. Efek tidak menulis depth yang berpotensi menutup transparansi di belakang |

`decay=0` adalah keputusan ilustratif untuk jarak scene yang terkompresi, bukan klaim inverse-square fisik. Sisi malam tetap gelap dengan fill kecil; tidak menambahkan city-light map, scattering atmosfer atau bayangan gerhana. Shell atmosfer/seleksi existing tetap dapat terlihat sebagai pita di tepi; polish shader bukan cakupan ini.

API diperiksa terhadap source Three.js lokal **0.180.0** (`WebGLRenderer`, `ColorManagement`, `Material`, `PointLight`) dan [dokumentasi renderer resmi](https://threejs.org/docs/pages/WebGLRenderer.html). Tidak menggunakan outputEncoding, gammaOutput atau physicallyCorrectLights API lama.

### Validasi

- `npm.cmd test`: **34/34 lulus** setelah perubahan akhir.
- `npm.cmd run build`: berhasil, 28 modul; aplikasi 84,41 kB, Three.js terpisah 499,86 kB sebelum gzip.
- Suite targeted rendering + finalization: **6/6 lulus**, mencakup resize/keyboard, kegagalan decode seluruh tekstur dan cap DPR semua kualitas. Setelah penandaan sRGB glow, suite rendering dijalankan ulang pada kedua browser: **2/2 lulus**, exit code 0, tanpa console warning/error atau pageerror.
- Test baru mensimulasikan devicePixelRatio 3 lalu 1, memeriksa drawing buffer dan aspect pada 1366×768 serta 1920×1080. Ini bukan pengujian perpindahan monitor fisik atau status tombol fullscreen.
- Screenshot Visit Matahari/Bumi/Saturnus dihasilkan di test-results (diabaikan Git). Inspeksi Bumi/Matahari memperlihatkan terminator, detail permukaan sisi terang dan detail Matahari; tidak mengklaim kalibrasi fotometrik/true color. Fixture browser memeriksa console warning/error dan pageerror.
- Tidak menjalankan ulang seluruh E2E atau benchmark GPU panjang. Tidak menambah render pass, shadow map, particle system atau pekerjaan baru di animation loop.

Manual: jalankan npm run dev, kunjungi Bumi lalu orbitkan kamera untuk membandingkan sisi siang/malam; kunjungi Matahari dan Saturnus. Ubah kualitas High/Medium/Low, resize kedua resolusi, masuk/keluar fullscreen dan cek proporsi planet tetap bulat. Periksa buffer pada monitor DPR tinggi dan pastikan cap kualitas tetap berlaku. Fallback tetap dapat diuji dengan memblokir JPEG lalu reload.

## 8. Atmosfer, glow dan material — 17 Oktober 2026

- `src/core/RimGlow.js` menyediakan satu shell BackSide per planet: Venus, Bumi, Mars, Jupiter, Saturnus, Uranus dan Neptunus. Merkurius tidak diberi atmosfer tebal. Profil adalah parameter visual, bukan ukuran/kepadatan atmosfer ilmiah. Bumi paling jelas (strength 0,22, radius 1,035×); Mars sangat tipis (0,035; 1,012×). Planet lain strength 0,05–0,11 dan radius 1,018–1,025×.
- RawShaderMaterial GLSL3 menghitung rim dari normal dan arah pandang, memudarkan batas luar serta mengurangi efek sisi malam berdasarkan posisi Matahari dalam view space. Tidak ada sampling tekstur, noise, loop partikel atau render pass tambahan. Warna overlay additive dikonversi ke sRGB secara eksplisit; bukan material permukaan atau simulasi scattering fisik.
- Corona Matahari menggunakan shader yang sama tanpa pembatas sisi siang, radius 1,10× dan strength 0,25. Sprite gradient lokal existing tetap tersedia. Corona lama diganti, bukan ditumpuk. Penambahan bersih hanya tiga mesh untuk Mars/Jupiter/Saturnus; tidak ada penambahan mesh per frame.
- Setiap shell merupakan child visual planet atau group Matahari, sehingga posisi/kemiringan mengikuti induk. Uniform view-space diperbarui dengan vector yang dipakai ulang saat render. Semua shell dan sprite glow menonaktifkan raycast; depthTest tetap aktif dan depthWrite false. Material/geometry dibuang melalui lifecycle existing. Low menyembunyikan semua efek ini.
- Shader diuji compile/link memakai source GLSL yang sama satu kali per WebGL context sebelum dipromosikan dari MeshBasicMaterial. Kegagalan compile/link mempertahankan shell bawaan yang redup; probe dibersihkan dan hasilnya dicache, tanpa retry per-frame. Material fallback yang tersimpan dilepas ketika material shader dibuang. Ini menangani kegagalan shader efek, bukan kegagalan total perangkat WebGL.
- Tekstur permukaan tetap memakai cache/fallback procedural existing. Rim dan corona tidak memerlukan tekstur eksternal. Roughness planet berbatu/katai menjadi 0,96; bulan tetap 1; gas/es tetap 0,9. Metalness planet tetap 0, sehingga peta warna dan pencahayaan gas tidak ditutupi lapisan spekular baru.
- Tidak mengubah main/kamera, orbit, data objek, guided tour, UI, dependency atau aset; tidak ada commit. File: SolarSystem.js, RimGlow.js, test/rimGlow.test.js, e2e/atmosphere.spec.js dan dokumen ini. API raw shader diperiksa pada [dokumentasi resmi Three.js](https://threejs.org/docs/pages/RawShaderMaterial.html).

### Pengujian dan batas

- `npm.cmd test`: **36/36 lulus**. Test baru memeriksa profil Bumi, pewarisan parent, raycast kosong, depthWrite serta kegagalan probe/caching/pembersihan resource dan material fallback.
- `npm.cmd run build`: berhasil, 29 modul, aplikasi 86,49 kB dan Three.js terpisah 499,98 kB sebelum gzip.
- `npm.cmd run test:e2e -- e2e/atmosphere.spec.js e2e/finalization.spec.js`: **6/6 lulus**, exit code 0 (1,1 menit). Menguji compile shader nyata di Edge/Chrome, alignment setelah orbit bergerak, toggle Low/High, disposal, klik dan screenshot Bumi/Matahari/Jupiter/Bulan, serta regresi resize dan kegagalan decode semua JPEG. Fixture bersama tidak menemukan console warning/error atau pageerror.
- Screenshot Bumi dan Matahari diperiksa: permukaan dan terminator tetap terlihat. Pita indikator seleksi existing masih terpisah dari rim atmosfer; tidak diubah dalam tugas ini. Screenshot bukan kalibrasi ilmiah atau benchmark GPU. Tidak mengklaim profiling jangka panjang atau seluruh E2E dijalankan ulang.

Manual: pilih Bumi, putar pandangan dari sisi siang menuju sisi malam, bandingkan dengan Mars dan Jupiter. Kunjungi Matahari dan periksa detail permukaan tetap terlihat. Pilih Bulan untuk memeriksa material matte. Klik pusat objek melalui efek, ubah kualitas menjadi Low lalu High; efek harus hilang/kembali tanpa mengubah objek. Blokir JPEG dan reload untuk memeriksa fallback procedural.

## 9. Lingkungan luar angkasa — 17 Oktober 2026

- `SpaceBackground.js` menggantikan volume starfield dan haze lama. Tiga Points/BufferGeometry berisi 6000/2400/600 bintang dengan ukuran layar 1,4/2,2/3,2, brightness per vertex dan variasi putih hangat/netral/biru pucat. Seed 42042 menghasilkan posisi dan warna identik saat reload. Satu DataTexture radial 16×16 dibagi ketiga material; tidak ada aset eksternal atau shader kustom baru.
- Haze berupa satu sphere berwarna per vertex dengan pita/cloud sangat redup; bukan peta Bima Sakti, katalog bintang atau model jarak galaksi. Tidak menambah aurora, animasi noise atau partikel individual.
- Group background menyalin posisi kamera, tidak rotasinya. Arah bintang tetap sama saat translasi, tetapi berputar secara wajar ketika pengguna melihat arah lain. Radius shell 1800/1900 berada di dalam far plane existing 2200. Hanya copy vector per frame; buffer, geometri dan warna dibuat sekali.
- Background memakai antrean opaque dengan renderOrder -200 (haze) dan -199 (bintang), depthTest/depthWrite false, serta additive blending bintang. Ini menggambar latar sebelum permukaan opaque dan efek transparan Tata Surya tanpa render pass terpisah; planet tetap menutupi bintang. Fog scene tidak diterapkan ke latar. Semua background raycast no-op dan tidak masuk daftar pickables.
- High 9000 bintang, Medium 5040, Low 2520 menggunakan drawRange pada buffer yang sama; haze mati di Low. Toggle **Bintang** pada dock menyembunyikan/menampilkan seluruh latar, dengan aria-pressed dan dukungan tombol native Space/Enter. Pergantian kualitas tidak mengubah pilihan visibilitas. Tombol menyebut dekorasi melalui title; tidak mengubah guided tour atau data ilmiah.
- Lifecycle disposal existing menelusuri group dan membuang geometry/material serta shared texture sekali melalui Set. Tidak ada listener atau mesh baru saat toggle/quality-change.
- File: `src/core/SpaceBackground.js` (baru), `src/core/SolarSystem.js`, `src/main.js` (satu event toggle), `src/ui/UIController.js`, `index.html`, `test/spaceBackground.test.js`, `e2e/background.spec.js`, dokumen ini. Tidak ada perubahan orbit, katalog ilmiah, guided tour, dependency atau commit.

Validasi: unit test mencakup seed posisi/warna, arah proyeksi tetap saat kamera ditranslasikan, reuse buffer, urutan render/depth, non-pickable dan kualitas/visibilitas. Browser memeriksa toggle keyboard, kualitas, viewport, klik planet, resize/HUD dan fallback JPEG. Benturan awal nama properti `layers` dengan API Object3D ditemukan lewat browser dan diperbaiki menjadi `starLayers`, dengan assertion regresi. Screenshot Edge 1366×768 diperiksa: latar halus dan planet tetap terlihat. Hasil akhir test/build/E2E dicatat setelah eksekusi selesai; tidak mengklaim benchmark GPU atau seluruh suite browser dijalankan ulang.

Manual: aktifkan Free Flight, bergerak maju/mundur dan menyamping; bintang tidak mendekat atau bergeser seperti asteroid. Putar pandangan untuk melihat arah langit berbeda. Gunakan Bintang lewat Tab/Space/Enter, ganti Low/Medium/High, lalu kunjungi Bumi atau Saturnus dan pastikan bintang tidak menutupi cakram planet. Semua efek latar ini dekoratif.

Hasil akhir: **37/37 unit test lulus**; **production build berhasil** (30 modul, aplikasi 88,03 kB, Three.js 499,98 kB sebelum gzip); **6/6 E2E targeted lulus** dalam 50,4 detik pada Edge/Chrome, exit code 0, tanpa console warning/error atau pageerror. `git diff --check` tidak menemukan whitespace error. Tidak ada git commit.

## 10. Kamera dan transisi sinematik — 17 Oktober 2026

- Easing quintic smootherstep `6t^5 - 15t^4 + 10t^3` menggantikan easing cubic, dengan turunan pertama/kedua nol pada endpoint. Orientasi memakai quaternion slerp dari pose awal menuju arah target yang diperbarui. Visit tetap memakai jarak berdasarkan radius visual (`max(radius × framing, radius + 1,2)`).
- `beginTween` dipakai Visit/Follow, overview dan pemberhentian khusus sabuk asteroid. Tidak ada pengendali kamera atau timer tur kedua. Target bergerak tetap diperbarui selama perjalanan, lalu Follow mempertahankan offset kamera saat objek bergerak.
- OrbitControls dinonaktifkan selama tween; listener pointer/wheel pada capture phase membatalkan tween sebelum OrbitControls memproses input. Sisa damping dibersihkan tanpa mengubah pose kamera. Pembatalan tween mengatur ulang target observer sepanjang arah pandang saat ini agar frame berikutnya tidak kembali menyentak ke arah target lama. Shortcut F berulang dan F saat Free Flight diabaikan.
- Saat Free Flight diaktifkan, tur dihentikan, tween/Follow dilepas dan velocity/tombol flight direset sebelum pointer lock. Posisi/orientasi tidak direset ke preset. Escape membatalkan tween atau melepas Follow; jika tur aktif, tur dijeda agar tidak langsung mengambil alih lagi. Dialog tetap mendapat prioritas Escape; di flight, Escape tetap melepas pointer lock.
- `CameraSafety` hanya mengubah posisi kamera. Batas bola = radius + max(0,25; 8% radius). Cincin diperiksa sebagai annulus dalam local space mesh dengan bantalan 0,3 unit visual, termasuk kemiringan/transformasi parent. Tidak menggunakan seluruh bola luar cincin sebagai zona terlarang saat observer/flight, sehingga area di atas/bawah cincin tetap dapat dijelajahi.
- Swept segment memotong langkah kamera pada titik kontak terdekat dengan bola/cincin, mencegah tunnelling pada gerak cepat. Koreksi penetrasi memakai hingga delapan lintasan untuk overlap akibat skala terkompresi. Scratch vector digunakan ulang; tidak membuat mesh collision atau objek baru dalam loop safety.
- Saat merencanakan tween, lintasan langsung diuji terhadap envelope konservatif; bila terhalang, empat kandidat quadratic detour diperiksa masing-masing 32 segmen. Alokasi perencanaan hanya terjadi saat memulai perjalanan. Rencana memakai posisi objek saat mulai; guard collision per-frame tetap menjadi pengaman ketika objek bergerak.
- Batas: ini navigasi ilustratif, bukan pathfinding dinamis penuh. Bila tidak ditemukan detour atau objek bergerak menghalangi lintasan, kamera berhenti pada batas aman dan dapat memerlukan input manual; tidak menjamin setiap endpoint dapat dicapai pada semua konfigurasi objek yang saling tumpang tindih. Koreksi keselamatan diprioritaskan atas kelancaran ketika sebuah objek bergerak memasuki posisi kamera.
- File: `src/main.js`, `src/core/cameraMath.js`, `src/core/CameraSafety.js` (baru), `test/cameraPolish.test.js`, `e2e/cameraPolish.spec.js`, dokumen ini. Tidak mengubah material, orbit, katalog objek, narasi tur atau UI. Tidak ada commit.

### Kontrol setelah perubahan

- Kunjungi / F / hasil pencarian: perjalanan halus, kemudian observer bebas; jarak mengikuti radius objek.
- Ikuti orbit: perjalanan lalu Follow; drag/scroll observer tetap dapat mengatur pandangan ketika Follow sudah aktif. Escape melepas Follow.
- Drag/scroll saat perjalanan: membatalkan perjalanan dan mengambil alih kamera; tur dijeda jika aktif.
- Free Flight: menghentikan tur/transisi/Follow pada pose sekarang; WASD, Space/Ctrl, Shift dan scroll tetap tersedia. Escape melepas pointer; tombol Keluar Free Flight kembali ke observer.
- Guided Tour menggunakan sistem tween dan safety yang sama; Escape menjeda pengambilalihan kamera tur, Resume tetap tersedia melalui kontrol existing.

### Validasi

- `npm.cmd test`: **39/39 lulus**, termasuk endpoint/monotonicity easing, radius aman, pusat bola, annulus miring yang ditranslasikan dan swept collision untuk lintasan cepat melewati bola/cincin.
- `npm.cmd run build`: berhasil, 31 modul; aplikasi 91,45 kB, Three.js tetap terpisah 499,98 kB sebelum gzip.
- `npm.cmd run test:e2e -- e2e/cameraPolish.spec.js e2e/observer.spec.js`: **8/8 lulus**, exit code 0, 1,5 menit di Edge 1366×768 dan Chrome 1920×1080. Regresi observer (Visit/Follow/tur/flight/resource/fallback), Escape dan pengambilalihan Free Flight dari transisi tur lulus tanpa console warning/error atau pageerror. Bukan klaim seluruh E2E atau benchmark performa dijalankan ulang.

Manual: kunjungi Saturnus/Uranus, zoom mendekati cincin dari atas/bawah; coba gerak flight melintasi cincin. Mulai Visit lalu drag/scroll/Escape; mulai Follow, ubah waktu dan periksa target mengikuti planet sebelum menekan Escape. Saat tur sedang berpindah, aktifkan Free Flight, lepas pointer dengan Escape lalu keluar melalui tombol. Periksa orientasi tetap menerus ketika mode berubah.

## 11. Mode sinematik dan kontrol tampilan — 17 Oktober 2026

- Tombol HUD existing menjadi **Sinematik · H**. Mode memakai class hud-hidden existing untuk menyembunyikan topbar/pencarian, kategori, welcome, info, kontrol waktu, panel tur dan label; overlay/status Free Flight, pesan aplikasi dan mobile notice juga disembunyikan. Tombol **Tampilkan UI · H** selalu tersedia, di luar panel inert.
- Indikator noninteraktif dengan role status muncul tiga detik: Mode sinematik aktif · H atau Escape untuk kembali. Timer dibatalkan/diganti saat toggle, tidak menumpuk. Label objek kembali sesuai pilihan Label sebelumnya, bukan selalu diaktifkan.
- Panel tersembunyi inert, termasuk tombol keluar flight. Saat UI dipulihkan, info yang tertutup dan welcome yang sudah disembunyikan tetap inert. Ini juga menutup celah fokus welcome yang ditemukan pada audit. Semua tombol statis mendapat title atau aria-label bila belum tersedia; tombol favorit dinamis sudah memiliki aria-label spesifik objek.
- H dapat masuk/keluar; key repeat, shortcut dengan modifier dan contenteditable tidak memicu toggle. Escape dalam mode sinematik memulihkan UI; bila fullscreen juga aktif, meminta exitFullscreen dan melepas pointer lock jika perlu. Event Escape tersebut tidak diteruskan ke handler kamera. Dialog terbuka tetap mendapat prioritas Escape native. Escape di mode observer biasa tetap mengikuti perilaku kamera existing.
- Fullscreen menggunakan requestFullscreen/exitFullscreen dengan penanganan API tidak tersedia, throw sinkron dan Promise rejection. fullscreenchange menyinkronkan title, aria-label dan aria-pressed tombol, termasuk ketika pengguna keluar lewat browser. Keluar fullscreen juga memulihkan UI bila mode sinematik aktif. Mode sinematik dan fullscreen dapat diaktifkan terpisah.
- Preferensi sinematik **tidak dipersist**; reload selalu membuka UI. Tidak memakai localStorage baru, capture screenshot, preserveDrawingBuffer atau perubahan WebGL. Kamera, orbit, material dan renderer tidak diubah. Tur/waktu/Follow tetap berjalan selama UI disembunyikan.
- File: `src/ui/UIController.js`, `src/styles.css`, `index.html`, `e2e/cinematic.spec.js` (baru), dokumen ini. Tidak ada dependency, redesign atau git commit.

### Verifikasi

- `npm.cmd test`: **39/39 lulus**.
- `npm.cmd run build`: berhasil, 31 modul; aplikasi 93,36 kB, CSS 14,21 kB, Three.js tetap 499,98 kB sebelum gzip.
- `npm.cmd run test:e2e -- e2e/cinematic.spec.js e2e/finalization.spec.js`: **8/8 lulus**, exit code 0, 1,1 menit pada Edge 1366×768 dan Chrome 1920×1080, tanpa console warning/error atau pageerror. Memeriksa pemulihan inert/label, indikator hilang, pose kamera identik saat simulasi paused, reload, atribut tombol, fullscreen nyata, Escape, Promise rejection/API hilang dan dialog; ditambah regresi resize serta fallback seluruh JPEG. Tidak menjalankan seluruh suite atau benchmark GPU ulang.

Manual: pilih objek lalu tekan H; pastikan hanya tombol pemulihan UI dan indikator sementara yang muncul. Tekan H/Escape untuk kembali dan periksa pilihan label sebelumnya dipertahankan. Masuk fullscreen, aktifkan sinematik, lalu Escape; keduanya harus berakhir. Coba ulang saat Follow/Free Flight dan buka bantuan untuk memeriksa prioritas Escape dialog. Reload saat sinematik harus selalu menampilkan UI.

## 12. Pengalaman informasi ilmiah — 17 Oktober 2026

- Panel existing kini mempunyai heading Ringkasan, Karakteristik fisik, Orbit dan rotasi, serta Eksplorasi dan fakta penting. Nama/jenis, bookmark, perbandingan, Visit/Follow dan sumber tetap tersedia; panel tetap scroll tanpa redesign scene.
- `src/data/scienceFormat.js` menyediakan formatter murni dan model kelompok. Diameter memakai km/pemisah ribuan Indonesia; angka sangat besar memakai notasi ilmiah. String eksponen seperti 7,35e+22 kg menjadi 7,35 × 10²² kg; label perkiraan/GM/G dipertahankan. Notasi gravitasi dan desimal dinormalisasi; AU ditulis au dengan legenda satuan.
- Nilai null/undefined, angka nonfinite, string kosong dan placeholder Belum diverifikasi/Tidak diketahui ditampilkan sebagai **Data belum tersedia**. Nol tetap nol. Tidak berlaku dibedakan dari data hilang; orbit heliosentris Matahari tidak berlaku. Tidak memakai ukuran/jarak visual untuk mengisi data kosong.
- Satuan utama konsisten (diameter km, massa kg, gravitasi m/s²). Periode jam/hari/tahun dan suhu K/°C tetap mengikuti nilai serta definisi sumber; tidak memaksa konversi teks rentang/perkiraan yang dapat menambah presisi palsu. Legenda menjelaskan satuan tersebut dan au. Jarak bulan diberi label Jarak dari induk, bukan Jarak dari Matahari.
- Penjelasan skala visual disederhanakan tetap tampil. Sumber hanya berasal dari metadata existing, menggunakan tautan HTTP(S) dan textContent. Metadata kosong menampilkan Data belum tersedia; label sumber yang kosong memakai URL. Tidak menambah atau memverifikasi ulang angka astronomi daring dalam tugas presentasi ini.
- Setelah memilih lewat pencarian/dropdown atau dari canvas/body, fokus masuk ke judul panel yang dapat difokuskan secara programatik. Pembaruan tur otomatis dan pointer lock tidak mencuri fokus. Tutup/Escape mengembalikan fokus ke pemicu yang masih aktif, atau pencarian/tombol pemulihan HUD sebagai fallback; panel tertutup tetap inert.
- Escape saat panel terbuka menutup panel, sambil mempertahankan handler Escape kamera existing (membatalkan transisi/melepas Follow). Dialog/fullscreen/sinematik dan pointer lock mempertahankan prioritas yang sudah tersedia. Tidak mengubah kode kamera, sistem orbit, scene, data ilmiah atau material.
- File: `src/data/scienceFormat.js`, `src/ui/UIController.js`, `index.html`, `src/styles.css`, `test/scienceFormat.test.js`, `e2e/sciencePanel.spec.js`; assertion au dan alur Escape pada test dwarfPlanets/cameraPolish disesuaikan dengan perilaku baru. Tidak ada dependency atau git commit.

### Verifikasi

- `npm.cmd test`: **42/42 lulus**; tambahan memeriksa nilai hilang/nonfinite/nol, angka besar, eksponen, satuan/qualifier serta jarak bulan dan orbit Matahari.
- `npm.cmd run build`: berhasil, 32 modul; aplikasi 95,41 kB, CSS 14,41 kB dan Three.js terpisah 499,98 kB sebelum gzip.
- `npm.cmd run test:e2e -- e2e/sciencePanel.spec.js e2e/dwarfPlanets.spec.js e2e/cameraPolish.spec.js`: **6/6 lulus**, exit code 0, 46,9 detik pada Edge/Chrome. Mencakup panel Matahari/planet/bulan/katai/komet, fokus/Escape, tautan sumber, placeholder data, regresi planet katai dan transisi kamera; tanpa console warning/error atau pageerror. Tidak mengklaim seluruh suite dijalankan ulang.

Manual: cari Matahari, Bumi, Bulan, Pluto dan Halley bergantian. Periksa heading, satuan, sumber dan Data belum tersedia pada massa objek yang belum memiliki data. Gunakan Tab untuk membaca kontrol; Escape menutup panel dan mengembalikan fokus ke pencarian. Mulai guided tour untuk memastikan pergantian informasi tidak memindahkan fokus dari kontrol tur.

## 13. Accessibility dan UX desktop — 17 Oktober 2026

### Audit dan perubahan

| Area | Hasil dan tindakan |
| --- | --- |
| Button/icon | Tombol native tetap keyboard-operable. Semua icon-button diberi aria-label jika belum ada; label/pressed Free Flight mengikuti state. Focus-visible cyan existing dipertahankan |
| Toggle/kategori | Orbit, Label, Free Flight dan kategori kini mengekspos aria-pressed; Bintang, kedua sabuk, bookmark, fullscreen dan sinematik sudah tersedia |
| Input | Search/select memiliki nama; slider kini aria-valuetext dalam hari simulasi per detik, bukan hanya indeks 0–4. Tombol panah native tetap bekerja |
| Modal | Help diberi aria-labelledby dan fokus awal Tutup. Favorit/perbandingan tetap native dialog dengan nama, autofocus dan pengembalian fokus existing. Tidak menambah focus trap JavaScript; Tab dapat menuju chrome browser ketika hanya ada satu kontrol dialog, tetapi tidak ke kontrol latar inert |
| Panel | Info memiliki aria-labelledby, heading fokus, Escape dan focus return; panel/welcome/HUD tersembunyi inert. Panel nonmodal tidak menjebak Tab |
| Shortcut | P jeda/lanjut simulasi, L fullscreen, H sinematik, G tur, F Visit. Guard dialog, input/select/textarea, contenteditable, modifier dan repeat mencegah shortcut mengambil alih ketika mengetik. Flight WASD/Space/Ctrl/Shift dan pointer lock tetap memakai kontrol existing |
| Bantuan | Daftar WASD, mouse/drag, scroll, Shift, Space/Ctrl, F, G/H, L, P, Escape, Tab/Shift+Tab/Enter/Space dan penjelasan prioritas modal. Dialog dibatasi tinggi viewport dan dapat discroll |
| Kontras | Muted menjadi #b1bfd5; glass-panel lebih opak (0,94–0,96) agar latar planet terang tidak memutihkan panel. Tidak mengganti layout utama |

Acuan perhitungan kontras terhadap panel gelap #1a253a: muted #b1bfd5 ≈8,24:1; label/sumber sekunder #a5b4cc ≈7,30:1; deskripsi #a9b4c9 ≈7,34:1; fokus cyan ≈9,44:1. Ini pemeriksaan palet teks utama, bukan sertifikasi seluruh kombinasi transparansi, perangkat atau pembaca layar. Disabled controls tetap berbeda secara visual. Uji screen reader manual menyeluruh dan zoom ekstrem belum dilakukan.

### Reduced motion

- matchMedia prefers-reduced-motion dipakai di beginTween yang sudah dibagi Visit/Follow/overview/tur: durasi 150 ms, menggantikan 1,2–2,2 detik. Perubahan preferensi saat tween aktif mengawali segmen pendek dari pose sekarang; bila tur dijeda, timestamp pause diselaraskan.
- CSS reduced-motion meminimalkan transisi UI dan mematikan animasi loading-orbit. Efek latar/rim existing tidak memakai blinking; tidak menambahkan efek berkedip. Simulasi orbit dan gerak manual tetap dikendalikan pengguna; reduced motion tidak diam-diam mengubah data/waktu/orbit atau menghentikan Follow. Shortcut P tersedia untuk pause simulasi.
- File: src/main.js, src/ui/UIController.js, src/styles.css, index.html, e2e/accessibility.spec.js dan dokumen ini. Tidak mengubah data/sistem orbit, dependency atau melakukan git commit.

### Validasi

- `npm.cmd test`: **42/42 lulus**.
- `npm.cmd run build`: berhasil, 32 modul, aplikasi 96,80 kB, CSS 14,63 kB; Three.js tetap terpisah 499,98 kB sebelum gzip.
- `npm.cmd run test:e2e -- e2e/accessibility.spec.js e2e/cinematic.spec.js e2e/sciencePanel.spec.js`: **10/10 lulus**, exit code 0, 43,1 detik pada Edge 1366×768 dan Chrome 1920×1080; tanpa console warning/error atau pageerror. Memeriksa bantuan bernama, fokus kembali, modal shortcut guard, P/L, input guard, slider, pressed state, outline keyboard serta reduced motion saat startup dan saat tween aktif; termasuk regresi cinematic dan panel ilmiah.
- Assertion awal terlalu ketat mengharuskan Tab tetap di dalam dialog satu tombol. Disesuaikan untuk perilaku native yang mengizinkan fokus chrome browser/body tanpa memfokuskan kontrol latar; tidak mengubah dialog menjadi trap buatan demi test.

Manual: buka bantuan lewat Tab/Enter, baca shortcut dan tutup dengan Escape; fokus harus kembali ke bantuan. Coba P/L/H dari tombol biasa dan pastikan tidak berjalan ketika mengetik di search. Ubah slider dengan panah. Aktifkan reduced motion di pengaturan OS/browser lalu Visit beberapa objek, termasuk saat transisi sedang berlangsung. Gunakan favorit/perbandingan dengan Tab/Shift+Tab dan pastikan Escape mengembalikan fokus ke kontrol pembuka.

## 14. Performa dan quality preset — 17 Oktober 2026

Default aplikasi adalah **Medium**; tidak menebak kelas GPU dari user agent. Pilihan melalui tombol kualitas disimpan sebagai string JSON pada `milky-way-observer.quality.v1`. Hanya low/medium/high diterima; JSON rusak, nilai asing, array/object, getter storage ditolak atau storage kosong kembali ke Medium. Kegagalan menulis tidak menghentikan perubahan kualitas sesi dan ditampilkan sebagai pesan. Tidak menyimpan atau mengubah data ilmiah.

| Parameter | Low | Medium (default) | High |
| --- | --- | --- | --- |
| DPR maksimum | 0,85 | 1,25 | 1,75 |
| Bintang | 2520 | 5040 | 9000 |
| Asteroid | 600 | 1200 | 1900 |
| Kuiper | 900 | 1800 | 3600 |
| Sphere Matahari/planet/katai (segmen width × height) | 24×16 | 40×24 | 64×40 |
| Sphere bulan | 12×8 | 16×12 | 24×16 |
| Atmosfer/corona/glow/coma | Mati | Aktif | Aktif |
| Haze dekoratif | Mati | Aktif | Aktif |

- Preset rendering berada di `src/data/quality.js`; jumlah sabuk tetap memakai konfigurasi visual seeded existing. Tombol, renderer/DPR dan scene memakai pilihan awal yang sama. Siklus Medium → Low → High → Medium; pilihan tersimpan dipulihkan setelah reload.
- Saat preset berubah, hanya geometry sphere permukaan diganti; mesh/material/tekstur/parent, seleksi dan orbit dipertahankan. Geometry lama langsung dispose. Memilih preset yang sudah aktif tidak mengalokasikan geometry baru. Tidak membuat ulang scene setiap frame; detail ring, hit sphere dan shader shell tetap ringan dan tidak diganti.
- Bintang/sabuk memakai drawRange pada buffer existing. Low tidak membebaskan seluruh buffer partikel atau menurunkan resolusi JPEG; ini mengurangi kerja render, bukan klaim penggunaan memori minimum. Aset shared tetap dibuang melalui traversal Set existing ketika scene dilepas.
- Audit loop: updateLabels langsung return ketika label/HUD disembunyikan, menghindari world transform, proyeksi dan string CSS yang tidak tampak. Saat terlihat, jarak dihitung sekali per label. Cache loader, scratch vector safety/flight/background dan UI speed existing tetap dipakai. Tidak ada event listener baru untuk preset dan tidak ada dependency performa.
- FPS opt-in hanya pada Vite development melalui `/?debug`. Counter menghitung frame per interval satu detik dan menulis satu output kecil; normal URL tidak membuat overlay. Guard import.meta.env.DEV menghilangkan jalur debug dari production. Tidak mengaktifkan preserveDrawingBuffer atau screenshot runtime.
- Skrip benchmark sekarang secara eksplisit memilih High sebelum seri pengukuran High/Medium/Low, agar perubahan default tidak membuat label hasil salah. Laporan benchmark historis tidak ditimpa.

### Beban tersisa dan batas pengukuran

Kandidat biaya terbesar dari audit kode: fill-rate/DPR saat planet atau shell transparan menutupi banyak layar, geometry High, proyeksi/penulisan DOM label yang terlihat, world transform serta collision/swept checks pada semua objek, dan pembuatan procedural map saat startup. Ini kandidat, **bukan ranking hasil GPU profiler**. Buffer partikel/tekstur tetap resident dan penambahan detail shader belum diukur lintas GPU. Benchmark jangka panjang, retained heap dan adaptive quality masih belum dikerjakan; FPS debug bukan bukti bebas leak.

### File dan validasi

File runtime: quality.js (baru), SolarSystem.js, SpaceBackground.js, UIController.js, main.js, index.html. Test: quality.test.js/quality.spec.js baru; observer/regions/rendering diperbarui untuk default Medium. scripts/profile.mjs memastikan preset benchmark benar. Tidak ada git commit.

- Unit test mencakup sanitasi storage, JSON rusak, array/object, storage ditolak dan round-trip semua preset.
- `npm.cmd test`: **43/43 lulus**. `npm.cmd run build`: berhasil, 33 modul; aplikasi 97,94 kB dan Three.js 499,98 kB sebelum gzip. Pencarian pada bundle produksi tidak menemukan debug-fps/FPS, sesuai guard development-only.
- `npm.cmd run test:e2e -- e2e/quality.spec.js e2e/rendering.spec.js e2e/regions.spec.js e2e/observer.spec.js`: **12/12 lulus**, exit code 0, 2,1 menit, Edge/Chrome; tidak ada console warning/error atau pageerror. Mencakup persistensi/reload, storage rusak, FPS opt-in, disposal geometry, reuse jika preset sama, identitas mesh/material, DPR/resize, jumlah sabuk dan regresi observer.
- Manual: reload tanpa preferensi harus Medium; ubah Low lalu reload harus Low. Beralih beberapa kali, pilih objek dan pastikan panel/Follow tetap berfungsi. Jalankan dev dengan `?debug` untuk FPS; URL biasa tidak menampilkan counter. Coba data storage rusak, lalu reload dan pastikan kembali Medium.

## 15. Finalisasi Phase 4 — 17 Oktober 2026

Baseline Git `4cb7276`, working tree bersih sebelum pekerjaan. Tidak ada dependency, aset, data ilmiah, sistem orbit atau fitur besar baru. Tidak melakukan git commit/reset. Riwayat bagian 1–14 dipertahankan; status akhir harus mengacu pada bagian ini.

### Temuan integrasi dan perbaikan

Regresi browser menemukan Visit antarbulan dapat berhenti di depan Uranus/Saturnus sehingga klik pusat bulan memilih planet yang menghalanginya. Planner memakai bola pembungkus cincin yang lebih besar daripada volume tabrakan aktual, hanya mencoba empat arah detour, dan pemilihan endpoint belum mempertimbangkan cincin. Akibatnya semua kandidat lintasan bisa ditolak meskipun ada ruang kosong yang aman.

`src/main.js` sekarang menguji segmen planner memakai `CameraSafety.resolve`, sama dengan guard runtime, memeriksa endpoint terhadap cincin dan mencari maksimal 64 arah seeded/geometris tetap dengan 32 sampel lintasan. Scratch planner dialokasikan saat Visit, bukan setiap frame. Guard runtime tetap aktif; orbit/posisi objek tidak diubah. Ini pencarian terbatas, bukan jaminan navigasi seluruh konfigurasi dinamis. Unit test menambahkan kasus melewati ruang kosong antara permukaan dan cincin, sekaligus mempertahankan larangan menembus body/cincin. Regresi bulan existing tetap mengharuskan klik memilih bulan yang benar; assertion tidak dilonggarkan.

### Cakupan audit

| Area | Pemeriksaan |
| --- | --- |
| Renderer/pencahayaan | Three.js terpasang 0.180.0; sRGB, ACES exposure 1, DPR cap sesuai preset; PointLight Matahari dan material matte tetap digunakan. Pencarian API legacy dan pemeriksaan source dependency tidak menemukan pemakaian deprecated pada kode proyek untuk versi ini. Clock pada r180 belum ditandai deprecated; tidak menyimpulkan kompatibilitas versi Three mendatang |
| Efek/background | Shader rim/corona kompilasi, parent, Low, disposal dan raycasting diuji; starfield seeded camera-relative dan haze dekoratif tetap non-pickable |
| Kamera | Visit/Follow/tur menggunakan jalur bersama; Escape, takeover mouse/flight, collision body/cincin dan kunjungan bulan diperiksa |
| UI | Cinematic menyembunyikan kontrol dan label tanpa mempersist keadaan tersembunyi; fullscreen masuk/keluar, Escape, API ditolak/tidak ada; panel ilmiah seluruh jenis objek, sumber, nilai kosong dan fokus |
| Accessibility | Keyboard, focus-visible, nama tombol/dialog, modal shortcut guard, time slider dan reduced motion ketika startup/perubahan preferensi. Belum audit screen reader/zoom fisik menyeluruh |
| Kualitas/storage | Default Medium, persist/reload, JSON rusak dan storage ditolak, batas DPR, jumlah partikel, disposal/reuse geometry dan debug FPS |
| Regresi Phase 3 | Search/filter, selection, bulan/katai/cincin/sabuk/komet, pause/resume/speed, tur/flight, bookmark dan perbandingan |
| Fallback | Semua JPEG dipaksa gagal decode; simulasi, navigasi dan panel tetap berfungsi. Callback error loader juga diuji. Browser dapat mencatat error jaringan sendiri pada HTTP 404 sungguhan; itu berbeda dari exception aplikasi |
| Loop/lifecycle | Scratch vector dipakai ulang; geometry tidak dibuat setiap frame, label tersembunyi early-return, material/texture/geometry dispose tersedia. DOM label yang terlihat dan collision/world transform tetap memerlukan kerja per-frame. Tidak mengklaim bebas leak jangka panjang |

### Hasil verifikasi final

- `npm.cmd test`: **43/43 lulus**, termasuk regresi ruang kosong cincin.
- `npm.cmd run build`: **berhasil**, 33 modul. HTML 13,00 kB; CSS 14,63 kB; JS aplikasi 97,84 kB (gzip 31,74 kB); Three.js terpisah 499,98 kB (gzip 126,49 kB). Tidak ada warning/error build.
- `npm.cmd run test:e2e`: **52/52 lulus**, 26 skenario pada Edge 1366×768 dan Chrome 1920×1080. Runner terakhir menyimpan `test-results/.last-run.json` dengan `status: passed` dan `failedTests: []`. Fixture seluruh skenario tidak menemukan console warning/error atau pageerror aplikasi. Screenshot Matahari/Bumi diperiksa; matriks visual lengkap tetap ditunda.
- Warning Node tentang `NO_COLOR`/`FORCE_COLOR` berasal dari environment runner, bukan console aplikasi. Fixture browser tetap menolak console warning/error dan pageerror tanpa menonaktifkan console.
- File finalisasi: `src/main.js`, `test/cameraPolish.test.js`, `README.md`, `docs/phase-4-progress.md`. Aset dan atribusi existing tidak berubah dan tidak diverifikasi ulang daring.

### Ditunda secara eksplisit ke Phase 5

- Galaxy Scene/peta Bima Sakti dan lifecycle lintas-scene; background Phase 4 hanya dekorasi.
- Ephemeris/kalender/epoch, catch-up tab background, tidal locking dan pengayaan data ilmiah dengan sumber terverifikasi; Charon/pendamping tambahan bukan bagian finalisasi.
- Peta awan Venus/tekstur bulan tambahan, dengan lisensi dan verifikasi representasi sebelum integrasi.
- Matriks screenshot deterministik seluruh view/kualitas, label occlusion/overlap, screen reader, browser zoom dan perpindahan monitor fisik.
- Profiling GPU/heap sesi panjang lintas perangkat serta kualitas adaptif. High DPR/transparansi, geometry, DOM label, collision dan procedural startup tetap kandidat biaya; bukan ranking hasil GPU profiler.

Pemeriksaan manual lanjutan: pada Medium, jeda waktu lalu kunjungi Titan → Enceladus dan Titania → Oberon → Ariel. Klik bulan setelah transisi; panel harus menunjukkan bulan yang terlihat, dengan kamera di luar permukaan/cincin. Coba H/Escape dan L/Escape, Tab ke bantuan/favorit/perbandingan, P dan slider, serta perubahan preferensi reduced motion. Jangan menganggap konfigurasi orbit ilustratif sebagai posisi astronomis tanggal nyata.

## 16. Ambient audio lokal — 17 Oktober 2026

- [x] AudioManager modular dengan satu instance aplikasi, terpisah dari lifecycle scene. Loop MP3, default volume 15%, fade 450 ms, play/pause dan mute/volume. Posisi track tidak direset saat pause atau berpindah scene; Galaxy Mode belum tersedia untuk diuji langsung.
- [x] Tidak autoplay saat startup/reload; hanya tombol Enable/Play memulai playback. Penolakan browser ditangkap dan meminta interaksi baru, tanpa retry otomatis.
- [x] Hanya mute/volume dipersist dalam `milky-way-observer.audio.v1`; JSON rusak, tipe salah, nilai di luar rentang dan storage ditolak ditangani. Status playback tidak disimpan.
- [x] Tab tersembunyi langsung pause, tanpa menunggu fade/timer background; kembali hanya melanjutkan intent playback sebelumnya. Pause manual tidak dilanjutkan otomatis.
- [x] File gagal menampilkan unavailable, menghentikan playback dan menonaktifkan kontrol tanpa error/retry berulang. HTTP error dari browser sendiri tetap mungkin jika file benar-benar hilang.
- [x] Kontrol native keyboard dengan aria-label/title, slider dengan nilai persen; tersembunyi bersama cinematic mode. Listener didaftarkan sekali, timer fade diganti/dihentikan, teardown saat keluar halaman. Tidak menambah library.
- [x] README aset mencatat nama/format, sumber berkas pengguna dan lisensi/attribution yang belum diketahui; tidak mengunduh, mengubah, atau menambahkan rekaman musik. MP3 sudah ada sebagai berkas pengguna sebelum tugas. Vite akan menyalin public ke build; izin distribusi perlu dipastikan sebelum deployment.

File baru: `src/core/AudioManager.js`, `src/data/audioPreferences.js`, `src/ui/AudioControls.js`, `test/audio.test.js`, `e2e/audio.spec.js`, `public/audio/README.md`. File berubah: `src/main.js` (inisialisasi audio saja), `index.html`, `src/styles.css`, `README.md`, dokumen ini. Rendering, orbit, kamera dan tur tidak diubah. Tidak ada git commit.

Verifikasi: **46/46 unit test lulus**, mencakup storage, fade, visibility/resume, timeline, autoplay denial dan media error. **Production build berhasil**, 36 modul; JS aplikasi 102,47 kB (gzip 33,06 kB), Three.js tetap terpisah 499,98 kB. **10/10 E2E targeted lulus** pada Edge 1366×768 dan Chrome 1920×1080 (audio, accessibility dan cinematic/fullscreen), 45,6 detik, tanpa console warning/error aplikasi atau pageerror. Seluruh suite E2E tidak diulang pada tugas audio ini; hasil 52/52 di bagian 15 adalah hasil finalisasi sebelumnya.

Cara uji: reload harus diam; Tab ke Enable Ambience lalu Enter, ubah volume dengan panah, mute/unmute, pause dan play. Pindah tab ketika playing lalu kembali; ulangi ketika paused (harus tetap paused). Reload mempertahankan volume/mute namun tidak mulai musik. Ganti MP3 berizin dengan nama sama atau ubah URL AudioManager; perbarui catatan sumber/lisensinya.
