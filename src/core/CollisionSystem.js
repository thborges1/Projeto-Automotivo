// Colisões horizontais círculo × AABB. Piso plano: altura dos olhos fixa.
// O deslocamento é subdividido para impedir atravessamento em frames demorados.
export class CollisionSystem {
  constructor(radius = 0.3) {
    this.radius = radius;
    this.boxes = [];
  }

  addBox(x, z, width, depth, id = '') {
    const box = { minX: x - width / 2, maxX: x + width / 2,
      minZ: z - depth / 2, maxZ: z + depth / 2, id, enabled: true };
    this.boxes.push(box);
    return box;
  }

  blocked(x, z) {
    return this.boxes.some((b) => {
      if (b.enabled === false) return false;
      const dx = x - Math.max(b.minX, Math.min(x, b.maxX));
      const dz = z - Math.max(b.minZ, Math.min(z, b.maxZ));
      return dx * dx + dz * dz < this.radius * this.radius;
    });
  }

  move(position, dx, dz) {
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (this.radius * 0.45)));
    for (let i = 0; i < steps; i++) {
      if (!this.blocked(position.x + dx / steps, position.z)) position.x += dx / steps;
      if (!this.blocked(position.x, position.z + dz / steps)) position.z += dz / steps;
    }
  }

  // A interação também respeita obstáculos entre os olhos e o equipamento.
  lineBlocked(start, end, ignoredId) {
    const count = Math.ceil(Math.hypot(end.x - start.x, end.z - start.z) / 0.08);
    for (let i = 1; i < count; i++) {
      const t = i / count;
      const x = start.x + (end.x - start.x) * t;
      const z = start.z + (end.z - start.z) * t;
      if (this.boxes.some(b => b.enabled !== false && b.id !== ignoredId && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ)) return true;
    }
    return false;
  }
}
