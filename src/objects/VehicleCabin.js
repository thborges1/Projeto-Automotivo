import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Shared corners keep glazing, pillars, roof and beltline joined at every edge.
export function createVehicleCabin({ body, trim, glass }) {
  const root = new THREE.Group(); root.name = 'cabine-contínua';
  const batches = new Map();
  function quad(a, b, c, d, material) {
    const geometry = new THREE.BufferGeometry();
    // Both windings are baked so paint stays visible from inside without changing
    // the shared paint material to DoubleSide for the entire vehicle.
    const points = [...a, ...b, ...c, ...a, ...c, ...d];
    if (material !== glass) points.push(...c, ...b, ...a, ...d, ...c, ...a);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(points.length / 3 * 2), 2));
    geometry.computeVertexNormals();
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(geometry);
  }
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function framed(a, b, c, d) {
    // Inset glazing in the same plane: no empty seams or coplanar overlays.
    const bottomLeft = mix(a, b, 0.045), bottomRight = mix(b, a, 0.045);
    const topLeft = mix(d, c, 0.045), topRight = mix(c, d, 0.045);
    const ia = mix(bottomLeft, topLeft, 0.055), ib = mix(bottomRight, topRight, 0.055);
    const ic = mix(topRight, bottomRight, 0.055), id = mix(topLeft, bottomLeft, 0.055);
    quad(a, b, ib, ia, body); quad(b, c, ic, ib, body);
    quad(c, d, id, ic, body); quad(d, a, ia, id, body);
    quad(ia, ib, ic, id, glass);
  }
  for (const side of [-1, 1]) {
    const z = side * 0.715;
    const a = [-0.99, 1.19, z], b = [1.4, 1.19, z];
    const c = [0.9, 1.69, z], d = [-0.46, 1.69, z];
    framed(a, b, c, d);
    // Continuous sloping shoulder bridges the narrower cabin to the door skin.
    quad([-1.06, 1.035, side * 0.825], [1.58, 1.075, side * 0.825], b, a, body);
    quad([0.335, 1.215, z + side * 0.001], [0.4, 1.215, z + side * 0.001],
      [0.4, 1.665, z + side * 0.001], [0.335, 1.665, z + side * 0.001], trim);
  }
  framed([-0.99, 1.19, -0.715], [-0.99, 1.19, 0.715], [-0.46, 1.69, 0.715], [-0.46, 1.69, -0.715]);
  framed([1.4, 1.19, 0.715], [1.4, 1.19, -0.715], [0.9, 1.69, -0.715], [0.9, 1.69, 0.715]);
  quad([-1.06, 1.035, -0.825], [-1.06, 1.035, 0.825], [-0.99, 1.19, 0.715], [-0.99, 1.19, -0.715], body);
  quad([1.4, 1.19, -0.715], [1.4, 1.19, 0.715], [1.58, 1.075, 0.825], [1.58, 1.075, -0.825], body);
  // Roof uses the exact same upper corners as all four glazed surfaces.
  quad([-0.46, 1.69, -0.715], [-0.46, 1.69, 0.715], [0.9, 1.69, 0.715], [0.9, 1.69, -0.715], body);
  for (const [material, geometries] of batches) {
    const geometry = mergeGeometries(geometries, false);
    for (const part of geometries) part.dispose();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = material === glass ? 'vidros-ajustados' : 'junções-da-cabine';
    root.add(mesh);
  }
  return root;
}
