import { Vector3 } from 'three';

export class InteractionSystem {
  constructor(engine) { this.engine = engine; this.current = null; this.direction = new Vector3(); }
  update(active) {
    let next = null, score = -Infinity;
    const { camera, registry, config, collision } = this.engine;
    camera.getWorldDirection(this.direction);
    if (active) for (const item of registry.items.values()) {
      const delta = item.anchor.clone().sub(camera.position);
      const distance = delta.length();
      const alignment = delta.normalize().dot(this.direction);
      if (distance < config.interactionDistance && alignment > 0.65 && alignment > score && !collision.lineBlocked(camera.position, item.anchor, item.data.id)) {
        next = item; score = alignment;
      }
    }
    if (next !== this.current) {
      this.current?.setHighlight(false); next?.setHighlight(true); this.current = next;
    }
    return next;
  }
}
