import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OilChangeActivity, oilProfiles, oilSteps } from '../education/OilChangeActivity.js';
import { OilChangeRig } from '../objects/OilChangeRig.js';

const toolNames = { inspect: 'Inspeção', collector: 'Mover coletor', socket: 'Soquete', filterWrench: 'Chave de filtro',
  cloth: 'Pano', newFilter: 'Filtro novo', seal: 'Vedação nova', hand: 'Mãos', torque: 'Torquímetro didático', oil: 'Óleo novo' };
const preparation = { power: 'Confirmar desligado / READY apagado', supports: 'Conferir apoios e travas', ppe: 'Confirmar proteção e temperatura' };

export class OilChangeSession {
  constructor(engine, ui, progress, audio, onExit) {
    Object.assign(this, { engine, ui, progress, audio, onExit });
    this.active = false; this.rigs = new Map();
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.point = new THREE.Vector3(); this.previous = new THREE.Vector3(); this.walkStart = new THREE.Vector3();
    this.savedPosition = new THREE.Vector3(); this.savedQuaternion = new THREE.Quaternion();
    this.context = {}; this.down = { x: 0, y: 0, active: false, moved: false };
    this.abort = new AbortController(); this.createUI();
    const signal = this.abort.signal, canvas = engine.renderer.domElement;
    canvas.addEventListener('pointerdown', e => this.pointerDown(e), { signal });
    canvas.addEventListener('pointermove', e => this.pointerMove(e), { signal });
    canvas.addEventListener('pointerup', e => this.pointerUp(e), { signal });
    canvas.addEventListener('pointercancel', () => this.cancelDrag(), { signal });
    document.addEventListener('keydown', e => {
      if (!this.active) return;
      if (e.code === 'Escape') { e.preventDefault(); this.close(); }
    }, { signal });
    for (const lift of engine.world.lifts) {
      // A physical occupancy interlock applies even outside this activity.
      lift.canLower = () => {
        const car = lift.vehicle.group;
        car.updateWorldMatrix(true, false);
        this.point.copy(engine.camera.position); car.worldToLocal(this.point);
        return Math.abs(this.point.x) > 2.6 || Math.abs(this.point.z) > 1.3;
      };
    }
  }
  createUI() {
    this.el = document.createElement('section'); this.el.className = 'oil-session hidden';
    this.el.setAttribute('aria-label', 'Manutenção automotiva: troca de óleo');
    this.el.innerHTML = `<header class="oil-header"><div><span>MANUTENÇÃO AUTOMOTIVA</span><h2>Troca de óleo</h2><small data-oil="vehicle"></small></div><button data-action="close">Sair e restaurar exercício ×</button></header>
      <aside class="oil-guide"><small data-oil="stage"></small><progress data-oil="progress" max="9" value="0" aria-label="Progresso da troca de óleo"></progress>
      <h3 data-oil="title"></h3><p data-oil="instruction"></p><div data-oil="feedback" role="status" aria-live="polite"></div>
      <div data-oil="actions" class="oil-actions"></div><details><summary>Entenda esta etapa</summary><p data-oil="learning"></p></details>
      <details><summary>Ficha técnica e perfil</summary><p>Modelos genéricos. Ano, motor, referência do filtro, volume, viscosidade e torque ainda não verificados. Não use esta simulação como especificação de serviço.</p>
      <label>Perfil didático <select data-oil="profile"><option value="corolla">Corolla Hybrid</option><option value="hb20">HB20</option><option value="gol">Gol</option></select></label><p>O perfil adapta a posição ilustrativa do filtro; não altera a carroceria nem certifica o tipo de filtro real.</p></details>
      <button data-action="focus">Focar / destacar componente</button><small class="oil-disclaimer">Treino visual · sem torque ou litros presumidos</small></aside>
      <nav class="oil-tools" aria-label="Ferramentas e peças"></nav>
      <div class="oil-help">Clique nas peças · Arraste para olhar · Arraste o coletor ou use os controles de posição · ESC sai e restaura</div>`;
    document.querySelector('#app').append(this.el);
    this.nodes = {};
    for (const node of this.el.querySelectorAll('[data-oil]')) this.nodes[node.dataset.oil] = node;
    this.el.querySelector('[data-action="close"]').onclick = () => this.close();
    this.el.querySelector('[data-action="focus"]').onclick = () => this.focus();
    this.nodes.profile.onchange = () => {
      if (this.activity.index !== 0 || this.activity.busy) return;
      this.activity.reset(this.nodes.profile.value); this.rig.setProfile(this.activity.profile);
      this.filterProfile = this.activity.profile; this.sync(); this.render(); this.focus();
    };
    for (const [id, name] of Object.entries(toolNames)) {
      const button = document.createElement('button'); button.textContent = name; button.dataset.tool = id;
      button.onclick = () => { this.activity.select(id); this.render(); };
      this.el.querySelector('.oil-tools').append(button);
    }
  }
  getContext() {
    const c = this.context, lift = this.lift;
    c.centered = lift.vehicleCentered; c.supported = lift.supportsLocked; c.engineOff = lift.engineOff;
    c.raised = lift.height >= lift.maxHeight - 0.02;
    c.lowered = lift.height < 0.005; c.moving = lift.moving;
    c.collectorAligned = this.rig.collectorAligned();
    c.collectorClear = this.rig.outsideFootprint(this.rig.collector.position);
    c.areaClear = this.rig.outsideFootprint(this.engine.camera.position);
    c.filterProfile = this.filterProfile;
    return c;
  }
  open(station) {
    if (this.active || !station.available || station.anchor.distanceTo(this.engine.camera.position) > this.engine.config.interactionDistance) return false;
    this.station = station; this.lift = station.lift; this.vehicle = this.lift.vehicle;
    this.savedPosition.copy(this.engine.camera.position); this.savedQuaternion.copy(this.engine.camera.quaternion);
    this.engine.controls.stop(); this.lift.maintenanceOwner = this;
    if (!this.rigs.has(this.lift)) this.rigs.set(this.lift, new OilChangeRig(this.vehicle, this.engine.scene));
    this.rig = this.rigs.get(this.lift); this.activity = new OilChangeActivity(this.lift.oilProfile);
    this.filterProfile = this.activity.profile; this.rig.setProfile(this.activity.profile);
    this.active = true; this.restarting = false; this.down.active = false;
    this.orbit = new OrbitControls(this.engine.camera, this.engine.renderer.domElement);
    this.orbit.enableDamping = true; this.orbit.enablePan = false; this.orbit.enabled = true;
    this.el.classList.remove('hidden'); this.nodes.profile.value = this.activity.profile;
    this.sync(); this.render(); this.focus();
    this.el.querySelector('[data-action="close"]').focus();
    return true;
  }
  feedback(message, ok = false) {
    this.nodes.feedback.textContent = message; this.nodes.feedback.className = ok ? 'oil-feedback success' : 'oil-feedback';
  }
  focus() {
    if (!this.active || this.activity.pending || this.restarting) return;
    const a = this.activity, id = a.current?.id;
    this.vehicle.group.updateWorldMatrix(true, false);
    if (a.completed || (a.stage >= 8 && !['parkCollector', 'leave', 'lower'].includes(id))) {
      this.point.set(-1.4, 1.02, 0); this.vehicle.group.localToWorld(this.point); this.orbit.target.copy(this.point);
      this.point.set(-2.7, 2.5, 1.2); this.vehicle.group.localToWorld(this.point); this.engine.camera.position.copy(this.point);
      this.orbit.minDistance = 2; this.orbit.maxDistance = 3.5;
      this.orbit.minPolarAngle = 0.2; this.orbit.maxPolarAngle = 0.95;
      this.view = 'upper';
      if (id === 'leaks') {
        this.point.set(-1.4, 0.18, 0.1); this.vehicle.group.localToWorld(this.point); this.orbit.target.copy(this.point);
        this.point.set(-2.7, 0.11, 0.1); this.vehicle.group.localToWorld(this.point); this.engine.camera.position.copy(this.point);
        this.view = 'inspection';
      }
    } else {
      const collector = id === 'collector' || id === 'parkCollector';
      if (collector) { this.orbit.target.copy(this.rig.collector.position); this.orbit.target.y = 0.45; }
      else { this.point.set(-1.4, 0.17, 0); this.vehicle.group.localToWorld(this.point); this.orbit.target.copy(this.point); }
      this.point.set(-2.2, -this.lift.height + 1.2, 0.7); this.vehicle.group.localToWorld(this.point); this.engine.camera.position.copy(this.point);
      this.orbit.minDistance = 0.75; this.orbit.maxDistance = collector ? 2.2 : 1.3;
      this.orbit.minPolarAngle = collector ? 0.3 : 1.95; this.orbit.maxPolarAngle = collector ? 1.5 : 2.8;
      this.view = 'under';
    }
    this.orbit.enabled = this.view !== 'inspection' && id !== 'lower';
    this.orbit.update(); this.constrainCamera();
    this.engine.camera.lookAt(this.orbit.target);
  }
  constrainCamera() {
    const camera = this.engine.camera;
    if (this.view === 'under') camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.65, this.lift.height + 0.08);
    if (this.view === 'upper') camera.position.y = Math.max(1.96, camera.position.y);
  }
  ray(event) {
    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    this.engine.camera.updateMatrixWorld(); this.raycaster.setFromCamera(this.pointer, this.engine.camera);
  }
  pointerDown(e) {
    if (!this.active || e.button !== 0 || this.activity.busy || this.restarting) return;
    Object.assign(this.down, { x: e.clientX, y: e.clientY, active: true, moved: false });
    this.ray(e); this.rig.floor.updateMatrixWorld(true);
    if (this.activity.selected === 'collector' && ['collector', 'parkCollector'].includes(this.activity.current?.id) && this.raycaster.intersectObject(this.rig.collector, true).length) {
      this.dragging = true; this.orbit.enabled = false;
      this.engine.renderer.domElement.setPointerCapture(e.pointerId);
    }
  }
  pointerMove(e) {
    if (!this.active || !this.down.active) return;
    if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 5) this.down.moved = true;
    if (!this.dragging) return;
    this.ray(e);
    if (this.raycaster.ray.intersectPlane(this.plane, this.point)) this.moveCollector(this.point.x, this.point.z);
  }
  moveCollector(x, z) {
    if (this.activity.busy || !['collector', 'parkCollector'].includes(this.activity.current?.id)) return;
    if (Math.hypot(x - this.rig.collectorTarget.x, z - this.rig.collectorTarget.z) > 2.7 || this.engine.collision.blocked(x, z)) {
      this.feedback('O coletor precisa permanecer na área livre do posto.'); return;
    }
    this.rig.collector.position.set(x, 0, z);
  }
  cancelDrag() { this.dragging = false; this.down.active = false; if (this.orbit) this.orbit.enabled = this.view !== 'inspection'; }
  pointerUp(e) {
    if (!this.active || !this.down.active) return;
    const click = !this.down.moved && !this.dragging;
    this.cancelDrag();
    if (!click || this.activity.busy) return;
    this.ray(e); this.engine.scene.updateMatrixWorld(true);
    // Full-scene raycast only on click: physical geometry occludes pick targets.
    const hits = this.raycaster.intersectObject(this.engine.scene, true);
    for (const hit of hits) {
      let visible = true;
      for (let p = hit.object; p; p = p.parent) if (!p.visible) { visible = false; break; }
      if (!visible || hit.object === this.rig.highlight || hit.object === this.station.outline || hit.object === this.rig.marker) continue;
      let target = hit.object;
      while (target && !target.userData.oilTarget) target = target.parent;
      if (target) this.act(target.userData.oilTarget);
      else this.feedback('Esta superfície não é o componente solicitado. Use Destacar para localizar a peça.');
      return;
    }
    this.feedback('Selecione uma peça visível ou use o alvo acessível no painel.');
  }
  canWalkExit() {
    const position = this.engine.camera.position, exit = this.rig.exitPoint;
    const steps = Math.ceil(Math.hypot(exit.x - position.x, exit.z - position.z) / 0.08);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (this.engine.collision.blocked(position.x + (exit.x - position.x) * t, position.z + (exit.z - position.z) * t)) return false;
    }
    return true;
  }
  act(target) {
    if (!this.active || this.restarting) return;
    const id = this.activity.current?.id;
    if (id === 'leave' && !this.canWalkExit()) { this.feedback('O caminho de saída está obstruído. Ajuste a visão e libere a passagem.'); return; }
    const result = this.activity.perform(target, this.getContext()); this.feedback(result.message, result.ok);
    if (!result.ok) return;
    if (id === 'leave') { this.walkStart.copy(this.engine.camera.position); this.orbit.enabled = false; }
    if (id === 'lower') {
      if (!this.lift.activate(this)) { this.activity.pending = false; this.feedback('A descida foi bloqueada. Confira a área livre.'); }
      this.orbit.enabled = false;
    }
    this.audio.play(); this.sync(); this.render();
    if (!this.activity.busy) this.focus();
  }
  sync() {
    const a = this.activity, id = a.current?.id;
    this.rig.sync(a);
    if (id === 'hood' && a.pending) this.vehicle.hood.rotation.z = -a.elapsed / a.current.duration * 1.05;
    else if (id === 'verify' && a.pending) this.vehicle.hood.rotation.z = -(1 - a.elapsed / a.current.duration) * 1.05;
    else this.vehicle.hood.rotation.z = a.index > 18 && !a.completed ? -1.05 : 0;
    if (a.completed) { this.rig.highlight.visible = false; this.vehicle.hood.rotation.z = 0; }
  }
  render() {
    const a = this.activity, step = a.current;
    this.nodes.vehicle.textContent = `${oilProfiles[a.profile].name} · representação didática`;
    this.nodes.stage.textContent = a.completed ? 'SERVIÇO CONCLUÍDO · 9/9' : `ETAPA ${a.stage}/9 · AÇÃO ${a.index + 1}/${oilSteps.length}`;
    this.nodes.progress.value = a.completed ? 9 : a.stage - 1;
    this.nodes.title.textContent = a.completed ? 'Óleo e montagem conferidos' : ['','Preparação','Localizar bujão','Posicionar coletor','Remover bujão','Drenagem','Trocar filtro','Reinstalar bujão','Abastecimento superior','Verificação final'][a.stage];
    this.nodes.instruction.textContent = step?.text || 'Nível, vazamentos e peças conferidos. Óleo e filtro usados destinados à coleta virtual.';
    this.nodes.learning.textContent = step?.learning || `Treino concluído com ${a.mistakes} tentativa(s) a revisar. Os dados técnicos reais continuam pendentes de validação.`;
    this.nodes.profile.disabled = a.index !== 0 || a.busy;
    for (const button of this.el.querySelectorAll('[data-tool]')) {
      button.setAttribute('aria-pressed', String(a.selected === button.dataset.tool)); button.disabled = a.busy || a.completed || this.restarting;
      button.classList.toggle('recommended', step?.tool === button.dataset.tool);
    }
    this.nodes.actions.replaceChildren();
    const add = (name, callback, disabled = false) => {
      const button = document.createElement('button'); button.textContent = name; button.disabled = disabled; button.onclick = callback; this.nodes.actions.append(button);
    };
    if (a.completed) add('Elevar e repetir exercício', () => this.restart(), this.restarting);
    else if (step.id === 'drain') {
      const meter = document.createElement('progress'); meter.max = 1; meter.value = a.drained; meter.setAttribute('aria-label', 'Drenagem do óleo'); meter.dataset.flow = 'true'; this.nodes.actions.append(meter);
    } else {
      if (['collector', 'parkCollector'].includes(step.id)) {
        for (const [label, dx, dz] of [['←', -0.1, 0], ['→', 0.1, 0], ['↑', 0, -0.1], ['↓', 0, 0.1]]) {
          add(`${label} coletor`, () => this.moveCollector(this.rig.collector.position.x + dx, this.rig.collector.position.z + dz), a.busy || a.selected !== 'collector');
        }
      }
      add(preparation[step.id] || (step.id === 'lower' ? 'Descer elevador' : step.id === 'leave' ? 'Caminhar até a saída verde' : `Interagir: ${step.id === 'parkCollector' || step.id === 'collector' ? 'validar posição do coletor' : step.target}`), () => this.act(step.target), a.busy);
    }
  }
  update(dt) {
    if (!this.active || document.hidden) return;
    if (this.restarting) {
      if (!this.lift.moving && this.lift.height >= this.lift.maxHeight - 0.02) {
        this.restarting = false; this.activity.reset(); this.rig.setProfile(this.activity.profile); this.sync(); this.render(); this.focus();
      }
      return;
    }
    const a = this.activity, id = a.current?.id;
    this.previous.copy(this.engine.camera.position);
    if (this.orbit.enabled) {
      this.orbit.update(); this.constrainCamera();
      if (this.engine.collision.blocked(this.engine.camera.position.x, this.engine.camera.position.z)) this.engine.camera.position.copy(this.previous);
    }
    const changed = a.update(dt, this.getContext());
    if (id === 'leave' && (a.pending || changed)) {
      const t = changed ? 1 : a.elapsed / a.current.duration;
      const x = this.walkStart.x + (this.rig.exitPoint.x - this.walkStart.x) * t;
      const z = this.walkStart.z + (this.rig.exitPoint.z - this.walkStart.z) * t;
      this.engine.collision.move(this.engine.camera.position, x - this.engine.camera.position.x, z - this.engine.camera.position.z);
      if (changed) this.engine.camera.position.y = this.engine.config.eyeHeight;
    }
    if (a.busy || changed) this.sync();
    const flowMeter = this.nodes.actions.querySelector('[data-flow]'); if (flowMeter) flowMeter.value = a.drained;
    if (changed) {
      if (a.completed) {
        this.progress.complete(`troca-oleo-${a.profile}`, Math.max(0, 100 - a.mistakes * 3), 100);
        this.audio.play(true); this.feedback('Serviço concluído: peças instaladas, nível e ausência de vazamentos simulados conferidos.', true);
      }
      this.render(); if (!a.busy && a.current?.id !== 'lower') this.focus();
    }
  }
  restart() {
    if (!this.active || !this.activity.completed || this.lift.moving || !this.rig.outsideFootprint(this.engine.camera.position)) return;
    if (!this.lift.activate(this)) { this.feedback('Não foi possível elevar. Confira se a área está livre.'); return; }
    this.restarting = true; this.orbit.enabled = false; this.render(); this.feedback('Aguarde a elevação e o travamento antes de reiniciar.', true);
  }
  close() {
    if (!this.active) return;
    this.active = false; this.cancelDrag(); this.orbit.dispose(); this.orbit = null;
    this.rig.reset(); this.lift.maintenanceOwner = null;
    // If the car was lowered, the saved position underneath is no longer safe.
    if (!this.engine.collision.blocked(this.savedPosition.x, this.savedPosition.z)) {
      this.engine.camera.position.copy(this.savedPosition); this.engine.camera.quaternion.copy(this.savedQuaternion);
    } else {
      this.engine.camera.position.copy(this.rig.exitPoint); this.engine.camera.position.y = this.engine.config.eyeHeight;
      this.engine.camera.lookAt(this.lift.anchor);
    }
    this.el.classList.add('hidden'); this.onExit();
  }
  dispose() {
    if (this.active) { this.active = false; this.rig.reset(); this.lift.maintenanceOwner = null; }
    this.orbit?.dispose(); this.abort.abort(); this.el.remove();
    for (const rig of this.rigs.values()) rig.dispose(); this.rigs.clear();
    for (const lift of this.engine.world.lifts) lift.canLower = null;
  }
}
