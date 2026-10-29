import * as THREE from 'three';

// For nearby parked duplicates sharing one cluster LOD. No animation/skinning.
// Matrices are local to the cluster. Keep clusters small for useful culling/LOD.
export function createStaticVehicleInstances(source, matrices) {
  const root = new THREE.Group();
  source.updateMatrixWorld(true);
  const inverse = source.matrixWorld.clone().invert();
  const local = new THREE.Matrix4(), combined = new THREE.Matrix4();
  source.traverse(mesh => {
    if (mesh.isSkinnedMesh || mesh.morphTargetInfluences || mesh.isInstancedMesh) {
      throw new Error('Instancing aceita apenas GLBs estáticos sem morphs ou instâncias internas.');
    }
    if (!mesh.isMesh) return;
    const batch = new THREE.InstancedMesh(mesh.geometry, mesh.material, matrices.length);
    local.multiplyMatrices(inverse, mesh.matrixWorld);
    for (let i = 0; i < matrices.length; i++) {
      combined.multiplyMatrices(matrices[i], local); batch.setMatrixAt(i, combined);
    }
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingBox(); batch.computeBoundingSphere();
    root.add(batch);
  });
  return root;
}
