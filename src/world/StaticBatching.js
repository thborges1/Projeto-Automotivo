import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { inheritedPartId, inspectionFaceRanges } from '../vehicles/VehicleParts.js';

export function batchStaticWorld(root) {
  const groups = new Map(); root.updateMatrixWorld(true);
  root.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || object.name === 'piso' || !object.visible || object.material?.transparent || !object.userData.static) return;
    const key = `${object.geometry.uuid}:${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
    if (!groups.has(key)) groups.set(key, []); groups.get(key).push(object);
  });
  let saved = 0;
  for (const objects of groups.values()) {
    if (objects.length < 3) continue;
    const source = objects[0], batch = new THREE.InstancedMesh(source.geometry, source.material, objects.length);
    batch.name = 'lote estático'; batch.castShadow = source.castShadow; batch.receiveShadow = source.receiveShadow;
    batch.userData.sourceNames = objects.map(o => o.name);
    batch.userData.inspectionInstances = objects.map(inheritedPartId);
    const inverse = root.matrixWorld.clone().invert();
    objects.forEach((o, i) => { batch.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld)); o.removeFromParent(); });
    batch.computeBoundingSphere(); root.add(batch); saved += objects.length - 1;
  }
  // Tubos e carrocerias estáticas usam geometrias diferentes: juntar por material
  // preserva o carro interativo e evita uma chamada por curva de coletor.
  const byMaterial = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible || !o.userData.static || o.name === 'piso' || o.material.transparent) return;
    const key = `${o.material.uuid}:${o.castShadow}:${o.receiveShadow}`;
    if (!byMaterial.has(key)) byMaterial.set(key, []); byMaterial.get(key).push(o);
  });
  const inverse = root.matrixWorld.clone().invert();
  for (const objects of byMaterial.values()) {
    if (objects.length < 3) continue;
    const geometries = objects.map(o => {
      let geometry = o.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
      if (geometry.index) { const nonIndexed = geometry.toNonIndexed(); geometry.dispose(); geometry = nonIndexed; }
      for (const attribute of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv'].includes(attribute)) geometry.deleteAttribute(attribute);
      return geometry;
    });
    const combined = mergeGeometries(geometries, false); geometries.forEach(g => g.dispose());
    if (!combined) continue;
    const source = objects[0], mesh = new THREE.Mesh(combined, source.material);
    mesh.name = 'superfícies estáticas combinadas'; mesh.castShadow = source.castShadow; mesh.receiveShadow = source.receiveShadow;
    mesh.userData.sourceNames = objects.map(o => o.name);
    let triangleOffset = 0;
    mesh.userData.inspectionFaces = objects.flatMap(o => {
      const ranges = inspectionFaceRanges(o, triangleOffset);
      triangleOffset += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
      return ranges;
    });
    // Nem todas as geometrias são exclusivas; descarte só quando nenhuma instância as usa.
    objects.forEach(o => o.removeFromParent()); root.add(mesh); saved += objects.length - 1;
  }
  return saved;
}
