# Ambient audio lokal

- Nama yang diharapkan: `Interstellar Main Theme.mp3` (case-sensitive pada hosting Linux).
- Format: MPEG audio / MP3, disajikan sebagai `audio/mpeg`.
- Sumber: berkas lokal yang sudah disediakan pengguna di workspace. Tidak diunduh atau dibuat oleh implementasi ini.
- Lisensi: **belum diberikan/diverifikasi**. Nama berkas bukan bukti kepemilikan atau izin penggunaan. Tidak diklaim sebagai public domain atau bebas royalti.
- Attribution: persyaratan belum diketahui; ikuti lisensi pemilik rekaman dan komposisi sebelum mendistribusikan. Attribution saja tidak menggantikan izin.

Kode tidak menyertakan/mengunduh rekaman baru. Gunakan musik milik sendiri atau berlisensi sesuai kebutuhan distribusi. Vite menyalin isi `public` ke build: pastikan rekaman yang disertakan dalam deployment memang memiliki izin.

Untuk mengganti musik, ganti berkas lokal dengan MP3 berizin menggunakan nama yang sama; atau ubah URL di `src/core/AudioManager.js` jika nama/format berubah. Catat sumber, URL lisensi, pemegang hak dan attribution rekaman pengganti di sini. Tidak ada hotlink.

Jika file hilang/tidak dapat didekode, kontrol menjadi unavailable sampai reload; simulasi tetap berjalan. Tidak ada retry otomatis. Browser sendiri dapat mencatat kegagalan HTTP; aplikasi tidak mengulang log/error.
