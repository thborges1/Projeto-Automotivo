# Validação atual da refatoração

Atualização da troca manual: **79/79 testes Node**, lint, Prettier e build aprovados. O smoke gráfico executou a sequência completa com mouse nas peças, incluindo retirada por arraste, rotação, snap, fixadores individuais, aperto cruzado e conclusão salva; testou também bloqueios e restauração. Zero erros de console no percurso. Veja [evidências e limites](roda-manual.md).

Atualização da janela de manutenção: **70/70 testes Node**, preservando o baseline anterior. O smoke verifica abertura direta sobre fundo desfocado, nome e informação ao passar o mouse, clique/abertura do capô e conclusão da prática de filtro dentro da janela. Os seis veículos, câmera, retorno, congelamento do elevador, cena exclusiva e carregamento/descarte de GLB continuam verificados. Lint, Prettier e build aprovados. Veja [relatório do modo](inspecao.md) para evidências e limites.

Em 29/10/2026: 52/52 testes Node, ESLint, Prettier incremental e build aprovados. Smoke em Edge/WebGL 2 verificou entrada principal, montagem acessível, movimento, seleção, ciclo de elevador, travas, abertura de óleo/montagem, descarte e seis câmeras de comparação, sem erros de console. A geometria e as transformações do cenário têm hash idêntico ao backup anterior à refatoração. FPS e hardware real não foram medidos. Veja [evidências, backup e limitações](refatoracao.md).

O conteúdo abaixo é o registro histórico das etapas anteriores.

# Registro de validação — protótipo 01

## Revisão 03 — reconstrução por fotografias

**20 testes automatizados aprovados**, zero falhas. A cena inteira foi construída em Node com um substituto do canvas 2D; isso permite testar geometria, volumes e materiais sem executar GPU. A cobertura adicional verifica valores finitos em posições/matrizes, instanciamento, início livre, caminhos até bancada/roda/corredor/elevadores e seis câmeras comparativas fora de obstáculos. O teste de movimento foi atualizado para posicionar seu obstáculo em função do novo ponto inicial.

Build de produção com entradas `index.html` e `comparacao.html`, imports resolvidos e parser GLTF separado sob demanda. `npm run audit` gerou `planta-estimada.svg` e `auditoria-cenario.json`: 279 meshes, 55 lotes instanciados, 2.339 instâncias e aproximadamente 131.624 triângulos de geometria na cena auditada. O agrupamento evitou 656 chamadas estáticas potenciais em relação à construção sem esses lotes. Esses números não incluem a bancada interativa adicionada pelo registro nem a bandeja transitória da prática; não são FPS nem chamadas medidas na GPU.

HTTP final: páginas `/` e `/comparacao.html` responderam 200 no Vite existente (5173) e no preview de produção iniciado para esta validação (4173). Módulos `comparison`, `Workshop` e `StaticBatching` responderam como JavaScript. JSONs responderam como `application/json` e foram interpretados. Os assets referenciados pelo HTML de produção responderam 200. O preview auxiliar foi encerrado após a validação; o Vite do usuário foi preservado.

Tentativa de abrir Edge headless com perfil `.browser-fidelity` falhou com `Acesso negado (0x5)` em Mojo/Crashpad. Não houve teste de renderização, comparação de capturas, clique em menus/exports, medição de FPS ou toque nesta revisão. A página comparativa fornece uma rotina para esses testes no navegador do usuário; não se declara que a rotina já foi executada.

Os registros das versões anteriores permanecem abaixo como histórico.

## Atualização 02 — prática de montagem

`npm.cmd test`: **17 testes aprovados**, zero falhas. `npm.cmd run build`: aprovado, 36 módulos, parser GLTF em chunk carregado sob demanda e sem avisos de tamanho no build final.

Os cinco testes novos cobrem pré-requisitos de montagem, rejeição de ferramenta/sequência incorretas, as 12 ações até a conferência, capô articulado/rodas separadas e correspondência dos fixadores com os alvos 3D. Esses testes usam geometria e lógica reais em Node, sem executar a interface num navegador.

A limitação de validação gráfica descrita abaixo continua: não se afirma que raycast por clique, layout responsivo, animações visuais ou controles orbitais foram testados em navegador. Conferência manual: abrir **Montar no carro**, completar o percurso, tentar um alvo errado, repetir, sair com montagem parcial e verificar a retomada da oficina. No celular, testar seleção na bandeja, pinça, rotação e alternativa por botões.

## Executado

- `npm.cmd run build`: aprovado, 27 módulos, saída em `dist/`, sem avisos no build final. Imports e caminhos resolvidos pelo Vite.
- `npm.cmd test`: 12 testes aprovados, zero falhas.
- Resposta HTTP de `http://localhost:5173/`: 200 no servidor local existente.
- Verificação adicional HTTP: página, entrada JavaScript, Engine, AppUI, EquipmentPanel, três JSONs e CSS retornaram 200. Não substitui execução de JavaScript no navegador.

## Cobertura automatizada

1. Arquitetura com piso em y=0, câmera acima do piso, início desobstruído, quatro barreiras externas e pilares instanciados.
2. Seleção de equipamento depende de proximidade e direção de olhar; componentes recebem destaque.
3. Erro de GLB mantém o modelo demonstrativo e produz aviso; ID duplicado é rejeitado.
4. Movimento com deslocamento grande não atravessa uma parede.
5. Deslizamento por parede e impedimento de penetração em quinas.
6. Interação bloqueada por obstáculo intermediário, ignorando o volume do próprio equipamento.
7. Fluxo de perguntas, resposta inicial preservada, explicação e nota.
8. Persistência e restauração de visitas/resultados; reinício preserva configurações.
9. Armazenamento bloqueado ou JSON corrompido não impede progresso em memória.
10. Dados com IDs únicos, atividade correspondente, alternativas válidas e equipamento dentro dos limites da sala.
11. Controles movem a câmera conforme a direção do olhar, mantêm a altura e respeitam colisão (eventos de navegador substituídos por EventTarget no teste de lógica).
12. Carregamento de JSON por fetch, com propagação de erro HTTP e conteúdo inválido. Os JSONs são servidos de `public/data/`, CSS é carregado por link no HTML e o favicon tem arquivo próprio. Endpoints de dados e favicon retornaram HTTP 200 após a correção de MIME.

## Limitação do ambiente

Tentativa de iniciar o Microsoft Edge em modo headless falhou com `Acesso negado (0x5)` na criação de canais/processos do navegador. Não foi possível validar renderização GPU, aparência, menus, pointer lock, tela cheia ou gestos de toque por automação. Não há captura de tela da aplicação validada nesta entrega. Os testes de geometria e lógica não são testes de renderização.

O executor de testes inicial também encontrou `spawn EPERM`; o comando foi ajustado para o executor nativo do Node com `--test-isolation=none`. O build inicialmente exigiu adaptar a configuração ao Vite 8 instalado; a configuração final compila sem subprocesso de resolução de configuração nem avisos de chunks.

## Conferência manual prioritária

- Abrir a tela inicial e confirmar piso, paredes, teto, luzes e bancada visíveis.
- Entrar, caminhar em WASD, mover o mouse e testar paredes, bancadas e armários em diagonais.
- Olhar para a bancada próxima e abrir com E; afastar-se para confirmar que a indicação desaparece.
- Navegar nas cinco abas, destacar cada componente, iniciar/parar a sequência visual.
- Responder certo e errado; ler feedback; concluir, recarregar, conferir nota e repetir.
- Testar pausa por ESC, perda de foco, retomada, ajuda, configurações, ponto inicial e tela inicial.
- Testar baixa/média/alta, áudio opcional, tela cheia e saída de tela cheia.
- Testar visita guiada e missão do começo ao fim.
- Em celular real, testar joystick e olhar simultaneamente, interação e orientação da tela.
- Medir fluidez em computador do laboratório. Nenhuma medição de FPS foi feita.
