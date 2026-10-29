/** Pure lift motion state. Safety interlocks remain with the lift adapter. */
export class LiftMotion {
  constructor() {
    this.height = 0;
    this.target = 0;
    this.elapsed = 0;
    this.duration = 4;
    this.maxHeight = 1.8;
    this.moving = false;
  }

  activate() {
    if (this.moving) return false;
    this.startHeight = this.height;
    this.target = this.target === 0 ? this.maxHeight : 0;
    this.elapsed = 0;
    this.moving = true;
    return true;
  }

  advance(dt) {
    if (!this.moving || !Number.isFinite(dt) || dt <= 0) return false;
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    const t = this.elapsed / this.duration;
    // Quintic easing reaches both stops with zero velocity and acceleration.
    const eased = t * t * t * (t * (t * 6 - 15) + 10);
    this.height = this.startHeight + (this.target - this.startHeight) * eased;
    if (t === 1) this.moving = false;
    return true;
  }
}
