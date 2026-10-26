import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createUndercarriage } from '../src/objects/Undercarriage.js';

test('parte inferior permanece abaixo do assoalho, acima do piso e usa três lotes', () => {
  const materials = Object.fromEntries(['metal', 'black', 'rubber'].map(name => [name, new THREE.MeshStandardMaterial()]));
  const group = createUndercarriage(materials);
  const bounds = new THREE.Box3().setFromObject(group);
  assert.ok(bounds.min.y > 0.13);
  assert.ok(bounds.max.y < 0.7);
  assert.ok(bounds.min.z > -0.8 && bounds.max.z < 0.8);
  assert.equal(group.children.length, 3);
  assert.ok(group.userData.components.includes('cárter do motor'));
  assert.ok(group.userData.components.includes('tanque de combustível'));
  assert.ok(group.userData.components.includes('silencioso traseiro'));
  group.traverse(o => {
    if (!o.isMesh) return;
    assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));
    assert.equal(o.material.transparent, false);
  });
  group.position.y = 1.8;
  const raised = new THREE.Box3().setFromObject(group);
  assert.ok(Math.abs(raised.min.y - bounds.min.y - 1.8) < 1e-6);
  assert.ok(Math.abs(raised.max.y - bounds.max.y - 1.8) < 1e-6);
  group.traverse(o => o.geometry?.dispose());
  Object.values(materials).forEach(m => m.dispose());
});
