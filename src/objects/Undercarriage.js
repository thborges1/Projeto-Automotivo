import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Local vehicle axes: front -X, rear +X, wheel track along Z.
// These parts are visual only; merge by material to keep rendering inexpensive.
export function createUndercarriage({ metal, black, rubber, serviceable = false }) {
  const group = new THREE.Group(); group.name = 'parte-inferior';
  const batches = new Map();
  const components = [];
  const ids = name => /escapamento|catalisador|silencioso/.test(name) ? 'exhaust'
    : /suspensão|amortecedor|mola/.test(name) ? 'suspension'
    : /cárter/.test(name) ? 'oilPan' : /transmissão|semieixo|homocinética/.test(name) ? 'transmission'
    : /tanque/.test(name) ? 'fuelTank' : /freio/.test(name) ? 'brakes' : 'chassis';
  function part(name, geometry, material, position, rotation = [0, 0, 0]) {
    const transform = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(1, 1, 1));
    geometry.applyMatrix4(transform);
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    flat.userData.inspectionPart = ids(name);
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(flat);
    components.push(name);
  }
  function box(name, size, position, material = black) {
    part(name, new THREE.BoxGeometry(...size), material, position);
  }
  function rod(name, start, end, radius, material = metal) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const direction = b.clone().sub(a);
    const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 8);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
    part(name, geometry, material, a.add(b).multiplyScalar(0.5).toArray());
  }

  // Pressed floor panels, tunnel and structural rails, below the existing floor.
  for (const side of [-1, 1]) {
    box('painel do assoalho', [1.76, 0.035, 0.48], [0.05, 0.318, side * 0.43]);
    box('longarina', [3.48, 0.11, 0.09], [0, 0.285, side * 0.65]);
    for (const x of [-0.65, -0.15, 0.35, 0.85]) {
      box('nervura do assoalho', [0.035, 0.025, 0.43], [x, 0.29, side * 0.42], metal);
    }
    for (const x of [-1.24, 1.21]) {
      rod('braço de suspensão', [x - 0.2, 0.3, side * 0.3], [x, 0.35, side * 0.76], 0.035, black);
      rod('braço de suspensão', [x + 0.19, 0.3, side * 0.3], [x, 0.35, side * 0.76], 0.035, black);
      rod('amortecedor', [x + 0.08, 0.31, side * 0.65], [x + 0.13, 0.64, side * 0.64], 0.035, metal);
      rod('coifa do amortecedor', [x + 0.11, 0.47, side * 0.64], [x + 0.13, 0.64, side * 0.64], 0.05, rubber);
      const points = Array.from({ length: 25 }, (_, i) => {
        const a = i / 24 * Math.PI * 8;
        return new THREE.Vector3(x - 0.12 + Math.cos(a) * 0.065, 0.33 + i / 24 * 0.25, side * 0.58 + Math.sin(a) * 0.065);
      });
      part('mola helicoidal', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.012, 4, false), black, [0, 0, 0]);
    }
    rod('linha de freio', [-1.1, 0.255, side * 0.59], [1.15, 0.255, side * 0.59], 0.008, metal);
  }
  box('túnel central', [2.15, 0.055, 0.24], [0.02, 0.3, 0]);
  for (const x of [-1.24, 1.21]) box('travessa do subchassi', [0.16, 0.09, 1.22], [x, 0.29, 0]);
  box('cárter do motor', [0.51, 0.16, 0.48], [-1.4, 0.285, 0], metal);
  for (let i = 0; i < 5; i++) box('aleta do cárter', [0.37, 0.018, 0.025], [-1.4, 0.196, -0.16 + i * 0.08], black);
  if (!serviceable) rod('bujão do cárter', [-1.48, 0.187, 0.1], [-1.48, 0.2, 0.1], 0.026, metal);
  box('carcaça da transmissão', [0.38, 0.13, 0.4], [-0.98, 0.285, 0.05], metal);
  for (const side of [-1, 1]) {
    rod('semieixo dianteiro', [-1.24, 0.37, side * 0.17], [-1.24, 0.4, side * 0.76], 0.025, metal);
    rod('coifa da junta homocinética', [-1.24, 0.39, side * 0.58], [-1.24, 0.4, side * 0.7], 0.055, rubber);
  }
  box('tanque de combustível', [0.57, 0.13, 0.67], [0.94, 0.275, 0.12]);
  for (const x of [0.76, 1.1]) box('cinta do tanque', [0.035, 0.016, 0.68], [x, 0.202, 0.12], metal);
  const exhaust = [[-1.5, 0.24, -0.3], [-0.8, 0.215, -0.21], [0.3, 0.215, -0.21], [0.65, 0.22, -0.43], [1.55, 0.24, -0.43], [2.02, 0.3, -0.47]];
  for (let i = 1; i < exhaust.length; i++) rod('tubo de escapamento', exhaust[i - 1], exhaust[i], 0.027);
  box('escudo térmico do escapamento', [1.1, 0.02, 0.28], [-0.15, 0.29, -0.21], metal);
  part('catalisador', new THREE.CylinderGeometry(0.075, 0.065, 0.32, 10), metal, [-0.53, 0.215, -0.21], [0, 0, Math.PI / 2]);
  box('silencioso traseiro', [0.43, 0.13, 0.26], [1.48, 0.25, -0.43], metal);
  rod('saída do escapamento', [1.92, 0.29, -0.47], [2.045, 0.31, -0.48], 0.035, black);

  for (const [material, geometries] of batches) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'conjunto inferior'; mesh.castShadow = mesh.receiveShadow = true;
    let triangleOffset = 0;
    mesh.userData.inspectionFaces = geometries.map(g => {
      const start = triangleOffset; triangleOffset += g.attributes.position.count / 3;
      return { start, end: triangleOffset, id: g.userData.inspectionPart };
    });
    group.add(mesh);
  }
  group.userData.components = components;
  return group;
}
