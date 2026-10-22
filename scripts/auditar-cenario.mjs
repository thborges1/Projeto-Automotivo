import { readFileSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { createWorkshop } from '../src/world/Workshop.js';
import { CollisionSystem } from '../src/core/CollisionSystem.js';

const config = JSON.parse(readFileSync(new URL('../public/data/workshop.json', import.meta.url)));
const equipment = JSON.parse(readFileSync(new URL('../public/data/equipment.json', import.meta.url)));
// Stub somente do canvas 2D: audita geometria sem fingir renderização WebGL.
globalThis.document = { createElement: () => ({ getContext: () => ({
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  putImageData() {}, fillRect() {}, fillText() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
}) }) };
const scene = new THREE.Scene(), collision = new CollisionSystem(config.playerRadius);
const world = createWorkshop(scene, collision, config);
let meshes = 0, batches = 0, instances = 0, triangles = 0;
scene.traverse(o => {
  if (!o.isMesh) return; meshes++;
  const count = o.isInstancedMesh ? o.count : 1;
  if (o.isInstancedMesh) { batches++; instances += count; }
  triangles += ((o.geometry.index?.count || o.geometry.attributes.position.count) / 3) * count;
});
const report = { kind: 'Auditoria estrutural em CPU, sem renderização gráfica', meshes, batches, instances, triangles: Math.round(triangles), staticDrawCallsAvoided: world.savedDrawCalls,
  collisionBoxes: collision.boxes.length, comparisonViews: config.reconstruction.comparisonViews.length, estimatedDimensions: { width: config.width, depth: config.depth, eave: config.height, ridge: config.reconstruction.ridgeHeight }, screenshotsGenerated: false, fpsMeasured: false };
writeFileSync(new URL('../docs/auditoria-cenario.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);

const sx = x => 200 + (x + config.width / 2) * 20, sz = z => 110 + (z + config.depth / 2) * 20;
const parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1020" height="850" viewBox="0 0 1020 850">', '<rect width="1020" height="850" fill="#f3f2ec"/>', '<style>text{font-family:Arial,sans-serif;fill:#23343b;font-size:12px}.small{font-size:10px}.title{font-size:24px;font-weight:bold}.label{font-size:11px;font-weight:bold}</style>', '<text x="45" y="45" class="title">Mapa de trabalho da oficina</text>', '<text x="45" y="72">Implantação estimada por fotografias. NÃO é planta aferida nem levantamento arquitetônico.</text>'];
function rect(x, z, w, d, color, label) { parts.push(`<rect x="${sx(x - w / 2)}" y="${sz(z - d / 2)}" width="${w * 20}" height="${d * 20}" fill="${color}" stroke="#4d646e" stroke-dasharray="4 2"/>`); if (label) parts.push(`<text class="small" x="${sx(x)}" y="${sz(z) + 3}" text-anchor="middle">${label}</text>`); }
rect(0, 0, config.width, config.depth, '#e3e0d3', '');
const r = config.reconstruction;
rect(r.lab.center[0], r.lab.center[2], r.lab.size[0], r.lab.size[2], '#9fa7ab', 'LAB');
for (const c of r.coveredCars) rect(c.position[0], c.position[2], 1.9, c.length, '#b3babb', 'C');
for (const c of r.lifts) { rect(c.position[0], c.position[2], 1.9, 4.2, '#eeeeea', 'V'); for (const side of [-1, 1]) rect(c.position[0] + side * 1.57, c.position[2], 0.3, 0.4, '#377e9b', ''); rect(c.position[0] + 0.25, c.position[2] - 3.4, 1.05, 0.5, '#c9c4a6', 'A'); }
rect(r.vehicle[0], r.vehicle[2], 4.2, 1.9, '#d9974d', 'HATCH');
for (const b of [...r.benches, { position: equipment[0].position, size: [2.8, 0.94, 1.1] }]) rect(b.position[0], b.position[2], b.size[0], b.size[2], '#7f9399', 'B');
for (const e of r.engineStands) rect(e.position[0], e.position[2], 0.9, 0.9, '#60866b', 'M');
for (const z of r.windowCenters) parts.push(`<line x1="${sx(10)}" x2="${sx(10)}" y1="${sz(z - 1.55)}" y2="${sz(z + 1.55)}" stroke="#57a2b5" stroke-width="5"/>`);
for (const x of r.motorWindowCenters) parts.push(`<line x1="${sx(x - 1.4)}" x2="${sx(x + 1.4)}" y1="${sz(-15)}" y2="${sz(-15)}" stroke="#57a2b5" stroke-width="5"/>`);
parts.push(`<line x1="${sx(r.gate.x - r.gate.width / 2)}" x2="${sx(r.gate.x + r.gate.width / 2)}" y1="${sz(15)}" y2="${sz(15)}" stroke="#788e86" stroke-width="7"/>`);
parts.push(`<line x1="${sx(0)}" x2="${sx(0)}" y1="${sz(-15)}" y2="${sz(15)}" stroke="#bdad68" stroke-dasharray="7 4"/><text x="615" y="130" class="small">−Z / setor de motores</text><text x="615" y="700" class="small">+Z / portão e elevadores</text>`);
r.comparisonViews.forEach((v, i) => { parts.push(`<circle cx="${sx(v.position[0])}" cy="${sz(v.position[2])}" r="5" fill="#b14a3e"/><text x="${sx(v.position[0]) + 8}" y="${sz(v.position[2])}" class="small">${i + 1}</text>`); });
const legend = ['LAB: laboratório cinza', 'C: veículos cobertos', 'V: veículos claros aproximados', 'A: armários didáticos creme', 'B: bancadas cinza', 'M: conjuntos em cavaletes', 'HATCH: veículo de painéis coloridos', 'Azul no perímetro: janelas', 'Linha central: faixa zenital', 'Tracejado: limites estimados', '', 'Câmeras de comparação:', ...r.comparisonViews.map((v, i) => `${i + 1}. ${v.id} — ${v.photo}`)];
legend.forEach((text, i) => parts.push(`<text x="660" y="${180 + i * 23}" class="small">${text}</text>`));
parts.push('<text x="45" y="770">Escala do modelo: 20 × 30 m; beiral 5,2 m; cumeeira 7,7 m. Todos esses valores são hipóteses ajustáveis.</text>', '<text x="45" y="798">Orientação dos eixos é convenção do projeto; não indica norte geográfico. Ligação entre setores ainda não comprovada.</text>', '</svg>');
writeFileSync(new URL('../docs/planta-estimada.svg', import.meta.url), parts.join('\n'));
console.log(JSON.stringify(report, null, 2));
