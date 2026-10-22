import * as THREE from 'three';

export class Equipment {
  constructor(data, materials, collision) {
    this.data = data;
    this.group = new THREE.Group();
    this.group.position.fromArray(data.position);
    this.group.name = data.id;
    this.parts = new Map();
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const box = (id, size, pos, material) => {
      const mesh = new THREE.Mesh(boxGeometry, material);
      mesh.scale.set(...size); mesh.position.set(...pos);
      mesh.castShadow = true; mesh.receiveShadow = true;
      this.group.add(mesh);
      if (id) this.parts.set(id, mesh);
      return mesh;
    };
    box('tampo', [2.8, 0.09, 1.1], [0, 0.94, 0], materials.worktop);
    for (const x of [-1.24, 1.24]) for (const z of [-0.4, 0.4]) box(null, [0.08, 0.9, 0.08], [x, 0.45, z], materials.sill || materials.lowerWall);
    box('prateleira', [2.5, 0.05, 0.8], [0, 0.25, 0], materials.sill || materials.lowerWall);
    for (const x of [-1.35, 1.35]) box(null, [0.055, 0.045, 1.07], [x, 0.88, 0], materials.metal);
    const vice = new THREE.Group(); vice.position.set(0.82, 1.03, 0.15); this.group.add(vice); this.parts.set('morsa', vice);
    const vicePart = (size, p, mat) => { const mesh = new THREE.Mesh(boxGeometry, mat); mesh.scale.set(...size); mesh.position.set(...p); mesh.castShadow = true; vice.add(mesh); };
    vicePart([0.34, 0.08, 0.3], [0, 0, 0], materials.dark);
    vicePart([0.24, 0.16, 0.2], [0, 0.1, 0], materials.lowerWall);
    for (const x of [-0.13, 0.13]) vicePart([0.055, 0.1, 0.26], [x, 0.21, 0], materials.metal);
    vicePart([0.48, 0.035, 0.035], [0, 0.12, 0], materials.metal);
    vicePart([0.025, 0.25, 0.025], [0.25, 0.12, 0], materials.metal);
    this.outline = new THREE.BoxHelper(this.group, '#d2ac57');
    this.outline.visible = false;
    this.componentOutline = new THREE.BoxHelper(this.parts.get('tampo'), '#e3bb63');
    this.componentOutline.visible = false;
    collision.addBox(data.position[0], data.position[2], data.size[0], data.size[2], data.id);
    this.anchor = new THREE.Vector3(data.position[0], 1.1, data.position[2]);
  }
  setHighlight(value) { this.outline.visible = value; if (value) this.outline.update(); }
  selectComponent(id) {
    const part = this.parts.get(id);
    this.componentOutline.visible = Boolean(part);
    if (part) this.componentOutline.setFromObject(part);
  }
  update(time) {
    if (this.demonstrating) {
      const ids = [...this.parts.keys()];
      const id = ids[Math.floor(time / 1.5) % ids.length];
      if (id !== this.lastDemoId) { this.selectComponent(id); this.lastDemoId = id; }
    } else {
      this.lastDemoId = null;
    }
  }
}
