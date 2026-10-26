import test from 'node:test';
import assert from 'node:assert/strict';
import { ServiceActivity, jobs } from '../src/education/ServiceActivity.js';
import { AssemblySession } from '../src/systems/AssemblySession.js';
import { Vehicle } from '../src/objects/Vehicle.js';

for (const id of Object.keys(jobs)) {
  test(`${id}: exige a sequência e impede ações após concluir`, () => {
    const a = new ServiceActivity(id);
    assert.equal(a.perform('inexistente'), false);
    assert.equal(a.step, 0);
    for (const target of jobs[id].targets) assert.equal(a.perform(target), true);
    assert.equal(a.completed, true);
    assert.equal(a.perform(jobs[id].targets[0]), false);
    assert.equal(new ServiceActivity(id).step, 0);
  });
}

test('serviços alteram peças, pontas de prova e luzes e salvam só ao concluir', () => {
  const vehicle = new Vehicle(); const saved = [];
  const s = Object.create(AssemblySession.prototype);
  Object.assign(s, { active: true, vehicle, probes: [{ visible: false }, { visible: false }], audio: { play() {} }, progress: { complete: (...args) => saved.push(args) }, renderService() {}, feedback() {} });
  s.job = 'filter'; s.service = new ServiceActivity('filter');
  s.serviceAct('cover'); assert.equal(vehicle.filterCoverLift, 0.45);
  s.serviceAct('filter'); assert.equal(vehicle.filter.visible, false); assert.equal(saved.length, 0);
  s.serviceAct('filter'); assert.equal(vehicle.filter.visible, true);
  s.serviceAct('cover'); assert.equal(vehicle.filterCoverLift, 0); assert.equal(saved[0][0], 'servico-filter');
  s.job = 'battery'; s.service = new ServiceActivity('battery');
  s.serviceAct('negative'); assert.equal(s.probes[1].visible, false);
  s.serviceAct('positive'); assert.equal(s.probes[0].visible, true);
  s.serviceAct('negative'); assert.equal(s.probes[1].visible, true);
  s.serviceAct('meter'); assert.ok(s.probes.every(p => !p.visible));
  s.job = 'lights'; s.service = new ServiceActivity('lights');
  s.serviceAct('headlights'); assert.equal(vehicle.lightsOn, true);
  vehicle.update(0.1); assert.equal(vehicle.headlightMaterial.emissiveIntensity, 2.5);
  s.serviceAct('hazards'); assert.equal(vehicle.hazardsOn, true);
  s.serviceAct('off'); assert.equal(vehicle.lightsOn, false); assert.equal(vehicle.hazardsOn, false);
  assert.equal(saved.length, 3);
});
