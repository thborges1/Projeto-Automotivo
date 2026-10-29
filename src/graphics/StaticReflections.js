import * as THREE from 'three';

/** One workshop probe, deliberately never regenerated per frame. */
export class StaticReflections {
  constructor(renderer, scene) {
    Object.assign(this, { renderer, scene });
    this.target = null;
  }

  prepare(quality) {
    if (this.target || quality === 'low') return;
    const cube = new THREE.WebGLCubeRenderTarget(128);
    const camera = new THREE.CubeCamera(0.1, 65, cube);
    camera.position.set(4.5, 2.1, -7);
    const generator = new THREE.PMREMGenerator(this.renderer);
    try {
      camera.update(this.renderer, this.scene);
      this.target = generator.fromCubemap(cube.texture);
      this.scene.environment = this.target.texture;
    } catch (error) {
      console.warn('Reflexos estáticos indisponíveis; materiais mantidos sem sonda.', error);
    } finally {
      cube.dispose();
      generator.dispose();
    }
  }

  dispose() {
    if (this.scene.environment === this.target?.texture) this.scene.environment = null;
    this.target?.dispose();
    this.target = null;
  }
}
