/** Owns the renderer's single animation callback; updates always precede rendering. */
export class GameLoop {
  constructor(renderer, update, render, isHidden = () => document.hidden) {
    Object.assign(this, { renderer, update, render, isHidden });
    this.lastTime = null;
    this.running = false;
    this.tick = milliseconds => {
      if (!this.running || !Number.isFinite(milliseconds)) return;
      const dt =
        this.lastTime === null ? 0 : Math.max(0, Math.min((milliseconds - this.lastTime) / 1000, 0.05));
      this.lastTime = milliseconds;
      if (this.isHidden()) return;
      this.update(dt, milliseconds / 1000);
      this.render();
    };
  }

  start() {
    if (this.running) return;
    this.lastTime = null;
    this.running = true;
    this.renderer.setAnimationLoop(this.tick);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.lastTime = null;
    this.renderer.setAnimationLoop(null);
  }
}
