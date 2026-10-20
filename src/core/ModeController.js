// Synchronous local-mode lifecycle; no renderer or animation loop ownership.
export class ModeController {
  constructor(modes) {
    this.modes = new Map(modes.map(mode => [mode.id, mode]));
    this.initialized = new Set(); this.active = null; this.width = this.height = 1;
  }
  initialize(id) {
    if (this.disposed) throw new Error('Mode controller disposed');
    const mode = this.modes.get(id);
    if (!mode) throw new Error(`Unknown mode: ${id}`);
    if (!this.initialized.has(id)) {
      try { mode.initialize(); this.initialized.add(id); }
      catch (error) { mode.dispose(); throw error; }
    }
    return mode;
  }
  activate(id) {
    if (this.switching) throw new Error('Mode switch already in progress');
    if (this.active?.id === id) return;
    const next = this.initialize(id), previous = this.active;
    this.switching = true;
    try {
      previous?.deactivate(); this.active = null;
      next.resize(this.width, this.height); next.activate(); this.active = next;
    } catch (error) {
      next.deactivate(); previous?.activate(); this.active = previous; throw error;
    } finally { this.switching = false; }
  }
  deactivate() { this.active?.deactivate(); this.active = null; }
  update(delta, now) { this.active?.update(delta, now); }
  resize(width, height) {
    this.width = Math.max(1, width); this.height = Math.max(1, height);
    for (const id of this.initialized) this.modes.get(id).resize(this.width, this.height);
  }
  dispose() {
    if (this.disposed) return;
    this.deactivate();
    for (const id of this.initialized) this.modes.get(id).dispose();
    this.initialized.clear(); this.modes.clear(); this.disposed = true;
  }
}
