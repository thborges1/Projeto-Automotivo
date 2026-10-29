import * as THREE from 'three';

// Authoring contract: material.extras.vehicleRole = paint | glass | tire | interior.
export function setupVehicleMaterials(root) {
  const converted = new Map();
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.receiveShadow = false;
    const convert = source => {
      if (converted.has(source)) return converted.get(source);
      const role = source.userData.vehicleRole || (/^(paint|carpaint|pintura)([_. -]|$)/i.test(source.name) ? 'paint' : 'standard');
      const target = role === 'paint' ? new THREE.MeshPhysicalMaterial() : new THREE.MeshStandardMaterial();
      // Copy only the standard PBR subset: transmission/volume never reach glass.
      THREE.MeshStandardMaterial.prototype.copy.call(target, source);
      if (role === 'paint') Object.assign(target, {
        clearcoat: 1, clearcoatRoughness: 0.16, metalness: 0.55, roughness: 0.28,
      });
      if (role === 'tire') { target.metalness = 0; target.roughness = 0.95; }
      if (role === 'glass') {
        target.transparent = true; target.opacity = 0.38;
        target.depthWrite = false; target.roughness = 0.16; target.metalness = 0.1;
      }
      converted.set(source, target);
      return target;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
  });
  // Source materials are owned by this freshly loaded GLB. Textures stay shared.
  for (const source of converted.keys()) source.dispose();
}
