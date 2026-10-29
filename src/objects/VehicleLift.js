import * as THREE from 'three';
import { LiftMotion } from '../machines/LiftMotion.js';

export class VehicleLift {
  constructor(number, moving, button, colliders = [], clearanceHeight = 1.8) {
    this.group = moving;
    this.button = button;
    this.data = { id: `elevador-${number}`, name: `Elevador ${number} · subir carro`, type: 'lift' };
    this.anchor = button.position.clone().add(new THREE.Vector3(0, 0, 0.12));
    this.outline = new THREE.BoxHelper(button, '#ffe080');
    this.outline.visible = false;
    this.motion = new LiftMotion();
    // Preserve the public fields used by maintenance sessions and scene builders.
    for (const key of ['height', 'target', 'elapsed', 'duration', 'maxHeight', 'moving', 'startHeight']) {
      Object.defineProperty(this, key, {
        enumerable: true,
        get: () => this.motion[key],
        set: value => { this.motion[key] = value; },
      });
    }
    this.number = number;
    this.colliders = colliders;
    this.clearanceHeight = clearanceHeight;
  }

  get actionLabel() {
    return this.moving ? 'Em movimento · aguarde' : this.target ? 'E / tocar para descer' : 'E / tocar para subir';
  }

  activate(owner = null) {
    if (this.maintenanceOwner && this.maintenanceOwner !== owner) return false;
    if (this.target > 0 && this.canLower && !this.canLower()) return false;
    if (!this.motion.activate()) return false;
    this.data.name = `Elevador ${this.number} · ${this.target ? 'subindo' : 'descendo'}`;
    return true;
  }

  advance(dt) {
    if (!this.motion.advance(dt)) return;
    this.group.position.y = this.height;
    for (const collider of this.colliders) collider.enabled = this.height < this.clearanceHeight;
    if (!this.moving) {
      this.data.name = `Elevador ${this.number} · ${this.target ? 'descer' : 'subir'} carro`;
    }
  }

  setHighlight(value) { this.outline.visible = value; }
  update() {}
}
