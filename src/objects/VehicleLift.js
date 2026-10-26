import * as THREE from 'three';

export class VehicleLift {
  constructor(number, moving, button, colliders = [], clearanceHeight = 1.8) {
    this.group = moving;
    this.button = button;
    this.data = { id: `elevador-${number}`, name: `Elevador ${number} · subir carro`, type: 'lift' };
    this.anchor = button.position.clone().add(new THREE.Vector3(0, 0, 0.12));
    this.outline = new THREE.BoxHelper(button, '#ffe080');
    this.outline.visible = false;
    this.height = 0;
    this.target = 0;
    this.elapsed = 0;
    this.duration = 4;
    this.maxHeight = 1.8;
    this.moving = false;
    this.number = number;
    this.colliders = colliders;
    this.clearanceHeight = clearanceHeight;
  }

  get actionLabel() {
    return this.moving ? 'Em movimento · aguarde' : this.target ? 'E / tocar para descer' : 'E / tocar para subir';
  }

  activate() {
    if (this.moving) return false;
    this.startHeight = this.height;
    this.target = this.target === 0 ? this.maxHeight : 0;
    this.elapsed = 0;
    this.moving = true;
    this.data.name = `Elevador ${this.number} · ${this.target ? 'subindo' : 'descendo'}`;
    return true;
  }

  advance(dt) {
    if (!this.moving || !Number.isFinite(dt) || dt <= 0) return;
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    const t = this.elapsed / this.duration;
    // Quintic easing reaches both stops with zero velocity and acceleration.
    const eased = t * t * t * (t * (t * 6 - 15) + 10);
    this.height = this.startHeight + (this.target - this.startHeight) * eased;
    this.group.position.y = this.height;
    for (const collider of this.colliders) collider.enabled = this.height < this.clearanceHeight;
    if (t === 1) {
      this.moving = false;
      this.data.name = `Elevador ${this.number} · ${this.target ? 'descer' : 'subir'} carro`;
    }
  }

  setHighlight(value) { this.outline.visible = value; }
  update() {}
}
