import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { OilChangeActivity, oilProfiles } from '../src/education/OilChangeActivity.js';
import { MaintenanceStation } from '../src/objects/MaintenanceStation.js';
import { OilChangeRig } from '../src/objects/OilChangeRig.js';
import { Vehicle } from '../src/objects/Vehicle.js';
import { VehicleLift } from '../src/objects/VehicleLift.js';
import { batchStaticWorld } from '../src/world/StaticBatching.js';
import { OilChangeSession } from '../src/systems/OilChangeSession.js';

const safe = () => ({ centered: true, supported: true, engineOff: true, raised: true, lowered: false,
  moving: false, collectorAligned: true, collectorClear: true, areaClear: true, filterProfile: 'corolla' });
function finishAnimation(activity, context) {
  for (let i = 0; i < 150 && activity.busy; i++) activity.update(0.1, context);
  assert.equal(activity.busy, false);
}
function advanceTo(activity, id, context) {
  for (let guard = 0; activity.current?.id !== id && guard < 40; guard++) {
    if (activity.current.id === 'drain') { finishAnimation(activity, context); continue; }
    const step = activity.current;
    if (step.tool) activity.select(step.tool);
    if (step.id === 'lower') { context.lowered = true; context.raised = false; }
    assert.equal(activity.perform(step.target, context).ok, true, step.id);
    finishAnimation(activity, context);
  }
}

test('troca de óleo bloqueia veículo baixo, em movimento ou sem apoio e ações fora de ordem', () => {
  const a = new OilChangeActivity(), c = safe();
  assert.equal(a.perform('plug', c).ok, false); assert.equal(a.index, 0);
  for (const condition of [{ raised: false }, { moving: true }, { supported: false }, { centered: false }, { engineOff: false }]) {
    assert.equal(a.perform('power', { ...c, ...condition }).ok, false);
    assert.equal(a.index, 0);
  }
  assert.equal(a.perform('power', c).ok, true);
});

test('coletor mal posicionado e ferramenta incorreta impedem abertura do cárter', () => {
  const a = new OilChangeActivity(), c = safe(); advanceTo(a, 'collector', c);
  a.select('collector'); c.collectorAligned = false;
  assert.equal(a.perform('collector', c).ok, false);
  c.collectorAligned = true; assert.equal(a.perform('collector', c).ok, true);
  assert.equal(a.perform('plug', c).ok, false);
  a.select('socket'); c.collectorAligned = false;
  assert.equal(a.perform('plug', c).ok, false); assert.equal(a.plugRemoved, false);
  c.collectorAligned = true; a.perform('plug', c);
  assert.equal(a.plugRemoved, false, 'remoção só termina ao finalizar animação');
  assert.equal(a.perform('plug', c).ok, false, 'cliques repetidos não pulam animação');
  finishAnimation(a, c); assert.equal(a.drained, 1); assert.equal(a.plugRemoved, true);
});

test('fluxo só avança em condições seguras, filtro incompatível não instala e bujão exige vedação', () => {
  const a = new OilChangeActivity(), c = safe(); advanceTo(a, 'removePlug', c); a.select('socket'); a.perform('plug', c);
  for (let i = 0; i < 12; i++) a.update(0.1, c);
  assert.equal(a.current.id, 'drain');
  const before = a.drained; a.update(0.1, { ...c, raised: false }); assert.equal(a.drained, before);
  advanceTo(a, 'installFilter', c); a.select('newFilter');
  assert.equal(a.perform('filterSeat', { ...c, filterProfile: 'gol' }).ok, false);
  assert.equal(a.filterInstalled, false); a.perform('filterSeat', c); finishAnimation(a, c);
  assert.equal(a.filterInstalled, true); assert.equal(a.current.id, 'seal');
  assert.equal(a.perform('plug', c).ok, false); a.select('seal'); a.perform('plug', c); assert.equal(a.sealReplaced, true);
});

test('percurso completo valida saída, descida, abastecimento, conferências e reinício nos três perfis', () => {
  for (const profile of Object.keys(oilProfiles)) {
    const a = new OilChangeActivity(profile), c = { ...safe(), filterProfile: profile };
    advanceTo(a, 'parkCollector', c); a.select('collector');
    assert.equal(a.perform('collector', { ...c, collectorClear: false }).ok, false);
    a.perform('collector', c); finishAnimation(a, c);
    a.perform('exit', c); finishAnimation(a, c);
    assert.equal(a.perform('lift', { ...c, areaClear: false }).ok, false);
    assert.equal(a.perform('lift', { ...c, collectorClear: false }).ok, false);
    a.perform('lift', c); a.update(0.1, { ...c, moving: true }); assert.equal(a.current.id, 'lower');
    c.lowered = true; c.raised = false; a.update(0.1, c); assert.equal(a.current.id, 'hood');
    a.select('hand'); assert.equal(a.perform('hood', { ...c, moving: true }).ok, false);
    advanceTo(a, 'verify', c); a.select('hand'); a.perform('hood', c); finishAnimation(a, c);
    assert.equal(a.completed, true); assert.equal(a.filled, 1); assert.equal(a.capOpen, false);
    assert.equal(a.plugRemoved, false); assert.equal(a.tightened, true);
    assert.equal(a.levelChecked && a.leaksChecked && a.filterInstalled, true);
    assert.equal(a.perform('hood', c).ok, false);
    a.reset(); assert.equal(a.index, 0); assert.equal(a.profile, profile); assert.equal(a.drained, 0);
  }
});

test('estação depende do elevador parado no alto; trava impede comandos concorrentes', () => {
  const car = new Vehicle([0, 0, 0], { displayOnly: true, color: '#aaa', serviceable: true });
  const group = new THREE.Group(); group.add(car.group);
  const lift = new VehicleLift(1, group, new THREE.Object3D());
  Object.assign(lift, { vehicle: car, vehicleCentered: true, supportsLocked: true, engineOff: true });
  const station = new MaintenanceStation(lift);
  assert.equal(station.available, false); lift.activate(); lift.advance(4); station.update();
  assert.equal(station.available, true); assert.ok(station.anchor.y > 1.9);
  const owner = {}; lift.maintenanceOwner = owner;
  assert.equal(station.available, false); assert.equal(lift.activate(), false);
  lift.canLower = () => false; assert.equal(lift.activate(owner), false);
  lift.canLower = () => true; assert.equal(lift.activate(owner), true);
});

test('capô permanece móvel após batching; fluxo e peças acompanham a elevação e descarte libera recursos', () => {
  const car = new Vehicle([2, 0, 3], { displayOnly: true, color: '#aaa', serviceable: true });
  batchStaticWorld(car.group); assert.equal(car.hood.children.length, 1);
  const scene = new THREE.Scene(); scene.add(car.group); car.group.position.y = 1.8; car.group.rotation.y = Math.PI / 2;
  const rig = new OilChangeRig(car, scene), a = new OilChangeActivity(), c = safe();
  rig.setProfile('corolla'); rig.collector.position.copy(rig.collectorTarget);
  advanceTo(a, 'removePlug', c); a.select('socket'); a.perform('plug', c);
  for (let i = 0; i < 12; i++) a.update(0.1, c);
  rig.sync(a); scene.updateMatrixWorld(true);
  assert.equal(rig.stream.visible, true);
  const head = rig.plug.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(rig.stream.position.x - head.x) < 1e-6);
  assert.ok(Math.abs(rig.stream.position.y + rig.stream.scale.y / 2 - head.y) < 1e-6);
  assert.equal(rig.collectorAligned(), true);
  assert.equal(rig.outsideFootprint(rig.collector.position), false);
  assert.equal(rig.outsideFootprint(rig.parking), true);
  let releases = 0; rig.box.addEventListener('dispose', () => releases++);
  rig.dispose(); assert.equal(releases, 1); assert.equal(scene.children.length, 1);
});

test('câmera inferior não cruza o assoalho e restauração não deixa jogador dentro do carro baixo', () => {
  const session = Object.create(OilChangeSession.prototype);
  session.engine = { camera: new THREE.PerspectiveCamera(), config: { eyeHeight: 1.65 }, collision: { blocked: () => true } };
  session.lift = { height: 1.8, anchor: new THREE.Vector3() }; session.view = 'under';
  session.engine.camera.position.y = 4; session.constrainCamera(); assert.ok(session.engine.camera.position.y < 1.9);
  session.active = true; session.cancelDrag = () => {}; session.orbit = { dispose() {} };
  session.rig = { reset() {}, exitPoint: new THREE.Vector3(0, 0, 3) };
  session.savedPosition = new THREE.Vector3(); session.savedQuaternion = new THREE.Quaternion();
  session.el = { classList: { add() {} } }; session.onExit = () => {};
  session.close(); assert.equal(session.engine.camera.position.z, 3); assert.equal(session.active, false);
  assert.equal(session.lift.maintenanceOwner, null);
});
