# SENAI Automotivo 3D

**Revisão 03 — reconstrução por fotografias:** cobertura em duas águas com faixa zenital, laboratório com aberturas, reorganização dos setores de motores/elevadores/corredor, materiais e iluminação revistos. Consulte o [relatório de reconstrução](docs/reconstrucao-03.md) e o [mapa estimado](docs/planta-estimada.svg). Medidas e ligação entre setores ainda não foram aferidas; a fidelidade renderizada não foi validada nesta sessão.

Para comparar no navegador, abra **http://localhost:5173/comparacao.html** (use a porta real informada pelo Vite). Há seis poses aproximadas, sobreposição da fotografia, ajuste de FOV e exportação de PNG/pose JSON. A exportação visual ainda precisa ser conferida em navegador. `npm run audit` gera o mapa e a auditoria estrutural sem WebGL; não produz capturas nem mede FPS.

Protótipo local de ambiente virtual de aprendizagem. A oficina é uma composição **provisória**, com medidas estimadas; a bancada interativa é genérica e não uma réplica de equipamento real.

**Atualização 02:** prática de montagem de roda no carro 3D, além do questionário. Clique em **Montar no carro** na tela inicial: inspecione o cubo, pegue a roda, encaixe quatro fixadores, selecione a ferramenta, aplique a sequência cruzada e confira o conjunto. Veja [guia da prática](docs/pratica-montagem.md). O carro tem painéis coloridos aproximados e capô articulado; o cenário recebeu detalhes derivados de quatro referências ampliadas.

## Executar

Requer Node.js compatível com o Vite instalado (a entrega foi compilada com Node 24.16.0) e navegador moderno com WebGL 2.

```sh
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173/`. Se o servidor já estiver aberto, reinicie-o após a atualização da configuração.

No PowerShell com bloqueio de `npm.ps1`, utilize `npm.cmd install`, `npm.cmd run dev`, `npm.cmd run build` e `npm.cmd test`. Não é necessário alterar a política de execução.

```sh
npm run build
npm run preview
npm test
```

O build gera `dist/`. O comando de teste utiliza o executor nativo do Node sem subprocessos de isolamento. Não abra `index.html` diretamente pelo explorador de arquivos.

## Primeira experiência

1. Clique em **Entrar na Oficina** e permita o controle do mouse.
2. Use WASD ou setas para caminhar, mouse para olhar e Shift para acelerar moderadamente.
3. A bancada com morsa está no setor de motores, à frente e à direita do início. Aproxime-se e olhe para ela. Pressione **E** quando surgir a indicação.
4. Explore as abas, destaque os três componentes e responda às duas perguntas de **Atividade**. Confira o feedback e o resultado; é possível repetir.
5. Feche o painel e clique em **Retomar exploração**. ESC libera o cursor e pausa.
6. A tela inicial oferece três percursos em **Atividades**: livre, visita guiada de três etapas e missão introdutória. Todos usam a mesma estação nesta versão.

No celular, use o joystick à esquerda, arraste à direita para olhar e toque no cartão de interação. Tela cheia depende do suporte do navegador.

## Implementado

Arquitetura 3D configurável, piso procedural, paredes, caixilhos, portão fechado, teto, pilares instanciados, vigas, luminárias, tubulação decorativa e faixas de circulação. Apoios genéricos e uma bancada educativa com morsa estilizada e painel de ferramentas. Navegação em primeira pessoa com colisões, pausa, ponto inicial, configurações gráficas e áudio opcional. Registro modular, fallback de carregamento GLB e salvamento de notas/visitas/configurações em armazenamento local.

## Organização

```text
src/
  main.js, style.css
  core/       Engine, Controls, CollisionSystem
  world/      Workshop, Architecture, Lighting, Materials
  objects/    Equipment, EquipmentRegistry
  systems/    InteractionSystem, ProgressSystem, AudioSystem
  education/  QuizSystem
  ui/         AppUI, EquipmentPanel, TouchControls
public/       data/ (workshop, equipment, activities, assembly), referencias/, modelos/, texturas/, audios/, imagens/
scripts/      auditar-cenario.mjs
docs/         inventario-visual.md, arquitetura.md, proximas-etapas.md
tests/        systems.test.js, scene.test.js
```

Edite `public/data/workshop.json` para dimensões, início e o objeto `reconstruction` (laboratório, pórticos, janelas, bancadas, motores, elevadores, veículos e câmeras). A planta e os testes devem ser executados novamente após mudanças. Detalhes menores e trechos de instalações mantêm coordenadas próprias nos construtores: reduzir muito a sala exige ajustá-los. Equipamentos também precisam permanecer dentro dos limites.

## Validação e limites

Consulte [registro de testes](docs/testes.md), [arquitetura](docs/arquitetura.md), [inventário](docs/inventario-visual.md) e [próximas etapas](docs/proximas-etapas.md).

Esta entrega não inclui máquinas reais reconstruídas, montagem de carro completo, diagnóstico avançado, backend de alunos ou réplica dimensional. O veículo procedural tem roda removível e capô articulado para uma prática introdutória. A demonstração educativa não autoriza operar equipamentos reais e exige revisão docente para adoção no curso. Sem logotipo institucional. Não há carregamento externo para funções essenciais.
