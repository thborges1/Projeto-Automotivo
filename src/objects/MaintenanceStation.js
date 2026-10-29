import * as THREE from 'three';

export class MaintenanceStation {
  constructor(lift) {
    this.lift = lift;
    this.group = lift.vehicle.group;
    this.data = { id: `troca-oleo-${lift.number}`, name: 'Manutenção · Troca de óleo', type: 'oil-change' };
    this.anchor = new THREE.Vector3();
    this.outline = new THREE.BoxHelper(this.group, '#91d5b4'); this.outline.visible = false;
    this.update();
  }
  get actionLabel() { return 'E / tocar · Iniciar manutenção — Troca de óleo'; }
  get available() {
    const lift = this.lift;
    return Boolean(lift.vehicle && lift.vehicleCentered && lift.supportsLocked && lift.engineOff &&
      !lift.moving && !lift.maintenanceOwner && lift.height >= lift.maxHeight - 0.02);
  }
  update() {
    this.group.updateWorldMatrix(true, false);
    this.anchor.set(-1.4, 0.15, 0); this.group.localToWorld(this.anchor);
  }
  setHighlight(value) { this.outline.visible = value && this.available; if (this.outline.visible) this.outline.update(); }
}
