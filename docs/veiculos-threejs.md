# Veículos em Three.js

Implementação em `src/vehicles/`, integrada ao Engine por `loadVehicles()`.
O repositório não contém modelos licenciados do Corolla Híbrido, HB20 ou Gol.
O carro didático existente permanece disponível. Não há download implícito de modelos.

## Assets e integração

Forneça nove arquivos, cada um com sua geometria efetivamente simplificada:

```text
public/models/vehicles/corolla/lod0.glb
public/models/vehicles/corolla/lod1.glb
public/models/vehicles/corolla/lod2.glb
public/models/vehicles/hb20/lod{0,1,2}.glb
public/models/vehicles/gol/lod{0,1,2}.glb
```

Use metros, +Y vertical, +Z dianteira, origem no chão. Não exporte luzes/câmeras.
Os três LODs precisam compartilhar origem, escala, orientação e aparência.
Defina extras `vehicleRole` nos materiais: `paint`, `glass`, `tire`, `interior`.
Também se reconhecem nomes começando com `paint`, `carpaint` ou `pintura`.
Use materiais glTF metallic-roughness. Materiais compartilhados são convertidos uma vez
por GLB; os mapas PBR são preservados. Vidro usa transparência simples sem refração.

Adicione ao JSON `public/data/workshop.json` um campo opcional `vehicles`:

```json
{
  "vehicles": [
    { "model": "corolla", "position": [0, 0, 0], "distances": [0, 12, 28] },
    { "model": "hb20", "position": [4, 0, 0] },
    { "model": "gol", "position": [-4, 0, 0], "rotation": 3.14159 }
  ]
}
```

Escolha posições livres na oficina; a frota é visual e não registra colisões ou
substitui os componentes educativos do carro de prática. Não ative esse campo antes
de fornecer os arquivos: erros de carregamento são reportados pela inicialização.

Em outro projeto Vite:

```js
const fleet = new VehicleFleet(renderer, import.meta.env.BASE_URL);
scene.add(fleet.root);
await fleet.load({ model: 'corolla' });
// Configure primeiro iluminação e environment PMREM estático.
await fleet.prepare(scene, camera);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = false;
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera); // THREE.LOD atualiza automaticamente, sem objetos novos aqui.
});
// Ao desmontar: renderer.setAnimationLoop(null); fleet.dispose();
```

`prepare()` compila todos os níveis e inicializa as texturas antes da interação.
O carregamento é sequencial para limitar pressão de decodificação/upload.
Não carregue novos carros durante a interação caso precise evitar picos de upload.
Não descarte a frota enquanto `prepare()` estiver pendente.

## Compressão offline

No Blender, crie LODs reduzidos e confira silhueta, rodas, UVs e normais antes de
exportar. Orçamentos iniciais sugeridos por carro: 80k / 30k / 8k triângulos,
até 12 / 8 / 4 materiais, texturas 2048 / 1024 / 512. Ajuste por medição.

Com glTF Transform CLI e o encoder KTX-Software `toktx` instalados no ambiente
de produção de assets, processe cada LOD (substitua os caminhos):

```sh
gltf-transform uastc input.glb textures.glb --level 2
gltf-transform draco textures.glb lod0.glb
gltf-transform inspect lod0.glb
```

Confirme no GLB final as extensões `KHR_draco_mesh_compression` e
`KHR_texture_basisu`. Somente configurar loaders não comprime arquivos existentes.
UASTC prioriza qualidade; avalie ETC1S para mapas de cor quando precisar reduzir
transferência. Preserve sRGB nos mapas de cor e dados lineares em normal/ORM.
Gere mipmaps na conversão. Faça inspeção visual após qualquer compressão.

`npm run assets:decoders` copia os decoders da versão instalada de Three.js para
`public/decoders/`. Também roda antes de dev/build, sem dependência de CDN.
GLTFLoader compartilha DRACOLoader e KTX2Loader com dois workers por pool.

## Sombras, batching e desempenho

A sombra usa um plano Basic e máscara de contato de 128 px gerada uma vez.
Ela é uma aproximação; para fidelidade, substitua por bake do veículo, mantendo
depthWrite desativado e altura de 1,5 cm para evitar z-fighting.
O Engine desativa sombras reais em todas as qualidades e mantém PMREM estático.

`createStaticVehicleInstances(source, matrices)` agrupa cópias estacionadas de
um mesmo GLB por mesh. Use um cluster pequeno e um THREE.LOD contendo um batch
de cada nível; a distância será a do centro do cluster. A função compartilha
geometria/material com a origem; só descarte esses recursos ao encerrar todas
as cópias. Não suporta skinning, morphs ou instâncias já presentes no GLB.
Para carros independentes/interativos, mantenha um LOD por carro. A integração
carrega cada placement independentemente; para grandes frotas repetidas, use
explicitamente os clusters instanciados. O cenário estático já usa
`mergeGeometries` em `src/world/StaticBatching.js` (nome atual da API).

Valide em produção no dispositivo alvo: frame budget 16,67 ms, percentil 95/99
de frame time, CPU/GPU, chamadas e triângulos em `renderer.info.render`, recursos
em `renderer.info.memory`. Meça partida fria separadamente da navegação aquecida,
atravesse os limiares LOD e repita descarte/reabertura para detectar vazamentos.
Faça capturas com DevTools/Spector.js, sem instrumentação pesada no loop final.
60 FPS não é garantido por código: depende dos assets, GPU, resolução e navegador.

Referência de inicialização: [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html)
e [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).
