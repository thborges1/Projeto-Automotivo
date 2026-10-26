import * as THREE from 'three';
import { createMaterials } from './Materials.js';
import { buildArchitecture } from './Architecture.js';
import { createLighting } from './Lighting.js';
import { buildLaboratory } from './Laboratory.js';
import { buildWorkshopProps } from './WorkshopProps.js';
import { batchStaticWorld } from './StaticBatching.js';
import { Vehicle } from '../objects/Vehicle.js';

export function createWorkshop(scene, collision, config) {
  const root = new THREE.Group(); root.name = 'oficina — reconstrução por fotografias'; scene.add(root);
  const materials = createMaterials(config);
  const kit = buildArchitecture(root, materials, collision, config);
  buildLaboratory(root, materials, collision, config);
  const lifts = buildWorkshopProps(root, kit, materials, collision, config);
  const lights = createLighting(scene, kit, materials, config);
  const vehicle = new Vehicle(config.reconstruction.vehicle); root.add(vehicle.group);
  const [vx, , vz] = config.reconstruction.vehicle;
  collision.addBox(vx, vz, 4.4, 2.1, 'veiculo-pratica');
  // Exterior visto nas janelas: tijolo baixo e vegetação volumétrica simplificada.
  // São contexto estimado; nenhuma fotografia é usada como parede da oficina.
  const exterior = new THREE.Group(); exterior.name = 'contexto externo estimado'; scene.add(exterior);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.8, 18), materials.brick); wall.position.set(14.2, 1.4, -5.5); exterior.add(wall);
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(11, 2.8, 0.16), materials.brick); northWall.position.set(5, 1.4, -18.5); exterior.add(northWall);
  const mortar = new THREE.LineBasicMaterial({ color: '#bd9977' });
  const lines = [];
  for (let y = 0.1; y < 2.8; y += 0.085) lines.push(14.11, y, -14.5, 14.11, y, 3.5);
  const lineGeometry = new THREE.BufferGeometry(); lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)); exterior.add(new THREE.LineSegments(lineGeometry, mortar));
  const foliage = new THREE.MeshStandardMaterial({ color: '#6b8151', roughness: 1 });
  const leaves = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 9; i++) {
    const tree = new THREE.Mesh(leaves, foliage); tree.position.set(17 + i % 2, 4 + (i % 3) * 0.3, -13 + i * 3.3); tree.scale.set(1.6, 2.6, 2); exterior.add(tree);
  }
  function sign(text, position, width, rotation = 0) {
    const c = document.createElement('canvas'); c.width = 768; c.height = 128;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#3e494a'; ctx.fillRect(0, 0, 768, 128); ctx.fillStyle = '#e2e3d6'; ctx.font = 'bold 37px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 384, 64, 730);
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 6), new THREE.MeshBasicMaterial({ map })); mesh.position.set(...position); mesh.rotation.y = rotation; root.add(mesh);
  }
  const lab = config.reconstruction.lab;
  sign('LABORATÓRIO DE DIAGNÓSTICO VEICULAR', [lab.center[0] + 1.1, 1.95, lab.center[2] + lab.size[2] / 2 + 0.025], 0.88);
  // O vidro e a faixa translúcida deixam a luz atravessar em vez de projetar uma laje preta.
  root.traverse(o => { if (o.material === materials.window || o.material === materials.skylight || o.material === materials.interiorGlass) o.castShadow = false; });
  kit.flush();
  const savedDrawCalls = batchStaticWorld(root);
  return { root, exterior, materials, lights, vehicle, lifts, savedDrawCalls };
}
