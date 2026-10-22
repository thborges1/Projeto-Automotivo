import * as THREE from 'three';
import { Controls } from './Controls.js';
import { CollisionSystem } from './CollisionSystem.js';
import { createWorkshop } from '../world/Workshop.js';
import { EquipmentRegistry } from '../objects/EquipmentRegistry.js';

export class Engine {
  constructor(container, config, settings, onPause) {
    Object.assign(this, { config, container });
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#d6dfdf');
    this.scene.fog = new THREE.Fog('#d6dfdf', 55, 100);
    this.camera = new THREE.PerspectiveCamera(65, 1, 0.08, 100);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'Oficina tridimensional. Use WASD para caminhar e o mouse para olhar.');
    container.appendChild(this.renderer.domElement);
    this.collision = new CollisionSystem(config.playerRadius);
    this.world = createWorkshop(this.scene, this.collision, config);
    this.registry = new EquipmentRegistry(this.scene, this.world.materials, this.collision);
    this.controls = new Controls(this.camera, this.renderer.domElement, this.collision, config, onPause);
    this.controls.reset();
    this.applySettings(settings);
    this.resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      this.camera.aspect = w / Math.max(h, 1); this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.resize); this.resize();
    this.lastTime = 0;
    this.onContextLost = e => { e.preventDefault(); onPause('O contexto gráfico foi interrompido. Recarregue a página para recuperar a cena.'); };
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
  }
  applySettings(settings) {
    const quality = { low: [1, 0], medium: [1.5, 1024], high: [2, 2048] }[settings.quality] || [1.5, 1024];
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality[0]));
    this.renderer.shadowMap.enabled = quality[1] > 0;
    const sun = this.world.lights.sun;
    sun.castShadow = quality[1] > 0;
    if (sun.shadow.mapSize.x !== quality[1] && quality[1]) {
      sun.shadow.mapSize.set(quality[1], quality[1]); sun.shadow.map?.dispose(); sun.shadow.map = null;
    }
    this.world.lights.fill.visible = settings.quality !== 'low';
    this.world.lights.secondary.visible = settings.quality !== 'low';
    this.scene.environmentIntensity = settings.quality === 'low' ? 0 : 0.25;
    this.quality = settings.quality;
    this.controls.sensitivity = settings.sensitivity;
    this.resize?.();
    if (this.lastTime !== undefined) this.prepareReflections();
  }
  start(onFrame) {
    this.prepareReflections();
    this.renderer.setAnimationLoop(ms => {
      const dt = Math.min((ms - (this.lastTime || ms)) / 1000, 0.05); this.lastTime = ms;
      if (document.hidden) return;
      this.controls.update(dt);
      this.world.vehicle.update(dt);
      for (const item of this.registry.items.values()) item.update(ms / 1000);
      onFrame(dt);
      this.renderer.render(this.scene, this.camera);
    });
  }
  prepareReflections() {
    if (this.reflectionTarget || this.quality === 'low') return;
    const cube = new THREE.WebGLCubeRenderTarget(128);
    const camera = new THREE.CubeCamera(0.1, 65, cube); camera.position.set(4.5, 2.1, -7);
    const generator = new THREE.PMREMGenerator(this.renderer);
    try {
      // Uma captura do próprio cenário; sem reflexos de HDRI externo ou atualização por frame.
      camera.update(this.renderer, this.scene);
      this.reflectionTarget = generator.fromCubemap(cube.texture);
      this.scene.environment = this.reflectionTarget.texture;
    } catch (error) { console.warn('Reflexos estáticos indisponíveis; materiais mantidos sem sonda.', error); }
    finally { cube.dispose(); generator.dispose(); }
  }
  focus(item) {
    const dir = item.anchor.clone().sub(this.camera.position);
    this.controls.yaw = Math.atan2(-dir.x, -dir.z);
    this.controls.pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
    this.controls.applyRotation();
  }
  dispose() {
    this.renderer.setAnimationLoop(null); this.registry.disposed = true;
    this.reflectionTarget?.dispose();
    this.controls.dispose(); window.removeEventListener('resize', this.resize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    const geometries = new Set(), materials = new Set(), textures = new Set();
    this.scene.traverse(o => {
      if (o.geometry) geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) materials.add(m);
      o.shadow?.map?.dispose();
    });
    materials.forEach(m => { for (const v of Object.values(m)) if (v?.isTexture) textures.add(v); m.dispose(); });
    geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose());
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
