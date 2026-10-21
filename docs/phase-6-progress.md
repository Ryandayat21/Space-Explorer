# Phase 6 - Production Readiness & Vercel

Tanggal audit: **20 Oktober 2026 (Asia/Jakarta)**. Baseline Git: `440dbc2`, working tree bersih sebelum audit. Status: **audit selesai; belum disetujui untuk rilis publik**. Satu-satunya perubahan yang dimaksud pada tugas ini adalah dokumen ini. Build menghasilkan ulang folder dist yang diabaikan Git. Tidak ada perubahan implementasi, dependency upgrade, commit, push, atau deploy.

## 1. Baseline dan hasil perintah

Dibaca: README.md, package.json/package-lock.json, vite.config.js, vercel.json, .gitignore, index.html, docs/phase-5-progress.md (termasuk audit final dan Discovery UI), struktur src dan modul terkait bootstrap, lifecycle, rendering/fallback, aset, search/panel/tur, audio, kualitas dan penyimpanan.

Lingkungan aktual: Windows PowerShell, Node **22.20.0**. Versi installed/lock: Vite **7.3.7**, Three.js **0.180.0**, @playwright/test **1.64.0**. Rentang package.json masih ^7.1.7 / ^0.180.0 / ^1.64.0. Vite installed mensyaratkan Node `^20.19.0 || >=22.12.0`; Playwright >=20. Tidak mengubah rentang atau lockfile.

| Perintah pada audit ini | Hasil |
| --- | --- |
| `npm.cmd test` | 66/66 lulus; 0 gagal/skipped; exit 0 |
| `npm.cmd run build` | Berhasil; 53 modul; exit 0; tidak ada warning/error build |
| Inventaris ukuran public/dist | Diukur langsung dari byte file setelah build |
| Git tracking, ignore, path case, pemindaian pola secret terbatas | Hasil di bagian 7 |

Tidak menjalankan E2E/browser, dev server, preview, npm ci, npm audit, Lighthouse, tes jaringan lambat atau profiling baru pada tugas audit ini. Hasil Phase 5 bersifat historis: 12/12 E2E final Discovery UI dan 22/22 regresi terkait, bukan bukti pengujian browser ulang Phase 6. Full E2E terakhir juga belum diulang setelah seluruh perubahan Discovery UI.

## 2. Bundle dan aset terukur

Ukuran byte adalah ukuran file disk, **bukan** bytes transfer HTTP, VRAM, heap atau ukuran unduhan awal. kB/MB menggunakan basis desimal. Gzip berikut adalah laporan Vite lokal, bukan verifikasi compression CDN.

| Output build | Byte aktual | Gzip laporan Vite |
| --- | ---: | ---: |
| dist/index.html | 15.837 | 4,55 kB |
| dist/assets/index-DAcmkbOo.css | 25.039 | 6,45 kB |
| dist/assets/index-jygk-r49.js | 147.523 | 46,96 kB |
| dist/assets/three-B-02bfyu.js | 499.985 | 126,49 kB |
| Empat output di atas | 688.384 | Penjumlahan bukan ukuran respons nyata |

Three.js tetap dipisahkan lewat manualChunks. Kode kedua mode diimpor statis dan masuk bundle aplikasi; konstruksi Galaxy lazy, tetapi download kode Galaxy belum lazy. Tidak ada source map pada dist hasil ini.

| Aset lokal | Byte aktual |
| --- | ---: |
| audio/Interstellar Main Theme.mp3 | 12.549.142 |
| textures/venus.jpg | 885.075 |
| textures/mercury.jpg | 872.555 |
| textures/mars.jpg | 750.547 |
| textures/jupiter.jpg | 498.976 |
| textures/moon.jpg | 265.744 |
| textures/neptune.jpg | 241.580 |
| textures/saturn.jpg | 199.916 |
| textures/earth.jpg | 149.296 |
| textures/sun.jpg | 144.982 |
| textures/uranus.jpg | 77.751 |
| textures/ATTRIBUTION.md | 2.502 |
| audio/README.md | 1.328 |

- Sepuluh JPEG: **4.086.422 byte** (~4,09 MB).
- Public: **13 file, 16.639.394 byte** (~16,64 MB).
- Dist: **17 file, 17.327.778 byte** (~17,33 MB), termasuk semua public dan kedua dokumen attribution.
- Audio adalah aset terbesar (~72,4% isi dist). `preload='none'` menghindari pemuatan sengaja saat startup; tidak berarti file tidak ikut deployment.
- Seluruh JPEG tidak wajib terunduh saat startup: Matahari diminta awal; lainnya ketika dipilih/dekat kamera. Jumlah request startup nyata belum diukur di audit ini.

## 3. Startup, loading dan WebGL

**Yang tersedia, berdasarkan kode:**

- main.js memeriksa WebGL2 sebelum renderer, membuat UI/audio singleton, menginisialisasi Solar System, resize, render awal, lalu satu RAF.
- Loading screen ditutup setelah promise tekstur Matahari selesai atau timeout 4.000 ms; UI.ready menambah 550 ms fade/delay. Batas sekitar 4,55 detik ini berlaku setelah bootstrap berhasil mencapai pemasangan timer, bukan deadline keseluruhan startup.
- SolarSystem langsung menyediakan procedural map. TextureLoader memiliki success/error callback; request dicache per ID, failure resolve(false) dan status nonblocking, tidak retry berulang. Map lama di-dispose ketika diganti. Texture yang tiba sesudah disposal dibuang; request pending tidak dibatalkan/di-timeout secara individual.
- Shader rim glow diperiksa compile/link melalui probe, dengan fallback material bawaan jika probe gagal; ini bukan fallback untuk seluruh kegagalan WebGL.
- WebGL2 tidak tersedia: body diganti pesan bantuan Three.js, lalu explicit throw. Tidak ada renderer WebGL1 atau tampilan simulasi 2D.
- Context loss: preventDefault dan pesan reload tersedia. Tidak ada alur aplikasi untuk menangguhkan loop/input, tombol reload yang eksplisit, atau koordinasi pemulihan lewat webglcontextrestored. Three.js mempunyai mekanisme internal sendiri; kemampuan pulih penuh aplikasi belum terbukti.

**Gap sebelum rilis:**

1. Tidak ada top-level error boundary untuk kegagalan constructor renderer, pembuatan UI/SolarSystem, render awal atau exception RAF. Startup dapat berhenti sebelum timer tersedia sehingga layar loading berpotensi tertinggal.
2. Kegagalan download/parse entry JS, JavaScript dimatikan, dan error promise tak terduga belum mempunyai fallback HTML/noscript atau recovery menyeluruh. Promise loadSun hanya memakai then di main; callback error tekstur normal sudah ditangani di loader.
3. Pesan context loss memakai app-status yang disembunyikan saat cinematic. Pengguna mungkin tidak melihat instruksi reload pada keadaan itu.
4. Tidak ada pengujian context loss/restore baru, unsupported GPU, browser tanpa WebGL2 atau startup injection pada audit ini. Gap tersebut berasal dari inspeksi kode, bukan klaim crash yang direproduksi.

## 4. Lifecycle dan fitur

| Area | Kondisi yang diperiksa | Batas / prioritas |
| --- | --- | --- |
| ModeController / ModeTransition | Lifecycle initialize/activate/deactivate/update/resize/dispose; tujuan disiapkan sebelum switch; rollback/error hooks; input gate dan Skip; satu renderer/RAF | Lokal sinkron, belum asynchronous import/cancellation. Uji error initialize/activate dan cleanup parsial saat bootstrap diperlukan |
| Solar System | Event wrapper aktif hanya pada mode aktif; deactivate membersihkan selection, follow, flight/tur; dispose controls/resources/listeners | Factory yang throw sebelum integration tersimpan perlu diuji cleanup parsialnya |
| Galaxy | Scene/kamera/pickables terpisah; konstruksi pertama saat masuk; update guarded active; shared resource disposal | Mode inactive dicache sengaja; bukan bukti leak. Low tidak membebaskan buffer maksimum |
| Main loop | Satu RAF; update hanya mode aktif; tab hidden melewati update/render | Loop tidak secara eksplisit berhenti pada context loss; profiling lama bukan bukti bebas leak sesi panjang |
| Search | Combobox/listbox, keyboard / + arrows/Enter/Escape, grouping, alias/recent IDs; fallback antar-mode; AbortController saat dispose | Katalog lokal, tanpa API pencarian. README masih menjelaskan native dropdown/ArrowDown berpindah fokus; dokumentasi harus diselaraskan |
| Panel informasi | Sections, sumber, scientific/model separation, approximate notice, selection state dan close/focus | Bookmark/compare masih solar-only. Kategori dan koordinat Galaxy ilustratif, bukan astrometri |
| Guided tour | Data terpisah per mode; memakai kontrol kamera existing; exit/deactivate; reduced motion | Tidak ada voice-over. Prioritas Escape lintas dialog/tour/transisi perlu regresi penuh sebelum rilis |
| Audio | Satu HTMLAudioElement, tidak autoplay; play dari interaksi; loop/fade; pause tab hidden; resume hanya bila sebelumnya ingin memutar; error unavailable terminal | Lisensi rekaman unresolved; MP3 tetap tersalin ke dist. Browser dapat mencatat HTTP failure; bukan klaim console selalu bersih pada jaringan gagal |
| Storage | Quality, audio, favorites memakai validasi dan try/catch; storage ditolak tidak mematikan aplikasi | Tidak ada sinkronisasi akun/perangkat; migrasi dan privasi cukup dijelaskan sebagai penyimpanan lokal |
| Quality | Medium default; DPR .85/1.25/1.75; sphere detail, efek, stars/regions; Galaxy 12.600/30.240/50.400 points | Low mengubah drawRange dan efek, tidak otomatis mengurangi seluruh resident memory; pilihan UI ada di Solar System |
| Teardown global | Main, SearchCombobox, audio dan mode punya cleanup | UIController/ExplorationUI masih listener singleton seumur halaman tanpa dispose menyeluruh; jangan mengklaim aman untuk remount aplikasi berulang. BFCache persisted sengaja tidak dispose |

Tidak ditemukan kebutuhan backend, akun, secret runtime, hotlink texture, atau layanan font untuk fungsi inti dari kode yang diperiksa. URL NASA/JPL (`science.nasa.gov`, `www.nasa.gov`, `nssdc.gsfc.nasa.gov`, `ssd.jpl.nasa.gov`, `ssd-api.jpl.nasa.gov`) digunakan sebagai referensi data/link, bukan fetching katalog saat runtime. Tidak menguji ketersediaan/redirect link sumber.

## 5. Metadata dan aksesibilitas

- Ada lang=id, charset, viewport, title, description dan theme-color. Description/canvas label masih menyebut Tata Surya saja; Galaxy belum tercakup. Favicon `data:,` masih kosong. Belum ada canonical, OG/Twitter preview, share image, robots.txt/sitemap atau noscript.
- Tidak semua metadata tersebut blocker fungsional; tetapkan domain final sebelum canonical dan kebijakan indeks. Mode tidak mempunyai URL route/deep link tersendiri.
- Focus-visible, label kontrol, combobox semantics, status live, dialog native, inert saat transisi, reduced motion dan pemulihan fokus tersedia dari inspeksi kode. Panel memberi jalur tekstual selain kanvas.
- Panel Galaxy seluruhnya role=status: perlu audit screen reader agar kontrol/detail dinamis tidak diumumkan berlebihan. Shortcut, popover audio, fullscreen, pointer lock, inert dan CSS :has/backdrop-filter membutuhkan matriks browser yang dinyatakan jelas.
- Font CSS menyebut DM Sans/Space Grotesk dengan system fallback; tidak ada file font atau @font-face/@import eksternal. Rendering tipografi dapat berbeda antar OS karena tidak membundel font tersebut.
- Kontras numerik, zoom 200%/400%, NVDA/VoiceOver, keyboard-only lengkap dan browser mobile/Safari **belum diuji ulang**. Jangan mengklaim kepatuhan WCAG hanya karena ARIA dan tests tersedia.

## 6. Deployment dan path

- vercel.json: framework vite, buildCommand npm run build, outputDirectory dist. Konfigurasi lokal konsisten dengan output build; tidak membuktikan deployment berhasil.
- Vite default base root `/`; texture dan audio memakai import.meta.env.BASE_URL. MP3 menggunakan `%20` untuk spasi. Root deployment direncanakan; subpath/custom base belum diuji.
- Sepuluh nama JPEG dari ID katalog, nama MP3, dan **76 impor relatif src** diperiksa terhadap nama file/direktori dengan pencocokan exact case: tidak ditemukan mismatch atau file hilang. Ini pemeriksaan statis Windows; Linux build/HTTP case-sensitivity belum diuji langsung.
- Tidak ada engines di package.json atau file pin Node. Tetapkan versi Node build yang memenuhi lockfile dan kebijakan install deterministik (misalnya npm ci) pada tahap implementasi/CI, tanpa upgrade dependency terlebih dahulu.
- Belum ada konfigurasi khusus response headers/CSP, cache policy aset public, redirect/domain, atau CI workflow yang dilacak. Jangan menganggap default CDN sudah diverifikasi. Chunk JS/CSS hashed; JPEG/MP3 memakai nama tetap, sehingga penggantian aset perlu kebijakan invalidasi cache.
- Saat deploy kelak, verifikasi MIME MP3/JPEG, Range/206 audio, cache HTML vs hashed chunks, 404, compression, asset base path, cold start dan rollback. Tidak mengubah header/routing pada audit ini.

## 7. Git hygiene dan sumber/lisensi

**Tracking/security terbatas:** 130 file tracked pada baseline. Tidak ditemukan node_modules, dist, test-results, playwright-report, .env, key/certificate, log/tmp di tracked paths yang dipindai. git check-ignore mengonfirmasi dist, node_modules, test-results dan .env/.env.production diabaikan. `.vercel/` belum tercakup ignore; folder tersebut belum ada/terlacak, sehingga ini pekerjaan preventif sebelum memakai CLI. package-lock.json dilacak, sebagaimana mestinya. Dokumen benchmark di docs/benchmarks adalah bukti yang disengaja, bukan output runtime.

Pemindaian pola pada file teks tracked untuk private-key header, pola AWS access key, GitHub token dan literal secret/password/token panjang tidak menghasilkan kandidat. Nilai secret tidak dicetak. Ini **bukan** audit secret menyeluruh: tidak memindai seluruh riwayat Git, remote branch, binary, credential store atau dashboard deployment. Tidak ada jaminan repo bebas secret dari pemeriksaan terbatas ini.

**Aset/lisensi:**

- MP3 **dilacak Git** dan ikut dist. public/audio/README.md secara eksplisit menyatakan sumber pengguna dan lisensi/attribution belum diberikan atau diverifikasi. Ini blocker distribusi publik sampai izin jelas atau ada keputusan mengganti/mengeluarkannya dari paket rilis. Audit tidak menghapus atau mengganti file pengguna.
- README dan public/textures/ATTRIBUTION.md mencatat sepuluh JPEG sebagai Solar System Scope/INOVE, CC BY 4.0, URL mirror, perubahan nama/resolusi dan tanggal pengambilan. Dokumen attribution ikut dist. Audit hanya memeriksa catatan lokal; tidak memverifikasi ulang upstream, provenance byte/checksum, grant pemegang hak atau kelengkapan pemenuhan attribution. **Belum menyatakan lisensi aman untuk rilis.**
- Ring, galaxy, glow, background dan permukaan lain procedural menurut kode/catatan; bukan aset katalog bintang. Tidak ada audit asal-usul kode penuh.
- Package metadata installed menyebut Three.js/Vite MIT dan @playwright/test Apache-2.0. Belum mengaudit dependency transitif, notice distribusi bundle, atau legal review; belum ada LICENSE proyek tersendiri yang dilacak. Tetapkan kebijakan lisensi proyek bila akan didistribusikan, tanpa menganggap package private=true sebagai perlindungan aset public.

## 8. Blocker dan urutan perbaikan

| Prioritas | Temuan / gerbang rilis | Kriteria selesai yang disarankan |
| --- | --- | --- |
| P0 - blocker publik | Izin MP3 belum diverifikasi, file masuk deployment | Bukti izin/sumber/attribution tercatat atau keputusan berizin untuk mengganti/mengeluarkan aset; periksa dist hasil akhir |
| P1 - ketahanan startup | Error bootstrap/render dan context loss belum mempunyai recovery menyeluruh | Pesan yang tetap terlihat, recovery/reload jelas; uji WebGL unavailable, constructor gagal, chunk gagal dan context loss/restore; tidak meninggalkan loading/input terkunci |
| P1 - gerbang verifikasi | Belum ada baseline full E2E setelah Discovery UI, Linux clean install atau preview deployment Phase 6 | Full test/build/browser pada baseline final, smoke production dan validasi staging Vercel hanya setelah izin deploy diberikan |
| P1 - provenance rilis | Catatan texture/dependency ada, belum diverifikasi ulang | Sumber/lisensi/notice artefak rilis terdokumentasi; tidak hanya mencantumkan nama lisensi |
| P2 | Node/install/CI/ignore .vercel dan kontrak cache/asset delivery belum ditetapkan | Konfigurasi deterministik, check pipeline, header/cache/Range/MIME diuji |
| P2 | Metadata/README tertinggal; audit aksesibilitas belum lengkap | Dokumentasi combobox terbaru, metadata solar+galaxy, domain/share assets, audit keyboard/reader/zoom/kontras |
| P2 | Audio besar, kedua mode di bundle awal, cached GPU buffers/heap | Budget berbasis profil nyata; throttle network/GPU dan soak test sebelum optimasi terarah |

Tugas implementasi pertama yang paling aman: perbaiki jalur startup/error/reload secara kecil dan teruji, tanpa mengubah renderer/orbit/kamera. Secara paralel administratif, selesaikan provenance audio sebelum paket apa pun dipublikasikan. Jangan otomatis mengunduh pengganti atau menghapus aset.

## 9. Checklist Phase 6

- [x] Audit baseline dan konfigurasi lokal; pisahkan bukti baru dari catatan Phase 5.
- [x] Jalankan npm test dan npm run build.
- [x] Ukur bundle, public, dist dan aset terbesar.
- [x] Inspeksi startup/WebGL/context loss, lifecycle, search/panel/tur/audio/quality.
- [x] Inspeksi metadata, aksesibilitas dari kode, external URL/font dan case-sensitive paths.
- [x] Periksa tracking/ignore dan pola secret terbatas; baca sumber/lisensi lokal.
- [x] Dokumentasikan blocker, batas verifikasi dan prioritas tanpa mengubah implementasi.
- [ ] Selesaikan izin/provenance audio dan verifikasi attribution texture/notice distribusi.
- [x] Implementasikan dan uji recovery startup/context loss serta fallback JS/no-WebGL (pemulihan melalui reload; lihat bagian 10-11).
- [ ] Tentukan Node/install deterministik, CI dan hygiene deployment.
- [ ] Selaraskan README/kontrol/metadata dengan Discovery UI dan Galaxy Mode.
- [ ] Jalankan full E2E dan smoke production terbaru, Linux clean build, fault injection dan storage/capability matrix.
- [ ] Audit screen reader, zoom/kontras, keyboard, Safari/mobile dan low-end desktop GPU.
- [ ] Profil startup/network, audio delivery, memori/GPU dan soak test sesi panjang.
- [ ] Setelah otorisasi terpisah: staging Vercel, URL/domain/header/cache/Range/404/compression dan rollback.
- [ ] Tinjau seluruh gerbang di atas sebelum keputusan rilis production.

Tidak ada klaim production-ready, lisensi aman, bebas leak, bebas vulnerability atau berhasil deploy hanya dari unit test/build lokal ini.

## 10. Loading startup dan Galaxy Mode - 20 Oktober 2026

Bagian 1-9 adalah baseline audit sebelum implementasi. Tugas ini memperbaiki startup/loading saja; orbit, dataset, perhitungan kamera dan generator galaksi tidak diubah. Tidak ada commit atau deployment.

### Pipeline dan kebijakan aset

- [x] Tetap memakai #loading-screen, UIController.ready, SolarSystem.loadTexture dan ModeTransition. Tidak ada TextureLoader, renderer atau animation loop kedua.
- [x] Entry ringan src/bootstrap.js menangkap kegagalan import modul utama dan startup. Status nyata: Inisialisasi, Memuat aset, Menyiapkan scene, Siap. Tahap dapat muncul kembali ketika beralih dari modul wajib ke tekstur opsional; tidak memaksakan urutan persentase fiktif.
- [x] Indikator orbit existing bersifat indeterminate. Tidak ada persentase unduhan atau byte yang dibuat-buat. Status menjelaskan modul wajib, tekstur opsional dan aset procedural Galaxy.
- [x] Aset wajib: modul aplikasi, renderer/WebGL2 dan scene. Kegagalan import/initialization/render awal ditangkap; pesan tetap terlihat dan menyediakan Muat Ulang (navigasi penuh), bukan Retry dalam instance parsial. Tidak ada auto-retry. Error render/update sesudahnya juga menghentikan loop, dengan pemulihan reload.
- [x] Watchdog bootstrap 15 detik memberi penjelasan apabila modul/proses wajib belum siap. Modul yang datang setelah timeout tidak memulai instance terlambat. Watchdog tidak dapat memotong pekerjaan JavaScript sinkron yang memblokir thread; ini bukan jaminan startup di bawah 15 detik pada semua GPU.
- [x] Tekstur Matahari opsional ditunggu maksimal 4 detik melalui promise loader existing. Gagal/reject memakai procedural; request tertahan melepas loading dengan status penjelasan. Tidak mengulang request. Respons terlambat tetap boleh memperbarui texture lewat loader existing, tetapi tidak membuka/menutup ulang loading.
- [x] Audio tetap singleton, preload=none dan opt-in. Tidak ditunggu oleh startup; kegagalan constructor/inisialisasi audio menjadikan kontrol unavailable tanpa mematikan simulasi.
- [x] HTML awal selalu menyediakan instruksi jika modul tidak terbuka dan link Muat Ulang, serta noscript untuk JavaScript nonaktif. Bila bootstrap atau dependensi loader sendiri gagal sebelum dapat dieksekusi, fallback ini tetap statis; bukan klaim watchdog JavaScript dapat bekerja tanpa JavaScript.

### Persiapan Galaxy tanpa flashing canvas kosong

- [x] Fase preparing diperluas pada ModeTransition existing. Input dikunci dan status ditampilkan sebelum konstruksi sinkron Galaxy, dengan kesempatan paint lewat RAF yang sama.
- [x] Tahap aset Galaxy menjelaskan konten lokal/procedural; tidak mengunduh musik. Scene tujuan diinisialisasi/resize/compile sebelum swap.
- [x] Scene/kamera sumber tetap dirender selama persiapan. Swap tetap di midpoint opaque existing; easing, posisi dan durasi gerakan kamera tidak diubah. Pada error persiapan, scene sumber dipertahankan dan overlay pemulihan reload ditampilkan.
- [x] Skip aktif setelah scene siap; permintaan skip programatik saat preparing ditunda sampai tujuan siap. Input/fokus dikembalikan oleh lifecycle existing. Tidak menambah loop animasi atau callback listener saat switch berulang.
- [x] Startup memberi satu kesempatan paint sebelum pekerjaan sinkron; requestAnimationFrame tersebut one-shot, bukan loop kedua. Setelah siap, pengujian mencatat satu pending RAF. Fade mengikuti reduced-motion; theme navy/cyan, status live, inert dan fokus pada Muat Ulang digunakan saat error.

### Verifikasi tugas ini

- npm test: **69/69 lulus**, exit 0. Tambahan mencakup optional asset success/failure/rejection/deadline/late completion dan tahapan prepare/skip sebelum activation. Tes lifecycle lama disesuaikan dengan persiapan bertahap.
- npm run build: **berhasil, 57 modul**, exit 0. HTML 16,14 kB; CSS 25,87 kB; entry 2,72 kB; loadingScreen 1,58 kB; main 148,42 kB (gzip 47,20 kB); Three.js tetap terpisah 499,99 kB (gzip 126,49 kB). Nama chunk hashed berubah akibat entry dinamis; tidak ada dependency baru.
- Browser final: **12/12 lulus** pada Edge 1366x768 dan Chrome 1920x1080, exit 0. Menguji tekstur tertahan/fallback, tahapan startup, satu RAF, zero request MP3, modul wajib gagal + reload, WebGL unavailable, audio initialization gagal, Galaxy initialization gagal, watchdog modul tertahan (timer dipercepat untuk tes), late import tidak memulai aplikasi, serta Skip/pergantian mode berulang. Fixture memeriksa pageerror dan warning/error console aplikasi.
- Sebelum pengulangan final, search Galaxy dan integrasi loading/transisi juga lulus pada kedua browser (12/12 eksekusi saat itu). Seluruh suite E2E tidak dijalankan ulang pada tugas ini.
- Smoke **production preview lokal Chrome** lulus: startup, Galaxy, kembali Solar System, request musik=0, dan kegagalan main chunk yang diinjeksi menampilkan recovery. Console warning/error kosong; screenshot recovery diperiksa. Ini bukan deployment Vercel.

File baru: src/bootstrap.js, src/core/loading.js, src/ui/loadingScreen.js, test/loading.test.js, e2e/loading.spec.js.
File berubah: index.html, src/main.js, src/core/ModeTransition.js, src/ui/UIController.js, src/styles.css, test/modeTransition.test.js, dokumen ini.

### Checklist lanjutan

- [x] Startup, optional asset deadline dan loading Galaxy dengan recovery Muat Ulang.
- [x] Fallback WebGL2 unavailable dan pesan statis untuk JS/modul tidak terbuka.
- [x] Tindak lanjut context loss/restoration dan kondisi cinematic diselesaikan pada bagian 11 dengan kebijakan Muat Ulang, bukan pemulihan GPU in-place.
- [ ] Fault injection seluruh jenis error GPU, clean Linux build, full E2E, slow-network nyata dan profiling GPU lemah.
- [ ] Lisensi audio, provenance aset, metadata/CI dan validasi Vercel tetap mengikuti backlog audit; belum dianggap selesai oleh perbaikan loading.

## 11. Penanganan kegagalan aplikasi - 20 Oktober 2026

Scope hanya kegagalan aplikasi vanilla JavaScript. Tidak mengubah orbit, kamera, dataset, dependency, atau membuat renderer/loader/animation loop tambahan. Tidak ada commit atau deployment.

### Implementasi

- [x] Kegagalan constructor WebGLRenderer diberi kode terpisah dari WebGL2 unavailable dan ditangkap bootstrap. Fallback HTML existing tetap memuat nama proyek, penjelasan, langkah akselerasi grafis/browser/tutup tab berat, dan Muat Ulang.
- [x] Context loss membatalkan RAF, menghentikan update/render dan resize GPU, membatalkan transisi, membersihkan target selection tertunda, menonaktifkan kontrol mode serta menghentikan audio/listener audio. Overlay pemulihan tetap dapat difokuskan saat cinematic atau pergantian mode; dialog/popover ditutup dan ancestor inert dibuka.
- [x] Context restored hanya memperbarui status: konteks tersedia tetapi scene belum dipulihkan. Tidak melanjutkan render atau mengklaim resource GPU sehat. Pemulihan selalu navigasi penuh melalui Muat Ulang, bukan retry instance parsial.
- [x] Listener context loss/restoration dipasang sekali per startup dan dilepas saat pagehide non-BFCache. Cleanup audio idempotent. Callback persiapan transisi async yang terlambat diabaikan setelah dispose; promise rejection diarahkan ke jalur error/unlock existing.
- [x] TextureLoader menangani error callback maupun throw sinkron dan kegagalan pemasangan texture; promise diselesaikan sebagai fallback, sehingga pemanggil lazy-load tidak meninggalkan rejection tanpa handler. Optional-asset rejection tetap nonfatal.
- [x] Rejection fullscreen dan audio play tetap memakai status yang sudah ada. Audio/localStorage yang gagal tetap nonfatal; default atau preferensi sesi dipertahankan.
- [x] Diagnostik terstruktur menggunakan console.info dengan kode kegagalan, nama, dan pesan; deduplikasi per kode selama sesi. Level info sengaja dipakai untuk kegagalan yang sudah ditangani, bukan menyembunyikan exception global. Error Three.js dari constructor tetap terlihat; tidak memasang global handler yang menelan semua error.

### Verifikasi dan batas pemulihan

Hasil perintah dan browser dicatat setelah verifikasi akhir di bawah. Tidak ada pemulihan scene GPU in-place: semua sumber daya baru dibuat oleh halaman baru saat reload. Sumber daya scene lama tetap dimiliki instance yang dihentikan hingga cleanup pagehide/reload; bukan klaim membangun ulang resource yang rusak.

Belum diverifikasi: GPU/driver crash fisik, kehabisan VRAM sungguhan, Safari/Firefox/mobile, context loss dalam fullscreen native pada tiap platform, BFCache lintas browser, sesi soak panjang, screen reader, dan production deployment. WEBGL_lose_context di browser lokal adalah fault injection, bukan pengujian semua kegagalan perangkat keras. Full suite E2E dan preview production tidak dijalankan ulang dalam scope ini.

File implementasi: src/core/failures.js (baru), src/bootstrap.js, src/main.js, src/core/ModeTransition.js, src/core/SolarSystem.js, src/core/loading.js, src/core/AudioManager.js, src/data/audioPreferences.js, src/data/quality.js, src/data/exploration.js, src/ui/AudioControls.js, src/ui/UIController.js, src/ui/loadingScreen.js, src/styles.css.
File pengujian: test/failures.test.js (baru), test/modeTransition.test.js, e2e/failures.spec.js (baru). Dokumentasi: docs/phase-6-progress.md.

- npm test: **73/73 lulus**, exit 0. Termasuk deduplikasi diagnostik, context loss/restoration/cleanup, rejection persiapan mode async dan late completion setelah dispose. Tes audio/storage/fallback existing tetap lulus.
- npm run build: **berhasil, 58 modul**, exit 0. Main 149,66 kB (gzip 47,65 kB), Three.js terpisah 499,99 kB (gzip 126,49 kB), loadingScreen 2,73 kB, entry 2,91 kB, CSS 25,88 kB. Tidak ada dependency baru.
- Browser final: **26/26 lulus** di Edge 1366x768 dan Chrome 1920x1080. Mencakup renderer throw, WebGL unavailable, WEBGL_lose_context dan restore (RAF tetap nol sampai reload), cinematic recovery, context loss saat mode preparation, reload berhasil, optional texture fallback/deadline, startup watchdog, module/scene failure, audio failure, fullscreen rejection, quality/storage rusak dan pergantian mode berulang. Console/pageerror diaudit; satu error Three.js yang sengaja dipicu pada tes constructor dicocokkan secara eksplisit, bukan diabaikan global. Pesan NO_COLOR/FORCE_COLOR berasal dari test runner Node, bukan aplikasi.
- Pada run awal terdapat satu kegagalan assertion teks WebGL lama; pesan WebGL unavailable dan constructor renderer kemudian dipisahkan. Run final di atas lulus seluruhnya. git diff --check tidak menemukan kesalahan whitespace.

## 12. Ukuran unduhan dan lazy loading Galaxy - 20 Oktober 2026

### Baseline dan perubahan

Working tree bersih sebelum tugas. Build baseline diulang sebelum edit (58 modul). GalaxyScene sebelumnya memang baru di-initialize ketika dikunjungi, tetapi import GalaxyMode statis masih memasukkan kode generator, kontrol, marker/panel dan tour ke main. Setelah perubahan, import dinamis baru dipanggil dari fase persiapan ModeTransition pada kunjungan pertama. Solar System tetap menjadi satu-satunya mode terdaftar saat startup. Dataset pencarian/landmark kecil yang dipakai lintas mode tetap tersedia agar pencarian lintas mode berfungsi.

- [x] GalaxyMode dan dependensi khususnya dipisah ke chunk lazy; tanpa preload Galaxy saat startup.
- [x] Satu promise import per halaman; kunjungan berikutnya memakai modul dan scene existing. Quality terbaru dipakai saat konstruksi Galaxy pertama.
- [x] Memakai curtain/loading stage dan RAF existing. Scene sumber tetap dirender saat menunggu modul; swap tetap setelah initialize/resize/compile selesai.
- [x] Import gagal atau lebih dari 15 detik menampilkan pesan koneksi/Muat Ulang melalui fallback existing. Tidak membuat retry renderer atau loop baru. Batas waktu tidak dapat membatalkan unduhan import browser; hasil terlambat tidak menginisialisasi scene setelah timeout/dispose.
- [x] Audio tetap preload=none dan opt-in, bukan dependensi startup atau persiapan Galaxy.
- [x] Tidak mengubah chunkSizeWarningLimit, memasang service worker, cache offline, dependency, atau mengambil aset internet.

### Ukuran sebelum/sesudah

Ukuran byte diukur dari hasil build di filesystem; gzip memakai node:zlib.gzipSync per file. Ini bukan ukuran transfer jaringan terkompresi yang telah diverifikasi pada server Vercel. kB pada output Vite memakai basis 1.000 byte. Jumlah JS awal mencakup entry, loadingScreen/shared, main dan Three.js; tidak mencakup HTML/CSS/texture/audio.

| Komponen | Sebelum (byte / gzip) | Sesudah (byte / gzip) |
| --- | ---: | ---: |
| Main | 149.664 / 47.653 | 124.392 / 40.746 |
| Three.js | 499.985 / 126.493 | 499.985 / 126.492 |
| Entry | 2.914 / 1.459 | 1.840 / 951 |
| loadingScreen/shared | 2.727 / 1.353 | 3.828 / 1.857 |
| Galaxy lazy | termasuk main | 26.589 / 8.799 |
| Jumlah JS awal | 655.290 / 176.958 | 630.045 / 170.046 |
| Jumlah seluruh JS | 655.290 / 176.958 | 656.634 / 178.845 |

JS awal berkurang **25.245 byte mentah / 6.912 byte gzip (~3,9%)**. Total JS justru bertambah 1.344 byte mentah karena penanganan import dan pemisahan chunk; manfaatnya penundaan unduhan Galaxy, bukan pengurangan semua kode. Three.js tetap komponen JS terbesar. CSS tetap 25,88 kB; HTML sekitar 16,14 kB. Tidak mengukur atau mengklaim peningkatan FPS maupun waktu loading.

### Audit texture dan aset

Dimensi dibaca langsung melalui System.Drawing.Image, ukuran melalui filesystem. Public berisi 13 file, total **16.639.394 byte**, tidak berubah. Sepuluh JPEG total **4.086.422 byte**. Tidak mengubah/menghapus sumber asli, format, kualitas atau catatan attribution.

| Texture | Resolusi | Byte sebelum = sesudah |
| --- | --- | ---: |
| earth.jpg | 1024x512 | 149.296 |
| moon.jpg | 1024x512 | 265.744 |
| sun.jpg | 1024x512 | 144.982 |
| mercury.jpg | 2048x1024 | 872.555 |
| venus.jpg | 2048x1024 | 885.075 |
| mars.jpg | 2048x1024 | 750.547 |
| jupiter.jpg | 2048x1024 | 498.976 |
| saturn.jpg | 2048x1024 | 199.916 |
| uranus.jpg | 2048x1024 | 77.751 |
| neptune.jpg | 2048x1024 | 241.580 |

Mercury/Venus/Mars adalah kandidat terbesar untuk kompresi terpisah pada tugas berikutnya. Planet kecil di overview tidak memerlukan detail 2K, tetapi Visit/free-flight memungkinkan close-up; belum ada perbandingan visual lossless/lossy yang membenarkan penurunan resolusi. Loader existing tetap meminta texture ketika dekat atau dipilih dan memakai fallback procedural; kualitas Low membatasi geometry/DPR tetapi belum memilih resolusi texture khusus. Matahari/Earth/Moon 1K dapat terlihat terbatas pada close-up ekstrem; tidak meningkatkan resolusi atau mengunduh pengganti dalam tugas ini.

MP3 **12.549.142 byte** tetap aset terbesar, tidak dimuat sebelum opt-in. Font eksternal tidak ditambahkan. Catatan sumber/lisensi existing di public/textures/ATTRIBUTION.md dan public/audio/README.md dipertahankan; provenance/lisensi belum diverifikasi ulang dan belum dinyatakan aman untuk rilis.

File: src/main.js, src/core/ModeTransition.js, src/core/lazyModule.js (baru), test/modeTransition.test.js, test/lazyModule.test.js (baru), e2e/lazyLoading.spec.js (baru), dokumen ini.

### Hasil verifikasi

- npm test: **77/77 lulus**, exit 0; mencakup import sesuai permintaan, satu promise, rejection tanpa retry otomatis, timeout/late resolution, serta module preparation/dispose sebelum inisialisasi mode.
- npm run build: **berhasil, 59 modul**, exit 0. Nilai tabel di atas berasal dari build final dan baseline yang diukur dalam tugas ini; tidak menaikkan ambang warning.
- Dev browser Edge 1366x768 dan Chrome 1920x1080: **24 skenario tercakup dan akhirnya lulus**. Run awal 22/24; dua kegagalan hanya assertion pesan lama `Scene tujuan gagal` setelah pesan diperluas untuk modul. e2e/loading.spec.js disesuaikan dan kedua skenario dijalankan ulang: **2/2 lulus**. Cakupan: lazy download, reuse, module failure/reload, cross-mode search, texture fallback/deadline, context recovery, constructor failure, mode switch/Skip dan watchdog startup.
- Production preview lokal: **4/4 lulus**, dua browser yang sama. Pengamatan request membuktikan Galaxy chunk=0 dan MP3=0 saat startup, Galaxy chunk=1 setelah kunjungan pertama dan tetap 1 setelah keluar/masuk lagi. Uji module evaluation failure menampilkan recovery dan reload berhasil. Request gagal jaringan asli/HTTP cache CDN bukan bagian pengukuran ini; rejection dan timeout juga diuji di unit test.
- Console warning/error dan pageerror diaudit oleh fixture; error constructor Three.js yang sengaja diinjeksi dicocokkan eksplisit. Tidak ada error aplikasi tak terduga. git diff --check lulus.
- Belum menjalankan full E2E, throttling jaringan representatif, profil FPS/startup timing, perbandingan visual kompresi texture, validasi encoding transfer CDN atau deployment Vercel. Tidak ada commit/deploy.

## 13. Identitas halaman dan informasi publik - 20 Oktober 2026

- [x] Title/nama publik Milky Way Observer; deskripsi meliputi Tata Surya dan Bima Sakti edukatif. Theme-color navy existing dipertahankan (#030712).
- [x] Favicon SVG lokal dibuat dalam proyek, menggantikan data URI kosong. Tidak ada unduhan/layanan eksternal.
- [x] Open Graph: website, site_name, title, description, locale id_ID. Twitter: summary, title, description. Tidak mengisi domain produksi, akun Twitter, atau URL gambar yang belum diketahui.
- [x] Pengantar HTML menjelaskan tujuan/batas visualisasi; noscript menyebut JavaScript dan WebGL 2. Konten singkat tidak bergantung pada renderer atau sukses startup.
- [x] About/Credits melalui tombol bantuan existing, memakai details/summary native di dalam dialog. Tersedia tujuan edukatif, skala disederhanakan, landmark skematis dan partikel bukan katalog bintang lengkap. Keyboard/fokus/Escape memakai mekanisme dialog existing, tanpa listener baru.
- [x] Tautan NASA/JPL sesuai sumber yang dipakai proyek; referensi spesifik tetap di panel objek. Kredit Solar System Scope/INOVE dan klaim CC BY 4.0 ditampilkan sebagai catatan aset lokal, dengan verifikasi provenance/attribution masih tertunda. Aset procedural dan favicon dikreditkan ke proyek.
- [x] Audio pengguna ditandai jelas: izin rekaman/komposisi serta attribution belum terverifikasi; pekerjaan sebelum publikasi, bukan klaim aman karena ada kredit.
- [x] Pemberitahuan desktop existing tetap ringan/nonmodal; pointer-events none agar tidak menangkap klik di atas canvas. Tidak menambah kontrol mobile penuh, analytics, banner cookie, atau layanan eksternal.
- [ ] Setelah URL deployment diketahui: canonical dan og:url absolut yang benar.
- [ ] Setelah gambar sosial berizin tersedia: og:image/twitter:image absolut, og:image:alt/twitter:image:alt dan dimensi yang benar. Jangan memakai placeholder produksi. Uji crawler/kartu sosial setelah URL publik tersedia.
- [ ] Verifikasi provenance/lisensi texture dan izin audio tetap blocker publikasi sesuai audit; tugas ini hanya memperjelas informasi, bukan menyelesaikan izin.

File berubah: index.html, src/styles.css, README.md, dokumen ini. File baru: public/favicon.svg dan e2e/publicInfo.spec.js. Tidak mengubah kamera, orbit, scene, dataset atau dependency; tidak commit/deploy.

Hasil perintah: npm test **77/77 lulus**, exit 0; npm run build **berhasil, 59 modul**, exit 0. HTML 19,87 kB (gzip 5,81 kB), CSS 26,52 kB (gzip 6,75 kB); JavaScript main/Galaxy/Three tidak berubah dari bagian 12. Tidak ada warning build baru.

Browser final: **4/4 lulus** di Edge 1366x768 dan Chrome 1920x1080. Memeriksa title/meta tanpa URL palsu, respons favicon lokal, About via keyboard, expand/close/Escape dan pengembalian fokus, viewport 390x844 dengan notice nonblocking, serta HTML/noscript ketika JavaScript dinonaktifkan. Console warning/error dan pageerror fixture kosong. Pada run awal assertion teks noscript memakai matcher Playwright yang mengabaikan teks elemen tersebut; diganti pembacaan textContent, lalu seluruh tes diulang dan lulus.

Belum diverifikasi: social crawler pada URL publik, screen reader, semua browser/perangkat mobile, full E2E dan audit kontras menyeluruh. Link sumber mengacu catatan/data lokal; tidak memverifikasi ulang ketersediaan atau lisensi upstream dalam tugas ini.

## 14. Verifikasi build produksi - 20 Oktober 2026

- [x] npm test **77/77 lulus**, npm run build **berhasil, 59 modul**, exit 0.
- [x] Menjalankan script npm run preview pada 127.0.0.1:5186. Test produksi menegaskan __observer tidak tersedia; tidak memakai source-module import atau diagnostik dev.
- [x] Tambahan e2e/productionRelease.spec.js menguji startup/fallback texture, mode berulang, search/keyboard/empty, selected landmark/panel, tur kedua mode, minimize/expand, flight/reset, quality, bookmark/compare, audio opt-in/preferences/visibility handler, fullscreen/sinematik, input shortcuts, reduced-motion, storage rusak/ditolak serta console/network.
- [x] Bug rilis ditemukan: aturan mobile menyembunyikan tur dan kontrol lain pada reflow 683x384 (setengah viewport 1366x768). Perbaikan CSS khusus pointer presisi/viewport desktop pendek mempertahankan kontrol, toolbar dua baris, scroll internal dan area panel terpisah. Tidak mengubah scene, kamera, data atau menambah kontrol mobile penuh.
- [x] Regression reflow menguji 683x384 dan 960x540, klik kontrol dan bounding-box pemisahan tur dari panel Galaxy kiri serta tombol sudut. Ini bukan bukti zoom browser asli 200%.
- [x] Final **16/16 browser test produksi lulus** (productionRelease, lazyLoading, publicInfo) pada Edge 1366x768 dan Chrome 1920x1080. Run awal release 7/8; kegagalan reflow menjadi regression lalu lulus setelah rebuild. Console/pageerror bersih; alur normal tidak memiliki requestfailed/HTTP >=400. Invalid texture dan module evaluation failures adalah fault injection yang disengaja.
- [x] Screenshot reflow-tour 683x384, tur 1366x768 dan panel Sirius 1920x1080 ditinjau visual. Artefak berada di test-results dan tidak ditambahkan ke Git.
- [x] docs/release-checklist.md berisi matriks PASS/FAIL/NOT TESTED beserta perintah reproduksi, batas bukti dan checklist manual.
- [ ] Zoom native menu browser 200%, pergantian tab/window OS sungguhan, screen reader/headed fullscreen dan hosting Vercel belum diuji. Visibility handler diuji dengan injeksi event, bukan klaim background-tab/OS behavior.
- [ ] Full suite lama yang memakai __observer tidak dianggap lulus terhadap production; hanya suite produksi yang disebutkan dijalankan. Izin audio/provenance aset tetap blocker publikasi.

Perubahan: src/styles.css, e2e/productionRelease.spec.js (baru), docs/release-checklist.md (baru), dokumen ini. Build akhir: HTML 19,87 kB, CSS 28,04 kB; main 124,39 kB, Galaxy 26,59 kB, Three 499,99 kB. Tidak ada library baru, commit, atau deploy. Tidak mengklaim peningkatan performa, bebas leak, atau production-ready.

## 15. Konfigurasi Vercel existing project - 21 Oktober 2026

- [x] Audit package.json/lockfile, vite.config.js, vercel.json dan .gitignore. Working tree bersih sebelum tugas; branch feat/phase-6-production-vercel.
- [x] Mempertahankan konfigurasi minimal existing: framework vite, npm run build, output dist. Tidak ada client-side URL routes, sehingga tidak menambah SPA rewrite/catch-all untuk aset hilang.
- [x] Tidak menambah cache immutable, header keamanan, runtime override atau dependency upgrade. Node lokal v22.20.0 memenuhi engine Vite lock 7.3.7; runtime dashboard tetap perlu konfirmasi. Dokumentasi resmi Vercel/Vite ditinjau dan ditautkan dalam docs/deployment.md.
- [x] Exact-case audit: 93 import relatif src dan 14 path aset public/dist cocok; public assets disalin tanpa perubahan byte. Tidak ada file .env/node_modules/dist/.vercel terlacak pada pemeriksaan git ls-files. Menambahkan .vercel/ pada .gitignore.
- [x] docs/deployment.md memisahkan fakta repository dan konfirmasi dashboard: root, build/install/Node, master sebagai Production Branch, Phase 6 sebagai Preview, Git integration/protection dan domain assignment. Prosedur import hanya referensi; proyek existing tidak di-import ulang.
- [x] Runbook Preview -> PR base master -> merge -> production serta rollback didokumentasikan. Tidak Promote Preview sebelum merge. Checklist mencakup missing assets 404, cache headers, Range MP3, case-sensitive paths dan pengujian UI.
- [x] npm test 77/77 PASS; npm run build PASS, 59 modul, exit 0. Root dependency declarations cocok dengan package-lock.json. Tidak menjalankan clean install Linux/npm ci atau browser suite ulang karena perubahan hanya ignore/dokumentasi.
- [ ] Dashboard Vercel, URL Preview/domain online, cache/header/404 CDN dan rollback nyata belum diverifikasi; tidak ada login, pembuatan proyek, pengaitan ulang, pergantian domain/Production Branch, push, commit atau deploy.

Pengguna menyatakan proyek sudah online; hal ini bukan bukti konfigurasi dashboard atau izin aset. Audio/provenance tetap mengikuti blocker release-checklist. File berubah: .gitignore, docs/deployment.md (baru), dokumen ini.
