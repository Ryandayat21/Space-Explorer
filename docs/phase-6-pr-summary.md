# Draft PR — Phase 6: loading resilience, lazy Galaxy loading dan verifikasi rilis

Base yang dituju: master. Head lokal: feat/phase-6-production-vercel. **Draft, belum siap merge rilis.** Dokumen ini hanya teks PR; tidak ada PR yang dibuat atau dikirim.

Startup dan kegagalan WebGL kini menampilkan status serta pemulihan reload, sementara texture/audio opsional tidak memblokir aplikasi. Galaxy diunduh saat pertama kali diperlukan, sehingga JS awal berkurang dari 655.290 menjadi 630.045 byte (gzip 176.958 menjadi 170.046 byte); tidak ada klaim peningkatan FPS atau waktu loading.

Perubahan nyata terhadap master lokal yang diperiksa:

- Entry bootstrap ringan, tahapan loading nyata, watchdog, fallback texture dan diagnostik kegagalan yang tidak berulang.
- Context loss menghentikan render/input/audio; context restored tetap meminta reload. Lifecycle transisi menangani promise gagal/terlambat tanpa membuat renderer atau loop tambahan.
- Lazy import Galaxy dengan timeout dan reuse, tanpa mengubah orbit/kamera/dataset.
- Title/meta sosial teks, favicon lokal, HTML/noscript dan About/Credits; canonical dan og:url memakai domain produksi yang dikonfirmasi pengguna: https://space-explorer-kappa-azure.vercel.app/
- Perbaikan reflow desktop sempit agar kontrol tidak tersembunyi oleh aturan mobile; regression tests produksi.
- .vercel/ di-ignore, konfigurasi Vite/Vercel existing dipertahankan, runbook Preview -> PR -> master dan rollback, checklist rilis dengan batas verifikasi.
- Tambahan pengujian hosting untuk sesi baru/reload, JPEG, Range MP3, missing assets/case, cache dan pencatatan perbedaan entry hash.

## Validasi

- [x] npm test terbaru: 77/77 PASS.
- [x] npm run build terbaru: PASS, 59 modul.
- [x] Historis preview lokal hasil build 20 Oktober: 16/16 PASS pada Edge/Chrome (lihat release-checklist; bukan deployment Vercel).
- [x] Alias publik kappa-azure pada 21 Oktober: 4/4 test fungsi dan audio PASS, 2/2 hosted-assets PASS; tidak ada error console tak terduga.
- [x] Aset salah/tidak ada pada alias memberi 404; audio Range memberi 206; root/sun.jpg tidak immutable.
- [ ] Verifikasi Preview spesifik n3v3h5khd dari sesi sah: saat ini redirect login Vercel.
- [ ] Konfirmasi SHA/branch/environment kandidat deployment cocok dengan PR; entry hash alias berbeda dari build lokal.
- [x] Domain produksi dikonfirmasi pengguna; canonical/og:url diisi https://space-explorer-kappa-azure.vercel.app/ (bukan URL deployment unik/preview).
- [ ] Selesaikan izin audio rekaman/komposisi dan provenance/attribution tekstur.
- [ ] Uji zoom native browser 200%, tab OS sungguhan, screen reader dan pemeriksaan manual lainnya.
- [ ] Konfirmasi dashboard master sebagai Production Branch, runtime efektif dan rollback operasional.
- [ ] Approval merge setelah seluruh blocker selesai; tidak Promote Preview sebagai jalan pintas.

## Blocker dan batas

URL deployment spesifik terlindungi login, sehingga fungsi Phase 6 di sana belum diuji. Alias yang bisa diakses memiliki entry index-jygk-r49.js/index-DAcmkbOo.css, berbeda dari lokal index-DZI3HjNL.js/index-B4rlouQ5.css. Hasil alias tidak membuktikan deployment kandidat benar. Tidak melakukan login/bypass, tidak mengubah protection, domain atau branch.

Izin audio belum terverifikasi tetap blocker distribusi. Tidak ada perubahan pada aset untuk menganggap masalah tersebut selesai. Tidak ada commit, push, merge atau deploy dari tugas finalisasi ini.
