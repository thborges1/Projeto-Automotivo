import { BoxHelper, Raycaster, Vector2 } from 'three';
import { partFromHit } from '../vehicles/VehicleParts.js';

export class InspectionPartSelection {
  constructor(session, root, procedural) {
    Object.assign(this, { session, root, procedural });
    this.canvas = session.engine.renderer.domElement;
    this.pointer = new Vector2();
    this.raycaster = new Raycaster();
    this.abort = new AbortController();
    this.outline = new BoxHelper(undefined, '#f3c86a');
    this.outline.visible = false;
    session.scene.add(this.outline);
    const options = { signal: this.abort.signal };
    this.canvas.addEventListener(
      'pointermove',
      event => {
        if (session.manual?.active) return;
        this.position = { x: event.clientX, y: event.clientY };
        if (this.down && Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y) > 6)
          this.down.moved = true;
        this.dirty = true;
      },
      options,
    );
    this.canvas.addEventListener(
      'pointerdown',
      event => {
        if (session.manual?.active) return;
        this.down =
          event.button === 0 && event.isPrimary !== false
            ? { id: event.pointerId, x: event.clientX, y: event.clientY }
            : null;
        session.panel.hover?.(null);
      },
      options,
    );
    this.canvas.addEventListener(
      'pointerup',
      event => {
        if (session.manual?.active) return;
        const down = this.down;
        this.down = null;
        if (!down || down.moved || down.id !== event.pointerId) return;
        const part = this.pick(event.clientX, event.clientY);
        if (part) {
          this.selected = part;
          session.selectPart(part);
        }
      },
      options,
    );
    const leave = () => {
      this.position = null;
      this.down = null;
      this.outline.visible = false;
      session.panel.hover?.(null);
      this.canvas.style.cursor = '';
    };
    this.canvas.addEventListener('pointerleave', leave, options);
    this.canvas.addEventListener('pointercancel', leave, options);
    this.onChange = () => {
      this.dirty = true;
    };
    session.orbit.addEventListener?.('change', this.onChange);
  }

  pick(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    this.pointer.set(((x - rect.left) / rect.width) * 2 - 1, (-(y - rect.top) / rect.height) * 2 + 1);
    this.root.updateWorldMatrix(true, true);
    this.session.camera.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.session.camera);
    const hit = this.raycaster.intersectObject(this.root, true).find(candidate => {
      if (!candidate.object.isMesh || candidate.object.userData.inspectionIgnore) return false;
      for (let node = candidate.object; node; node = node.parent) if (!node.visible) return false;
      const material = Array.isArray(candidate.object.material)
        ? candidate.object.material[candidate.face?.materialIndex || 0]
        : candidate.object.material;
      return material?.visible !== false && material?.opacity !== 0;
    });
    return hit ? partFromHit(hit, this.root, this.procedural) : null;
  }

  update() {
    if (this.session.manual?.active) return;
    if (!this.dirty || !this.position || this.down) return;
    this.dirty = false;
    const part = this.pick(this.position.x, this.position.y);
    this.session.panel.hover?.(part, this.position.x, this.position.y);
    this.canvas.style.cursor = part ? 'pointer' : '';
    // Combined workshop surfaces can contain many components: do not outline the whole batch.
    const specific =
      part && !part.object.userData.inspectionFaces && !part.object.userData.inspectionInstances;
    this.outline.visible = Boolean(specific);
    if (specific) this.outline.setFromObject(part.object);
  }

  dispose() {
    this.abort.abort();
    this.session.orbit?.removeEventListener?.('change', this.onChange);
    this.outline.removeFromParent();
    this.outline.geometry.dispose();
    this.outline.material.dispose();
    this.session.panel.hover?.(null);
    this.canvas.style.cursor = '';
  }
}
