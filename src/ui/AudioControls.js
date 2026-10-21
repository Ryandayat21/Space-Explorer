import { getAudioManager } from '../core/AudioManager.js';

let initialized = false;
export function initializeAudioControls() {
  if (initialized) return;
  initialized = true;
  const manager = getAudioManager();
  const play = document.getElementById('audio-play');
  const mute = document.getElementById('audio-mute');
  const volume = document.getElementById('audio-volume');
  const status = document.getElementById('audio-status');
  const render = () => {
    const unavailable = manager.state === 'unavailable';
    play.textContent = manager.wantsPlayback ? 'Pause Ambience' : manager.state === 'idle' ? 'Enable Ambience' : 'Play Ambience';
    play.title = play.textContent; play.setAttribute('aria-label', play.textContent);
    play.setAttribute('aria-pressed', String(manager.wantsPlayback));
    mute.textContent = manager.muted ? 'Unmute' : 'Mute';
    mute.title = manager.muted ? 'Aktifkan suara ambience' : 'Bisukan ambience';
    mute.setAttribute('aria-label', mute.title); mute.setAttribute('aria-pressed', String(manager.muted));
    volume.value = String(Math.round(manager.volume * 100));
    volume.setAttribute('aria-valuetext', `${volume.value}%`);
    play.disabled = mute.disabled = volume.disabled = unavailable;
    const messages = { idle: 'Musik dimulai setelah diaktifkan.', loading: 'Memuat audio…', playing: 'Ambience aktif', paused: 'Ambience dijeda', suspended: 'Dijeda saat tab tersembunyi', blocked: 'Tekan Play untuk mengizinkan audio.', unavailable: 'Audio unavailable — berkas tidak tersedia atau format tidak didukung.' };
    status.textContent = messages[manager.state] + (manager.storageUnavailable ? ' Preferensi hanya berlaku untuk sesi ini.' : '');
  };
  const onPlay = () => manager.wantsPlayback ? manager.pause() : manager.play();
  const onMute = () => manager.setPreferences({ muted: !manager.muted });
  const onVolume = () => manager.setPreferences({ volume: Number(volume.value) / 100 });
  play.addEventListener('click', onPlay); mute.addEventListener('click', onMute); volume.addEventListener('input', onVolume);
  manager.addEventListener('change', render); render();
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    manager.removeEventListener('change', render);
    play.removeEventListener('click', onPlay); mute.removeEventListener('click', onMute); volume.removeEventListener('input', onVolume);
    window.removeEventListener('pagehide', onPageHide); manager.dispose();
  };
  const onPageHide = event => { if (!event.persisted) cleanup(); };
  window.addEventListener('pagehide', onPageHide);
  return cleanup;
}
