import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { setupVehicleMaterials } from './VehicleMaterials.js';
import { createBakedShadow, createShadowTexture } from './BakedShadow.js';
import { disposeObject3D } from '../utils/DisposeUtils.js';
import { validateVehiclePlacement } from './VehicleData.js';
export { VEHICLES } from './VehicleData.js';

export class VehicleFleet {
  constructor(renderer, baseURL = '/') {
    this.renderer = renderer;
    this.draco = new DRACOLoader().setDecoderPath(`${baseURL}decoders/draco/`).setWorkerLimit(2);
    this.ktx2 = new KTX2Loader().setTranscoderPath(`${baseURL}decoders/basis/`).setWorkerLimit(2).detectSupport(renderer);
    this.loader = new GLTFLoader().setDRACOLoader(this.draco).setKTX2Loader(this.ktx2);
    this.baseURL = baseURL;
    this.root = new THREE.Group(); this.root.name = 'vehicle-fleet';
    this.resources = new Set(); this.shadowTexture = createShadowTexture();
    this.inspectionVehicles = [];
    this.disposed = false;
  }

  async load({ model, position = [0, 0, 0], rotation = 0, distances = [0, 12, 28], inspectionModel }) {
    if (this.disposed) throw new Error('VehicleFleet já descartada.');
    const spec = validateVehiclePlacement({ model, position, rotation, distances });
    const lod = new THREE.LOD(); lod.name = spec.name;
    lod.position.fromArray(position); lod.rotation.y = rotation;
    // Sequential loading bounds decoder and GPU upload pressure during startup.
    try {
      for (let level = 0; level < 3; level++) {
        const gltf = await this.loader.loadAsync(`${this.baseURL}models/vehicles/${model}/lod${level}.glb`);
        this.resources.add(gltf.scene);
        if (this.disposed) { this.release(gltf.scene); this.resources.delete(gltf.scene); throw new Error('Carregamento cancelado.'); }
        setupVehicleMaterials(gltf.scene);
        lod.addLevel(gltf.scene, distances[level], 0.12);
      }
    } catch (error) {
      for (const level of lod.levels) { this.release(level.object); this.resources.delete(level.object); }
      throw error;
    }
    const shadow = createBakedShadow(this.shadowTexture, spec.width * 1.35, spec.length * 1.12);
    // Export convention: +Y up, +Z forward, metres, origin on the ground.
    const wrapper = new THREE.Group(); wrapper.position.copy(lod.position); wrapper.rotation.copy(lod.rotation);
    lod.position.set(0, 0, 0); lod.rotation.set(0, 0, 0);
    wrapper.add(lod, shadow); this.resources.add(shadow); this.root.add(wrapper);
    this.inspectionVehicles.push({ id: `frota-${this.inspectionVehicles.length + 1}`, name: spec.name, root: lod.levels[0].object, pickRoot: lod, inspectionModel });
    return lod;
  }

  async prepare(scene, camera) {
    // Call before starting animation, including every LOD in shader compilation.
    const lods = [];
    this.root.traverse(o => { if (o.isLOD) { lods.push(o); o.autoUpdate = false; for (const level of o.levels) level.object.visible = true; } });
    try {
      await this.renderer.compileAsync(scene, camera);
      this.root.traverse(o => {
        if (!o.material) return;
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        for (const material of materials) for (const value of Object.values(material)) {
          if (value?.isTexture) this.renderer.initTexture(value);
        }
      });
    } finally {
      scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      for (const lod of lods) { lod.autoUpdate = true; lod.update(camera); }
    }
  }

  release(root, disposed) {
    disposeObject3D(root, { excludeTextures: new Set([this.shadowTexture]), disposed });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.root.removeFromParent();
    const disposed = new Set();
    for (const root of this.resources) this.release(root, disposed);
    this.resources.clear(); this.shadowTexture.dispose(); this.draco.dispose(); this.ktx2.dispose();
    this.root.clear();
    this.inspectionVehicles.length = 0;
  }
}
