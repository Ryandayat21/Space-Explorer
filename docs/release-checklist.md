# Release checklist — Milky Way Observer

Tanggal: 20 Oktober 2026. Scope: hasil `dist` melalui **npm run preview**, bukan dev server dan bukan deployment. Status PASS hanya berlaku pada skenario dan lingkungan yang disebutkan; bukan jaminan seluruh perangkat atau production-ready.

## Lingkungan dan reproduksi

- `npm test`: 77/77 PASS, exit 0.
- `npm run build`: PASS, 59 modul, exit 0. Main 124,39 kB, Galaxy lazy 26,59 kB, Three 499,99 kB; CSS setelah perbaikan reflow 28,04 kB, HTML 19,87 kB.
- `npm run preview -- --host 127.0.0.1 --port 5186 --strictPort` menyajikan hasil build.
- PowerShell: `$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:5186'`, lalu `node node_modules/@playwright/test/cli.js test e2e/productionRelease.spec.js e2e/lazyLoading.spec.js e2e/publicInfo.spec.js`.
- Browser: Edge headless 1366x768, Chrome headless 1920x1080. Test release menegaskan `window.__observer` tidak tersedia: tidak memakai API diagnostik dev atau import `/src`.
- Screenshot disimpan oleh Playwright dalam `test-results/productionRelease-*/`: galaxy-panel.png, galaxy-tour.png, reflow-tour.png dan reflow-half-viewport.png. Direktori hasil tes tidak dimaksudkan untuk dilacak Git.

## Pemeriksaan produksi

| Pemeriksaan | Status | Bukti / batas pemeriksaan |
| --- | --- | --- |
| Startup | PASS | Loading selesai dari dist pada kedua browser; tidak memakai dev diagnostics. |
| Texture fallback | PASS | Semua JPEG sengaja diganti payload tidak valid melalui interception; status procedural muncul, pencarian Bumi dan pergantian mode tetap berfungsi. Ini decode failure, bukan uji semua jenis gangguan jaringan. |
| Solar System dan Galaxy | PASS | Panel objek Solar dan landmark Galaxy dibuka; Galaxy terlihat setelah transisi. |
| Pergantian mode berulang | PASS | Lima pergantian berturut-turut dalam release test; tambahan reuse di lazyLoading. Bukan soak test/memory profile. |
| Galaxy lazy import dan fallback | PASS | Nol request Galaxy sebelum dibuka, satu request untuk kunjungan berulang; fault injection module gagal memberi reload dan berhasil setelah pemulihan. |
| Search hasil/empty/keyboard | PASS | Query tidak dikenal menampilkan empty state; ArrowDown/Enter membuka Bumi; memilih Sirius membuka panel Galaxy. |
| Selected landmark dan panel | PASS | Sirius memiliki aria-pressed=true; nama dan Sources muncul di panel; Escape menutup panel. |
| Guided tour Solar | PASS | Start, pause/resume, Next dan Exit melalui kontrol produksi. |
| Guided tour Galaxy | PASS | Start, pause/resume, Next, minimize/expand, Exit; narasi disembunyikan/dikembalikan. |
| Free-flight Solar/Galaxy | PASS | Pointer lock masuk/keluar, WASD dikirim pada Solar, Escape melepaskan lock; tidak mengukur lintasan kamera secara numerik. |
| Reset view Galaxy | PASS | Tombol reset dapat diaktifkan setelah keluar flight; tidak memakai assertion koordinat internal dev. |
| Quality presets | PASS | Siklus tiga preset kembali Medium; kontrol juga bisa diklik pada reflow desktop. Bukan benchmark GPU. |
| Bookmark dan comparison | PASS | Bumi ditandai, daftar favorit memuat Bumi, tabel Bumi/Jupiter memuat diameter Jupiter. |
| Audio opt-in | PASS | Nol MP3 sebelum interaksi; Play menghasilkan status aktif, pause berhenti, reload tidak autoplay. |
| Audio mute/volume | PASS | Volume 12 disimpan, mute memudarkan elemen Audio hingga 0, pilihan bertahan setelah reload. Instrumentasi hanya menangkap instance HTMLAudioElement melalui init script, bukan import source. |
| Audio visibility handler | PASS | document.hidden dan visibilitychange diinjeksi: playback dijeda, hanya playback yang sebelumnya aktif dilanjutkan. |
| Tab background OS sungguhan | NOT TESTED | Visibility injection tidak membuktikan throttling/tab suspension asli. Uji manual di bawah. |
| Fullscreen/sinematik | PASS | Fullscreen API aktif, H-mode melalui tombol menyembunyikan HUD, Escape mengembalikan UI dan keluar fullscreen. Headless API, bukan observasi window manager. |
| Shortcut saat mengetik | PASS | g/h/l/p diketik di search tidak membuka tur, fullscreen atau sinematik. |
| Reduced motion | PASS | Alur eksplorasi/tur/pergantian mode dijalankan dengan prefers-reduced-motion: reduce. Tidak mengukur durasi frame. |
| Storage rusak | PASS | JSON tidak valid untuk quality/audio/favorites tidak mematikan startup dan operasi UI. |
| Storage tidak tersedia | PASS | Getter localStorage melempar error; bookmark sesi tetap bekerja, status sesi tampil, Galaxy bisa dibuka. |
| Console/error aset normal | PASS | Fixture memeriksa warning/error console dan pageerror; alur utama juga mencatat requestfailed dan HTTP >=400, hasil kosong. Fault injection disengaja dipisahkan. |
| Metadata/About/noscript | PASS | publicInfo menguji metadata, SVG, keyboard dialog, HTML tanpa JS, serta notice kecil pada preview produksi. |
| Layout 1366x768 dan 1920x1080 | PASS | Kontrol penting dapat diklik sepanjang alur; screenshot panel/tur diambil. Lihat batas inspeksi visual di catatan verifikasi. |
| Reflow efektif 683x384 dan 960x540 | PASS | Setengah viewport desktop untuk mendekati layout pada zoom 200%; tombol tur/kualitas, search/panel/reset/tur dapat digunakan; overlap tur vs panel kiri/mode/sinematik diuji melalui bounding boxes. **Bukan pengukuran zoom browser asli.** |
| Zoom browser asli 200% | NOT TESTED | Headless viewport resize tidak setara seluruh perilaku zoom browser (rasterisasi/DPR/menu browser). Wajib validasi manual di menu browser sebelum rilis. |
| Semua suite E2E lama | NOT TESTED | Banyak suite lama bergantung __observer dan /src; tidak dijalankan seolah-olah valid terhadap dist. Suite produksi khusus ditambahkan. |
| Lisensi audio/provenance tekstur untuk publikasi | FAIL | Izin audio belum terverifikasi; attribution/provenance tekstur perlu peninjauan. Bug UI yang diperbaiki tidak menghapus blocker ini. |
| Vercel/CDN/cache/Range/404 | NOT TESTED | Tidak deploy. Preview lokal tidak membuktikan perilaku hosting. |

## Bug rilis dan regresi

Run pertama release: 7/8 lulus. Reflow 683x384 gagal karena #tour-button tersembunyi oleh aturan mobile; inspeksi CSS juga menemukan panel dan time controls disembunyikan. Perbaikan dibatasi pada CSS desktop `(pointer: fine)`, lebar <=1050px dan tinggi <=650px: toolbar dua baris, kontrol existing dipertahankan, dock dapat digulir, panel memakai ruang terpisah dan internal scroll. Tidak menambah kontrol mobile atau mengubah scene/kamera.

Regression: `zoom-equivalent reflow keeps key controls reachable` pada e2e/productionRelease.spec.js. Memeriksa klik nyata dan bounding-box tur agar tidak menutupi mode toggle, tombol sinematik atau panel Galaxy kiri.

## Checklist manual yang masih wajib

1. Buka preview pada desktop 1366x768 dan 1920x1080; gunakan **menu browser Zoom 200%**, bukan CSS zoom/pinch. Pastikan toolbar, search, panel objek, quality, About, tur dan tombol Exit dapat dicapai dengan mouse maupun Tab; periksa scroll internal dan tombol tutup. Kembalikan 100% setelah uji.
2. Putar ambience, pindah tab/window sungguhan: pastikan berhenti saat tersembunyi dan hanya melanjutkan bila sebelumnya aktif. Ulangi setelah Pause; pastikan tidak autoplay. Periksa juga kebijakan autoplay perangkat lain.
3. Uji fullscreen secara headed, kontrol pointer lock/Escape, serta screen reader dan kontras. Headless PASS tidak menggantikan pemeriksaan perangkat input/OS.
4. Sebelum distribusi: selesaikan izin audio dan attribution; setelah otorisasi deployment terpisah, uji CDN/static paths, request Range MP3, cache header, fallback dan social crawler.

Tidak commit atau deploy. Status keseluruhan: **belum memberi persetujuan rilis publik**, karena blocker izin aset dan pemeriksaan manual/hosting masih terbuka.

## Hasil akhir dan inspeksi visual

Setelah perbaikan CSS dan rebuild: **16/16 test produksi PASS** pada Edge dan Chrome (productionRelease, lazyLoading, publicInfo), exit 0. npm test **77/77 PASS** dan build PASS. Screenshot reflow-tour 683x384, galaxy-tour 1366x768, serta galaxy-panel 1920x1080 diperiksa secara visual: panel/kontrol terpisah dan teks dapat dibaca pada gambar tersebut. Pemeriksaan tidak mencakup setiap posisi kamera, kombinasi panel atau level zoom.

## Addendum online — 21 Oktober 2026

Bagian sebelumnya adalah hasil preview lokal 20 Oktober, bukan bukti deployment Vercel Phase 6. User memberikan dua URL. Konfirmasi user: domain produksi belum ditetapkan untuk metadata; canonical/og:url tetap kosong.

| Target / pemeriksaan | Status | Bukti |
| --- | --- | --- |
| Deployment n3v3h5khd dari sesi baru | FAIL | Redirect ke Login – Vercel; blocker akses, bukan error aplikasi. Tidak login atau bypass. |
| Fitur/asset Phase 6 pada deployment n3v3h5khd | NOT TESTED | Aplikasi tidak dapat dibuka tanpa otorisasi Vercel. |
| Alias space-explorer-kappa-azure.vercel.app sesi baru/reload | PASS | HTTP 200 dan aplikasi terbuka; dua browser headless. |
| Alias: JS/CSS/texture normal | PASS | Tidak ada request gagal/HTTP >=400 pada alur UI; semua 10 JPEG diperiksa 200 image/jpeg. |
| Alias: kedua mode/search/panel/tur | PASS | productionRelease discovery: 2/2 PASS (Edge 1366x768, Chrome 1920x1080). |
| Alias: audio opt-in/mute/volume | PASS | productionRelease audio: 2/2 PASS; MP3 tidak diminta sebelum Play, tidak autoplay setelah reload. |
| Alias: audio Range | PASS | 206 audio/mpeg; bytes 0-1023/12549142; 1024 byte diterima. |
| Alias: console/pageerror | PASS | Tidak ada error/warning tak terduga dari fixture pada skenario yang diuji. |
| Alias: missing assets/case | PASS | Missing JPEG/JS/MP3 dan Sun.jpg salah kapitalisasi memberi 404, bukan HTML aplikasi berstatus 200. |
| Alias: cache index/sun.jpg | PASS | public, max-age=0, must-revalidate; tidak immutable. Tidak digeneralisasi ke seluruh response. |
| Kesamaan artefak alias dengan kandidat Phase 6 | FAIL | Hash entry alias berbeda dari dist lokal; SHA deployment tidak diketahui. PASS alias bukan acceptance Phase 6. |
| Domain produksi untuk canonical | NOT TESTED | User meminta tetap kosong karena belum dikonfirmasi. |
| Zoom native 200%, tab OS asli, screen reader, rollback/dashboard | NOT TESTED | Tetap membutuhkan pemeriksaan yang sah/manual. |
| Izin audio dan provenance/attribution | FAIL | Belum ada bukti penyelesaian sejak audit sebelumnya. |

Total online alias: **6/6 test PASS**, terdiri dari empat test fungsional dan dua test hosted-assets. Test baru: e2e/onlineAssets.spec.js; jalankan dengan PLAYWRIGHT_BASE_URL HTTPS yang diotorisasi. Nama file hash berbeda dicatat rinci di phase-6-progress bagian 16. Local rerun 21 Oktober: **77/77 unit PASS**, build PASS (59 modul).

**Keputusan: belum siap merge ke master untuk rilis.** Dapat ditinjau sebagai draft PR; akses Preview kandidat/SHA dan blocker izin aset harus diselesaikan lebih dulu. Tidak menganggap login HTTP 200 sebagai PASS aplikasi dan tidak memakai alias untuk melewati proteksi deployment.


### Konfirmasi metadata domain produksi ? 21 Oktober 2026

Pembaruan setelah audit di atas: pengguna mengonfirmasi `https://space-explorer-kappa-azure.vercel.app/` sebagai domain produksi saat ini. Canonical dan og:url pada index.html kini memakai URL tersebut dengan trailing slash yang sama, termasuk untuk build Preview. URL deployment unik/preview branch tidak digunakan. Jika beralih ke custom domain, perbarui kedua field, README dan e2e/publicInfo.spec.js. Catatan sebelumnya tentang domain belum dikonfirmasi adalah riwayat sebelum konfirmasi ini. Gambar sosial tetap belum ditentukan. Konfirmasi domain tidak menyelesaikan blocker akses Preview kandidat, perbedaan artefak, atau izin aset; tidak ada commit/push/deploy.
