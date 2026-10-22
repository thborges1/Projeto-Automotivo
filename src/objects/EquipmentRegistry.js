import { Equipment } from './Equipment.js';

export class EquipmentRegistry {
  constructor(scene, materials, collision) {
    Object.assign(this, { scene, materials, collision });
    this.items = new Map(); this.loader = null; this.disposed = false;
  }
  async register(data, onError = () => {}) {
    if (this.items.has(data.id)) throw new Error(`Identificador duplicado: ${data.id}`);
    const item = new Equipment(data, this.materials, this.collision);
    this.items.set(data.id, item);
    this.scene.add(item.group, item.outline, item.componentOutline);
    if (data.model) {
      try {
        // Carrega o parser somente quando existir um modelo GLB cadastrado.
        if (!this.loader) { const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'); this.loader = new GLTFLoader(); }
        const gltf = await this.loader.loadAsync(data.model);
        if (this.disposed) { this.disposeModel(gltf.scene); return item; }
        // Modelo substitui só a aparência. Volume de colisão continua definido nos dados.
        const oldGeometry = new Set();
        item.group.traverse(o => { if (o.geometry) oldGeometry.add(o.geometry); });
        oldGeometry.forEach(g => g.dispose());
        item.group.clear(); item.parts.clear(); item.group.add(gltf.scene);
        gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
        for (const component of data.components) {
          const node = gltf.scene.getObjectByName(component.id);
          if (node) item.parts.set(component.id, node);
        }
        item.outline.update();
      } catch (error) { onError(`Modelo de ${data.name} indisponível. Demonstração genérica mantida.`, error); }
    }
    return item;
  }
  attach(item) {
    if (this.items.has(item.data.id)) throw new Error(`Identificador duplicado: ${item.data.id}`);
    this.items.set(item.data.id, item);
    this.scene.add(item.outline);
    if (item.componentOutline) this.scene.add(item.componentOutline);
  }
  disposeModel(root) { root.traverse(o => { o.geometry?.dispose(); for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) { for (const v of Object.values(m)) if (v?.isTexture) v.dispose(); m.dispose(); } }); }
}
