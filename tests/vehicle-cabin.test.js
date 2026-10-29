import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createVehicleCabin } from '../src/objects/VehicleCabin.js';

test('faixa entre portas e janelas tem superfície nos dois lados sem frestas', () => {
  const cabin = createVehicleCabin({
    body: new THREE.MeshStandardMaterial(), trim: new THREE.MeshStandardMaterial(),
    glass: new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }),
  });
  cabin.updateMatrixWorld(true);
  for (const side of [-1, 1]) {
    for (const x of [-0.8, -0.4, 0, 0.4, 0.8, 1.1]) {
      for (const y of [1.1, 1.14, 1.18, 1.19, 1.2]) {
        const ray = new THREE.Raycaster(new THREE.Vector3(x, y, side * 2), new THREE.Vector3(0, 0, -side));
        const hits = ray.intersectObject(cabin);
        assert.ok(hits.length > 0, `Fresta em x=${x}, y=${y}, lado=${side}`);
        assert.ok(hits[0].point.z * side > 0.7, 'A superfície próxima precisa fechar a lateral');
      }
    }
  }
  assert.equal(cabin.children.length, 3, 'Cabine limitada a um lote por material');
});
