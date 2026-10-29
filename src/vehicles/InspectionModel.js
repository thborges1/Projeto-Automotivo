import { Box3, Vector3 } from 'three';

/** Temporarily borrows an existing graph; child transforms and mechanical state stay untouched. */
export class InspectionModel {
  constructor(root, container) {
    if (!root?.isObject3D || !root.parent) throw new Error('Veículo indisponível para inspeção.');
    this.root = root;
    this.parent = root.parent;
    this.index = this.parent.children.indexOf(root);
    this.position = root.position.clone();
    this.quaternion = root.quaternion.clone();
    this.scale = root.scale.clone();
    this.visible = root.visible;
    container.add(root);
    root.position.set(0, 0, 0);
    root.quaternion.identity();
    root.visible = true;
  }

  restore() {
    if (!this.parent) return;
    this.parent.add(this.root);
    const children = this.parent.children;
    children.splice(children.indexOf(this.root), 1);
    children.splice(Math.min(this.index, children.length), 0, this.root);
    this.root.position.copy(this.position);
    this.root.quaternion.copy(this.quaternion);
    this.root.scale.copy(this.scale);
    this.root.visible = this.visible;
    this.root.updateMatrixWorld(true);
    this.parent = null;
  }
}

export function frameInspectionModel(container, camera, orbit) {
  container.position.set(0, 0, 0);
  container.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(container);
  if (bounds.isEmpty()) throw new Error('O veículo não contém geometria visível.');
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const radius = Math.max(size.length() / 2, 0.5);
  if (![radius, ...center.toArray()].every(Number.isFinite))
    throw new Error('Dimensões inválidas no veículo.');
  container.position.copy(center).multiplyScalar(-1);
  const verticalFov = (camera.fov * Math.PI) / 180;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const distance = (radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2)) * 1.15;
  camera.near = Math.max(radius / 1000, 0.005);
  camera.far = Math.max(distance * 20, 100);
  camera.position.set(distance * 0.75, distance * 0.35, distance * 0.56).setLength(distance);
  camera.updateProjectionMatrix();
  orbit.target.set(0, 0, 0);
  orbit.minDistance = radius * 0.15;
  orbit.maxDistance = distance * 3;
  orbit.update();
}
