import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWheel, cylinder } from '../objects/Vehicle.js';
import { AssemblyActivity } from '../education/AssemblyActivity.js';

const itemNames = { wheel: 'Conjunto pneu + aro', fastener: 'Fixadores · 4 unidades', torque: 'Torquímetro didático', impact: 'Chave de impacto' };

export class AssemblySession {
  constructor(engine, ui, definition, progress, audio, onExit) {
    Object.assign(this, { engine, ui, definition, progress, audio, onExit });
    this.vehicle = engine.world.vehicle;
    this.activity = new AssemblyActivity(definition);
    this.active = false; this.busy = false;
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2();
    this.stage = new THREE.Group(); this.stage.name = 'pratica-roda'; engine.scene.add(this.stage);
    this.targets = []; this.boltTargets = []; this.partPickers = [];
    this.buildStage(); this.createUI();
    this.onDown = e => { if (this.active) this.down = { x: e.clientX, y: e.clientY, time: performance.now() }; };
    this.onUp = e => {
      if (!this.active || !this.down || e.button !== 0) return;
      const distance = Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y);
      if (distance < 7 && performance.now() - this.down.time < 600) this.pick(e);
      this.down = null;
    };
    engine.renderer.domElement.addEventListener('pointerdown', this.onDown);
    engine.renderer.domElement.addEventListener('pointerup', this.onUp);
    this.stage.visible = false;
  }
  buildStage() {
    const hub = this.vehicle.hubWorld;
    const markerMaterial = new THREE.MeshBasicMaterial({ color: '#e2b864', transparent: true, opacity: 0.5, depthTest: false });
    const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    this.centerTarget = new THREE.Mesh(new THREE.CircleGeometry(0.075, 32), hitMaterial);
    this.centerTarget.position.copy(hub).add(new THREE.Vector3(0, 0, 0.22)); this.centerTarget.userData.kind = 'center';
    this.stage.add(this.centerTarget); this.targets.push(this.centerTarget);
    this.hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.008, 8, 40), markerMaterial);
    this.hubRing.position.copy(hub).add(new THREE.Vector3(0, 0, 0.23)); this.hubRing.renderOrder = 10; this.stage.add(this.hubRing);
    this.ghost = createWheel(); this.ghost.position.copy(hub);
    this.ghost.traverse(o => {
      if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: '#e2b864', transparent: true, opacity: 0.13, depthWrite: false, wireframe: true }); o.castShadow = false; }
    });
    this.stage.add(this.ghost);
    for (let i = 0; i < 4; i++) {
      const pos = this.vehicle.boltPositions[i].clone().add(hub); pos.z += 0.04;
      const target = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), hitMaterial); target.position.copy(pos); target.userData.kind = 'bolt'; target.userData.index = i;
      this.targets.push(target); this.boltTargets.push(target); this.stage.add(target);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.004, 6, 20), markerMaterial.clone()); ring.position.copy(pos); ring.renderOrder = 11; target.userData.ring = ring; this.stage.add(ring);
      const label = this.makeLabel(`${i + 1}`); label.position.copy(pos).add(new THREE.Vector3(Math.sign(pos.x - hub.x) * 0.038, Math.sign(pos.y - hub.y) * 0.038, 0.025));
      label.scale.set(0.058, 0.058, 1); target.userData.label = label; this.stage.add(label);
    }
    // Bandeja de peças: clicável no cenário e também acessível por botões.
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.75), new THREE.MeshStandardMaterial({ color: '#495759', roughness: 0.65, metalness: 0.4 }));
    rack.position.set(hub.x - 1.05, 0.72, hub.z + 1.2); rack.receiveShadow = true; this.stage.add(rack);
    this.rackWheel = createWheel(); this.rackWheel.position.set(hub.x - 1.6, 1.13, hub.z + 1.2); this.stage.add(this.rackWheel); this.rackWheel.userData.part = 'wheel'; this.partPickers.push(this.rackWheel);
    this.rackBolts = new THREE.Group(); this.rackBolts.position.set(hub.x - 0.55, 0.81, hub.z + 1.2); this.rackBolts.userData.part = 'fastener'; this.stage.add(this.rackBolts); this.partPickers.push(this.rackBolts);
    for (let i = 0; i < 4; i++) cylinder(0.038, 0.1, new THREE.MeshStandardMaterial({ color: '#b9c0bd', metalness: 0.8, roughness: 0.3 }), [(i % 2) * 0.11, Math.floor(i / 2) * 0.11, 0], this.rackBolts, 6);
    this.tool = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.018, 0.32, 16), new THREE.MeshStandardMaterial({ color: '#a5afb1', metalness: 0.8, roughness: 0.25 })); handle.position.y = -0.14; this.tool.add(handle);
    cylinder(0.04, 0.05, handle.material, [0, 0.02, 0], this.tool, 16);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.13, 16), new THREE.MeshStandardMaterial({ color: '#bd4639', roughness: 0.8 })); grip.position.y = -0.3; this.tool.add(grip);
    this.tool.visible = false; this.stage.add(this.tool);
    const trayTitle = this.makeLabel('BANDEJA DE PEÇAS'); trayTitle.position.set(hub.x - 1.05, 0.55, hub.z + 1.65); trayTitle.scale.set(1.5, 0.18, 1); this.stage.add(trayTitle);
  }
  makeLabel(text) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = text.length < 3 ? 512 : 64;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#15232be8'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f3d49b'; ctx.font = `bold ${text.length < 3 ? 330 : 30}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false }));
  }
  createUI() {
    const el = document.createElement('section'); el.id = 'assembly'; el.className = 'assembly hidden';
    el.setAttribute('aria-label', 'Prática de montagem 3D');
    el.innerHTML = `<header class="assembly-header"><div><span class="eyebrow">PRÁTICA INTERATIVA / 01</span><h2>Montagem de roda</h2><small>Veículo didático · modelo aproximado · suporte fixo</small></div><button id="assembly-exit">Sair da prática ×</button></header>
      <aside class="assembly-guide"><div class="section-number" id="assembly-step"></div><h3 id="assembly-title"></h3><p id="assembly-instruction"></p><div class="assembly-meter"><i id="assembly-meter-fill"></i></div><small id="assembly-count"></small><div id="assembly-feedback" role="status" aria-live="polite"></div><div id="assembly-targets" class="assembly-targets" aria-label="Alternativa por teclado para os alvos 3D"></div><details><summary>O que estou aprendendo?</summary><p id="assembly-learning"></p></details><p class="practice-note">Modelo educativo simplificado. Sem elevação, torque físico ou liberação para operar um veículo real.</p></aside>
      <div class="assembly-view-actions"><button id="assembly-focus">Focar encaixe</button><button id="assembly-car-view">Ver carro</button><button id="assembly-hood" aria-pressed="false">Abrir capô</button><button id="assembly-hint">Destacar próximo</button></div>
      <div class="assembly-parts" aria-label="Peças e ferramentas"><span>PEÇAS & FERRAMENTAS</span><div id="assembly-inventory"></div><button id="assembly-configure" class="primary hidden">Ativar perfil didático</button></div>
      <div class="assembly-help">Arraste para girar · Role / pinça para aproximar · Clique nas peças e encaixes · ESC para sair</div>
      <div id="assembly-result" class="assembly-result hidden"></div>`;
    this.ui.$('app')?.append(el); // AppUI é montado em #app.
    if (!el.parentElement) document.querySelector('#app').append(el);
    this.ui.bind('assembly-exit', () => this.requestExit());
    this.ui.bind('assembly-focus', () => this.focus()); this.ui.bind('assembly-car-view', () => this.focus(true));
    this.ui.bind('assembly-hood', () => {
      this.vehicle.setHood(!this.vehicle.hoodOpen); this.ui.$('assembly-hood').textContent = this.vehicle.hoodOpen ? 'Fechar capô' : 'Abrir capô'; this.ui.$('assembly-hood').setAttribute('aria-pressed', this.vehicle.hoodOpen);
    });
    this.ui.bind('assembly-hint', () => this.hint());
    this.ui.bind('assembly-configure', () => this.act('configure'));
    this.abort = new AbortController();
    document.addEventListener('keydown', e => { if (e.code === 'Escape' && this.active) this.requestExit(); }, { signal: this.abort.signal });
  }
  open() {
    this.savedPosition = this.engine.camera.position.clone(); this.savedQuaternion = this.engine.camera.quaternion.clone();
    this.active = true; this.busy = false; this.stage.visible = true; this.activity.reset();
    this.orbit = new OrbitControls(this.engine.camera, this.engine.renderer.domElement);
    this.orbit.enableDamping = true; this.orbit.enablePan = false; this.orbit.minDistance = 0.55; this.orbit.maxDistance = 8;
    this.orbit.minPolarAngle = 0.25; this.orbit.maxPolarAngle = Math.PI / 2 - 0.02;
    this.orbit.minAzimuthAngle = -Math.PI / 2 + 0.12; this.orbit.maxAzimuthAngle = Math.PI / 2 - 0.12;
    this.focus(); this.syncMeshes(); this.render(); this.ui.show('assembly'); this.ui.show('assembly-result', false);
    this.ui.$('assembly-exit').focus(); this.feedback('Comece clicando no centro do cubo destacado. Você pode girar e aproximar a câmera.', true);
  }
  focus(full = false) {
    if (!this.active) return;
    const hub = this.vehicle.hubWorld;
    const target = full ? this.vehicle.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)) : hub.clone();
    this.orbit.target.copy(target);
    this.engine.camera.position.copy(target).add(new THREE.Vector3(full ? -3.5 : -0.22, full ? 2.1 : 0.8, full ? 4.6 : 2.6));
    this.orbit.update();
  }
  select(id) {
    if (!this.active || this.busy || this.activity.completed) return;
    const result = this.activity.select(id); this.feedback(result.message, result.ok); this.render(); this.audio.play();
  }
  pick(e) {
    if (this.busy || this.activity.completed) return;
    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.engine.camera); this.stage.updateMatrixWorld(true);
    const candidates = [...this.targets.filter(t => t.visible), ...this.partPickers.filter(t => t.visible)];
    const hits = this.raycaster.intersectObjects(candidates, true);
    if (!hits.length) { this.feedback('Clique no alvo destacado ou selecione uma peça no inventário.', false); return; }
    let object = hits[0].object;
    while (object && !object.userData.part && !object.userData.kind) object = object.parent;
    if (object?.userData.part) { this.select(object.userData.part); return; }
    if (object?.userData.kind === 'bolt') {
      this.act(this.activity.step === 2 ? 'fit' : 'tighten', object.userData.index);
    } else if (object?.userData.kind === 'center') {
      this.act(this.activity.step === 0 ? 'inspect' : this.activity.step === 5 ? 'verify' : 'mount');
    }
  }
  act(action, index) {
    if (!this.active || this.busy) return;
    const result = this.activity.perform(action, index);
    this.feedback(result.message, result.ok);
    if (result.ok && action === 'tighten') {
      this.busy = true; this.animation = { kind: 'tighten', time: 0, duration: 0.85, index };
      this.tool.visible = true; this.tool.position.copy(this.boltTargets[index].position).add(new THREE.Vector3(0, 0, 0.06));
    } else if (result.ok && action === 'mount') {
      this.busy = true; this.animation = { kind: 'mount', time: 0, duration: 0.75, start: this.rackWheel.position.clone() };
    }
    this.syncMeshes(); this.render();
    if (result.completed) {
      const score = Math.max(0, 100 - this.activity.mistakes * 5);
      this.progress.complete(this.definition.id, score, 100); this.audio.play(true);
      this.ui.$('assembly-result').innerHTML = `<span class="eyebrow">PRÁTICA CONCLUÍDA</span><h2>Você montou e conferiu.</h2><p>12 ações realizadas · ${this.activity.mistakes} tentativas a revisar · aproveitamento ${score}%.</p><p>Você identificou o apoio, posicionou a roda, iniciou as fixações, preparou a ferramenta, aplicou a sequência cruzada e conferiu o conjunto.</p><div class="button-stack"><button id="assembly-repeat" class="primary">Desmontar e repetir</button><button id="assembly-finish">Voltar à oficina</button></div>`;
      this.ui.show('assembly-result');
      this.ui.bind('assembly-repeat', () => { this.activity.reset(); this.busy = false; this.animation = null; this.syncMeshes(); this.render(); this.ui.show('assembly-result', false); this.focus(); });
      this.ui.bind('assembly-finish', () => this.close()); this.ui.$('assembly-repeat').focus();
    } else if (result.ok) this.audio.play();
  }
  syncMeshes() {
    const a = this.activity;
    this.vehicle.activeWheel.visible = a.mounted;
    if (!this.animation || this.animation.kind !== 'mount') this.vehicle.activeWheel.position.copy(this.vehicle.homeWheelPosition);
    this.rackWheel.visible = !a.mounted;
    this.rackBolts.visible = a.fasteners.size < 4;
    this.ghost.visible = a.step === 1;
    this.hubRing.visible = [0, 1, 5].includes(a.step) && !a.completed;
    this.centerTarget.visible = this.hubRing.visible;
    for (let i = 0; i < 4; i++) {
      const bolt = this.vehicle.bolts[i]; bolt.visible = a.fasteners.has(i);
      bolt.material.color.set(a.tightened.includes(i) ? '#67a989' : '#b8bcb9');
      const target = this.boltTargets[i]; target.visible = [2, 4].includes(a.step);
      target.userData.ring.visible = target.visible && !(a.step === 2 ? a.fasteners.has(i) : a.tightened.includes(i));
      target.userData.label.visible = target.userData.ring.visible;
    }
  }
  render() {
    const a = this.activity;
    this.ui.$('assembly-step').textContent = `ETAPA ${a.step + 1} / ${this.definition.steps.length}`;
    this.ui.$('assembly-title').textContent = a.completed ? 'Conjunto conferido' : a.current.title;
    this.ui.$('assembly-instruction').textContent = a.current.instruction;
    this.ui.$('assembly-learning').textContent = a.current.learning;
    this.ui.$('assembly-meter-fill').style.width = `${a.progress / a.totalActions * 100}%`;
    this.ui.$('assembly-count').textContent = `${a.progress}/${a.totalActions} ações · ${a.mistakes} tentativas a revisar`;
    const inventory = this.ui.$('assembly-inventory'); inventory.innerHTML = '';
    const targets = this.ui.$('assembly-targets'); targets.innerHTML = '';
    if (!a.completed) {
      const add = (name, action, i) => { const b = document.createElement('button'); b.textContent = name; b.disabled = this.busy; b.onclick = () => this.act(action, i); targets.append(b); };
      if ([0, 1, 5].includes(a.step)) add(a.step === 0 ? 'Inspecionar cubo' : a.step === 1 ? 'Encaixar no centro' : 'Conferir centro', a.step === 0 ? 'inspect' : a.step === 1 ? 'mount' : 'verify');
      if ([2, 4].includes(a.step)) for (let i = 0; i < 4; i++) add(`Alvo ${i + 1}`, a.step === 2 ? 'fit' : 'tighten', i);
    }
    Object.entries(itemNames).forEach(([id, name]) => {
      const b = document.createElement('button'); b.textContent = name; b.setAttribute('aria-pressed', a.selected === id);
      b.disabled = this.busy || a.completed || (id === 'wheel' && a.mounted) || (id === 'fastener' && a.fasteners.size === 4);
      b.onclick = () => this.select(id); inventory.append(b);
    });
    this.ui.show('assembly-configure', a.step === 3); this.ui.$('assembly-configure').disabled = this.busy;
  }
  feedback(text, ok) { const el = this.ui.$('assembly-feedback'); el.textContent = text; el.className = ok ? 'feedback success' : 'feedback'; }
  hint() {
    if (!this.active) return;
    const step = this.activity.step;
    if ([0, 1, 5].includes(step)) { this.focus(); this.feedback(step === 1 ? 'Selecione o conjunto pneu + aro e clique no círculo no cubo.' : 'Clique no círculo no centro do conjunto.', true); }
    else if ([2, 4].includes(step)) {
      const i = step === 2 ? [0, 1, 2, 3].find(n => !this.activity.fasteners.has(n)) : this.definition.boltOrder[this.activity.tightened.length];
      if (i !== undefined) {
        this.boltTargets.forEach((t, j) => t.userData.ring.material.color.set(j === i ? '#91e0ad' : '#e2b864'));
        this.focus(); this.feedback(`Próximo alojamento: ${i + 1}. Selecione ${step === 2 ? 'os fixadores' : 'o torquímetro'} no inventário.`, true);
      }
    } else this.feedback('Selecione o torquímetro e clique em “Ativar perfil didático”.', true);
  }
  update(dt) {
    if (!this.active) return;
    this.orbit.update();
    if (!this.animation) return;
    const a = this.animation; a.time += dt; const t = Math.min(1, a.time / a.duration);
    if (a.kind === 'tighten') this.tool.rotation.z = -Math.sin(t * Math.PI) * 0.7;
    if (a.kind === 'mount') {
      const position = a.start.clone().lerp(this.vehicle.hubWorld, t * t * (3 - 2 * t));
      this.vehicle.group.worldToLocal(position); this.vehicle.activeWheel.position.copy(position);
    }
    if (t === 1) { this.busy = false; this.animation = null; this.tool.visible = false; this.syncMeshes(); this.render(); }
  }
  requestExit() {
    if (!this.active) return;
    if (this.activity.progress && !this.activity.completed) {
      this.ui.modal('Sair da montagem?', '<p>O resultado só é salvo ao concluir a conferência. Você pode voltar para terminar a montagem atual.</p><div class="button-stack"><button id="assembly-continue" class="primary">Continuar montando</button><button id="assembly-leave">Sair sem concluir</button></div>');
      this.ui.bind('assembly-continue', () => this.ui.closeModal());
      this.ui.bind('assembly-leave', () => { this.ui.closeModal(); this.close(); });
    } else this.close();
  }
  close() {
    if (!this.active) return;
    this.active = false; this.busy = false; this.animation = null; this.tool.visible = false;
    this.orbit.dispose(); this.stage.visible = false; this.ui.show('assembly', false);
    this.vehicle.activeWheel.visible = true; this.vehicle.activeWheel.position.copy(this.vehicle.homeWheelPosition);
    this.vehicle.bolts.forEach(b => { b.visible = true; b.material.color.set('#b8bcb9'); });
    this.engine.camera.position.copy(this.savedPosition); this.engine.camera.quaternion.copy(this.savedQuaternion);
    this.onExit();
  }
  dispose() {
    this.orbit?.dispose(); this.abort.abort();
    this.engine.renderer.domElement.removeEventListener('pointerdown', this.onDown);
    this.engine.renderer.domElement.removeEventListener('pointerup', this.onUp);
  }
}
