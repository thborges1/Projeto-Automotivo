import { mkdir, copyFile } from 'node:fs/promises';

for (const [directory, files] of [
  ['draco', ['draco_wasm_wrapper.js', 'draco_decoder.wasm', 'draco_decoder.js']],
  ['basis', ['basis_transcoder.js', 'basis_transcoder.wasm']],
]) {
  const destination = new URL(`../public/decoders/${directory}/`, import.meta.url);
  await mkdir(destination, { recursive: true });
  for (const file of files) {
    const source = new URL(`../node_modules/three/examples/jsm/libs/${directory === 'draco' ? 'draco/gltf' : 'basis'}/${file}`, import.meta.url);
    await copyFile(source, new URL(file, destination));
  }
}
console.log('Decodificadores Draco/Basis copiados da versão instalada de Three.js.');
