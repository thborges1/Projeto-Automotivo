import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const metal = new THREE.MeshStandardMaterial({ color: '#a9afb0', roughness: 0.32, metalness: 0.8 });
const rubber = new THREE.MeshStandardMaterial({ color: '#252628', roughness: 0.93 });
const black = new THREE.MeshStandardMaterial({ color: '#202a2c', roughness: 0.6 });
const paint = color => new THREE.MeshPhysicalMaterial({ color, roughness: 0.44, metalness: 0.18, clearcoat: 0.25, clearcoatRoughness: 0.35 });
const mesh = (geometry, material, position, parent) => {
  const m = new THREE.Mesh(geometry, material); m.position.set(...position); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
};
const round = (size, material, position, parent, radius = 0.05) => mesh(new RoundedBoxGeometry(...size, 2, radius), material, position, parent);
export function cylinder(radius, depth, material, position, parent, segments = 40) {
  const m = mesh(new THREE.CylinderGeometry(radius, radius, depth, segments), material, position, parent); m.rotation.x = Math.PI / 2; return m;
}

export function createWheel() {
  const group = new THREE.Group();
  const tire = mesh(new THREE.TorusGeometry(0.302, 0.093, 14, 56), rubber, [0, 0, 0], group);
  tire.scale.z = 1.35;
  cylinder(0.225, 0.15, black, [0, 0, 0.015], group);
  cylinder(0.19, 0.16, metal, [0, 0, 0.03], group);
  const holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 12), black, 8);
  const holeTransform = new THREE.Object3D();
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    holeTransform.position.set(Math.sin(angle) * 0.145, Math.cos(angle) * 0.145, 0.12);
    holeTransform.rotation.x = Math.PI / 2; holeTransform.updateMatrix(); holes.setMatrixAt(i, holeTransform.matrix);
  }
  group.add(holes);
  const rim = mesh(new THREE.TorusGeometry(0.218, 0.008, 6, 40), paint('#428a92'), [0, 0, 0.095], group);
  cylinder(0.075, 0.03, black, [0, 0, 0.14], group);
  // Blocos repetidos da banda são instanciados, sem uma chamada de desenho por bloco.
  const tread = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.009, 0.18), rubber, 52);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 52; i++) { const a = i / 52 * Math.PI * 2; dummy.position.set(Math.sin(a) * 0.392, Math.cos(a) * 0.392, 0); dummy.rotation.z = -a; dummy.updateMatrix(); tread.setMatrixAt(i, dummy.matrix); }
  tread.castShadow = true; group.add(tread);
  return group;
}

export class Vehicle {
  constructor(position = [5.2, 0, -3], options = {}) {
    this.group = new THREE.Group(); this.group.position.set(...position);
    this.group.name = 'veiculo-didatico-estimado';
    this.group.userData.dynamic = !options.color;
    const orange = paint(options.color || '#d58b2f'), cream = paint(options.color || '#d3d0ba'), red = paint(options.color || '#b93730'), turquoise = paint(options.color || '#62abb0');
    const glass = new THREE.MeshPhysicalMaterial({ color: '#425b60', metalness: 0.2, roughness: 0.18, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    round([3.85, 0.36, 1.56], black, [0, 0.51, 0], this.group);
    // Flancs extrudés avec véritables passages de roue, pas de cube posé sur quatre roues.
    const profile = new THREE.Shape();
    profile.moveTo(-1.95, 0.48); profile.lineTo(-1.97, 0.88);
    profile.quadraticCurveTo(-1.85, 1.04, -1.5, 1.05); profile.lineTo(1.56, 1.1);
    profile.quadraticCurveTo(1.92, 1.1, 1.95, 0.9); profile.lineTo(1.95, 0.48); profile.lineTo(1.72, 0.48);
    profile.bezierCurveTo(1.72, 1.03, 0.7, 1.03, 0.7, 0.48); profile.lineTo(-0.73, 0.48);
    profile.bezierCurveTo(-0.73, 1.03, -1.75, 1.03, -1.75, 0.48); profile.closePath();
    const bodyGeometry = new THREE.ExtrudeGeometry(profile, { depth: 0.065, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 16 });
    for (const side of [-1, 1]) {
      mesh(bodyGeometry, orange, [0, 0, side > 0 ? 0.76 : -0.825], this.group);
      round([1.4, 0.53, 0.045], cream, [-0.15, 0.92, side * 0.81], this.group, 0.035);
      round([0.23, 0.045, 0.045], black, [0.36, 1.05, side * 0.845], this.group, 0.018);
      const windowShape = new THREE.Shape();
      windowShape.moveTo(-0.95, 1.19); windowShape.lineTo(-0.44, 1.66); windowShape.lineTo(0.87, 1.67); windowShape.lineTo(1.39, 1.2); windowShape.closePath();
      mesh(new THREE.ShapeGeometry(windowShape), glass, [0, 0, side * 0.715], this.group);
      const pillar = round([0.065, 0.53, 0.06], black, [0.37, 1.43, side * 0.72], this.group, 0.015); pillar.rotation.z = 0.03;
      const aPillar = round([0.065, 0.73, 0.07], orange, [-0.73, 1.43, side * 0.73], this.group, 0.02); aPillar.rotation.z = -0.81;
      const cPillar = round([0.12, 0.71, 0.08], orange, [1.15, 1.43, side * 0.73], this.group, 0.025); cPillar.rotation.z = 0.78;
      round([0.18, 0.12, 0.16], black, [-0.78, 1.22, side * 0.9], this.group, 0.04);
    }
    round([1.4, 0.09, 1.43], orange, [0.23, 1.72, 0], this.group, 0.04);
    const windshield = round([0.035, 0.72, 1.37], glass, [-0.7, 1.43, 0], this.group, 0.015); windshield.rotation.z = -0.81;
    const rearGlass = round([0.035, 0.7, 1.37], glass, [1.15, 1.43, 0], this.group, 0.015); rearGlass.rotation.z = 0.78;
    round([0.14, 0.48, 1.54], red, [1.92, 0.92, 0], this.group);
    for (const side of [-1, 1]) round([0.08, 0.22, 0.25], paint('#a92320'), [2.01, 1.02, side * 0.59], this.group, 0.04);
    round([0.22, 0.23, 1.65], turquoise, [1.98, 0.59, 0], this.group, 0.08);
    round([0.21, 0.23, 1.65], black, [-1.99, 0.59, 0], this.group, 0.06);
    for (const side of [-1, 1]) round([0.12, 0.15, 0.42], paint('#e1dfc7'), [-1.98, 0.88, side * 0.53], this.group);
    round([0.12, 0.15, 0.55], black, [-2.02, 0.79, 0], this.group);
    this.hood = new THREE.Group(); this.hood.position.set(-0.94, 1.08, 0); this.group.add(this.hood);
    round([1.02, 0.06, 1.49], paint(options.color || '#58a126'), [-0.51, 0, 0], this.hood, 0.04);
    this.engine = new THREE.Group(); this.engine.position.set(-1.4, 0.8, 0); this.group.add(this.engine);
    round([0.6, 0.35, 0.65], metal, [0, 0, 0], this.engine);
    round([0.63, 0.08, 0.38], black, [0, 0.21, 0], this.engine);
    for (let i = 0; i < 4; i++) cylinder(0.045, 0.12, metal, [-0.23 + i * 0.15, 0.27, 0], this.engine);
    this.wheels = [];
    for (const x of [-1.24, 1.21]) for (const side of [-1, 1]) {
      const wheel = createWheel(); wheel.position.set(x, 0.4, side * 0.84); if (side < 0) wheel.rotation.y = Math.PI;
      this.group.add(wheel); this.wheels.push(wheel);
    }
    this.activeWheel = this.wheels[1]; // Frente, lado +Z: removível na atividade.
    this.hubLocal = new THREE.Vector3(-1.24, 0.4, 0.84);
    this.hubGroup = new THREE.Group(); this.hubGroup.position.copy(this.hubLocal); this.group.add(this.hubGroup);
    cylinder(0.17, 0.065, metal, [0, 0, -0.025], this.hubGroup);
    cylinder(0.055, 0.11, metal, [0, 0, 0.03], this.hubGroup);
    round([0.09, 0.18, 0.09], paint('#7b7d70'), [0.155, 0.03, -0.02], this.hubGroup, 0.025);
    // Suporte fixo didático sob o eixo. Não é um elevador operável.
    for (const side of [-1, 1]) {
      round([0.36, 0.045, 0.45], black, [-1.24, 0.025, side * 0.5], this.group);
      round([0.13, 0.31, 0.13], metal, [-1.24, 0.2, side * 0.5], this.group);
    }
    this.boltPositions = Array.from({ length: 4 }, (_, i) => {
      const a = i * Math.PI / 2; return new THREE.Vector3(Math.sin(a) * 0.105, Math.cos(a) * 0.105, 0.17);
    });
    this.bolts = this.boltPositions.map(p => cylinder(0.023, 0.045, metal.clone(), [p.x, p.y, p.z], this.activeWheel, 6));
    this.homeWheelPosition = this.activeWheel.position.clone();
    this.hoodOpen = false;
    if (options.color) this.group.traverse(o => { if (o.isMesh) o.userData.static = true; });
  }
  setHood(open) { this.hoodOpen = open; }
  update(dt) { this.hood.rotation.z = THREE.MathUtils.damp(this.hood.rotation.z, this.hoodOpen ? -1.05 : 0, 8, dt); }
  get hubWorld() { this.group.updateMatrixWorld(true); return this.group.localToWorld(this.hubLocal.clone()); }
}
