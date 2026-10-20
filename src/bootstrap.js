import './styles.css';
import { loadingScreen, paintLoading } from './ui/loadingScreen.js';
loadingScreen.stage('initializing', 'Memeriksa dan membuka aplikasi. Audio tidak dimuat otomatis.');
const watchdog = setTimeout(() => loadingScreen.fail('Modul wajib belum siap. Periksa koneksi lalu muat ulang halaman.'), 15000);
try {
  await paintLoading();
  loadingScreen.stage('assets', 'Memuat modul aplikasi wajib. Ukuran unduhan tidak tersedia.');
  const { start } = await import('./main.js');
  if (!loadingScreen.failed) await start();
} catch (error) {
  loadingScreen.fail(error?.code === 'WEBGL_UNAVAILABLE' ? 'WebGL 2 tidak tersedia. Aktifkan akselerasi grafis atau gunakan browser yang mendukung, lalu muat ulang.' : 'Aplikasi atau scene wajib gagal disiapkan. Periksa koneksi dan muat ulang halaman.');
} finally { clearTimeout(watchdog); }
