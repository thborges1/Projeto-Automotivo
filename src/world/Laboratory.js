import * as THREE from 'three';
import { geometryKit } from './GeometryKit.js';

export function buildLaboratory(root, m, collision, config) {
  const lab = config.reconstruction.lab, [cx, , cz] = lab.center, [w, h, d] = lab.size;
  const g = new THREE.Group(); g.name = 'laboratório — implantação estimada'; g.position.set(cx, 0, cz); root.add(g);
  const kit = geometryKit(g, { addBox() {} }), { box, repeat, pipe } = kit;
  function sideWall(x, windows, glassMaterial) {
    box('parede inferior do laboratório', [0.18, 1.23, d], [x, 0.615, 0], m.wall);
    box('parede superior do laboratório', [0.18, h - 2.25, d], [x, (h + 2.25) / 2, 0], m.wall);
    let last = -d / 2;
    for (const z of windows) {
      const a = z - 0.9;
      if (a > last) box('montante de alvenaria', [0.18, 1.02, a - last], [x, 1.74, (last + a) / 2], m.wall);
      box('vidro do laboratório', [0.018, 0.89, 1.72], [x, 1.74, z], glassMaterial);
      for (const dz of [-0.92, 0.92]) box('ombreira', [0.25, 1.12, 0.07], [x, 1.74, z + dz], m.sill);
      for (const y of [1.2, 2.28]) box('verga e peitoril', [0.27, 0.07, 1.9], [x, y, z], m.sill);
      last = z + 0.9;
    }
    if (last < d / 2) box('alvenaria final', [0.18, 1.02, d / 2 - last], [x, 1.74, (last + d / 2) / 2], m.wall);
    box('rodapé do laboratório', [0.21, 0.12, d], [x, 0.06, 0], m.skirting);
  }
  sideWall(-w / 2, [-3.4, -0.6, 2.2], m.interiorGlass);
  sideWall(w / 2, [-3.3, -0.5, 2.3], m.interiorGlass);
  box('parede posterior do laboratório', [w, h, 0.18], [0, h / 2, -d / 2], m.wall);
  // Fachada de entrada: porta real recuada e janela, com vazios geométricos.
  const front = d / 2;
  box('parede sobre porta', [w, h - 2.35, 0.18], [0, (h + 2.35) / 2, front], m.wall);
  box('lateral esquerda de fachada', [0.42, 2.35, 0.18], [-w / 2 + 0.21, 1.175, front], m.wall);
  box('faixa sob janela', [2.2, 1.24, 0.18], [-0.73, 0.62, front], m.wall);
  box('vidro frontal', [2.08, 0.89, 0.02], [-0.73, 1.76, front], m.interiorGlass);
  box('peitoril frontal', [2.2, 0.08, 0.26], [-0.73, 1.25, front], m.sill);
  box('pilar entre janela e porta', [0.18, 2.35, 0.18], [0.48, 1.175, front], m.wall);
  box('porta de diagnóstico — fechada', [1.02, 2.24, 0.08], [1.1, 1.12, front - 0.04], m.gate);
  for (let x = 0.65; x < 1.6; x += 0.13) repeat([0.009, 2.15, 0.01], [x, 1.12, front + 0.01], m.frame);
  box('batente externo', [0.57, 2.35, 0.2], [w / 2 - 0.28, 1.175, front], m.wall);
  box('maçaneta de porta', [0.05, 0.16, 0.08], [0.73, 1.02, front + 0.09], m.metal);
  box('quina cinza alta', [0.47, h + 1.0, 0.5], [w / 2 + 0.09, (h + 1) / 2, front - 0.04], m.column);
  box('teto do laboratório — estimado', [w, 0.1, d], [0, h, 0], m.wall);
  // Mesas internas vistas através das janelas, sem inventar instrumentos.
  for (const x of [-1.3, 0.5]) for (const z of [-2.5, 1]) {
    box('mesa interna estimada', [1.15, 0.06, 0.8], [x, 0.75, z], m.dark);
    for (const dx of [-0.45, 0.45]) box('pé de mesa interna', [0.04, 0.72, 0.6], [x + dx, 0.36, z], m.dark);
  }
  // Face do corredor: tubos, eletrocalha e equipamentos de incêndio vistos nas fotos 2 e 8.
  pipe('tubo vermelho com desvio', [[-w / 2 - 0.2, 4.9, -d / 2], [-w / 2 - 0.2, 4.5, -d / 2 + 0.5], [-w / 2 - 0.2, 4.3, -d / 2 + 0.8], [-w / 2 - 0.2, 1.7, -d / 2 + 0.8]], 0.055, m.red);
  box('abrigo vermelho', [0.3, 0.76, 0.55], [-w / 2 - 0.24, 1.28, -d / 2 + 0.8], m.red);
  box('visor do abrigo', [0.012, 0.36, 0.12], [-w / 2 - 0.398, 1.3, -d / 2 + 0.8], m.dark);
  const extinguisher = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 18), m.red);
  extinguisher.position.set(-w / 2 - 0.2, 1.28, -d / 2 - 0.05); extinguisher.castShadow = true; g.add(extinguisher);
  pipe('mangueira do extintor', [[-w / 2 - 0.22, 1.58, -d / 2 - 0.05], [-w / 2 - 0.3, 1.72, -d / 2 - 0.23], [-w / 2 - 0.35, 1.45, -d / 2 - 0.28]], 0.012, m.rubber);
  for (const x of [-w / 2 - 0.16, w / 2 + 0.16]) {
    box('eletrocalha lateral', [0.32, 0.045, d], [x, 3.95, 0], m.frame);
    for (let z = -d / 2; z <= d / 2; z += 0.16) repeat([0.35, 0.06, 0.025], [x, 3.98, z], m.frame);
  }
  collision.addBox(cx - w / 2, cz, 0.2, d, 'laboratório oeste');
  collision.addBox(cx + w / 2, cz, 0.2, d, 'laboratório leste');
  for (const z of [-d / 2, d / 2]) collision.addBox(cx, cz + z, w, 0.2, 'laboratório fechado');
  collision.addBox(cx + w / 2 + 0.09, cz + front - 0.04, 0.5, 0.5, 'quina laboratório');
  kit.flush(); return g;
}
