# Phase 3 - Audit dan rencana pengembangan

Tanggal audit: 11 Oktober 2026 (Asia/Jakarta). Baseline Git: `be4251a`.
Status: **audit dan perencanaan selesai; implementasi Phase 3 belum dimulai**.

Dokumen ini merupakan hasil pemeriksaan workspace, bukan spesifikasi fitur baru yang sudah disetujui. Karena permintaan belum menetapkan daftar fitur Phase 3 secara rinci, backlog di bawah adalah usulan berdasarkan bagian Roadmap dan Fase berikutnya dalam README. Prioritas dan kriteria penerimaan perlu ditetapkan sebelum implementasi masing-masing fitur.

## 1. Kondisi baseline dan batas audit

- Proyek existing: Vite, Three.js, JavaScript ES modules; satu aplikasi statis, tanpa backend.
- `package.json`: Three.js `^0.180.0`, Vite `^7.1.7`, Playwright `^1.64.0`. Build yang dijalankan menggunakan Vite **7.3.7** dari instalasi yang tersedia.
- Working tree bersih saat audit dimulai. Tidak ada perubahan pengguna yang dihapus atau direset. Tidak dilakukan commit, instalasi dependency, refactor, atau perubahan kode aplikasi.
- Satu-satunya tambahan sumber pada tugas ini adalah `docs/phase-3-progress.md`. Build menghasilkan ulang `dist/` yang diabaikan Git.
- Semua 10 berkas dalam `src` diperiksa: `main.js`, `styles.css`, `core/SolarSystem.js`, `core/FlightControls.js`, `core/cameraMath.js`, `ui/UIController.js`, `data/celestialBodies.js`, `data/science.js`, `data/search.js`, `data/tour.js`.
- Referensi lokal tambahan: README, package.json, index.html, vite.config.js, kedua berkas unit test, e2e/observer.spec.js, playwright.config.js, daftar tekstur dan ATTRIBUTION.md.
- Audit ini menjalankan unit test dan build. **Browser/E2E tidak dijalankan ulang dalam tugas audit ini.** Status interaksi di bawah didasarkan pada kode dan cakupan pengujian yang tersedia; hasil browser sebelumnya bukan hasil eksekusi baru.
- Sumber NASA/JPL dan lisensi diperiksa sebagai metadata yang sudah tersimpan di repository, bukan diverifikasi ulang secara daring pada audit ini.

### Hasil perintah

PowerShell menggunakan `npm.cmd` agar tidak bergantung pada eksekusi `npm.ps1`.

| Perintah | Hasil audit |
| --- | --- |
| `npm.cmd test` | PASS: 9 test, 0 gagal, exit code 0 |
| `npm.cmd run build` | PASS: 16 modul, exit code 0 |

Artefak build: HTML 8,55 kB; CSS 12,59 kB; JavaScript aplikasi 60,81 kB; bundle Three.js terpisah 495,34 kB (gzip 124,75 kB). Tidak ada error build. Angka ini adalah ukuran build, bukan ukuran memori runtime atau bukti FPS stabil.

Unit test mencakup jumlah objek, ID unik, relasi induk bulan, monotonicitas skala, urutan/narasi tur, kelengkapan panel planet, pemisahan nilai ilmiah bulan dari jarak visual, pencarian/filter, serta helper jarak kamera dan perlambatan.

Suite browser saat ini mempunyai **3 skenario x 2 konfigurasi = 6 eksekusi** bila dijalankan penuh: alur desktop, tur otomatis/fallback Bulan, serta tekstur Matahari saat startup/fallback. Konfigurasi: Edge 1366x768 dan Chrome 1920x1080. README masih menyebut 4 skenario E2E dari kondisi sebelum penambahan test startup Matahari; dokumentasi tersebut perlu diselaraskan nanti.

## 2. Implementasi Phase 2 yang sudah tersedia

| Area | Implementasi yang ditemukan | Batas yang perlu dipahami |
| --- | --- | --- |
| Matahari, planet, bulan | 1 Matahari, 8 planet, 22 bulan; registry `objects`, relasi induk, rotasi, orbit, atmosfer dan cincin di SolarSystem | Bulan berbentuk sphere; fase awal dan geometri orbit adalah ilustrasi |
| Free Flight | Pointer lock, WASD, Space/Ctrl, mouse, scroll 1-180, Shift x3,5, interpolasi velocity, perlambatan dekat objek, Escape, reset ketika kehilangan fokus, tombol keluar | Penolakan pointer lock hanya mereset gerak; belum ada pesan khusus. Perlindungan kamera memakai sphere permukaan, bukan lintasan collision fisik |
| Visit / Follow | Tween posisi dan target, tujuan mengikuti posisi terbaru objek selama perjalanan, jarak berdasarkan radius, Follow membawa kamera bersama objek, input manual membatalkan tween | State kamera/tur tersebar antara main dan UI; gunakan alur event yang ada, jangan menambah pengendali kamera paralel |
| Guided tour | 10 pemberhentian, Start/Pause/Resume/Previous/Next/Skip/Exit, progres, framing dan durasi baca 12-16 detik; konten di data/tour.js | Sabuk asteroid adalah target kamera khusus di main, bukan objek registry. Belum ada pilihan rute; tur tidak memakai audio |
| Raycasting | Mesh dan hit sphere minimal radius visual 0,75, indikator seleksi, drag guard 5 piksel, klik kosong aman, reticle saat pointer lock | Hit area memakai unit dunia, belum menyesuaikan piksel layar. Sabuk asteroid tidak dapat dipilih melalui raycaster |
| Pencarian | Fungsi murni searchObjects, nama/ID/alias, case-insensitive, trim, kelompok Bintang/Planet/Bulan, kategori dan empty state | Kategori memfilter hasil pencarian, bukan menghapus objek scene; tipe kategori masih tetap |
| Panel informasi | Nama/jenis, diameter, massa, gravitasi, suhu, jarak, rotasi, revolusi, bulan, komposisi, fakta, tautan sumber; nilai kosong ditandai | Selain Bulan Bumi, banyak parameter satelit masih null. Sumber masih pada tingkat objek; sebagian fakta adalah teks placeholder |
| Tekstur dan visual | 10 JPEG lokal: Matahari, delapan planet, Bulan; cache Promise, lazy loading, fallback procedural, dispose map pengganti; material sRGB, roughness, cahaya, sisi malam, corona, cincin ber-alpha | 21 bulan lain procedural; Venus memakai peta permukaan, bukan awan. Belum ada night map Bumi, cloud map terpisah atau normal map |
| Startup Matahari | Tekstur Matahari diminta sebelum loading screen ditutup, tanpa perlu klik; timeout 4 detik dan delay ready 550 ms menjaga startup dapat dibuka | Pada request tertahan, fallback bisa terlihat setelah timeout; tidak ada retry eksplisit dalam sesi yang sama |
| Waktu / orbit | Pause/resume; 0,1 / 1 / 10 / 50 / 200 hari per detik; planet dan bulan menggunakan deltaDays; toggle garis orbit | Orbit gerak masih lingkaran; tidak ada tanggal, epoch, reset tanggal, rewind atau ephemeris |
| HUD / kualitas | Bantuan, fullscreen, HUD toggle, label, focus state, panel scroll, pemberitahuan mobile; DPR dibatasi dan draw range partikel menyesuaikan kualitas | Mode Low tidak mengurangi resolusi tekstur/geometry yang sudah dialokasikan; reduced-motion CSS belum mengendalikan tween kamera |
| Performa / lifecycle | Asteroid satu Points, vector scratch dipakai ulang, dispose geometry/material/texture, cleanup FlightControls dan OrbitControls saat pagehide, bundle Three.js terpisah | Pemeriksaan resource bukan heap profiling. UI/main belum menyediakan lifecycle teardown menyeluruh untuk pergantian scene tanpa reload |

## 3. Fondasi Phase 3 yang sudah ada sebagian - gunakan kembali

| Kandidat Phase 3 | Fondasi existing | Bagian yang belum tersedia |
| --- | --- | --- |
| Melengkapi sains bulan | 22 ID/induk; moonRadii; scienceFor; tampilan null dan tautan sumber | Nilai terverifikasi per bulan beserta unit, definisi pengukuran, dan provenance per parameter |
| Tekstur bulan / awan Venus | TextureLoader, cache, fallback, disposal, direktori aset dan atribusi | Aset baru; pemetaan aset selain pola ID.jpg. Loader saat ini hanya mengizinkan anggota bodies atau ID moon |
| Perbandingan ukuran / jarak | Data radius, diameter panel, orbitAu, helper visualRadiusFromEarth dan orbitRadiusFromAu | Mode perbandingan, pilihan objek, satuan/legenda, tata letak dan transisi kembali ke observer |
| Orbit elips / kalender simulasi | eccentricity, periode, elapsedDays, helper createOrbitLine menerima eccentricity | Pemanggilan garis orbit masih menggunakan e=0; gerak pivot seragam, bukan solver Kepler atau ephemeris; epoch belum ada |
| Tur tambahan | Array narasi, duration/framing, event dan kontrol tur yang sudah lengkap | Definisi beberapa rute dan target tambahan; hindari membuat UI/timer tur kedua |
| Planet katai / komet / Sabuk Kuiper | Registry objek, partikel sabuk asteroid, pencarian dan panel | Data/renderer/jenis objek baru, pencarian/filter baru, sumber ilmiah dan aturan framing yang sesuai |
| Galaxy Scene | Starfield dekoratif dan kamera existing | Scene galaksi, skala galaksi, katalog bintang, navigasi antar-scene dan pengelolaan resource; starfield sekarang bukan peta Bima Sakti |
| Performa adaptif | Quality preset, DPR cap, draw range, diagnostik khusus DEV, E2E resource | Baseline frame-time/heap jangka panjang pada GPU nyata, kebijakan adaptif, budget tekstur dan resource lintas-scene |

## 4. Temuan dan risiko sebelum memperluas fitur

Temuan berikut berasal dari pembacaan kode; reproduksi browser tambahan belum dilakukan dalam audit ini.

1. **Semantik pause belum seragam.** SolarSystem.update memakai realDelta untuk rotasi Matahari dan sabuk asteroid, sementara planet/bulan memakai deltaDays. Saat timeScale=0, Matahari dan sabuk tetap berputar. Tentukan apakah animasi tersebut dekoratif atau harus ikut pause sebelum menambah kalender simulasi. Pause tur berbeda dari pause waktu: Follow tetap dapat mengikuti planet ketika pembacaan tur dijeda.
2. **Waktu simulasi dibatasi frame.** main membatasi delta hingga 0,05 detik. Ini membantu kontrol tetap stabil, tetapi hari/detik dan durasi baca tur dapat lebih lambat dari waktu dinding pada FPS rendah; tween memakai performance.now. Kalender ilmiah membutuhkan keputusan eksplisit tentang jam simulasi, tab background dan catch-up.
3. **Belum ada model orbit ilmiah lengkap.** eccentricity belum menggerakkan posisi. Orbit bulan menempel pada group planet yang miring; jangan menganggap orientasinya sebagai elemen orbit terverifikasi. Bulan tidak memiliki logika rotasi fisik terpisah berdasarkan data ilmiah.
4. **Data ilmiah dan visual terpisah pada penggunaan, belum sepenuhnya pada skema.** celestialBodies masih mencampur string panel dan parameter scene, sedangkan scienceFor menimpa sebagian data. Banyak string angka belum siap untuk perhitungan perbandingan; `distance` bulan di katalog berarti unit visual. Perlu kontrak data kecil dan bertahap, bukan migrasi besar sekaligus.
5. **Penambahan jenis objek perlu integrasi nyata.** SolarSystem menganggap bodies[0] Matahari dan bodies.slice(1) planet; UI hanya membedakan star/moon/planet. Menambah entri komet ke array saja akan memberi klasifikasi dan perilaku yang salah. Cari semua titik integrasi sebelum menambah tipe baru.
6. **Pengujian masih memiliki celah.** Test kelengkapan planet memeriksa keberadaan nilai dan domain sumber, bukan akurasi tiap angka. Diameter seluruh bulan belum diuji sebagai angka finite positif. Uji boost sekarang menekan Shift lalu memeriksa perpindahan, belum mengukur rasio boost. Collision boundary, pause seluruh objek, retry/timeout startup, pergantian scene, dan frame-time belum diuji khusus.
7. **Performa memiliki fondasi, bukan jaminan.** Seluruh procedural map dibuat saat konstruksi. Quality Low mengurangi draw range/efek tetapi tidak membebaskan buffer atau mengecilkan map. HUD flight dan label diperbarui setiap frame. Ukur dahulu sebelum mengoptimalkan.
8. **Dokumentasi minor tertinggal.** Roadmap lama masih menyebut tekstur planet dan narasi kaya sebagai rencana, padahal sebagian telah selesai. HTML placeholder tur masih 1/9, tetapi UI segera menghitung 1/10 saat tur dimulai. Jangan menafsirkan placeholder ini sebagai kekurangan pemberhentian tur.

Tidak ada temuan di atas yang diperbaiki pada tugas audit ini.

## 5. File yang kemungkinan diubah pada implementasi berikutnya

Daftar bersifat perkiraan; setiap tugas harus membatasi diff sesuai kebutuhan.

| Tujuan | File existing yang relevan | Tambahan yang mungkin diperlukan |
| --- | --- | --- |
| Sains bulan | src/data/science.js, test/phase2.test.js, README.md | Dataset moonScience terpisah bila tabel mulai besar; tidak wajib pada langkah pertama |
| Tekstur/awan | src/core/SolarSystem.js, public/textures/ATTRIBUTION.md, README.md, e2e/observer.spec.js | JPEG/PNG lokal terverifikasi; manifest tekstur jika variasi map membutuhkan |
| Skala perbandingan | src/data/celestialBodies.js, src/core/cameraMath.js, src/main.js, src/ui/UIController.js, src/styles.css, index.html | Modul perbandingan dan unit test matematikanya |
| Orbit/waktu | src/core/SolarSystem.js, src/main.js, src/data/celestialBodies.js, src/ui/UIController.js | Modul perhitungan orbit/clock dan test deterministik |
| Tur tambahan | src/data/tour.js, src/main.js, src/ui/UIController.js, e2e/observer.spec.js | Data rute tambahan bila disetujui |
| Tipe objek baru | src/data/celestialBodies.js, src/data/search.js, src/data/science.js, src/core/SolarSystem.js, src/ui/UIController.js, src/main.js | Data/renderer spesifik hanya jika dibutuhkan |
| Galaxy / lifecycle | src/main.js, src/core/SolarSystem.js, src/ui/UIController.js, src/core/FlightControls.js | Modul GalaxyScene dan lifecycle lintas-scene setelah cakupan disetujui |
| Profiling | e2e/observer.spec.js, playwright.config.js; main/SolarSystem hanya jika perlu instrumentasi | Laporan benchmark, bukan dependency runtime baru secara otomatis |

Tidak ada alasan saat ini untuk mengganti Vite/Three.js, membuat proyek baru, mengubah package dependencies atau menulis ulang seluruh main/UIController.

## 6. Checklist Phase 3

### Audit - selesai

- [x] Baca README, package.json, struktur dan semua modul src yang relevan.
- [x] Petakan objek, kamera, tur, raycasting, pencarian, panel, tekstur, waktu dan orbit.
- [x] Identifikasi bagian yang dapat digunakan kembali.
- [x] Jalankan unit test: 9/9 lulus.
- [x] Jalankan production build: berhasil, Three.js tetap terpisah.
- [x] Catat gap, risiko, file terdampak dan usulan prioritas.
- [x] Simpan audit ini tanpa perubahan aplikasi, reset atau commit.

### Usulan implementasi - belum dikerjakan

- [ ] Tetapkan cakupan Phase 3 dari kandidat roadmap dan acceptance criteria; Galaxy Scene bukan otomatis termasuk tahap awal.
- [ ] P3-01: lengkapi data ilmiah **satu bulan pilot, Europa**, dengan sumber resmi, definisi/unit dan test; gunakan panel existing.
- [ ] P3-02: perluas pola terverifikasi ke bulan Galilea lain dan Titan, kemudian sisa katalog tanpa mengarang nilai kosong.
- [ ] P3-03: tambahkan peta bulan/awan Venus yang berlisensi; integrasikan dengan cache, fallback dan atribusi existing.
- [ ] P3-04: ukur frame-time, heap dan resource pada skenario berulang sebelum menambah efek visual atau kualitas adaptif.
- [ ] P3-05: tetapkan semantik pause/clock; tambah test deterministik sebelum mengubah waktu dan gerakan orbit.
- [ ] P3-06: rancang perbandingan ukuran/jarak dengan angka ilmiah yang terpisah dari skala scene.
- [ ] P3-07: implementasikan orbit elips/epoch bila diprioritaskan, dengan validasi matematis dan sinkronisasi garis orbit.
- [ ] P3-08: perluas katalog ke planet katai/komet/Sabuk Kuiper hanya setelah tipe, pencarian, panel dan kamera siap.
- [ ] P3-09: perluas narasi/rute tur menggunakan data dan kontrol existing.
- [ ] P3-10: rancang Galaxy Scene dan lifecycle resource sebagai tugas tersendiri bila disetujui.
- [ ] Selaraskan README, jumlah skenario test, daftar aset, tanggal sumber dan batas ilmiah setelah tiap tugas.

### Kriteria penerimaan setiap perubahan implementasi

- [ ] Semua fitur Phase 2 tetap tersedia, termasuk tekstur Matahari tanpa klik.
- [ ] Nilai ilmiah baru memiliki sumber resmi, unit/definisi dan tanggal pemeriksaan; nilai tidak tersedia tetap eksplisit.
- [ ] Aset disimpan lokal dengan lisensi/atribusi; kegagalan pemuatan tidak mengunci aplikasi.
- [ ] Unit test terkait dan production build lulus; tidak menambah test yang hanya menyalin implementasi.
- [ ] Perubahan interaksi diuji dengan E2E terkait pada Edge 1366x768 dan Chrome 1920x1080; catat error console dan keterbatasan.
- [ ] Perubahan rendering/lifecycle diperiksa resource dan frame-time dengan baseline yang sebanding.
- [ ] Tidak mereset perubahan pengguna; tidak membuat commit tanpa instruksi.

## 7. Rekomendasi tugas pertama paling aman

**P3-01: lengkapi informasi ilmiah Europa secara terbatas dengan memakai scienceFor dan panel yang sudah ada.**

Alasan: Europa sudah memiliki ID, mesh, relasi Jupiter, orbit visual, pencarian, diameter dasar dan panel. Perubahan dapat dibatasi pada lapisan data dan test, tanpa mengubah kamera, shader, clock atau tata letak aplikasi. Tidak perlu membuat ulang sistem bulan atau panel informasi.

Langkah implementasi berikutnya, bukan pekerjaan pada audit ini:

1. Verifikasi parameter Europa dari NASA/JPL; catat sumber, tanggal akses, satuan dan definisi. Jangan mengisi angka berdasarkan radius visual atau periode animasi.
2. Tambahkan hanya nilai yang terverifikasi sebagai override per-ID; pertahankan null untuk parameter yang belum cukup jelas. Jangan membongkar skema semua planet sekaligus.
3. Tambahkan test untuk diameter finite positif, relasi induk, field baru bersumber, fallback data kosong, serta tidak berubahnya size/distance/period simulasi.
4. Jalankan test/build, lalu buka Europa melalui pencarian dan klik untuk memastikan panel dan Visit/Follow tetap bekerja.
5. Catat hasil dalam dokumen ini sebelum memperluas ke bulan berikutnya.

Definition of done P3-01: panel Europa menampilkan tambahan data bersumber, tidak mengubah tampilan/orbit/kamera existing, dan pemeriksaan terkait lulus. Bila suatu nilai tidak dapat diverifikasi, kelengkapan palsu bukan syarat selesai.
