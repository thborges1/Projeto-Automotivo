import * as THREE from 'three';
import { oilProfiles } from '../education/OilChangeActivity.js';

export class OilChangeRig {
  constructor(vehicle, scene) {
    this.vehicle = vehicle; this.scene = scene;
    this.root = new THREE.Group(); this.root.name = 'manutencao-oleo'; vehicle.group.add(this.root);
    this.floor = new THREE.Group(); this.floor.name = 'coleta-oleo'; scene.add(this.floor);
    this.metal = new THREE.MeshStandardMaterial({ color: '#a9afb0', metalness: 0.7, roughness: 0.4 });
    this.dark = new THREE.MeshStandardMaterial({ color: '#242a2c', roughness: 0.65 });
    this.fresh = new THREE.MeshStandardMaterial({ color: '#e4c06c', roughness: 0.45 });
    this.oil = new THREE.MeshBasicMaterial({ color: '#302518' });
    this.green = new THREE.MeshBasicMaterial({ color: '#71d4aa', transparent: true, opacity: 0.7, depthWrite: false });
    this.blue = new THREE.MeshStandardMaterial({ color: '#367e9a', roughness: 0.5 });
    this.box = new THREE.BoxGeometry(1, 1, 1); this.cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
    this.sphere = new THREE.SphereGeometry(1, 10, 6);
    this.targets = [];
    const add = (name, geometry, material, size, position, parent = this.root) => {
      const mesh = new THREE.Mesh(geometry, material); mesh.name = name;
      mesh.scale.set(...size); mesh.position.set(...position); parent.add(mesh); return mesh;
    };
    this.pan = add('pan', this.box, this.metal, [0.49, 0.009, 0.46], [-1.4, 0.197, 0]);
    this.hole = add('drainHole', this.cylinder, this.dark, [0.024, 0.005, 0.024], [-1.48, 0.19, 0.1]);
    this.plug = add('plug', new THREE.CylinderGeometry(0.03, 0.03, 0.025, 6), this.metal, [1, 1, 1], [-1.48, 0.177, 0.1]);
    this.seal = add('seal', this.cylinder, this.fresh, [0.036, 0.008, 0.036], [-1.48, 0.19, 0.1]);
    this.filterSeat = add('filterSeat', this.cylinder, this.metal, [0.08, 0.018, 0.08], [-1.64, 0.32, 0.36]);
    this.filter = add('filter', this.cylinder, this.blue, [0.075, 0.16, 0.075], [-1.64, 0.25, 0.36]);
    this.upper = new THREE.Group(); this.root.add(this.upper);
    add('engineCover', this.box, this.dark, [0.61, 0.1, 0.65], [-1.4, 0.96, 0], this.upper);
    this.filler = add('filler', this.cylinder, this.dark, [0.055, 0.06, 0.055], [-1.37, 1.04, 0.13], this.upper);
    this.cap = add('cap', this.cylinder, this.fresh, [0.068, 0.025, 0.068], [-1.37, 1.085, 0.13], this.upper);
    this.dipstick = add('dipstick', this.cylinder, this.fresh, [0.018, 0.12, 0.018], [-1.12, 1.02, -0.23], this.upper);
    this.tool = new THREE.Group(); this.root.add(this.tool);
    add('handle', this.box, this.metal, [0.25, 0.025, 0.035], [0.11, 0, 0], this.tool);
    add('socket', this.cylinder, this.metal, [0.04, 0.06, 0.04], [0, 0.02, 0], this.tool);
    this.bottle = add('oilBottle', this.box, this.fresh, [0.17, 0.26, 0.12], [-1.45, 1.31, 0.13], this.upper);
    this.fillStream = add('freshOil', this.cylinder, this.fresh, [0.009, 0.18, 0.009], [-1.37, 1.17, 0.13], this.upper);
    this.collector = new THREE.Group(); this.floor.add(this.collector);
    add('collectorBase', this.cylinder, this.dark, [0.32, 0.08, 0.32], [0, 0.08, 0], this.collector);
    add('collectorStem', this.cylinder, this.metal, [0.035, 0.3, 0.035], [0, 0.24, 0], this.collector);
    add('collectorBowl', new THREE.CylinderGeometry(0.36, 0.22, 0.12, 16, 1, true), this.blue, [1, 1, 1], [0, 0.45, 0], this.collector).material.side = THREE.DoubleSide;
    this.liquid = add('usedOil', this.cylinder, this.oil, [0.31, 0.01, 0.31], [0, 0.4, 0], this.collector);
    this.stream = add('oilFlow', this.cylinder, this.oil, [0.014, 1, 0.014], [0, 1, 0], this.floor);
    this.usedFilter = add('usedFilter', this.cylinder, this.dark, [0.075, 0.16, 0.075], [0.9, 0.12, 0], this.floor);
    this.usedPlug = add('removedPlug', this.cylinder, this.metal, [0.03, 0.025, 0.03], [0.75, 0.05, 0], this.floor);
    this.marker = add('collectorGuide', new THREE.TorusGeometry(0.39, 0.009, 4, 24), this.green, [1, 1, 1], [0, 0.025, 0], this.floor);
    this.marker.rotation.x = -Math.PI / 2;
    this.exit = add('exit', new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12), this.green, [1, 1, 1], [0, 0.025, 0], this.floor);
    this.highlight = new THREE.BoxHelper(this.plug, '#e5c77d'); this.highlight.visible = false; scene.add(this.highlight);
    // Generous invisible pick volumes still respect the depth of the visible scene.
    const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    for (const [id, size] of [['pan', 0.24], ['plug', 0.07], ['filter', 0.1], ['filterSeat', 0.1], ['hood', 0.3], ['cap', 0.085], ['filler', 0.08], ['dipstick', 0.08], ['leakCheck', 0.15]]) {
      const target = add(`pick-${id}`, this.sphere, hitMaterial, [size, size, size], [0, 0, 0]);
      target.userData.oilTarget = id; this.targets.push(target);
    }
    this.point = new THREE.Vector3(); this.local = new THREE.Vector3();
    this.collector.userData.oilTarget = 'collector'; this.exit.userData.oilTarget = 'exit';
    for (const id of ['pan', 'plug', 'filter', 'filterSeat', 'cap', 'filler', 'dipstick']) this[id].userData.oilTarget = id;
    this.vehicle.hood.userData.oilTarget = 'hood';
    this.collectorTarget = new THREE.Vector3(); this.parking = new THREE.Vector3(); this.exitPoint = new THREE.Vector3();
    this.floor.visible = false; this.root.visible = false;
  }
  setProfile(id) {
    this.profile = id; const profile = oilProfiles[id];
    this.plug.position.fromArray(profile.plug); this.filter.position.fromArray(profile.filter);
    this.filterSeat.position.copy(this.filter.position); this.filterSeat.position.y += 0.09;
    this.vehicle.group.updateWorldMatrix(true, false);
    this.collectorTarget.copy(this.plug.position); this.vehicle.group.localToWorld(this.collectorTarget); this.collectorTarget.y = 0;
    this.parking.set(-1.4, 0, 1.5); this.vehicle.group.localToWorld(this.parking); this.parking.y = 0;
    this.exitPoint.set(-3, 0, 0); this.vehicle.group.localToWorld(this.exitPoint); this.exitPoint.y = 0;
    this.collector.position.copy(this.parking);
    this.usedFilter.position.copy(this.parking); this.usedFilter.position.y = 0.12;
    this.usedPlug.position.copy(this.parking); this.usedPlug.position.x += 0.18; this.usedPlug.position.y = 0.05;
  }
  collectorAligned() { return Math.hypot(this.collector.position.x - this.collectorTarget.x, this.collector.position.z - this.collectorTarget.z) < 0.12; }
  outsideFootprint(position, margin = 0.4) {
    this.local.copy(position); this.vehicle.group.worldToLocal(this.local);
    return Math.abs(this.local.x) > 2.2 + margin || Math.abs(this.local.z) > 0.9 + margin;
  }
  targetObject(id) {
    switch (id) {
      case 'hood': return this.vehicle.hood;
      case 'leakCheck': return this.pan;
      case 'pan': case 'plug': case 'filter': case 'filterSeat': case 'cap': case 'filler':
      case 'dipstick': case 'collector': case 'exit': return this[id];
      default: return null;
    }
  }
  sync(activity) {
    const id = activity.current?.id, t = activity.pending ? activity.elapsed / (activity.current.duration || 1) : 0;
    this.root.visible = true; this.floor.visible = true;
    this.plug.visible = !activity.plugRemoved;
    this.plug.position.fromArray(oilProfiles[this.profile].plug);
    if (id === 'removePlug' && activity.pending) { this.plug.position.y -= t * 0.12; this.plug.rotation.y = t * Math.PI * 4; }
    if (id === 'installPlug' && activity.pending) { this.plug.visible = true; this.plug.position.y -= (1 - t) * 0.12; this.plug.rotation.y = -t * Math.PI * 4; }
    this.seal.visible = activity.sealReplaced;
    this.filter.visible = !activity.filterRemoved;
    this.filter.position.fromArray(oilProfiles[this.profile].filter);
    if (id === 'removeFilter' && activity.pending) { this.filter.position.y -= t * 0.16; this.filter.rotation.y = t * Math.PI * 3; }
    if (id === 'installFilter' && activity.pending) { this.filter.visible = true; this.filter.position.y -= (1 - t) * 0.16; this.filter.rotation.y = -t * Math.PI * 3; }
    this.filter.material = activity.filterInstalled || id === 'installFilter' ? this.fresh : this.blue;
    this.usedFilter.visible = activity.index > 9;
    this.usedPlug.visible = activity.plugRemoved;
    this.tool.visible = activity.pending && ['removePlug', 'removeFilter', 'installPlug', 'installFilter', 'tighten'].includes(id);
    if (this.tool.visible) { this.tool.position.copy(id.includes('Filter') ? this.filter.position : this.plug.position); this.tool.position.y -= 0.05; this.tool.rotation.y = Math.sin(t * Math.PI * 4) * 0.5; }
    this.stream.visible = id === 'drain' && activity.drained < 1;
    if (this.stream.visible) {
      this.point.copy(this.plug.position); this.vehicle.group.localToWorld(this.point);
      const height = Math.max(0.01, this.point.y - 0.51);
      this.stream.position.set(this.point.x, 0.51 + height / 2, this.point.z);
      const radius = 0.014 * Math.max(0.12, 1 - activity.drained);
      this.stream.scale.set(radius, height, radius);
    }
    this.liquid.scale.y = 0.01 + activity.drained * 0.07;
    this.liquid.position.y = 0.4 + activity.drained * 0.035;
    this.upper.visible = activity.stage >= 8;
    this.bottle.visible = this.fillStream.visible = id === 'fill' && activity.pending;
    this.bottle.rotation.z = -0.6;
    this.cap.visible = !activity.capOpen;
    this.cap.position.y = 1.085 + (id === 'cap' && activity.pending ? t * 0.12 : id === 'closeCap' && activity.pending ? (1 - t) * 0.12 : 0);
    if (id === 'closeCap' && activity.pending) this.cap.visible = true;
    this.dipstick.position.y = 1.02 + (id === 'level' && activity.pending ? Math.sin(t * Math.PI) * 0.17 : 0);
    this.marker.visible = ['collector', 'parkCollector'].includes(id);
    this.marker.position.copy(id === 'parkCollector' ? this.parking : this.collectorTarget); this.marker.position.y = 0.025;
    this.exit.position.copy(this.exitPoint); this.exit.position.y = 0.025;
    this.exit.visible = id === 'leave';
    for (const target of this.targets) {
      const key = target.userData.oilTarget;
      const object = this.targetObject(key);
      target.position.copy(object.position);
      if (key === 'hood') target.position.x -= 0.5;
      target.visible = key === activity.current?.target || (activity.stage < 8 && ['pan', 'plug', 'filter', 'filterSeat'].includes(key));
      // Cap/filler/dipstick are authored under upper but pickers are root-local.
    }
    this.highlight.visible = !activity.completed && !activity.busy && Boolean(this.targetObject(activity.current?.target));
    if (this.highlight.visible) { this.highlight.setFromObject(this.targetObject(activity.current.target)); this.highlight.update(); }
  }
  reset() {
    this.root.visible = this.floor.visible = this.highlight.visible = false;
    this.vehicle.hood.rotation.z = 0;
  }
  dispose() {
    const geometries = new Set(), materials = new Set();
    for (const root of [this.root, this.floor, this.highlight]) {
      root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); }); root.removeFromParent();
    }
    for (const geometry of geometries) geometry.dispose(); for (const material of materials) material.dispose();
  }
}
