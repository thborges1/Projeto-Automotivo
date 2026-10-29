# Auditoria e refatoração — 29/10/2026

## Diagnóstico anterior às alterações

O projeto usa ES Modules, JavaScript, Three.js e Vite, com duas entradas: `index.html → src/main.js` e `comparacao.html → src/comparison.js`. Não há framework de interface, backend ou TypeScript. Dependências de execução: apenas Three.js; Vite é ferramenta de desenvolvimento. Nenhuma dependência existente foi comprovada desnecessária.

`main` carrega quatro JSON em paralelo e instancia Engine, registro, interface e sessões. `Engine → Workshop → Architecture/Laboratory/WorkshopProps/Lighting/Vehicle`; `WorkshopProps → VehicleLift/Vehicle`; `Engine → Controls/CollisionSystem/EquipmentRegistry/VehicleFleet`. As sessões dependem do motor e da interface; as regras em `education` são independentes do DOM. Não há necessidade de EventBus ou de hierarquia de atividades.

Sistemas confirmados no código e nos 41 testes iniciais:

- Oficina procedural com batching, materiais e texturas locais, carros nos elevadores e carro didático com cabine e componentes móveis.
- Suporte a frota GLB configurável: Corolla híbrido, HB20 (esse é o nome no cadastro atual, sem comprovação de variante HB20S) e Gol; três LOD, Draco/Basis e materiais próprios. Não há arquivos GLB na árvore atual nem `vehicles` habilitado no JSON: os carros efetivamente apresentados são procedurais.
- Elevadores com animação de quatro segundos, bloqueio durante movimento, proprietário de manutenção, liberação de colisão por altura e proteção de descida.
- Navegação com teclado, mouse, pointer lock e toque; câmera orbital nas sessões e página de comparação; colisões horizontais AABB e interação por distância/direção/oclusão.
- Bancada educativa, quiz, visita guiada e missão; montagem de roda, filtro de ar, bateria, luzes e troca de óleo para três perfis; persistência local e áudio opcional.
- Suspensão e escapamento têm geometria, mas não atividades independentes. Não foi encontrada lavagem de chassi implementada.

Problemas: Engine concentra configuração gráfica, reflexos, loop e descarte; VehicleLift mistura estado temporal e representação 3D; descarte de geometria/material/textura repetido em Engine, registro e frota; descarte não idempotente; listeners globais de main/AppUI sem encerramento; controles de toque não expõem descarte. main mantém todo o estado no escopo do módulo. Documentação anterior não acompanha óleo, frota/LOD e configuração atual de sombras.

O loop existente é único (`setAnimationLoop`); não há evidência de loops concorrentes. Vetores dos controles e interação já são reutilizados. Batching, instanciamento e LOD já existem: devem ser preservados. Não há evidência de ganho de FPS que justifique mudanças na geometria. Materiais e texturas podem ser compartilhados, exigindo descarte único por conjunto de recursos. Arquivos maiores: AssemblySession (321 linhas), OilChangeSession (295), main (181), WorkshopProps (179), Vehicle (173); tamanho por si só não justifica fragmentação visual.

## Plano incremental

1. Preservar a árvore atual e registrar baseline de testes/build.
2. Extrair configuração gráfica/reflexos, controle de loop e descarte compartilhado, mantendo Engine como fachada pública.
3. Extrair estado puro do elevador sem alterar seus campos consumidos por sessões e testes.
4. Encapsular aplicação em Game; encerrar listeners, toque e sessões explicitamente.
5. Validar entradas do registro e ciclo de vida; testar falhas, compartilhamento e regras existentes.
6. Configurar análise estática/formatação sem reformatar a árvore inteira; atualizar guias e resultados.

## Restauração e baseline

Cópia integral dos arquivos versionados e não ignorados, incluindo alterações locais e novos arquivos: `C:\Users\492137~1\AppData\Local\Temp\automotivo-refactor-20261029-090919`. Contém também `git-status.txt` e `working-tree.diff`. Nenhum reset, stash ou commit foi realizado. Para reverter esta etapa, encerre o servidor, compare o backup com a árvore atual e restaure somente os arquivos alterados nesta refatoração; remova apenas novos arquivos desta etapa. Não use `git reset --hard`: descartaria trabalho anterior do usuário. O backup não contém node_modules, dist ou artefatos ignorados; dependências podem ser reinstaladas pelo lockfile preservado.

Baseline: `npm.cmd test`: 41/41 aprovados. Build no sandbox falhou por `spawn EPERM`; repetido com permissão fora dele, aprovado (61 módulos, bundle principal 81,39 kB; Three.js 611,90 kB). Esses tamanhos não medem FPS, memória GPU nem tempo de inicialização real.

## Resultado arquitetural

| Antes | Depois |
| --- | --- |
| Engine configura renderizador, captura reflexos, atualiza e descarta recursos. | Engine mantém fachada; Renderer, StaticReflections, GameLoop e DisposeUtils possuem responsabilidades específicas. |
| Estado da aplicação no escopo de main e eventos sem encerramento. | main inicia Game; Game encapsula estado e coordena descarte de sessões/eventos/UI/toque. |
| VehicleLift calcula interpolação e altera objetos 3D no mesmo método. | LiftMotion contém progressão sem Three.js; VehicleLift adapta movimento e preserva intertravamentos e campos públicos. |
| Três implementações de descarte; materiais/texturas compartilhados podem ser liberados repetidamente. | Utilitário comum com Set, exclusões explícitas e descarte de buffers de InstancedMesh; Engine/frota idempotentes. |
| Cadastro de veículos dentro do loader. | VehicleData separa dimensões e valida posição, rotação e LOD antes do carregamento. |
| Sem análise estática/formatação configuradas. | ESLint em toda a árvore de código; Prettier incremental nos módulos novos, sem reformatar toda a geometria. |

Arquivos acrescentados: `core/Game.js`, `core/GameLoop.js`, `graphics/Renderer.js`, `graphics/StaticReflections.js`, `machines/LiftMotion.js`, `utils/DisposeUtils.js`, `vehicles/VehicleData.js`, `tests/architecture.test.js`, `tests/browser-harness.html`, `scripts/smoke-browser.mjs`, configuração ESLint/Prettier e este relatório. O restante da estrutura foi mantido. Engine, registro, frota, elevador, UI, áudio, toque e página de comparação receberam ajustes de integração/ciclo de vida. README e arquitetura foram atualizados.

Remoções comprovadas: três rotinas de descarte consolidadas; helper `round` não utilizado em Vehicle; variável local `rim` não usada (a chamada que cria a malha permanece); import `oilSteps` não usado no teste. Nenhuma atividade, dependência de execução ou geometria foi removida. ESLint e Prettier são as únicas novas dependências de desenvolvimento.

Melhorias verificáveis de recursos: descarte compartilhado único, encerramento repetível, liberação de buffers de instâncias, limpeza de referências do registro, remoção de eventos globais/UI/toque, cancelamento lógico de publicação de modelos tardios e limpeza em falhas parciais de inicialização. Não se atribui ganho de FPS a essas alterações. Permanecem batching, LOD e sonda estática existentes.

O watcher do Vite ignora `.browser-*` e `.npm-cache`: a verificação gráfica revelou avisos EBUSY ao observar arquivos de perfil do Edge. Esses diretórios locais não são fontes do simulador. O navegador isolado e o servidor usados nos testes foram encerrados após a verificação.

## Evidências de verificação

- Após as extrações: 41 testes originais preservados e 11 novos aprovados (52/52). Novos testes cobrem imports locais/ciclos, loop/delta/visibilidade, movimento puro e travas do elevador, descarte compartilhado/instâncias, modelos tardios, interação inválida, dados de veículos, qualidade/DPR, encerramento idempotente e toque.
- Build de produção aprovado com as duas entradas: 68 módulos; principal 82,15 kB (gzip 26,25 kB), Three.js 611,90 kB. Pequeno aumento é compatível com separação/validação/ciclo de vida; não é uma medição de desempenho interativo.
- Smoke em Edge headless com WebGL 2 e SwiftShader: entrada real e menu abrem; montagem acessível; fixture testa movimento, seleção com oclusão, subida/descida, trava durante manutenção, abertura de óleo/montagem e renderização de três carros procedurais. Segunda entrada carrega seis poses. Zero exceções, console.error, warnings ou requisições com falha nesse percurso.
- Na pose amostrada: 113 draw calls, 54.342 triângulos, 180 geometrias e 7 texturas no renderer. A contagem depende da câmera e do enquadramento; não compara FPS com o baseline.
- Encerramento gráfico: zero canvases no viewport, registro vazio e loop parado; segunda chamada de dispose sem erro.
- Artefatos locais: `.browser-refactor/results.json` e `workshop.png`; screenshot inspecionado, com oficina, bancada, carro e materiais visíveis. Não constitui comparação visual exaustiva entre versões.
- Comparação CPU com os fontes do backup: hashes de geometrias, atributos, índices, matrizes mundiais e matrizes de instâncias idênticos (`e7cc037b814217cba7bf32c57e458366658ff6c53af6a46153db0aa8d99ba258`). Ambos geram 274 malhas, 1.851 instâncias, 92.534 triângulos, 565 chamadas estáticas evitadas e 55 volumes de colisão. Artefato: `.browser-refactor/structural-comparison.json`. O relatório antigo tinha contagens de uma versão anterior ao trabalho local: sua atualização não indica redução causada por esta refatoração.
- ESLint, verificação incremental de Prettier, auditoria CPU e `git diff --check` executados sem erros. Aviso de GLB inexistente nos testes Node é intencional: comprova fallback e diagnóstico de erro, sem arquivo externo real.

O primeiro teste gráfico de seleção colocou a câmera atrás do volume horizontal de um braço baixo, onde a oclusão deveria bloquear. A fixture foi corrigida para aproximar pelo lado livre; nenhuma regra do jogo foi alterada para fazer esse teste passar.

## Limites e próximos passos

Não foram medidos FPS, latência dos controles, inicialização ou memória de GPU real no hardware do laboratório. O renderizador de software headless não permite extrapolar esses números. Não foram testados visualmente todos os percursos completos de manutenção, celulares reais, pointer lock por gesto físico ou modelos GLB ausentes. As regras completas de óleo/montagem/serviços têm testes CPU, mas a adoção exige conferência manual e docente. Preservação de comportamento tem evidências nos testes e no cenário; não é uma garantia de ausência de qualquer regressão possível.

AssemblySession/OilChangeSession ainda coordenam câmera, DOM e animação de suas próprias atividades. As regras já estão separadas em education; fragmentar os coordenadores agora sem necessidade comprovada aumentaria o risco. IDs da UI continuam globais; múltiplas aplicações simultâneas não são um caso suportado. Não foram introduzidas atividades ausentes, réplicas de veículos, cache global, framework, TypeScript ou mudanças de aparência.

Para executar e ampliar veículos, máquinas e atividades, consulte o README e `docs/arquitetura.md`. Documentos históricos de reconstrução não foram reescritos como se descrevessem a versão atual.
