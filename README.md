# Milky Way Observer

Prototype simulasi 3D Tata Surya yang menggabungkan eksplorasi sinematik dan informasi ilmiah. Dibangun dengan Vite, Three.js, dan JavaScript modular untuk deployment statis di Vercel.

## Fitur saat ini

- Matahari dan delapan planet dengan orbit serta rotasi.
- 22 bulan utama sebagai objek 3D.
- Sabuk asteroid berbasis partikel.
- Guided tour dari Matahari sampai Neptunus.
- Free-flight dengan keyboard dan mouse.
- Pemilihan objek melalui klik atau pencarian.
- Panel informasi astronomi.
- Kontrol waktu, orbit, label, dan kualitas render.
- Tampilan desktop-first dan pemeriksaan WebGL 2.

## Menjalankan di VS Code

1. Buka folder proyek di VS Code.
2. Jalankan `npm install` pada terminal.
3. Jalankan `npm run dev`.
4. Buka URL lokal yang ditampilkan Vite.

Untuk menguji versi produksi:

```bash
npm run build
npm run preview
```

## Kontrol

- Klik objek: membuka detail.
- Pencarian: memilih dan mengunjungi objek.
- `W A S D`: bergerak dalam mode Free Flight.
- Mouse: melihat sekeliling.
- `Space` / `Ctrl`: naik / turun.
- `Shift`: boost.
- `F`: fokus ke objek terpilih.
- `G`: memulai guided tour.
- `H`: menyembunyikan HUD (akan disempurnakan pada fase berikutnya).
- `Esc`: melepas pointer.

## Deployment Vercel

1. Push proyek ke GitHub.
2. Buat proyek baru di Vercel dan pilih repository ini.
3. Vercel akan mendeteksi Vite secara otomatis.
4. Build command: `npm run build`.
5. Output directory: `dist`.

Alternatif CLI:

```bash
npm install -g vercel
vercel
```

## Struktur penting

- `src/core/SolarSystem.js`: pembuatan scene dan benda langit.
- `src/core/FlightControls.js`: kontrol terbang bebas.
- `src/data/celestialBodies.js`: data Matahari, planet, dan bulan.
- `src/ui/UIController.js`: HUD dan interaksi antarmuka.
- `src/main.js`: integrasi engine, kamera, raycasting, dan render loop.

## Catatan skala

Ukuran dan jarak visual sengaja disederhanakan agar seluruh Tata Surya tetap dapat dijelajahi. Nilai ilmiah pada panel informasi disimpan terpisah dari ukuran yang digunakan oleh scene 3D.

## Sumber data awal

- NASA Solar System Exploration: https://science.nasa.gov/solar-system/
- NASA Planetary Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/

Data ini merupakan fondasi konten dan perlu ditinjau kembali ketika detail ilmiah tiap bulan ditambahkan.

## Roadmap

- Detail ilmiah lengkap untuk 22 bulan utama.
- Tekstur planet berkualitas tinggi dengan lisensi yang sesuai.
- Mode perbandingan skala ilmiah.
- Guided tour dengan narasi lebih kaya.
- Planet katai, Sabuk Kuiper, dan komet.
- Galaxy Scene untuk peta 3D Bima Sakti.
