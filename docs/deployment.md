# Deployment Milky Way Observer — Vercel existing project

Audit: **21 Oktober 2026**. Pengguna menyatakan proyek sudah online dan terhubung ke GitHub. Identitas proyek, domain, deployment ID dan dashboard **belum diakses/diverifikasi**. Dokumen ini bukan instruksi membuat proyek baru atau menghubungkan ulang repository.

## Konfigurasi repository yang terverifikasi

`vercel.json` existing dipertahankan:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

| Pengaturan | Bukti repository / hasil lokal | Konfirmasi dashboard |
| --- | --- | --- |
| Framework | Vite vanilla JS; tidak ada SSR/backend/functions | Preset efektif Vite pada proyek existing |
| Root Directory | package.json, lockfile, index.html dan vite.config.js di root repository | Root yang dipilih harus menunjuk folder ini, bukan src/public/dist |
| Build Command | npm run build -> vite build; berhasil | Periksa build log deployment memakai konfigurasi ini |
| Output Directory | dist; tidak ada build.outDir override | Pastikan artefak yang dipublikasikan dist |
| Install | package-lock.json v3 terlacak; root dependency declarations sesuai package.json | Periksa install command/versi npm aktual; tidak menambahkan override |
| Node | Lokal v22.20.0. Lock Vite 7.3.7 mensyaratkan ^20.19.0 atau >=22.12.0 | Konfirmasi versi build aktual memenuhi engine; Node 22.x adalah major yang telah diuji lokal |
| Dependency | Lock: Three 0.180.0, Vite 7.3.7, Playwright 1.64.0 | Tidak upgrade lock/dependency |
| Base URL | Default Vite /; target hosting root | Domain existing tetap; subpath bukan target yang diuji |
| Production Branch | Target alur pengguna: master; tidak dikodekan dalam vercel.json | **Konfirmasi master sudah menjadi Production Branch; jangan menggantinya otomatis** |
| Preview branch | Branch lokal feat/phase-6-production-vercel | Konfirmasi Git deployment branch ini aktif, menghasilkan Preview bukan Production |

Konfigurasi minimal sesuai [Vite static deploy](https://vite.dev/guide/static-deploy.html) dan [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build). Preview server lokal adalah pemeriksaan build, bukan server yang dijalankan terus-menerus di Vercel.

Tidak menambah engines/runtime pin tanpa mengetahui runtime existing. Dokumentasi [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) yang diperiksa mencantumkan 22.x/24.x; pin engines dapat mengoverride dashboard. Karena proyek statis, Node dipakai saat build, bukan runtime server aplikasi. Tidak mengklaim Node 24 telah diuji lokal. Clean install npm ci pada Linux/Vercel belum dijalankan dalam audit ini.

## Routing, cache, header dan path

- Solar System/Galaxy adalah state internal, bukan URL routes. Tidak ditemukan router/history pushState untuk halaman virtual; **tidak menambah SPA catch-all rewrite**.
- Aset hilang harus menghasilkan 404, bukan index.html aplikasi berstatus 200. Tidak ada rewrite, redirect, middleware, custom routes atau fallback aset dalam konfigurasi repository. Ini belum membuktikan tidak ada aturan dashboard/CDN lain.
- Tidak ada custom Cache-Control/immutable di repository. Jangan menambahkan immutable untuk index.html, favicon.svg, textures/*.jpg, audio/*.mp3 atau berkas attribution bernama tetap. Chunk JS/CSS bernama hash berbeda dari public assets. Header CDN efektif harus diperiksa pada Preview; tidak diasumsikan dari preview lokal.
- Tidak menambahkan CSP/COEP/COOP/Permissions-Policy atau header lain. Aplikasi memakai WebGL, shader/procedural canvas, texture lokal, Audio opt-in, fullscreen/pointer lock dan style dinamis. Font memakai system fallback; tidak memuat layanan font eksternal. Header restriktif memerlukan uji kompatibilitas tersendiri.
- Texture URL memakai BASE_URL + textures/<id>.jpg; audio memakai audio/Interstellar%20Main%20Theme.mp3. Huruf besar dan spasi harus sama persis dengan berkas Git. Favicon /favicon.svg, kredit ./textures/ATTRIBUTION.md dan ./audio/README.md sesuai hosting root.
- Audit exact-case memeriksa **93 referensi import relatif** dalam src dan **14 aset public/dist** (10 JPEG, MP3, 2 Markdown, SVG). Semua ada dengan kapitalisasi tepat dan byte public/dist identik. Windows filesystem tidak dipakai sebagai satu-satunya bukti: setiap segmen path dibandingkan dengan nama directory entry secara case-sensitive.
- .env, .env.*, node_modules/, dist/ sudah di-ignore; **.vercel/** ditambahkan. .env.example tetap diizinkan sebagai template tanpa rahasia. git ls-files tidak menemukan file di kategori tersebut yang sudah terlacak. Ini pemeriksaan tracking, bukan audit seluruh histori Git.

## Import repository: catatan referensi, bukan tindakan pada proyek ini

Proyek ini **sudah di-import**. Alur saat ini adalah membuka proyek existing dan memeriksa Settings/Git/Build; jangan memilih Add New Project, Import ulang, vercel link, mengubah domain atau Production Branch.

Untuk dokumentasi prosedur awal saja (hanya bila kelak secara eksplisit diminta membuat proyek terpisah): pemilik memilih Add New Project, memilih repository GitHub yang berizin, memeriksa root/preset/build/output, lalu Import/Deploy. Langkah terakhir menciptakan deployment dan tidak dijalankan dalam tugas ini. Untuk proyek existing, seluruh prosedur import tersebut **dilewati**. Panduan: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Alur branch Phase 6 -> Preview -> PR -> master

1. Pemilik mengonfirmasi dashboard: repository existing benar, Production Branch **master**, branch Preview feat/phase-6-production-vercel tidak dinonaktifkan, tidak ada ignored-build condition yang melewatkan perubahan, serta kebijakan Deployment Protection mengizinkan penguji yang berwenang. Catat juga Node/install command dan apakah auto-assignment domain production sedang aktif. Tidak mengubah apa pun bila berbeda; selesaikan konfirmasi terlebih dahulu.
2. Setelah pengguna mengizinkan commit/push secara terpisah, push branch Phase 6 dan buka PR **base master**. Git integration dapat membuat Preview untuk branch nonproduction; periksa label Environment dan commit SHA, bukan hanya URL. Ambil URL dari GitHub check atau proyek existing; jangan menebak domain.
3. Jalankan checklist Preview di bawah terhadap commit yang sama. Perbaikan berikutnya tetap pada branch ini dan diuji kembali pada Preview terbaru.
4. Setelah pengujian/izin aset dan review lulus, pengguna me-merge PR ke master. Git integration produksi mengikuti konfigurasi master existing. **Jangan Promote Preview ke Production sebagai jalan pintas sebelum merge.**
5. Setelah build master selesai, periksa SHA hasil merge dan smoke test domain production existing. Jangan mengganti domain/branch. Bila auto-assignment dinonaktifkan (misalnya setelah rollback), minta pemilik memutuskan langkahnya; jangan menganggap merge pasti sudah live.

Perbedaan Preview/Production dan pemicu Git didokumentasikan di [Vercel environments](https://vercel.com/docs/deployments/environments). Tidak melakukan push, PR, merge, login, deploy atau perubahan dashboard dalam audit ini.

## Checklist Preview Deployment (belum dijalankan pada Vercel)

- [ ] Catat URL deployment spesifik, SHA, Environment=Preview, branch Phase 6, Node/npm dan build logs. Pastikan domain production existing tidak berpindah.
- [ ] Jalankan cakupan [release-checklist.md](release-checklist.md): startup/fallback, Solar/Galaxy, lazy import, repeated switching, search/keyboard/panel, tur, flight, quality, bookmark/compare, audio opt-in/visibility, fullscreen, reduced-motion/storage. Validasi desktop 1366x768, 1920x1080 dan zoom native 200% yang masih manual.
- [ ] Pastikan JS/CSS hash dan 10 JPEG, favicon serta kredit lokal berhasil; nol MP3 sebelum opt-in. Setelah Play, verifikasi Content-Type audio dan Range request (206 bila Range digunakan), serta kegagalan tidak membuat request berulang.
- [ ] Buka URL aset yang sengaja tidak ada: /textures/__missing__.jpg, /audio/__missing__.mp3, /assets/__missing__.js. Harus 404 dan bukan HTML aplikasi berstatus 200. Request /textures/Sun.jpg (kapitalisasi salah) tidak boleh diam-diam membuka aplikasi.
- [ ] Periksa response headers index.html dan aset bernama tetap: tidak immutable. Periksa stale page/lazy chunk setelah deployment baru; pesan reload harus bekerja bila chunk lama tidak tersedia.
- [ ] Audit console dan Network tanpa error tak terduga; bedakan fault injection dari request normal. Periksa aturan header/redirect dashboard/protection yang mungkin berbeda dari kode.
- [ ] Selesaikan izin audio dan provenance/attribution tekstur sebelum distribusi. Preview juga menyajikan aset; jangan menganggap Preview otomatis bebas kewajiban izin. Repository saat ini masih memuat MP3 dengan izin belum terverifikasi; tidak dihapus dalam audit ini.
- [ ] Simpan deployment production sebelumnya yang sehat beserta SHA untuk rollback. Approval PR dilakukan setelah bukti Preview dicatat.

## Rollback bila rilis gagal (dijalankan pemilik setelah otorisasi)

1. Catat deployment/SHA gagal dan gejalanya. Hentikan merge lanjutan; buka proyek existing, pilih Instant Rollback dan deployment production sebelumnya yang sehat/eligible.
2. Periksa domain dan rincian target sebelum konfirmasi rollback. Ketersediaan target bergantung plan/izin; jangan membuat proyek/domain baru bila opsi tidak tersedia.
3. Setelah rollback, periksa domain existing serta startup, texture, mode dan audio. Rollback memakai build lama, bukan rebuild dengan environment terbaru; bukan revert histori Git.
4. Buat revert/fix PR melalui review dan Preview agar master tidak tetap membawa bug. Jangan force-push/reset master.
5. Vercel dapat menonaktifkan auto-assignment domain production setelah Instant Rollback. Saat perbaikan yang sudah di-merge master siap, pemilik memverifikasi dan memakai alur Undo Rollback yang sesuai untuk memulihkan deployment normal; jangan mempromosikan branch Phase 6 yang belum di-merge.

Sumber prosedur/limit: [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback). Ini runbook, bukan rollback yang telah dilaksanakan atau diuji.

## Hasil audit lokal

21 Oktober 2026: npm test **77/77 PASS**, npm run build **PASS (59 modul)**. Main 124,39 kB; Galaxy 26,59 kB; Three 499,99 kB; CSS 28,04 kB; HTML 19,87 kB. Konfigurasi aplikasi dan runtime tidak diubah. Perubahan hanya .gitignore dan dokumentasi. Dashboard, Preview Vercel, domain production dan rollback nyata tetap **NOT VERIFIED**; pengguna belum memberikan URL/config snapshot untuk pemeriksaan tersebut.
