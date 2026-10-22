import * as THREE from 'three';

export class VehicleStation {
  constructor(vehicle) {
    this.vehicle = vehicle; this.group = vehicle.group;
    this.data = { id: 'veiculo-pratica', name: 'Veículo didático · montar roda', type: 'assembly', activityId: 'montagem-roda' };
    this.anchor = vehicle.hubWorld.clone().add(new THREE.Vector3(0, 0.3, 0.1));
    this.outline = new THREE.BoxHelper(this.group, '#d2ac57'); this.outline.visible = false;
  }
  setHighlight(value) { this.outline.visible = value; if (value) this.outline.update(); }
  update() {}
}
