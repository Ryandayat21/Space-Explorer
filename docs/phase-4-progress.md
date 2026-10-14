# Phase 4 — Scientific & Cinematic Polish

Tanggal audit: 14 Oktober 2026 (Asia/Jakarta). Baseline Git: `f694554`.
Status: **audit dan perencanaan selesai; implementasi Phase 4 belum dimulai**.

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

Checklist implementasi berikut adalah usulan ruang lingkup polish, bukan pekerjaan yang sudah selesai.

### Audit selesai

- [x] Baca baseline, konfigurasi dan implementasi relevan.
- [x] Petakan fitur existing agar tidak dibuat ulang.
- [x] Identifikasi risiko renderer/cahaya/material/efek/background/kamera/HUD/accessibility/loop/resize.
- [x] Jalankan 34 unit test dan production build.
- [x] Dokumentasikan rencana tanpa mengubah kode aplikasi/reset/commit.

### Implementasi bertahap

- [ ] P4-01: reproduksi dan perbaiki fokus welcome tersembunyi, status toggle/slider dan nama dialog. Tambahkan E2E keyboard targeted.
- [ ] P4-02: perbaiki sinkronisasi resize/DPR/fullscreen, termasuk keluar fullscreen melalui Escape dan kegagalan API. Uji kedua viewport, cap kualitas, zoom/perpindahan monitor.
- [ ] P4-03: integrasikan reduced motion pada transisi kamera melalui alur existing; jaga Visit/Follow, pembatalan manual dan tur.
- [ ] P4-04: ambil screenshot baseline deterministik Matahari, Bumi day/night limb, Venus, Saturnus, satu bulan, Halley dan overview pada Low/Medium/High; catat viewport, DPR, posisi kamera dan waktu simulasi yang sama.
- [ ] P4-05: kalibrasi pencahayaan/material/transparansi secara kecil dan terpisah, lalu polish atmosfer/corona jika screenshot membuktikan manfaatnya. Tidak menambahkan bloom/shadow pipeline secara default.
- [ ] P4-06: verifikasi sumber/representasi ilmiah dan aset prioritas (misalnya awan Venus atau satu bulan) sebelum menambah map lokal; perluas loader existing hanya sesuai kebutuhan, sertakan lisensi/fallback/disposal.
- [ ] P4-07: polish background dan keterbacaan label/panel dengan pemeriksaan kontras dan occlusion; pertahankan navigasi dan layout utama.
- [ ] P4-08: profile loop/startup/heap pada interaksi bergerak dan sesi panjang; kurangi kerja label/transformasi terbukti mahal. Bandingkan kualitas dengan baseline dan catat GPU/browser.
- [ ] P4-09: regresi akhir unit/build/E2E, texture failure, keyboard/zoom/reduced motion, resize/fullscreen, console; perbarui README, atribusi dan hasil pengukuran.

**Tugas pertama paling aman: P4-01, khusus fokus welcome yang tersembunyi.** Mulai dengan test Tab yang menunjukkan masalah; perbaiki `hideWelcome` dan pemulihan HUD agar keadaan inert konsisten. Perubahan kecil di UI tanpa menyentuh renderer, data orbit atau kamera; sesudah itu lanjutkan semantik kontrol terkait.

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
