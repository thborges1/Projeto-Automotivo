import * as THREE from 'three';

const PIXEL_RATIO_LIMITS = { low: 1, medium: 1.5, high: 2 };

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute(
    'aria-label',
    'Oficina tridimensional. Use WASD para caminhar e o mouse para olhar.',
  );
  container.appendChild(renderer.domElement);
  return renderer;
}

export function applyRendererQuality(renderer, quality, pixelRatio = globalThis.devicePixelRatio || 1) {
  renderer.setPixelRatio(Math.min(pixelRatio, PIXEL_RATIO_LIMITS[quality] || PIXEL_RATIO_LIMITS.medium));
  renderer.shadowMap.enabled = false;
}
