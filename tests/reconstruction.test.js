import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createWorkshop } from '../src/world/Workshop.js';
import { CollisionSystem } from '../src/core/CollisionSystem.js';
import { EquipmentRegistry } from '../src/objects/EquipmentRegistry.js';
const config = JSON.parse(readFileSync(new URL('../public/data/workshop.json', import.meta.url)));
const equipment = JSON.parse(readFileSync(new URL('../public/data/equipment.json', import.meta.url)));

function build() {
  const original = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillRect() {}, fillText() {},
  }) }) };
  try {
    const scene = new THREE.Scene(), collision = new CollisionSystem(config.playerRadius);
    return { scene, collision, world: createWorkshop(scene, collision, config) };
  } finally { if (original === undefined) delete globalThis.document; else globalThis.document = original; }
}

test('reconstrução completa gera geometria finita, cobertura inclinada e lotes estáticos', () => {
  const { world, collision } = build();
  let meshes = 0, instances = 0;
  world.root.traverse(o => {
    if (!o.isMesh) return; meshes++;
    const positions = o.geometry.attributes.position?.array;
    if (positions) assert.ok(positions.every(Number.isFinite), o.name);
    if (o.isInstancedMesh) { instances += o.count; assert.ok(o.instanceMatrix.array.every(Number.isFinite)); }
  });
  assert.ok(meshes > 100); assert.ok(instances > 500); assert.ok(world.savedDrawCalls > 200);
  const floor = world.root.getObjectByName('piso'); assert.equal(floor.position.y + floor.scale.y / 2, 0);
  assert.ok(config.reconstruction.ridgeHeight > config.height);
  assert.equal(collision.blocked(config.spawn[0], config.spawn[2]), false);
  assert.equal(world.vehicle.activeWheel.parent, world.vehicle.group);
});

test('nova planta preserva caminhos para bancada, veículo e corredor', async () => {
  const { scene, collision, world } = build();
  const registry = new EquipmentRegistry(scene, world.materials, collision);
  for (const data of equipment) await registry.register(data);
  const step = 0.25, key = (x, z) => `${x},${z}`;
  const start = [Math.round(config.spawn[0] / step), Math.round(config.spawn[2] / step)];
  const queue = [start], visited = new Set([key(...start)]);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz, k = key(nx, nz);
      if (visited.has(k) || Math.abs(nx * step) > config.width / 2 - 0.3 || Math.abs(nz * step) > config.depth / 2 - 0.3 || collision.blocked(nx * step, nz * step)) continue;
      visited.add(k); queue.push([nx, nz]);
    }
  }
  for (const [name, x, z] of [['bancada', 6, -0.9], ['roda', 1.96, -2.1], ['corredor', -6.3, 2], ['elevadores', 0.4, 10]]) {
    assert.ok(queue.some(([cx, cz]) => Math.hypot(cx * step - x, cz * step - z) < 0.4), `Caminho até ${name}`);
  }
  assert.equal(collision.blocked(-5.8, 1), true);
  assert.equal(collision.blocked(2.6, 9), true);
});

test('poses comparativas estão dentro da sala e fora de obstáculos', () => {
  const { collision } = build();
  assert.equal(config.reconstruction.comparisonViews.length, 6);
  for (const view of config.reconstruction.comparisonViews) {
    const [x, y, z] = view.position;
    assert.ok(Math.abs(x) < config.width / 2 && Math.abs(z) < config.depth / 2, view.id);
    assert.ok(y > 0 && view.landmarks.length >= 3);
    assert.equal(collision.blocked(x, z), false, `Câmera sem colisão: ${view.id}`);
    assert.ok(readFileSync(new URL(`../public/referencias/${view.photo}`, import.meta.url)).length > 0);
  }
});
