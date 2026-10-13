# Phase 3 - Audit dan rencana pengembangan

Tanggal audit: 11 Oktober 2026 (Asia/Jakarta). Baseline Git: `be4251a`.
Status: **orbit elips, 17 bulan utama, lima planet katai, cincin dan sistem komet Halley telah diimplementasikan (13 Oktober 2026)**. Rincian ada di bagian 8-12.

Bagian 1-7 berikut menyimpan baseline audit sebelum implementasi. Pengguna kemudian memprioritaskan sistem orbit saja; usulan lain belum dikerjakan.

Dokumen audit ini merupakan hasil pemeriksaan workspace, bukan spesifikasi fitur baru yang sudah disetujui. Karena permintaan belum menetapkan daftar fitur Phase 3 secara rinci, backlog di bawah adalah usulan berdasarkan bagian Roadmap dan Fase berikutnya dalam README. Prioritas dan kriteria penerimaan perlu ditetapkan sebelum implementasi masing-masing fitur.

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

### Checklist implementasi - diperbarui setelah tugas orbit

- [x] Tetapkan cakupan tugas pertama: orbit elips, inclination, relasi parent, waktu, garis orbit dan pengujiannya; Galaxy Scene tidak termasuk.
- [x] P3-01: data ilmiah Europa bersumber, definisi/unit dan test tersedia melalui panel existing (bagian 9).
- [x] P3-02a: lengkapi 17 bulan utama yang diminta pengguna, tanpa duplikat atau angka rekaan.
- [ ] P3-02b: verifikasi suhu/rotasi yang masih kosong dan detail lima bulan tambahan di luar daftar tugas.
- [ ] P3-03: tambahkan peta bulan/awan Venus yang berlisensi; integrasikan dengan cache, fallback dan atribusi existing.
- [ ] P3-04: ukur frame-time, heap dan resource pada skenario berulang sebelum menambah efek visual atau kualitas adaptif.
- [x] P3-05a: semua gerakan SolarSystem memakai delta hari simulasi; pause/resume dan pengali waktu diuji deterministik.
- [ ] P3-05b: kalender, kebijakan tab background/catch-up dan jam waktu dinding (di luar tugas ini).
- [ ] P3-06: rancang perbandingan ukuran/jarak dengan angka ilmiah yang terpisah dari skala scene.
- [x] P3-07a: orbit elips sederhana dengan inclination, fase awal, periode dan garis tersinkronisasi.
- [ ] P3-07b: epoch kalender, orientasi node/periapsis dan ephemeris presisi (di luar tugas ini).
- [x] P3-08a: lima planet katai dengan kategori, orbit, label, pencarian, seleksi dan panel.
- [x] P3-08b: satu komet representatif Halley, orbit, nucleus/coma/ekor, pencarian dan panel (bagian 12).
- [ ] P3-08c: Charon/pendamping lain dan Sabuk Kuiper (belum tersedia pada baseline workspace tugas ini).
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


## 8. Implementasi orbit elips - 11 Oktober 2026

Cakupan yang disetujui: sistem orbit saja. Tidak ada perubahan aset/tekstur, narasi tur, panel atau layout UI, dependency maupun commit Git.

### Perubahan

- Delapan planet dan 22 bulan memakai elemen orbit terpisah: `semiMajorAxis` dalam unit scene, `eccentricity`, `inclination` dalam radian, `orbitalPeriod` dalam hari simulasi bertanda, dan `initialAngle` sebagai mean anomaly awal dalam radian.
- Persamaan Kepler `M = E - e sin(E)` diselesaikan dengan Newton yang dibatasi interval dan fallback bisection. Posisi relatif terhadap fokus: `x=a(cos(E)-e)`, dengan sumbu minor diputar sesuai inclination. Kecepatan orbit bertambah di periapsis dan berkurang di apoapsis; bukan simulasi gravitasi n-body.
- Garis orbit menggunakan persamaan geometri yang sama, 160 segmen seperti sebelumnya. Titik garis dibuat sekali; update posisi memakai Vector3 existing tanpa membuat object baru per-frame.
- Semi-major axis planet tetap `orbitRadiusFromAu(orbitAu)` dan bulan tetap `distance` katalog. Radius objek dan periode katalog tidak berubah. Bulan dengan eccentricity sumber 0 tetap memiliki orbit lingkaran, sebagai kasus khusus elips.
- Parent planet adalah group Matahari; frame bulan berada di group pusat planet masing-masing. Kemiringan badan planet, atmosfer dan cincin dipindahkan ke subgroup visual; revolusi planet tidak lagi memutar orientasi seluruh sistem bulan. Garis orbit bulan ikut berpindah bersama induknya.
- Waktu posisi dihitung dari `elapsedDays`. Pause memberi delta 0 dan membekukan seluruh gerakan SolarSystem, termasuk rotasi Matahari dan sabuk asteroid. Resume tidak mengatur ulang fase. Slider waktu tetap memakai alur UI/main existing; rotasi dekoratif Matahari/sabuk sekarang ikut pengali waktu, dengan laju 1x sebelumnya dipertahankan.
- OrbitMotion memakai geometry/material yang tetap terjangkau traversal dispose existing; referensi motion/orbit dibersihkan saat dispose.

### Sumber dan batas ilmiah

Diperiksa 11 Oktober 2026:

- [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/): inclination planet dan eccentricity/inclination Bulan. Eccentricity planet, AU dan periode memakai katalog existing; ini elemen sederhana, bukan satu set osculating elements dengan epoch yang sama.
- [JPL Mean Orbital Elements of Planetary Satellites](https://ssd.jpl.nasa.gov/sats/elem/sep.html): eccentricity dan inclination bulan lain, dibulatkan sesuai tabel. Data sumber disimpan terpisah dari penyesuaian visual.

Batas model:

- Fase awal deterministik memakai hash ID planet dan distribusi indeks bulan existing, bukan posisi langit pada tanggal tertentu. Tidak ada precession, perturbasi, longitude ascending node, argument of periapsis, n-body atau ephemeris.
- Planet, Bulan Bumi dan Nereid memakai bidang referensi ekliptika scene. Satelit lain memakai pendekatan bidang ekuator planet; bidang Laplace JPL tidak direkonstruksi lengkap. Kemiringan global scene -2,5 derajat tetap untuk presentasi.
- Triton tetap retrograde melalui periode katalog negatif. Inclination geometris memakai `180 - 157,3 = 22,7` derajat agar arah retrograde tidak diterapkan dua kali; nilai inclination sumber tetap tersedia.
- Eccentricity sumber Nereid 0,751 akan membuat periapsis menembus Neptunus dalam skala visual existing. Eccentricity visual dibatasi oleh `1 - (radiusParent + radiusMoon + 0,35) / semiMajorAxis` (sekitar 0,6165). Semi-major axis tetap 9,2; `sourceEccentricity` tetap 0,751. Bulan lain tidak membutuhkan pembatasan. Ini penyederhanaan visual eksplisit, bukan koreksi data ilmiah.
- Rotasi bulan/tidal locking belum dimodelkan secara fisik. Perubahan ini hanya menghitung translasi orbit dan mempertahankan material existing.

### File diubah / ditambahkan

| File | Peran |
| --- | --- |
| `src/core/SolarSystem.js` | Integrasi orbit, hirarki parent/visual tilt, pause konsisten dan pembersihan referensi |
| `src/core/orbitMath.js` (baru) | Validasi, solver Kepler, posisi elips dan inclination tanpa dependency Three.js |
| `src/core/OrbitMotion.js` (baru) | Frame orbit, garis elips dan group objek yang bergerak |
| `src/data/orbitalElements.js` (baru) | Elemen orbit sederhana, konversi skala existing dan catatan sumber |
| `test/orbits.test.js` (baru) | Enam unit test orbit, skala, parent, finite, apsis, arah dan sinkronisasi bidang |
| `e2e/orbits.spec.js` (baru) | Integrasi SolarSystem nyata, pause/resume, kesetaraan pengali waktu, toggle garis, dispose dan UI clock |
| `docs/phase-3-progress.md` | Status, checklist, batas ilmiah, hasil verifikasi dan langkah manual |

### Verifikasi

- `npm.cmd test`: **15/15 lulus** (9 existing + 6 orbit).
- `npm.cmd run build`: **berhasil**, 19 modul; bundle Three.js tetap terpisah (495,34 kB sebelum gzip).
- Unit test mencakup seluruh 30 orbit: posisi finite hingga waktu sangat besar/negatif, batas jarak, periapsis lebih kecil dari apoapsis untuk e>0, kasus lingkaran e=0, skala dan parent, periodicity, arah retrograde, gerak lebih cepat di periapsis, solver e tinggi, bidang garis dan parent translation.
- `npm.cmd run test:e2e`: **8/8 lulus**, Edge 1366x768 dan Chrome 1920x1080, 1,4 menit. Vite dev server dipakai oleh konfigurasi Playwright.
- Skenario baru memeriksa seluruh parent di SolarSystem nyata, pause termasuk rotasi Matahari/sabuk, resume, kesetaraan delta 200x dengan akumulasi 1x, toggle garis, dispose serta tombol waktu/slider UI.
- Regresi existing lulus untuk Visit/Follow, klik/pencarian, tur, Free Flight, kualitas/HUD, resource berulang dan tekstur Matahari saat startup. Tidak ada pageerror/console error pada skenario normal; pengujian fallback sengaja menggagalkan permintaan tekstur. Tidak dilakukan benchmark FPS/heap menyeluruh.

### Cara menguji manual

1. Jalankan `npm run dev` (PowerShell dapat memakai `npm.cmd run dev`), buka URL Vite. Aktifkan garis orbit dan pilih Merkurius lewat pencarian.
2. Tekan Visit lalu zoom keluar dan putar kamera agar garis orbit terlihat. Naikkan slider ke 200 hari/detik: Merkurius mengikuti garis elips, jaraknya dari Matahari berubah, dan bidangnya miring terhadap orbit Bumi. Elips planet lain lebih halus karena eccentricity lebih kecil.
3. Tekan Jeda: planet, bulan, Matahari dan sabuk berhenti; kamera masih bisa dikendalikan. Tekan Lanjutkan: objek meneruskan posisi terakhir. Coba 0,1x, 1x, 10x, 50x dan 200x tanpa reset posisi.
4. Cari Bumi dan tekan Follow pada 10x/50x: kamera mengikuti Bumi; Bulan dan garis orbitnya tetap mengelilingi Bumi yang bergerak. Ulangi untuk Jupiter/Europa dan Uranus/Miranda untuk melihat sistem bulan miring.
5. Cari Neptunus/Nereid: lintasan Nereid memanjang tetapi tidak menembus badan Neptunus. Triton bergerak retrograde relatif sistem ekuator Neptunus.
6. Matikan/nyalakan garis orbit; semua garis planet dan bulan mengikuti toggle. Coba Visit/Follow, klik objek dan jalankan tur singkat untuk memeriksa navigasi tetap nyaman.

Pekerjaan selanjutnya tetap terpisah: epoch/ephemeris, orientasi orbit lengkap, kalender/catch-up, serta model rotasi bulan. Usulan Europa pada bagian 7 adalah rekomendasi audit historis; tugas orbit ini adalah prioritas yang kemudian dipilih pengguna.


## 9. Bulan-bulan utama - 11 Oktober 2026

### Audit sebelum perubahan

- Katalog existing berisi 22 bulan dengan ID unik; **semua 17 bulan yang diminta sudah ada**. Tidak ditambahkan objek baru maupun entri katalog duplikat.
- Daftar cakupan: Bulan; Phobos, Deimos; Io, Europa, Ganymede, Callisto; Titan, Enceladus, Rhea, Iapetus; Titania, Oberon, Ariel, Umbriel, Miranda; Triton.
- Mimas, Tethys, Dione, Nereid dan Proteus tetap tersedia; detail ilmiah tambahan kelimanya di luar cakupan tugas ini.
- OrbitMotion existing sudah menempelkan tiap bulan ke pusat planet induknya. Mesh dan invisible hit area sudah masuk pickables. Pencarian/filter existing sudah menyertakan seluruh bulan. Tidak perlu membuat ulang mekanisme tersebut.
- Panel sebelumnya hanya memiliki diameter untuk semua bulan, beberapa angka Bulan Bumi, dan placeholder generik untuk bulan lain. Diameter berbasis radius rata-rata JPL sudah tersedia dan dipindahkan ke satu tabel, bukan disalin menjadi katalog baru.
- Semua bulan sudah memperoleh CanvasTexture procedural saat konstruksi. Hanya Bulan Bumi memiliki JPEG lokal; kegagalan load/decode mempertahankan material procedural, dan permintaan gagal dicache agar tidak berulang tiap frame. Bulan lain memakai material procedural langsung tanpa meminta file yang tidak tersedia.

### Implementasi

- Tambah `src/data/moonScience.js`: pengayaan ilmiah keyed by ID untuk 17 objek existing, radius seluruh 22 bulan, provenance NASA/JPL dan tanggal verifikasi.
- Lengkapi diameter, estimasi massa/gravitasi, jarak dari pusat induk, periode, komposisi, fakta khusus dan sumber panel. Suhu/rotasi hanya diisi ketika terverifikasi; field lainnya null dan panel existing menampilkan **Belum diverifikasi**.
- Massa dihitung dari GM/G (GM km^3/s^2 dikonversi ke SI). Gravitasi dihitung dari GM/R^2 pada radius rata-rata. Keduanya dilabeli perkiraan; gravitasi pendekatan bola tidak memodelkan variasi bentuk Phobos/Deimos atau percepatan sentrifugal. Tampilan dibulatkan menjadi tiga angka signifikan.
- Diameter adalah dua kali radius rata-rata ekuivalen volume; untuk bulan tidak beraturan bukan ukuran sumbu terpanjang. Jarak adalah semi-major axis, bukan tinggi di atas permukaan atau jarak sesaat.
- Periode bulan selain Bulan Bumi dilabeli **elemen rata-rata JPL**; tidak disamakan dengan periode sideris terukur. Nilainya dipisahkan dari `period` untuk animasi. Bulan Bumi memakai periode sideris NASA Moon Fact Sheet.
- Nama induk memakai nama Indonesia dari katalog planet. `scienceFor` mendukung data katalog bulan maupun data objek scene; tidak mengambil besaran ilmiah dari size/distance/period visual.
- Hapus placeholder ilmiah bulan dari SolarSystem; renderer hanya menambahkan tipe/simbol objek. Data dan narasi berada di modul data, bukan UI atau renderer.
- Sistem orbit, skala, tekstur, tour, layout UI, katalog objek dan dependency tetap. Tidak ada git commit.

### Sumber ilmiah

Diperiksa 11 Oktober 2026; tautan khusus setiap bulan juga tersimpan di dataset dan tampil pada panel:

- [JPL Satellite Physical Parameters](https://ssd.jpl.nasa.gov/sats/phys_par/): radius rata-rata dan GM.
- [JPL Satellite Mean Elements](https://ssd.jpl.nasa.gov/sats/elem/sep.html): semi-major axis dan periode elemen rata-rata, bukan ephemeris.
- [JPL Astrodynamic Parameters](https://ssd.jpl.nasa.gov/astro_par.html): G = 6,67430 x 10^-11 m^3 kg^-1 s^-2.
- [NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) dan [Moon Facts](https://science.nasa.gov/moon/facts/): periode/rotasi, jarak, rentang suhu ekuator, komposisi dan fakta Bulan Bumi.
- NASA Science halaman tiap bulan Mars/Jupiter/Saturnus/Uranus/Neptunus: narasi, komposisi dan suhu/rotasi yang terverifikasi. Komposisi umum bulan besar Uranus memakai [halaman Ariel](https://science.nasa.gov/uranus/moons/ariel/) sebagai sumber tambahan; detail persentase tidak diasumsikan.

Tidak ada aset baru atau hotlink tekstur. Tetap memakai aset lokal Bulan yang atribusinya sudah tersedia dan ilustrasi procedural untuk bulan lain.

### File terkait

- Baru: `src/data/moonScience.js`, `test/moons.test.js`, `e2e/moons.spec.js`.
- Diubah: `src/data/science.js`, `src/core/SolarSystem.js` (hanya metadata bulan), `test/phase2.test.js`, `docs/phase-3-progress.md`.
- Tidak diubah: `celestialBodies.js`, `orbitalElements.js`, `OrbitMotion.js`, `orbitMath.js`, `main.js`, `UIController.js`, `styles.css`.

### Pengujian dan cara memeriksa

- Unit test memvalidasi 17 target hanya muncul sekali, total katalog tetap 22, induk benar, pencarian/filter, data wajib/nilai null eksplisit, angka finite positif, satuan/konversi fisik, sumber, dan independensi data dari skala simulasi.
- E2E baru mencari dan mengunjungi setiap target, memeriksa panel, menutup panel lalu membuka kembali melalui klik objek. Skenario lain memeriksa parent/material/pickables seluruh 22 bulan dan kegagalan loader mempertahankan material serta cache.
- `npm.cmd test`: **18/18 lulus**.
- `npm.cmd run build`: **berhasil**, 20 modul, bundle aplikasi 68,77 kB dan Three.js tetap terpisah 495,34 kB sebelum gzip.
- Suite lengkap browser pertama: 11/12 lulus; satu skenario klik Chrome terganggu reload Vite ketika data terakhir disimpan, yang menghapus status pause.
- Setelah seluruh kode stabil, `npm.cmd run test:e2e -- e2e/moons.spec.js`: **4/4 lulus** pada Edge 1366x768 dan Chrome 1920x1080 (1,4 menit), termasuk pencarian/panel/klik seluruh 17 target. Delapan skenario regresi existing (orbit, tur, kamera, flight, startup/fallback) lulus pada eksekusi lengkap sebelumnya.
- Tidak ada pageerror atau console error pada skenario interaksi bulan normal. Pengujian kegagalan loader mempertahankan CanvasTexture dan cache permintaan. `git diff --check` bersih.
- Manual: jalankan `npm run dev`, pilih kategori Bulan, cari masing-masing nama, Visit, tutup panel dan klik bulannya. Panel harus menampilkan nama, jenis, data dan sumber sesuai objek. Coba Follow dengan waktu berjalan untuk melihat bulan tetap mengikuti induk. Blokir `textures/moon.jpg` di DevTools lalu reload dan kunjungi Bulan: material procedural tetap terlihat dan panel tetap berfungsi.

Sisa pekerjaan: verifikasi suhu/rotasi yang masih null, lengkapi data lima bulan tambahan jika diminta, dan peta tekstur lokal bersumber untuk bulan selain Bulan Bumi. Tidal locking visual tetap merupakan pekerjaan orbit terpisah; informasi rotasi di panel bukan klaim bahwa renderer telah memodelkannya.


## 10. Lima planet katai - 11 Oktober 2026

### Cakupan dan integrasi

- Tambah Ceres, Pluto, Haumea, Makemake dan Eris, semuanya bertipe `dwarf-planet`. Total scene menjadi 36 objek: Matahari, 8 planet, 5 planet katai dan 22 bulan; 35 orbit.
- Katalog planet katai terpisah di `src/data/dwarfPlanets.js`. Delapan planet utama dan 22 bulan existing tidak diubah/ditambah duplikat.
- Kelimanya memakai OrbitMotion/solver elips existing, parent Matahari, inclination, periode dan fase awal ilustratif. Toggle garis, pause/resume dan pengali waktu tetap melalui mekanisme existing.
- Tambah tombol kategori Katai, optgroup Planet katai, dan klasifikasi PLANET KATAI pada panel. Label, raycasting/hit area, Visit/Follow dan pencarian memakai mekanisme existing.
- Material procedural lokal tersedia tanpa unduhan atau permintaan JPEG yang belum ada. Bentuk semua objek masih disederhanakan menjadi bola, termasuk Haumea; tidak mengklaim peta permukaan ilmiah.
- Charon bersifat opsional dan belum dimodelkan. Panel Pluto tetap menyebut lima bulan dan menyatakan pendamping belum dimodelkan. Parent bulan existing masih dibatasi katalog planet utama; perlu perluasan data/validasi tersendiri untuk Charon. Tidak ada perubahan sabuk asteroid, penambahan Sabuk Kuiper, guided tour atau layout besar UI.

### Data dan skala

- Data ilmiah (`dwarfPlanetScience`) terpisah dari radius scene (`visualRadius`: 1,1 sampai 1,5 unit), fase dan orientasi visual. Jarak memakai fungsi kompresi existing `22 + sqrt(AU) * 37`, bukan AU linear. Orbit masih ilustratif: elemen dibulatkan, node/periapsis tidak dimodelkan dan fase awal bukan posisi tanggal saat ini.
- Catatan pada panel dan scale-note UI menyatakan ukuran diperbesar/jarak dikompresi, tidak proporsional. Diameter diberi konteks perkiraan NASA; Haumea disebut memiliki bentuk memanjang meskipun mesh masih bola.
- Massa/gravitasi dan sebagian suhu belum diisi, menggunakan null dan pesan Belum diverifikasi. Rotasi Eris juga belum dipastikan: angka lama pada halaman ringkasan NASA tidak diperlakukan sebagai nilai terbaru yang pasti; Eris tidak diberi putaran rekaan. Pluto memakai arah rotasi retrograde, sedangkan orientasi sumbu scene tetap ilustratif.
- Tidak ada angka panel yang dihitung dari ukuran atau jarak scene. Jumlah bulan adalah snapshot halaman NASA pada tanggal verifikasi, bukan jumlah mesh pendamping.

### Sumber

Diperiksa 11 Oktober 2026; sumber juga tampil di panel:

- [NASA Ceres](https://science.nasa.gov/dwarf-planets/ceres/facts/), [NASA Pluto](https://science.nasa.gov/dwarf-planets/pluto/facts/), [NASA Haumea](https://science.nasa.gov/dwarf-planets/haumea/), [NASA Makemake](https://science.nasa.gov/dwarf-planets/makemake/), [NASA Eris](https://science.nasa.gov/dwarf-planets/eris/): ukuran perkiraan, komposisi/fakta, periode rotasi yang digunakan dan jumlah bulan.
- JPL SBDB API dibaca via HTTPS: `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=NUMBER`, NUMBER = 1, 134340, 136108, 136472, 136199. Snapshot a/e/i/per: Ceres 2,77 AU / 0,0797 / 10,6 derajat / 1680 hari; Pluto 39,6 / 0,252 / 17,1 / 91000; Haumea 43,1 / 0,194 / 28,2 / 103000; Makemake 45,6 / 0,159 / 29 / 112000; Eris 67,9 / 0,438 / 43,9 / 205000.
- Epoch elemen JPL JD 2461200,5 kecuali Pluto JD 2457588,5. Bukan ephemeris dengan satu epoch bersama. Kegagalan akses melalui Python (sertifikat lokal) diselesaikan dengan pembacaan resmi HTTPS melalui sertifikat Windows; tidak menonaktifkan verifikasi sertifikat.

### File

- Baru: `src/data/dwarfPlanets.js`, `test/dwarfPlanets.test.js`, `e2e/dwarfPlanets.spec.js`.
- Integrasi: `src/data/orbitalElements.js`, `src/data/search.js`, `src/data/science.js`, `src/core/SolarSystem.js`, `src/ui/UIController.js`, `index.html`.
- Penyesuaian validasi jumlah orbit/jenis parent: `test/orbits.test.js`, `e2e/orbits.spec.js`.
- Dokumentasi: `docs/phase-3-progress.md`. Tidak ada dependency baru atau git commit.

### Verifikasi

- `npm.cmd test`: 21/21 lulus, termasuk ID unik lintas seluruh kategori, pencarian/filter, parent, skala, posisi finite, data wajib, sumber dan pemisahan data ilmiah/visual.
- `npm.cmd run build`: berhasil, 21 modul; bundle aplikasi 71,71 kB, Three.js tetap terpisah 495,34 kB sebelum gzip.
- `npm.cmd run test:e2e`: **14/14 lulus** dalam 3,1 menit pada Edge 1366x768 dan Chrome 1920x1080. Skenario baru memeriksa kategori/optgroup, label, pencarian, panel skala/sumber, Visit, klik ulang kelima objek dan Follow Eris pada 200 hari/detik.
- Regresi bulan, orbit/waktu, guided tour, Free Flight, resource dan fallback/startup tekstur lulus. Tidak ada pageerror/console error pada skenario planet katai. `git diff --check` tidak menemukan whitespace error; hanya pemberitahuan normal konversi LF/CRLF Windows.

Manual: jalankan `npm run dev`, pilih Katai, cari kelima nama, tekan Enter/Visit, tutup panel dan klik objek untuk membuka kembali. Pastikan label dan tipe PLANET KATAI benar. Coba Follow Eris pada 200 hari/detik; pause/resume dan toggle Orbit/Label tetap berfungsi. Orbit objek jauh bergerak lambat sesuai periodenya. Baca scale-note dan sumber di panel untuk membedakan ilustrasi dari data fisik.


## 11. Sistem cincin planet - 11 Oktober 2026

### Audit baseline

- Saturnus dan Uranus sudah memiliki cincin; tidak membuat cincin Uranus duplikat.
- Implementasi sebelumnya: satu RingGeometry 128 segmen dan CanvasTexture 512x1 per planet, variasi alpha acak dan satu celah. Uranus sudah memakai rentang radius lebih kecil dan opacity rendah.
- Cincin berada di subgroup kemiringan planet sehingga mengikuti posisi/axial tilt, tetapi menjadi sibling mesh planet dan tidak mengikuti rotasi mesh.
- Cincin tidak masuk daftar pickables; picker main menggunakan recursive=false. Dispose existing sudah menelusuri geometry/material/texture scene.

### Implementasi

- Modul `src/core/PlanetRings.js` membuat cincin procedural sepenuhnya lokal menggunakan strip RGBA DataTexture 512x1 (2048 byte data mentah). Tidak memakai gambar eksternal, Canvas 2D atau TextureLoader; tampilan fallback selalu tersedia tanpa jaringan.
- Saturnus: lima pita radial dengan warna/kepadatan berbeda, detail halus dan celah transparan lebar. Seluruh lapisan merupakan variasi tekstur pada **satu mesh**, bukan tumpukan geometri.
- Uranus: empat pita sempit dengan alpha lebih rendah dan warna abu-abu redup. Rentang radius tetap 1,55-1,62 kali radius planet, dibanding Saturnus 1,25-2,25; mempertahankan skala existing.
- Tiap sistem tetap satu geometry 128 segmen (256 triangle), satu material dan satu texture. MeshStandardMaterial menggunakan roughness=1, transparansi, depthTest aktif dan depthWrite nonaktif; forceSinglePass menghindari dua pass untuk permukaan tipis double-sided. Tidak ada object/tekstur yang dibuat pada animation loop.
- Cincin kini menjadi child mesh planet dengan orientasi lokal ekuatorial. Posisi, axial tilt dan spin diwarisi langsung, termasuk arah retrograde Uranus. Pause waktu menghentikan spin bersama planet. Ini pendekatan visual; bukan simulasi kecepatan diferensial partikel cincin.
- Cincin tetap di luar pickables dan raycast-nya dinonaktifkan, sehingga juga tidak menghalangi pemilihan jika kelak picker memakai recursive=true.
- Geometry, material dan DataTexture tetap terjangkau traversal dispose existing. Uji integrasi memverifikasi enam resource dari dua cincin menerima dispose.
- Profil pita adalah ilustrasi visual, bukan rekonstruksi radius/ketebalan cincin ilmiah. Tidak ada aset/sumber eksternal baru. Orbit, data bulan, guided tour, layout UI dan dependency tidak diubah. Tidak ada git commit.

### File

- Baru: `src/core/PlanetRings.js`, `test/rings.test.js`, `e2e/rings.spec.js`.
- Diubah: `src/core/SolarSystem.js` (mengganti helper cincin lama dan parenting), `docs/phase-3-progress.md`.

### Verifikasi

- `npm.cmd test`: **24/24 lulus**. Tiga test baru memeriksa budget geometry/texture, pita/celah/alpha, Uranus yang tipis/redup, transformasi parent, raycasting recursive, disposal dan validasi input.
- `npm.cmd run build`: **berhasil**, 22 modul, aplikasi 72,31 kB dan bundle Three.js terpisah 495,59 kB sebelum gzip.
- `npm.cmd run test:e2e -- e2e/rings.spec.js e2e/observer.spec.js e2e/orbits.spec.js`: **10/10 lulus** dalam 1,7 menit; Edge 1366x768 dan Chrome 1920x1080. Tidak ada pageerror/console error pada skenario cincin.
- Browser menguji parenting/posisi/spin/pause aktual SolarSystem, disposal, serta klik Saturnus dan Uranus setelah Visit. Regresi kamera, tour, Free Flight, orbit/waktu dan startup/fallback tekstur lulus. Suite khusus bulan/planet katai tidak dijalankan ulang karena modul tersebut tidak berubah; unit test datanya tetap dijalankan.
- Tangkapan layar kedua cincin dibuat pada kedua browser; inspeksi gambar Edge mengonfirmasi lapisan/celah Saturnus dan cincin Uranus yang tipis/redup. Tidak dilakukan benchmark FPS penuh; jumlah mesh/material/segmen tetap seperti baseline.
- `git diff --check`: bersih.

Manual: jalankan `npm run dev`, cari Saturnus lalu Visit. Putar kamera untuk melihat pita/celah dan transparansi; tutup panel lalu klik planet. Ulangi untuk Uranus (cincin sengaja jauh lebih redup). Coba Follow, ganti kecepatan waktu dan pause/resume: cincin tetap terpusat dan miring mengikuti planet. Matikan koneksi jaringan setelah aplikasi lokal termuat; cincin tetap tersedia karena procedural.

## 12. Sistem komet Halley - 13 Oktober 2026

### Baseline dan cakupan

Workspace awal bersih, berisi implementasi hingga cincin (bagian 11); modul sabuk Kuiper/benchmark yang disebut percakapan sebelumnya tidak ada pada snapshot ini. Tidak mengembalikan, menghapus atau mereset perubahan apa pun. Tugas hanya menambahkan satu komet; guided tour, orbit planet/bulan dan layout besar tetap menggunakan implementasi existing. Scene menjadi 37 objek dan 36 orbit.

- `src/data/comets.js`: identitas `halley`, tipe `comet`, parameter visual terpisah dari data ilmiah dan formatter panel. Nilai massa/gravitasi/suhu yang belum diverifikasi tetap null. Pencarian mendukung Halley, Komet Halley, 1P/Halley dan Halley's Comet; hasil dikelompokkan sebagai Komet pada kategori Semua.
- `src/data/orbitalElements.js`: komet mengorbit parent Matahari menggunakan OrbitMotion/solver Kepler existing dan garis orbit yang sama dengan geraknya. Sumbu semi-mayor menggunakan kompresi jarak existing, inclination 162,2 derajat dan periode positif menghasilkan gerak retrograde. Pause, resume dan pengali waktu tetap melalui delta hari simulasi.
- Eksentrisitas ilmiah 0,967 disimpan terpisah; visual 0,92 menjaga perihelion di luar radius Matahari yang diperbesar. Tetap sangat elips, tetapi tidak diklaim sebagai ephemeris atau skala fisik proporsional. Fase awal ilustratif, tanpa epoch/node/periapsis presisi. Panel menjelaskan simplifikasi ini.
- `src/core/CometVisual.js`: tiga mesh/material lokal untuk nucleus, coma dan ekor ion lurus. Ekor satu cylinder terbuka dengan alpha vertex memudar; tidak ada particle simulation, gambar eksternal atau alokasi vector/material/geometry pada update. Panjang/opacity meredup terhadap jarak visual secara ilustratif, bukan model sublimasi fisik. Coma dimatikan pada Low; nucleus dan ekor ringan tetap tampak.
- Arah ekor dinormalisasi dari posisi komet dikurangi posisi Matahari dalam frame yang sama. Transformasi root diwarisi keduanya; diuji kembali di koordinat dunia. Kasus posisi berimpit menggunakan arah fallback finite. Coma/ekor tidak menangkap raycast; nucleus dan hit area mengikuti picker existing.
- Label, indikator seleksi, panel, Visit dan Follow memakai jalur existing. TextureLoader tidak meminta file Halley yang tidak ada; material procedural selalu tersedia. Traversal dispose existing membebaskan tiga geometry dan tiga material.

### Sumber dan batas ilmiah

Diperiksa 13 Oktober 2026, juga ditautkan pada panel:

- [NASA Comet Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/cometfact.html), tabel historis diperbarui 2016: a=17,94 AU, e=0,967, i=162,2°, periode 76,1 tahun. Konversi renderer memakai 365,25 hari/tahun. Bukan elemen osculating terbaru.
- [NASA 1P/Halley](https://science.nasa.gov/solar-system/comets/1p-halley/): inti sekitar 15 × 8 km, diameter ringkasan 11 km, rotasi ringkasan 2,2 hari, orbit retrograde dan komposisi dasar. Bentuk nucleus mesh tetap ilustrasi; tidak mengklaim rekonstruksi bentuk atau peta permukaan.

### File dan pengujian

Baru: `src/data/comets.js`, `src/core/CometVisual.js`, `test/comets.test.js`, `e2e/comets.spec.js`.
Integrasi: `src/core/SolarSystem.js`, `src/data/orbitalElements.js`, `src/data/search.js`, `src/data/science.js`, `src/ui/UIController.js`, `src/main.js`, `test/orbits.test.js`, README dan dokumen ini. Kamera hanya menerima override jarak `visitFraming` milik komet, supaya nucleus dan ekor terlihat bersama; tidak ada perubahan arsitektur kamera.

Unit test memeriksa ID unik lintas katalog, pencarian/filter, data wajib/sumber, pemisahan ukuran ilmiah/visual, parent, orbit finite dan perihelion aman, arah ekor termasuk Matahari yang ditranslasikan dan posisi berimpit, serta reuse geometry/material. E2E memeriksa pencarian/panel/Visit/klik/Follow, arah ekor world-space, pause, Low dan enam disposal event.

- `npm.cmd test`: **27/27 lulus** pada kode akhir.
- `npm.cmd run build`: **berhasil**, 24 modul; aplikasi 75,70 kB dan Three.js tetap terpisah 499,85 kB sebelum gzip.
- Browser mencatat 12 skenario komet, orbit/waktu dan observer (tur/flight/startup/fallback) lulus pada Edge 1366×768 dan Chrome 1920×1080. Runner pertama tertahan saat cleanup setelah seluruh skenario selesai; dihentikan setelah hasil skenario tercatat.
- Setelah penyesuaian framing dan opacity ekor, `npm.cmd run test:e2e -- e2e/comets.spec.js`: **4/4 lulus**, exit code 0, 24,5 detik. Tidak ada pageerror/console error pada uji interaksi komet. Screenshot Edge diperiksa: inti, coma, ekor dan panel terlihat; tidak menambahkan shader/texture eksternal.
- `git diff --check`: tidak menemukan whitespace error. Tidak ada dependency baru, reset atau git commit.

Manual: jalankan `npm run dev`, pilih kategori Semua, cari `Halley` atau `1P/Halley`, lalu Enter. Putar kamera untuk melihat nucleus/coma dan ekor lurus menjauhi Matahari. Tutup panel dan klik inti untuk membuka kembali; coba Visit dan Follow. Ubah waktu ke 200 hari/detik, pause/resume dan toggle Orbit. Pada Low, coma hilang tetapi nucleus dan ekor tetap tersedia. Ekor adalah ilustrasi ion; ekor debu melengkung dan aktivitas fisik presisi belum dimodelkan. Tidak ada git commit.
