# Troca manual de uma roda

Implementada na roda dianteira esquerda do carro didático, dentro da janela de inspeção. As demais atividades e a prática guiada anterior continuam disponíveis. Não há migração de framework, motor físico ou dependência nova.

## Como experimentar

```sh
npm ci
npm run dev
```

No PowerShell com bloqueio de npm.ps1, use `npm.cmd`.

1. Entre na oficina e clique/toque no carro didático. Na janela, clique no pneu, aro ou outro componente da roda dianteira esquerda.
2. Escolha **Trocar roda — interação manual**. A câmera enquadra a roda e a bandeja; **Focar roda** recupera esse enquadramento.
3. Com **Inspeção**, clique no marcador amarelo ligado ao apoio fixo virtual. O veículo representado já está imobilizado e apoiado: essa é uma conferência educativa, não uma validação física de segurança.
4. Escolha **Chave de soquete**. Segure cada fixador no modelo e arraste para a esquerda. Complete o giro virtual dos quatro; soltar o mouse antes permite continuar depois.
5. Escolha **Mãos**. Clique individualmente nos fixadores soltos para retirá-los e guardá-los na bandeja. Cada retirada é animada e precisa terminar antes da próxima interação.
6. Segure o pneu/aro, arraste para fora do cubo e solte. A roda só é liberada após os quatro fixadores terem sido retirados.
7. Arraste a roda de volta ao anel do cubo. **Shift + arrastar** gira o conjunto para alinhar os alojamentos. O anel fica verde quando distância e alinhamento permitem encaixe; solte para completar a animação de snap.
8. Com **Mãos**, clique nos fixadores da bandeja para iniciá-los individualmente no conjunto assentado.
9. Escolha **Torquímetro didático**. Segure o fixador destacado e arraste para a direita, seguindo a sequência cruzada **1 → 3 → 2 → 4**. O próximo é destacado em verde. Uma tentativa fora de ordem não aplica aperto.
10. Com **Inspeção**, clique no centro da roda para concluir. A mensagem de conclusão aparece e o resultado é salvo no progresso da montagem da roda.

Botões selecionam ferramentas, iniciam/encerram a prática ou navegam. Não há botões para soltar fixadores, retirar roda, encaixar ou apertar: essas ações são feitas nas peças 3D.

**Encerrar prática e restaurar peças**, fechar a inspeção ou sair da página restaura os objetos originais. Uma prática incompleta não salva conclusão. Uma prática concluída mantém o resultado educativo; roda, fixadores, cores, pais e transformações retornam à configuração anterior ao exercício.

## Escopo educativo

Os giros, distâncias de interação e tolerâncias são controles virtuais. Não representam número de voltas, torque ou tolerância de montagem de um veículo real. A prática não substitui treinamento supervisionado, especificações do fabricante ou conferência dos equipamentos e pontos de apoio reais. Não há condução do veículo, macaco móvel ou elevação física nesta atividade.

Somente a roda estruturada do carro didático é manipulada nesta etapa. Modelos detalhados sem nós mecânicos mapeados continuam disponíveis para inspeção visual; não são reinterpretados como peças desmontáveis. Se a prática começar enquanto um detalhe opcional ainda carrega, esse carregamento é cancelado ou sua conclusão é descartada, preservando o grafo ativo.

## Responsabilidades e arquivos

| Arquivo | Função |
| --- | --- |
| `src/education/WheelMaintenanceActivity.js` | Estado independente de DOM/Three.js: apoio, ferramentas, giros, retirada, snap, ordem de montagem e conclusão. |
| `src/interactions/ConstrainedPartDrag.js` | Arraste por raio/plano, em coordenadas mundiais, com preservação do ponto de pega. Reutilizável em outras peças. |
| `src/systems/ManualWheelSession.js` | Adapta input, controla a roda/fixadores existentes, bandeja, marcadores, animações, captura e restauração. |
| `src/systems/InspectionSession.js` | Integra a prática no loop/câmera existentes e mantém apenas uma visualização ativa. |
| `src/systems/InspectionPartSelection.js` | Suspende o hover/clique comum durante a atividade manual para não disputar o gesto. |
| `src/ui/InspectionPanel.js`, `src/ui/inspection.css` | Instruções, ferramentas selecionáveis, progresso de giro e feedback. |
| `src/objects/Vehicle.js`, `src/vehicles/VehicleParts.js` | Referências e identificação dos apoios didáticos existentes; geometria preservada. |
| `tests/manual-wheel.test.js` | Regras, arraste, fluxo do controlador, animação parcial, bloqueios e restauração. |
| `scripts/smoke-browser.mjs` | Percurso gráfico completo com eventos de mouse sobre as peças. |
| `package.json` | Inclui os módulos novos nas verificações de formatação. |

README, arquitetura, relatório da inspeção e registro de testes apontam para este guia. Não foram modificadas as regras das outras atividades.

## Input, recursos e expansão

A roda e os fixadores não são clonados. São temporariamente reparentados para permitir deslocamento independente, com snapshots das transformações, posição na árvore, visibilidade e cores. Somente bandeja, marcadores e representação simples da ferramenta são próprios da atividade. Ao encerrar, primeiro restauram-se as peças emprestadas e depois descartam-se os auxiliares, com deduplicação de geometrias/materiais compartilhados.

O arraste calcula interseções apenas durante os gestos. O loop existente interpola somente animações ativas; não há simulação rígida, gravidade, colisores dinâmicos ou novo render loop. Perder captura, cancelar o ponteiro, ocultar a página ou perder foco encerra o gesto; sair da prática cancela animações e restaura o conjunto.

Para outra peça, reutilize o arraste por raio e implemente suas próprias regras. `WheelMaintenanceActivity` não conhece o mouse; `ConstrainedPartDrag` recebe `Ray`. Isso permite um futuro adaptador XR, sem prometer suporte VR já implementado. A entrada desta entrega usa Pointer Events e Shift para rotação.

## Verificação realizada

- **79/79 testes Node** aprovados: 72 anteriores e sete novos, incluindo fluxo integral por eventos do controlador, tentativa de remoção prematura, ferramenta errada, alinhamento inválido, sequência errada, animação intermediária e encerramento durante animação.
- **Edge headless/WebGL 2:** eventos reais de mouse selecionaram ferramenta, giraram quatro fixadores, retiraram-nos, arrastaram/giraram a roda, encaixaram, reinstalaram e apertaram em cruz; a conferência final salvou o progresso. Retirada prematura e sequência errada foram rejeitadas. O painel continha apenas a ação de encerramento, além das ferramentas, durante os passos mecânicos.
- Zero exceções, console.error, warnings ou requisições com falha no percurso gráfico. O mesmo smoke preservou inspeção, câmeras, elevadores, óleo, filtro, montagem anterior e descarte.
- Evidências locais: `.browser-refactor/results.json`, `manual-wheel-removed.png` e `manual-wheel-complete.png`. Capturas inspecionadas.
- ESLint, Prettier e build aprovados. Comparação CPU: geometria e transformações da oficina com hash idêntico ao baseline; 274 malhas, 1.851 instâncias e 55 volumes de colisão.

FPS e uso de GPU em hardware real não foram medidos; o navegador de teste usa renderização de software. Não foram testados controladores VR nem gesto Shift em dispositivos de toque. Esses limites não são apresentados como validação de segurança real.

Comandos: `npm test`, `npm run lint`, `npm run format:check`, `npm run build`; smoke com Vite na porta 5175 e Chromium de teste/depuração na porta 9225: `npm run test:browser`.

Backup anterior a esta etapa, incluindo alterações locais: `C:\Users\492137~1\AppData\Local\Temp\automotivo-roda-manual-20261029-110659`. Nenhum reset, stash ou commit foi realizado.
