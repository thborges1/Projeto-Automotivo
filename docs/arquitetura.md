# Arquitetura — protótipo 01

**Revisão 03:** `GeometryKit` compartilha primitivas e lotes; `Architecture` constrói o envelope com cobertura inclinada e aberturas; `Laboratory` reconstrói as fachadas do volume interno; `WorkshopProps` representa os conjuntos confirmados nas fotos; `StaticBatching` instancia ou combina geometrias estáticas por material, preservando o carro interativo. `Materials` gera texturas locais distintas para cor e rugosidade. O motor gera uma sonda estática do próprio ambiente em qualidade média/alta, com descarte do render target e intensidade discreta.

As posições principais e seis poses de revisão estão em `public/data/workshop.json.reconstruction`. A segunda entrada Vite, `comparacao.html`, usa o mesmo motor/cenário e adiciona câmera orbital, comparação de referências e exportação manual. Não altera os controles do aluno. Veja `reconstrucao-03.md` para mapa, evidências e limitações.

Atualização 02: `AssemblyActivity` modela pré-requisitos de montagem; `AssemblySession` coordena raycast, inventário, alvos, animação e câmera orbital durante a prática. `Vehicle` contém peças separadas e capô articulado; `VehicleStation` adapta o veículo ao registro universal. Os dados estão em `public/data/assembly.json`. O estado `assembly` libera o cursor, interrompe a navegação e restaura a câmera ao sair. O parser GLTF agora é importado sob demanda, apenas quando há GLB cadastrado. O guia completo está em `pratica-montagem.md`.

Aplicação ES Modules com Three.js e Vite. Todas as funções essenciais e materiais são locais, sem backend, CDN, fontes remotas ou dependências pagas.

## Responsabilidades

- `src/core/Engine.js`: cena, renderizador, câmera, loop, qualidade e descarte.
- `src/core/Controls.js`: primeira pessoa, teclado, pointer lock, suavização e pausa por perda de foco.
- `src/core/CollisionSystem.js`: círculo horizontal contra caixas alinhadas aos eixos, com subdivisão de movimento e deslizamento por eixo.
- `src/world/`: construção procedural da arquitetura, materiais e luzes. Uma geometria de caixa compartilhada na arquitetura e pilares instanciados.
- `src/objects/`: registro por ID, volumes de colisão, bancada genérica e carregador GLTF com fallback. Modelos reais devem seguir escala em metros, origem no piso e nós com IDs dos componentes.
- `src/systems/`: seleção por proximidade/direção com oclusão por volumes sólidos, áudio opcional e persistência versionada.
- `src/education/QuizSystem.js`: avaliação independente da interface; primeira resposta registrada, feedback e repetição.
- `src/ui/`: apresentação, painel de abas, questionário e controles de toque.
- `src/main.js`: coordenação dos estados e percursos.
- `public/data/`: dimensões, equipamento e conteúdo educativo, separados da geometria.

## Estados

`loading → home → playing → paused/panel/help → playing/home`. Configurações e escolha de percurso usam diálogos. Ao abrir um painel a movimentação para e o cursor é liberado. Fechar o painel abre pausa; retomar exige um clique para cumprir as regras do navegador para pointer lock.

Em desktop, entrada pede pointer lock. Em celular, joystick e área de olhar trabalham com Pointer Events independentes. Tela cheia é solicitada somente por ação do usuário e depende da compatibilidade do navegador.

## Colisão e interação

A solução é equivalente para este ambiente plano: altura dos olhos fixa, sem salto, escadas, rampas ou gravidade. Paredes, pilares, bancadas e armários têm caixas sólidas. AABB de móveis bloqueia todo o volume de projeção, inclusive sob o tampo. A interação usa cone de visão, distância de 3,2 m e teste de oclusão horizontal. Não é física de corpos rígidos e não deve ser usada para veículos em movimento. Para pisos desnivelados e máquinas complexas, evoluir para Capsule/Octree ou BVH.

## Cadastro de equipamento

1. Adicionar entrada em `equipment.json` com ID único, posição em metros, tamanho de colisão, conteúdo e `activityId`.
2. Adicionar a atividade em `activities.json` com perguntas, índices de resposta e explicações.
3. Sem `model`, a fábrica atual cria a bancada de demonstração. Novos tipos de mobiliário precisam de uma fábrica visual ou de um GLB: cadastrar nome por si só não gera a máquina real.
4. Com `model: "/modelos/arquivo.glb"`, o registro carrega o GLB e substitui a aparência provisória; conserva o volume configurado. Nós com nomes de `components[].id` permitem destaque.
5. Validar escala, posição, colisão, nomes de nós e desempenho. Modelos comprimidos com Draco/Meshopt ainda exigem configurar os decodificadores; não estão anunciados como suportados nesta etapa.

## Persistência e privacidade

Chave `senai-automotivo-3d:v1`: IDs visitados, última nota por atividade, data de conclusão e configurações. Sem nome, cadastro, analytics ou transmissão. Armazenamento bloqueado mantém o estado em memória. Reinício pede confirmação dentro da interface. Referências originais não aparecem no simulador; revisar pessoas, placas e permissões antes de publicação.

## Renderização e limitações

PBR padrão, concreto procedural com variação de superfície, tone mapping ACES, luz hemisférica, luz direcional e preenchimento pontual. Apenas a direcional gera sombras. Qualidade baixa sem sombras e DPR 1; média 1024/DPR 1,5; alta 2048/DPR 2. DPR limitado ao do aparelho. Luminárias visuais emissivas não acrescentam luzes individuais.

Não há reflexos dinâmicos, modelos reais, mapas PBR fotográficos, iluminação assada ou LOD de veículos nesta entrega. Texturas procedurais e primitivas detalhadas são uma fundação, não um acabamento fotorrealista. O desempenho de 60 FPS é uma meta que precisa ser medido no laboratório.
