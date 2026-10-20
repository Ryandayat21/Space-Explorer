import { reportFailure } from './failures.js';
// Driven by the existing RAF. Preparation completes before either scene is deactivated.
export class ModeTransition {
  constructor(manager, hooks = {}) { this.manager = manager; this.hooks = hooks; this.phase = 'idle'; }
  get busy() { return this.phase !== 'idle'; }
  start(id, reduced = false) {
    if (this.disposed || this.busy || this.manager.active.id === id) return false;
    this.phase = 'preparing'; this.target = id; this.duration = reduced ? .08 : .65; this.elapsed = 0;
    this.preparationStep = 0; this.skipRequested = false;
    try {
      this.hooks.lock?.();
      this.hooks.stage?.('initializing');
      this.hooks.scene?.(this.manager.active);
      return true;
    } catch (error) { this.fail(error); return false; }
  }
  prepare() {
    // Let the existing RAF paint the curtain before synchronous construction.
    if (this.preparationStep++ === 0) return;
    if (this.preparationStep === 2) {
      this.next = this.manager.initialize(this.target);
      this.next.resize(this.manager.width, this.manager.height);
      this.hooks.stage?.('assets');
    } else if (this.preparationStep === 3) {
      this.hooks.stage?.('scene');
    } else {
      const preparation = this.hooks.prepare?.(this.next);
      if (preparation?.then) {
        this.phase = 'waiting';
        Promise.resolve(preparation).then(() => {
          if (!this.disposed && this.phase === 'waiting') this.prepared();
        }).catch(error => {
          if (!this.disposed && this.busy) this.fail(error);
        });
      } else this.prepared();
    }
  }
  prepared() {
    this.manager.active.deactivate();
    this.phase = 'out'; this.hooks.scene?.(this.manager.active);
    this.hooks.stage?.('ready');
    if (this.skipRequested) this.skip();
  }
  swap() {
    this.manager.activate(this.target);
    this.hooks.changed?.(this.target);
    this.phase = 'in'; this.elapsed = 0;
    this.hooks.scene?.(this.manager.active);
  }
  update(delta) {
    if (!this.busy) return;
    if (this.phase === 'waiting') return;
    try {
      if (this.phase === 'preparing') { this.prepare(); return; }
      this.elapsed += Math.max(0, delta);
      const t = Math.min(1, this.elapsed / this.duration);
      this.hooks.frame?.(this.phase === 'out' ? t : 1 - t, this.phase);
      if (t === 1) { if (this.phase === 'out') this.swap(); else this.finish(); }
    } catch (error) { this.fail(error); }
  }
  skip() {
    if (!this.busy) return;
    if (this.phase === 'preparing' || this.phase === 'waiting') { this.skipRequested = true; return; }
    try { if (this.phase === 'out') this.swap(); this.finish(); } catch (error) { this.fail(error); }
  }
  finish() { this.phase = 'idle'; this.hooks.unlock?.(); }
  fail(error) {
    try { this.manager.active?.activate(); }
    catch (recoveryError) { reportFailure('mode-recovery', recoveryError); }
    try { this.finish(); }
    catch (unlockError) { reportFailure('mode-unlock', unlockError); }
    this.hooks.error?.(error);
  }
  dispose() { if (this.disposed) return; this.disposed = true; if (this.busy) this.finish(); }
}
