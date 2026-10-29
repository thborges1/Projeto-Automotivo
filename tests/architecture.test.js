import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GameLoop } from '../src/core/GameLoop.js';
import { LiftMotion } from '../src/machines/LiftMotion.js';
import { VehicleLift } from '../src/objects/VehicleLift.js';
import { disposeObject3D } from '../src/utils/DisposeUtils.js';
import { EquipmentRegistry } from '../src/objects/EquipmentRegistry.js';
import { CollisionSystem } from '../src/core/CollisionSystem.js';
import { validateVehiclePlacement, VEHICLES } from '../src/vehicles/VehicleData.js';
import { applyRendererQuality } from '../src/graphics/Renderer.js';
import { bindTouchControls } from '../src/ui/TouchControls.js';
import { Engine } from '../src/core/Engine.js';

test('imports locais existem e módulos de produção não possuem ciclos', () => {
  const root = fileURLToPath(new URL('../src/', import.meta.url));
  const graph = new Map();
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const file = resolve(entry.parentPath, entry.name);
    const source = readFileSync(file, 'utf8');
    const dependencies = [];
    for (const match of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
      const dependency = resolve(dirname(file), match[1]);
      assert.ok(existsSync(dependency), `${file}: ${match[1]}`);
      if (dependency.endsWith('.js')) dependencies.push(dependency);
    }
    graph.set(file, dependencies);
  }
  const visited = new Set(),
    stack = new Set();
  function visit(file) {
    assert.equal(stack.has(file), false, `Dependência circular: ${[...stack, file].join(' → ')}`);
    if (visited.has(file)) return;
    stack.add(file);
    for (const dependency of graph.get(file) || []) visit(dependency);
    stack.delete(file);
    visited.add(file);
  }
  for (const file of graph.keys()) visit(file);
  assert.ok(visited.size > 40);
});

test('loop único atualiza antes de renderizar, limita delta, pausa oculto e reinicia sem salto', () => {
  const calls = [],
    updates = [],
    order = [];
  let hidden = false;
  const renderer = { setAnimationLoop: callback => calls.push(callback) };
  const loop = new GameLoop(
    renderer,
    dt => {
      updates.push(dt);
      order.push('update');
    },
    () => order.push('render'),
    () => hidden,
  );
  loop.start();
  loop.start();
  assert.equal(calls.length, 1);
  loop.tick(0);
  loop.tick(16);
  loop.tick(1000);
  assert.deepEqual(updates, [0, 0.016, 0.05]);
  assert.deepEqual(order, ['update', 'render', 'update', 'render', 'update', 'render']);
  hidden = true;
  loop.tick(5000);
  assert.equal(updates.length, 3);
  hidden = false;
  loop.tick(5016);
  assert.equal(updates.at(-1), 0.016);
  loop.tick(NaN);
  loop.stop();
  loop.stop();
  loop.tick(6000);
  assert.equal(updates.length, 4);
  assert.equal(calls.at(-1), null);
  loop.start();
  loop.tick(9000);
  assert.equal(updates.at(-1), 0);
  loop.stop();
});

test('estado puro do elevador completa ambos percursos e rejeita delta inválido e comandos simultâneos', () => {
  const motion = new LiftMotion();
  assert.equal(motion.activate(), true);
  assert.equal(motion.activate(), false);
  for (const dt of [NaN, Infinity, -1, 0]) assert.equal(motion.advance(dt), false);
  assert.equal(motion.height, 0);
  motion.advance(2);
  assert.equal(motion.height, 0.9);
  motion.advance(20);
  assert.equal(motion.height, 1.8);
  assert.equal(motion.moving, false);
  motion.activate();
  motion.advance(4);
  assert.equal(motion.height, 0);
  assert.equal(motion.target, 0);
});

test('adaptador mantém campos públicos, trava de manutenção e proteção de descida', () => {
  const moving = new THREE.Group(),
    button = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  const collider = { enabled: true },
    owner = {};
  const lift = new VehicleLift(1, moving, button, [collider]);
  lift.maintenanceOwner = owner;
  assert.equal(lift.activate(), false);
  assert.equal(lift.activate(owner), true);
  lift.advance(4);
  assert.equal(moving.position.y, 1.8);
  assert.equal(collider.enabled, false);
  lift.canLower = () => false;
  assert.equal(lift.activate(owner), false);
  lift.canLower = () => true;
  lift.activate(owner);
  lift.advance(4);
  assert.equal(collider.enabled, true);
  lift.height = 0.5;
  assert.equal(lift.motion.height, 0.5);
  disposeObject3D(button);
  disposeObject3D(lift.outline);
});

test('descarte respeita materiais/geometrias compartilhados, textura externa e buffers de instâncias', () => {
  const texture = new THREE.Texture(),
    external = new THREE.Texture();
  const geometry = new THREE.BoxGeometry(),
    material = new THREE.MeshBasicMaterial({ map: texture, alphaMap: external });
  const instance = new THREE.InstancedMesh(geometry, material, 2);
  const a = new THREE.Group(),
    b = new THREE.Group();
  a.add(instance);
  b.add(new THREE.Mesh(geometry, material));
  const counts = new Map();
  for (const resource of [texture, external, geometry, material, instance])
    resource.addEventListener('dispose', () => counts.set(resource, (counts.get(resource) || 0) + 1));
  const disposed = new Set(),
    excludeTextures = new Set([external]);
  disposeObject3D(a, { disposed, excludeTextures });
  disposeObject3D(b, { disposed, excludeTextures });
  for (const resource of [texture, geometry, material, instance]) assert.equal(counts.get(resource), 1);
  assert.equal(counts.has(external), false);
  external.dispose();
});

test('registro rejeita interação inválida e encerrada sem alterar o mapa', () => {
  const registry = new EquipmentRegistry(new THREE.Scene(), {}, new CollisionSystem());
  assert.throws(() => registry.attach({ data: { id: 'invalid' } }), /inválido/);
  assert.equal(registry.items.size, 0);
  registry.dispose();
  registry.dispose();
  assert.throws(() => registry.attach({}), /encerrado/);
});

test('modelo que termina após descarte é liberado sem ser publicado na cena', async () => {
  const data = JSON.parse(readFileSync(new URL('../public/data/equipment.json', import.meta.url)))[0];
  const material = new THREE.MeshBasicMaterial();
  const materials = new Proxy({}, { get: () => material });
  const registry = new EquipmentRegistry(new THREE.Scene(), materials, new CollisionSystem());
  let resolve;
  registry.loader = {
    loadAsync: () =>
      new Promise(done => {
        resolve = done;
      }),
  };
  const loading = registry.register({ ...data, model: '/late.glb' });
  registry.dispose();
  const model = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  let disposed = 0;
  model.geometry.addEventListener('dispose', () => disposed++);
  resolve({ scene: model });
  const item = await loading;
  assert.equal(disposed, 1);
  assert.equal(registry.items.size, 0);
  assert.equal(item.group.children.includes(model), false);
  disposeObject3D(registry.scene);
});

test('cadastro de veículos valida dimensões, posição e LOD antes do carregamento', () => {
  for (const model of Object.keys(VEHICLES)) {
    const placement = { model, position: [0, 0, 0], rotation: 0, distances: [0, 12, 28] };
    const spec = validateVehiclePlacement(placement);
    assert.ok(spec.width > 0 && spec.length > spec.width);
    for (const distances of [
      [0, 12, Infinity],
      [0, 12, 8],
      [0, 0, 10],
    ])
      assert.throws(() => validateVehiclePlacement({ ...placement, distances }), /LOD/);
    assert.throws(() => validateVehiclePlacement({ ...placement, position: [NaN, 0, 0] }), /Posição/);
  }
  assert.throws(() => validateVehiclePlacement({ model: 'toString' }), /desconhecido/);
});

test('qualidade preserva limites de DPR e sombras desativadas', () => {
  const renderer = {
    shadowMap: {},
    setPixelRatio(value) {
      this.ratio = value;
    },
  };
  for (const [quality, expected] of [
    ['low', 1],
    ['medium', 1.5],
    ['high', 2],
    ['invalid', 1.5],
  ]) {
    applyRendererQuality(renderer, quality, 3);
    assert.equal(renderer.ratio, expected);
    assert.equal(renderer.shadowMap.enabled, false);
  }
  applyRendererQuality(renderer, 'high', 1);
  assert.equal(renderer.ratio, 1);
});

test('encerramento do motor é idempotente e libera cena, mapa e canvas', () => {
  const scene = new THREE.Scene(),
    geometry = new THREE.BoxGeometry(),
    material = new THREE.MeshBasicMaterial();
  scene.add(new THREE.Mesh(geometry, material));
  const calls = [];
  const oldWindow = globalThis.window;
  globalThis.window = { removeEventListener() {} };
  try {
    const engine = Object.assign(Object.create(Engine.prototype), {
      scene,
      registry: { dispose: () => calls.push('registry') },
      loop: { stop: () => calls.push('stop') },
      reflections: { dispose() {} },
      controls: { dispose() {} },
      renderer: {
        dispose: () => calls.push('renderer'),
        domElement: { removeEventListener() {}, remove: () => calls.push('canvas') },
      },
    });
    engine.dispose();
    engine.dispose();
    assert.deepEqual(calls, ['stop', 'registry', 'renderer', 'canvas']);
    assert.equal(scene.children.length, 0);
    assert.throws(() => engine.start(() => {}), /encerrado/);
  } finally {
    globalThis.window = oldWindow;
  }
});

test('toque mantém callback de reset e remove handlers ao encerrar', () => {
  const nodes = Object.fromEntries(['joystick', 'stick', 'look-zone'].map(id => [id, { style: {} }]));
  const controls = { active: true, stick: { x: 1, y: 1 } };
  const reset = bindTouchControls({ $: id => nodes[id] }, controls);
  assert.equal(typeof reset, 'function');
  reset();
  assert.deepEqual(controls.stick, { x: 0, y: 0 });
  reset.dispose();
  assert.equal(nodes.joystick.onpointerdown, null);
  assert.equal(nodes['look-zone'].onpointermove, null);
});
