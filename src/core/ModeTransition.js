// Driven by the existing RAF. Preparation completes before either scene is deactivated.
export class ModeTransition {
  constructor(manager, hooks = {}) { this.manager = manager; this.hooks = hooks; this.phase = 'idle'; }
  get busy() { return this.phase !== 'idle'; }
  start(id, reduced = false) {
    if (this.disposed || this.busy || this.manager.active.id === id) return false;
    this.phase = 'preparing'; this.target = id; this.duration = reduced ? .08 : .65; this.elapsed = 0;
    try {
      const next = this.manager.initialize(id);
      next.resize(this.manager.width, this.manager.height);
      this.hooks.prepare?.(next);
      this.hooks.lock?.();
      this.manager.active.deactivate();
      this.phase = 'out'; this.hooks.scene?.(this.manager.active);
      return true;
    } catch (error) { this.fail(error); return false; }
  }
  swap() {
    this.manager.activate(this.target);
    this.hooks.changed?.(this.target);
    this.phase = 'in'; this.elapsed = 0;
    this.hooks.scene?.(this.manager.active);
  }
  update(delta) {
    if (!this.busy) return;
    try {
      this.elapsed += Math.max(0, delta);
      const t = Math.min(1, this.elapsed / this.duration);
      this.hooks.frame?.(this.phase === 'out' ? t : 1 - t, this.phase);
      if (t === 1) { if (this.phase === 'out') this.swap(); else this.finish(); }
    } catch (error) { this.fail(error); }
  }
  skip() {
    if (!this.busy) return;
    try { if (this.phase === 'out') this.swap(); this.finish(); } catch (error) { this.fail(error); }
  }
  finish() { this.phase = 'idle'; this.hooks.unlock?.(); }
  fail(error) { this.manager.active?.activate(); this.finish(); this.hooks.error?.(error); }
  dispose() { if (this.disposed) return; this.disposed = true; if (this.busy) this.finish(); }
}
