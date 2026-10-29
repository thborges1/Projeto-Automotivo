import { Plane, Vector3 } from 'three';

/** World-space ray/plane drag with a grab offset; independent of pointer events and physics. */
export class ConstrainedPartDrag {
  constructor() {
    this.plane = new Plane();
    this.offset = new Vector3();
    this.intersection = new Vector3();
    this.active = false;
  }
  begin(ray, position, normal) {
    this.plane.setFromNormalAndCoplanarPoint(normal, position);
    this.active = Boolean(ray.intersectPlane(this.plane, this.intersection));
    if (this.active) this.offset.copy(position).sub(this.intersection);
    return this.active;
  }
  move(ray, target) {
    if (!this.active || !ray.intersectPlane(this.plane, this.intersection)) return false;
    target.copy(this.intersection).add(this.offset);
    return true;
  }
  end() {
    this.active = false;
  }
}
