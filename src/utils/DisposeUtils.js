/** Dispose shared resources once per ownership boundary, optionally across several roots. */
export function disposeObject3D(root, { excludeTextures = new Set(), disposed = new Set() } = {}) {
  const release = resource => {
    if (!resource || disposed.has(resource)) return;
    disposed.add(resource);
    resource.dispose();
  };
  root.traverse(object => {
    release(object.geometry);
    release(object.shadow?.map);
    // InstancedMesh owns GPU buffers in addition to its geometry/material.
    if (object.isInstancedMesh) release(object);
    const materials = Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : [];
    for (const material of materials) {
      if (disposed.has(material)) continue;
      for (const value of Object.values(material)) {
        if (value?.isTexture && !excludeTextures.has(value)) release(value);
      }
      release(material);
    }
  });
  return disposed;
}
