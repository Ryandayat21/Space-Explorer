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
- [ ] Implementasikan dan uji recovery startup/context loss serta fallback JS/no-WebGL.
- [ ] Tentukan Node/install deterministik, CI dan hygiene deployment.
- [ ] Selaraskan README/kontrol/metadata dengan Discovery UI dan Galaxy Mode.
- [ ] Jalankan full E2E dan smoke production terbaru, Linux clean build, fault injection dan storage/capability matrix.
- [ ] Audit screen reader, zoom/kontras, keyboard, Safari/mobile dan low-end desktop GPU.
- [ ] Profil startup/network, audio delivery, memori/GPU dan soak test sesi panjang.
- [ ] Setelah otorisasi terpisah: staging Vercel, URL/domain/header/cache/Range/404/compression dan rollback.
- [ ] Tinjau seluruh gerbang di atas sebelum keputusan rilis production.

Tidak ada klaim production-ready, lisensi aman, bebas leak, bebas vulnerability atau berhasil deploy hanya dari unit test/build lokal ini.
