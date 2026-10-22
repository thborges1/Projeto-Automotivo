import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CollisionSystem } from '../src/core/CollisionSystem.js';
import { buildArchitecture } from '../src/world/Architecture.js';
import { Equipment } from '../src/objects/Equipment.js';
import { EquipmentRegistry } from '../src/objects/EquipmentRegistry.js';
import { InteractionSystem } from '../src/systems/InteractionSystem.js';
import { Controls } from '../src/core/Controls.js';
import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync(new URL('../public/data/workshop.json', import.meta.url)));
const data = JSON.parse(readFileSync(new URL('../public/data/equipment.json', import.meta.url)))[0];
const materials = Object.fromEntries(['floor', 'wall', 'lowerWall', 'window', 'steel', 'metal', 'dark', 'blue', 'roof', 'red', 'yellow', 'worktop'].map(key => [key, new THREE.MeshStandardMaterial()]));

test('arquitetura tem piso sob os olhos, pilares e quatro barreiras; spawn livre', () => {
  const root = new THREE.Group(), c = new CollisionSystem(config.playerRadius);
  buildArchitecture(root, materials, c, config);
  root.updateMatrixWorld(true);
  const floor = new THREE.Box3().setFromObject(root.getObjectByName('piso'));
  assert.equal(floor.max.y, 0); assert.ok(config.spawn[1] > floor.max.y);
  assert.equal(c.blocked(config.spawn[0], config.spawn[2]), false);
  for (const delta of [[100, 0], [-100, 0], [0, 100], [0, -100]]) {
    const p = { x: 0, z: 0 }; c.move(p, ...delta);
    assert.ok(Math.abs(p.x) < config.width / 2); assert.ok(Math.abs(p.z) < config.depth / 2);
  }
  assert.ok(root.children.some(o => o.isInstancedMesh));
});
test('interação exige proximidade e direção; destaque corresponde ao objeto', () => {
  const scene = new THREE.Scene(), c = new CollisionSystem();
  const item = new Equipment(data, materials, c); scene.add(item.group, item.outline, item.componentOutline);
  const camera = new THREE.PerspectiveCamera();
  const engine = { camera, config, collision: c, registry: { items: new Map([[data.id, item]]) } };
  const interaction = new InteractionSystem(engine);
  camera.position.set(data.position[0], 1.65, data.position[2] + 2);
  camera.lookAt(item.anchor); camera.updateMatrixWorld();
  assert.equal(interaction.update(true), item); assert.equal(item.outline.visible, true);
  item.selectComponent('morsa'); assert.equal(item.componentOutline.visible, true);
  camera.lookAt(camera.position.clone().add(new THREE.Vector3(0, 0, 2))); camera.updateMatrixWorld();
  assert.equal(interaction.update(true), null); assert.equal(item.outline.visible, false);
  camera.position.z += 20; camera.lookAt(item.anchor); camera.updateMatrixWorld();
  assert.equal(interaction.update(true), null);
});
test('falha no GLB mantém demonstração e reporta erro; IDs duplicados rejeitados', async () => {
  const registry = new EquipmentRegistry(new THREE.Scene(), materials, new CollisionSystem());
  registry.loader = { loadAsync: async () => { throw new Error('arquivo ausente'); } };
  let message = '';
  const item = await registry.register({ ...data, model: '/inexistente.glb' }, m => { message = m; });
  assert.ok(item.group.children.length > 0); assert.ok(message.includes('indisponível'));
  await assert.rejects(() => registry.register(data), /duplicado/);
});

test('controles movem a câmera na direção do olhar e mantêm altura e colisão', () => {
  const originals = { document: globalThis.document, window: globalThis.window, matchMedia: globalThis.matchMedia };
  globalThis.document = new EventTarget();
  globalThis.window = new EventTarget();
  globalThis.matchMedia = () => ({ matches: false });
  try {
    const camera = new THREE.PerspectiveCamera(), collision = new CollisionSystem();
    const obstacleZ = config.spawn[2] - 3;
    collision.addBox(0, obstacleZ, 20, 0.2, 'obstáculo');
    const controls = new Controls(camera, {}, collision, config, () => {});
    controls.reset(); controls.active = true; controls.keys.add('KeyW');
    for (let i = 0; i < 300; i++) controls.update(1 / 60);
    assert.ok(camera.position.z < config.spawn[2]);
    assert.ok(camera.position.z >= obstacleZ + 0.399);
    assert.equal(camera.position.y, config.eyeHeight);
    controls.clear(); controls.yaw = Math.PI / 2; controls.keys.add('KeyW');
    const previousX = camera.position.x;
    for (let i = 0; i < 30; i++) controls.update(1 / 60);
    assert.ok(camera.position.x < previousX);
    controls.dispose();
  } finally {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
