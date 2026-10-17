import { readAudioPreferences, saveAudioPreferences } from '../data/audioPreferences.js';

// Application-owned, independent of scene lifecycles. Never reset currentTime.
export class AudioManager extends EventTarget {
  constructor({ audio = new Audio(), document: doc = globalThis.document, getStorage } = {}) {
    super();
    this.audio = audio; this.document = doc; this.getStorage = getStorage;
    Object.assign(this, readAudioPreferences(getStorage));
    this.wantsPlayback = false; this.state = 'idle'; this.revision = 0;
    audio.loop = true; audio.preload = 'none'; audio.volume = 0;
    audio.src = (import.meta.env?.BASE_URL ?? '/') + 'audio/Interstellar%20Main%20Theme.mp3';
    this.onError = () => {
      if (this.disposed || this.state === 'unavailable') return;
      this.revision++; this.wantsPlayback = false; this.stopFade(); audio.pause();
      this.state = 'unavailable'; this.changed();
    };
    this.onVisibility = () => {
      if (doc.hidden) {
        this.revision++; this.stopFade(); audio.pause(); audio.volume = 0;
        if (this.wantsPlayback) this.state = 'suspended';
        this.changed();
      } else if (this.wantsPlayback) this.play();
    };
    audio.addEventListener('error', this.onError);
    doc.addEventListener('visibilitychange', this.onVisibility);
  }
  changed() { this.dispatchEvent(new Event('change')); }
  stopFade() { clearInterval(this.fadeTimer); this.fadeTimer = null; }
  fade(target, complete = () => {}) {
    this.stopFade();
    const from = this.audio.volume, started = performance.now();
    this.fadeTimer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / 450);
      const eased = progress * progress * (3 - 2 * progress);
      this.audio.volume = from + (target - from) * eased;
      if (progress === 1) { this.stopFade(); complete(); }
    }, 20);
  }
  async play() {
    if (this.disposed || this.state === 'unavailable') return;
    this.wantsPlayback = true;
    if (this.document.hidden) { this.state = 'suspended'; this.changed(); return; }
    const revision = ++this.revision;
    this.stopFade(); this.state = 'loading'; this.changed();
    try {
      // Called synchronously from the click before awaiting: retains user activation.
      await this.audio.play();
      if (revision !== this.revision || this.disposed) return;
      this.state = 'playing'; this.fade(this.muted ? 0 : this.volume); this.changed();
    } catch (error) {
      if (revision !== this.revision || this.disposed) return;
      if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
        this.wantsPlayback = false; this.audio.pause(); this.state = 'blocked'; this.changed();
      } else this.onError();
    }
  }
  pause() {
    if (this.disposed || this.state === 'unavailable') return;
    this.revision++; this.wantsPlayback = false; this.state = 'paused';
    this.fade(0, () => this.audio.pause()); this.changed();
  }
  setPreferences(preferences) {
    if (typeof preferences.muted === 'boolean') this.muted = preferences.muted;
    if (typeof preferences.volume === 'number' && Number.isFinite(preferences.volume))
      this.volume = Math.max(0, Math.min(1, preferences.volume));
    this.storageUnavailable = !saveAudioPreferences(this, this.getStorage);
    if (this.wantsPlayback && this.state === 'playing') this.fade(this.muted ? 0 : this.volume);
    this.changed();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.revision++; this.wantsPlayback = false;
    this.stopFade(); this.audio.pause();
    this.audio.removeEventListener('error', this.onError);
    this.document.removeEventListener('visibilitychange', this.onVisibility);
    this.audio.removeAttribute('src'); this.audio.load();
  }
}

let instance;
export function getAudioManager() { return instance ??= new AudioManager(); }
