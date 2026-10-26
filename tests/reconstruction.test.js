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

test('elevadores mantêm carros e braços juntos após batching e ciclos completos', () => {
  const { world } = build();
  assert.equal(world.lifts.length, config.reconstruction.lifts.length);
  for (const lift of world.lifts) {
    const car = lift.group.getObjectByName('veiculo-didatico-estimado');
    const arm = lift.group.children.find(o => o.name.includes('braço'));
    assert.ok(car && arm);
    let carDraws = 0;
    let triangles = 0;
    car.traverse(o => {
      if (!o.isMesh) return;
      carDraws++;
      triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
      assert.equal(o.userData.static, false);
      assert.equal(o.material.transparent, false);
      assert.equal(o.material.isMeshPhysicalMaterial, undefined);
    });
    assert.ok(carDraws <= 12, `Carro do elevador usa ${carDraws} desenhos`);
    // Budget includes undercarriage, rounded tires, five-spoke rims and trim.
    assert.ok(triangles < 9000, `Carro do elevador usa ${triangles} triângulos`);
    const bounds = new THREE.Box3().setFromObject(car);
    const carY = car.getWorldPosition(new THREE.Vector3()).y;
    const armY = arm.getWorldPosition(new THREE.Vector3()).y;
    assert.equal(lift.activate(), true);
    assert.equal(lift.activate(), false);
    lift.advance(NaN);
    assert.equal(lift.height, 0);
    for (let i = 0; i < 120; i++) lift.advance(1 / 60);
    assert.ok(Math.abs(lift.height - 0.9) < 1e-9);
    lift.advance(2.1);
    assert.equal(lift.height, 1.8);
    assert.equal(lift.moving, false);
    world.root.updateMatrixWorld(true);
    const raisedBounds = new THREE.Box3().setFromObject(car);
    assert.ok(Math.abs(raisedBounds.min.y - bounds.min.y - 1.8) < 1e-6);
    assert.ok(Math.abs(raisedBounds.max.y - bounds.max.y - 1.8) < 1e-6);
    assert.ok(Math.abs(car.getWorldPosition(new THREE.Vector3()).y - carY - 1.8) < 1e-9);
    assert.ok(Math.abs(arm.getWorldPosition(new THREE.Vector3()).y - armY - 1.8) < 1e-9);
    assert.equal(lift.activate(), true);
    lift.advance(4);
    assert.equal(lift.height, 0);
    assert.equal(car.getWorldPosition(new THREE.Vector3()).y, carY);
    assert.equal(lift.moving, false);
  }
});

test('carro elevado libera passagem e visão sob ele, preservando colisão das colunas', () => {
  const { world, collision } = build();
  for (const [i, lift] of world.lifts.entries()) {
    const [x, , z] = config.reconstruction.lifts[i].position;
    const start = new THREE.Vector3(x, config.eyeHeight, z + 2.6);
    const end = new THREE.Vector3(x, config.eyeHeight, z - 2.6);
    assert.equal(collision.blocked(x, z), true);
    assert.equal(collision.lineBlocked(start, end), true);
    lift.activate(); lift.advance(2);
    assert.equal(collision.blocked(x, z), true);
    lift.advance(2);
    assert.equal(collision.blocked(x, z), false);
    assert.equal(collision.lineBlocked(start, end), false);
    for (const side of [-1, 1]) {
      assert.equal(collision.blocked(x + side * 1.12, z + 0.5), false);
      assert.equal(collision.blocked(x + side * 1.57, z), true);
    }
    const player = start.clone();
    collision.move(player, 0, -5.2);
    assert.ok(Math.abs(player.z - end.z) < 1e-6);
    lift.activate(); lift.advance(4);
    assert.equal(collision.blocked(x, z), true);
    assert.equal(collision.lineBlocked(start, end), true);
  }
});
