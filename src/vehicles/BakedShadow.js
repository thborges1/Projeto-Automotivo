import * as THREE from 'three';

export function createShadowTexture() {
  // Small procedural contact mask, generated once; replace with an authored bake.
  const size = 128, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (x + 0.5) / size * 2 - 1, dy = (y + 0.5) / size * 2 - 1;
    const falloff = Math.max(0, 1 - dx * dx - dy * dy);
    data[(y * size + x) * 4 + 3] = Math.round(155 * falloff * falloff);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createBakedShadow(texture, width, length) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length), new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }));
  mesh.name = 'vehicle-contact-shadow';
  mesh.userData.inspectionIgnore = true;
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.015;
  return mesh;
}
