import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { AssemblyActivity } from '../src/education/AssemblyActivity.js';
import { Vehicle } from '../src/objects/Vehicle.js';
import { VehicleStation } from '../src/objects/VehicleStation.js';
import { AssemblySession } from '../src/systems/AssemblySession.js';
const definition = JSON.parse(readFileSync(new URL('../public/data/assembly.json', import.meta.url)));
const prepare = () => {
  const a = new AssemblyActivity(definition);
  a.perform('inspect'); a.select('wheel'); a.perform('mount');
  a.select('fastener'); for (let i = 0; i < 4; i++) a.perform('fit', i);
  return a;
};

test('montagem exige inspeção, peça selecionada e encaixe antes de fixação', () => {
  const a = new AssemblyActivity(definition);
  assert.equal(a.perform('mount').ok, false); assert.equal(a.mounted, false);
  a.perform('inspect'); assert.equal(a.step, 1);
  a.select('fastener'); assert.equal(a.perform('mount').ok, false);
  a.select('wheel'); assert.equal(a.perform('mount').ok, true); assert.equal(a.mounted, true);
  assert.equal(a.perform('fit', 0).ok, false); // Seleção é devolvida após encaixar a roda.
  a.select('fastener'); assert.equal(a.perform('fit', 0).ok, true);
  assert.equal(a.perform('fit', 0).ok, false); assert.equal(a.fasteners.size, 1);
});
test('ferramenta inadequada e sequência incorreta não aplicam aperto', () => {
  const a = prepare();
  assert.equal(a.step, 3); a.select('impact'); assert.equal(a.perform('configure').ok, false);
  a.select('torque'); assert.equal(a.perform('configure').ok, true);
  assert.equal(a.perform('tighten', 1).ok, false); assert.deepEqual(a.tightened, []);
  a.perform('tighten', 0); assert.equal(a.perform('tighten', 0).ok, false);
  assert.deepEqual(a.tightened, [0]);
});
test('percurso prático completo tem 12 ações e exige conferência final', () => {
  const a = prepare(); a.select('torque'); a.perform('configure');
  for (const bolt of definition.boltOrder) assert.equal(a.perform('tighten', bolt).ok, true);
  assert.equal(a.completed, false); assert.equal(a.progress, 11);
  assert.equal(a.perform('verify').completed, true); assert.equal(a.progress, 12); assert.equal(a.mistakes, 0);
  a.reset(); assert.equal(a.progress, 0); assert.equal(a.mounted, false); assert.equal(a.completed, false);
});
test('veículo separa roda e fixadores, abre capô e fornece âncora da prática', () => {
  const v = new Vehicle(); const station = new VehicleStation(v);
  assert.equal(v.wheels.length, 4); assert.equal(v.bolts.length, 4);
  assert.equal(v.activeWheel, v.wheels[1]);
  assert.ok(v.hubWorld.distanceTo(v.group.localToWorld(v.homeWheelPosition.clone())) < 1e-6);
  v.setHood(true); v.update(0.1); assert.ok(v.hood.rotation.z < 0);
  station.setHighlight(true); assert.equal(station.outline.visible, true);
  assert.equal(station.data.type, 'assembly');
  const bounds = new THREE.Box3().setFromObject(v.group);
  assert.ok(bounds.min.y >= -0.01); assert.ok(bounds.max.x < 10); assert.ok(bounds.min.z > -13);
});
test('visibilidade 3D acompanha peças encaixadas e destinos dos parafusos', () => {
  const vehicle = new Vehicle();
  const s = Object.create(AssemblySession.prototype);
  Object.assign(s, { vehicle, engine: { scene: new THREE.Scene() }, stage: new THREE.Group(), activity: new AssemblyActivity(definition), targets: [], boltTargets: [], partPickers: [] });
  s.makeLabel = () => new THREE.Sprite(new THREE.SpriteMaterial());
  s.buildStage(); s.syncMeshes();
  assert.equal(vehicle.activeWheel.visible, false); assert.equal(s.rackWheel.visible, true);
  assert.equal(s.centerTarget.visible, true); assert.equal(s.boltTargets[0].visible, false);
  s.activity.perform('inspect'); s.activity.select('wheel'); s.activity.perform('mount'); s.syncMeshes();
  assert.equal(vehicle.activeWheel.visible, true); assert.equal(s.rackWheel.visible, false);
  assert.equal(s.boltTargets.every(b => b.visible), true);
  s.activity.select('fastener'); s.activity.perform('fit', 0); s.syncMeshes();
  assert.equal(vehicle.bolts[0].visible, true); assert.equal(vehicle.bolts[1].visible, false);
  assert.equal(s.boltTargets[0].userData.ring.visible, false);
  vehicle.group.updateMatrixWorld(true);
  const boltPosition = vehicle.bolts[0].getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(boltPosition.x - s.boltTargets[0].position.x) < 1e-6);
  assert.ok(Math.abs(boltPosition.y - s.boltTargets[0].position.y) < 1e-6);
});
