import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { setupVehicleMaterials } from '../src/vehicles/VehicleMaterials.js';
import { createStaticVehicleInstances } from '../src/vehicles/StaticVehicleInstances.js';
import { createBakedShadow, createShadowTexture } from '../src/vehicles/BakedShadow.js';
import { VehicleFleet } from '../src/vehicles/VehicleFleet.js';

test('pintura mantém mapas; vidro perde transmission e não escreve profundidade', () => {
  const root = new THREE.Group(), map = new THREE.Texture();
  const paint = new THREE.MeshStandardMaterial({ map }); paint.userData.vehicleRole = 'paint';
  const glass = new THREE.MeshPhysicalMaterial({ transmission: 1 }); glass.userData.vehicleRole = 'glass';
  const a = new THREE.Mesh(new THREE.BoxGeometry(), [paint, glass]), b = new THREE.Mesh(a.geometry, paint);
  root.add(a, b); setupVehicleMaterials(root);
  assert.equal(a.material[0], b.material);
  assert.equal(b.material.map, map); assert.ok(b.material.isMeshPhysicalMaterial);
  assert.equal(a.material[1].isMeshPhysicalMaterial, undefined);
  assert.equal(a.material[1].depthWrite, false);
});

test('instâncias preservam transformações internas e agrupam cópias', () => {
  const source = new THREE.Group(); source.position.x = 10;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  mesh.position.x = 2; source.add(mesh);
  const root = createStaticVehicleInstances(source, [new THREE.Matrix4(), new THREE.Matrix4().makeTranslation(5, 0, 0)]);
  assert.equal(root.children.length, 1); assert.equal(root.children[0].count, 2);
  const matrix = new THREE.Matrix4(); root.children[0].getMatrixAt(1, matrix);
  assert.equal(matrix.elements[12], 7);
});

test('LOD aplica histerese e escolhe detalhes pela distância da câmera', () => {
  const lod = new THREE.LOD(), camera = new THREE.PerspectiveCamera();
  for (const distance of [0, 12, 28]) lod.addLevel(new THREE.Group(), distance, 0.12);
  camera.position.z = 30; camera.updateMatrixWorld(); lod.updateMatrixWorld(); lod.update(camera);
  assert.equal(lod.getCurrentLevel(), 2);
  camera.position.z = 27; camera.updateMatrixWorld(); lod.update(camera);
  assert.equal(lod.getCurrentLevel(), 2);
  camera.position.z = 20; camera.updateMatrixWorld(); lod.update(camera);
  assert.equal(lod.getCurrentLevel(), 1);
});

test('sombra usa máscara pequena e material sem iluminação', () => {
  const texture = createShadowTexture(), shadow = createBakedShadow(texture, 2, 5);
  assert.equal(texture.image.width, 128); assert.ok(shadow.material.isMeshBasicMaterial);
  assert.equal(shadow.material.depthWrite, false); assert.equal(shadow.castShadow, false);
  assert.equal(texture.image.data[3], 0);
  assert.ok(texture.image.data[(64 * 128 + 64) * 4 + 3] > 100);
});

test('falha em LOD intermediário libera o nível carregado sem publicar carro parcial', async () => {
  const fleet = Object.create(VehicleFleet.prototype);
  fleet.root = new THREE.Group(); fleet.resources = new Set(); fleet.baseURL = '/';
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  let disposed = false, calls = 0;
  mesh.geometry.addEventListener('dispose', () => { disposed = true; });
  fleet.loader = { loadAsync: async () => {
    if (++calls === 2) throw new Error('LOD ausente');
    const scene = new THREE.Group(); scene.add(mesh); return { scene };
  } };
  await assert.rejects(fleet.load({ model: 'hb20' }), /LOD ausente/);
  assert.equal(disposed, true); assert.equal(fleet.resources.size, 0);
  assert.equal(fleet.root.children.length, 0);
});
