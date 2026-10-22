import * as THREE from 'three';

function surfaceTexture(kind, repeat) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const ctx = c.getContext('2d'), data = ctx.createImageData(512, 512);
  let seed = 7829;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = ((seed >>> 16) / 65535 - 0.5);
    const cloud = Math.sin(x * Math.PI / 128) * Math.cos(y * Math.PI / 256) * 3 + Math.sin((x + y) * Math.PI / 64) * 2;
    const index = (y * 512 + x) * 4;
    const base = kind === 'roughness' ? 207 + cloud * 2 + noise * 13 : kind === 'wall' ? 218 + noise * 12 : 172 + cloud + noise * 13;
    data.data[index] = base; data.data[index + 1] = base - (kind === 'concrete' ? 5 : 0); data.data[index + 2] = base - (kind === 'concrete' ? 14 : 0); data.data[index + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  if (kind === 'concrete') {
    for (let i = 0; i < 260; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0; const x = seed % 512;
      seed = (seed * 1664525 + 1013904223) >>> 0; const y = seed % 512;
      ctx.strokeStyle = i % 3 ? '#e5e0ce25' : '#625e5018'; ctx.lineWidth = 0.3 + (i % 3) * 0.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (i % 37), y + (i % 7) - 3); ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(c); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat); texture.anisotropy = 4;
  if (kind !== 'roughness') texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMaterials(config) {
  const concrete = surfaceTexture('concrete', [config.width / 2, config.depth / 2]);
  const roughness = surfaceTexture('roughness', [config.width / 2, config.depth / 2]);
  const plaster = surfaceTexture('wall', [4, 2]);
  const mat = (color, roughness = 0.75, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    floor: new THREE.MeshStandardMaterial({ color: '#ffffff', map: concrete, roughnessMap: roughness, roughness: 0.82, bumpMap: roughness, bumpScale: 0.0018 }),
    wall: new THREE.MeshStandardMaterial({ color: '#f1efeb', map: plaster, roughness: 0.94, bumpMap: plaster, bumpScale: 0.002 }),
    lowerWall: mat('#b2b3ad'), column: mat('#596269', 0.83), skirting: mat('#777369', 0.85), joint: mat('#77766c', 1),
    steel: mat('#263f3a', 0.64, 0.3), blue: mat('#32617a', 0.6, 0.25), liftBlue: mat('#216f94', 0.52, 0.32),
    green: mat('#356c51', 0.6, 0.28), roof: mat('#b7b9b4', 0.93, 0.08), roofRib: mat('#aaaead', 0.9, 0.1),
    metal: mat('#939b99', 0.45, 0.68), frame: mat('#a2aaa7', 0.62, 0.48), sill: mat('#7f8784'), gate: mat('#8d9d9a', 0.83, 0.2),
    dark: mat('#262c2c', 0.79, 0.25), rubber: mat('#252728', 0.94), worktop: mat('#8b918b', 0.43, 0.6),
    yellow: mat('#c6a638', 0.6, 0.12), red: mat('#b52c26', 0.55, 0.15), turquoise: mat('#4d9692', 0.66, 0.12),
    cream: mat('#c8c5aa', 0.75, 0.15), paper: mat('#ddd9c7', 0.96), brick: mat('#ad7955', 0.96),
    window: new THREE.MeshStandardMaterial({ color: '#dae2dd', roughness: 0.18, metalness: 0, transparent: true, opacity: 0.23, depthWrite: false }),
    interiorGlass: new THREE.MeshStandardMaterial({ color: '#4b5c5a', roughness: 0.3, transparent: true, opacity: 0.6, depthWrite: false }),
    skylight: new THREE.MeshStandardMaterial({ color: '#dfe6e5', roughness: 0.65, emissive: '#c4d1d0', emissiveIntensity: 0.55 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#e4e6db', emissive: '#dce3de', emissiveIntensity: 1.1, roughness: 0.7 }),
    cover: mat('#a5aaa9', 0.57, 0.18),
  };
}
