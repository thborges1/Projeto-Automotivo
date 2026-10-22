# Prática de montagem — protótipo 02

## Direção de experiência

Evolução do visualizador para uma prática de manipulação de peças. A inspiração é a interação por componentes de simuladores de mecânica, sem copiar conteúdo, veículos, modelos ou identidade de My Summer Car. A primeira prática opera uma roda de um veículo didático genérico, não um carro completo.

## Como usar

Clique em **Montar no carro** na tela inicial ou em **Atividades → Montar a roda no veículo**. Também é possível caminhar até o lado da roda dianteira do carro à direita e pressionar E.

Na prática, o mouse fica livre. Arraste a cena para girar, use a roda do mouse/pinça para aproximar. Selecione a peça na bandeja 3D ou nos botões do inventário e clique no alvo. Os botões “Alvo 1–4” são alternativa para teclado e telas pequenas. “Focar encaixe” recupera o enquadramento; “Ver carro” amplia o campo de visão.

Sequência implementada:

1. Inspecionar o cubo clicando no centro.
2. Selecionar conjunto pneu/aro e clicar no encaixe central. A roda se desloca da bandeja ao cubo.
3. Selecionar fixadores e encaixar cada um dos quatro separadamente.
4. Selecionar torquímetro e ativar perfil didático.
5. Aplicar ferramenta em cada fixador na sequência cruzada 1 → 3 → 2 → 4, com animação entre ações.
6. Conferir no centro da roda; salvar aproveitamento e oferecer repetição.

O perfil didático **não representa um torque real**, nem é calibração de instrumento. O veículo não tem identificação técnica confirmada; não foi atribuído valor em N·m. O modelo fica sobre suporte fixo genérico; não há exercício de elevação.

## Arquivos e extensão

- `public/data/assembly.json`: passos, instruções, objetivos e sequência.
- `src/education/AssemblyActivity.js`: estado de peças, ferramenta, pré-requisitos e validação.
- `src/systems/AssemblySession.js`: seleção por raycast, inventário, alvos, enquadramento orbital, animação, feedback e salvamento.
- `src/objects/Vehicle.js`: carro procedural com passagens de roda, vidros, painéis coloridos, rodas separadas, cubo, fixadores e capô articulado.
- `src/objects/VehicleStation.js`: integração com o registro e a interação por proximidade existentes.
- `src/ui/assembly.css`: interface da prática para desktop e toque.

O registro de resultado usa o sistema de progresso existente. São 12 ações; cada tentativa inválida reduz o indicador de aproveitamento em 5 pontos, até o mínimo zero. Trata-se de feedback exploratório, não nota oficial ou certificação. O estado parcial não é persistido; sair com ações em andamento pede confirmação.

O ciclo é simplificado e orientado a aprendizagem da relação peça → encaixe → ferramenta → sequência → conferência. Não simula rosca, atrito, forças, torque físico, sustentação real, inspeção dimensional ou todos os procedimentos de manutenção. A expansão para motor, freios e suspensão precisa de estados, encaixes e modelos próprios; trocar apenas o texto do JSON não cria automaticamente outra máquina.

## Base técnica consultada

- [Continental — Retorquing wheels](https://www.continental-tires.com/tire-knowledge/retorquing-wheels/): padrão cruzado de aperto e consulta ao torque recomendado.
- [Wheel Pros — Torque specifications](https://helpcenter.wheelpros.com/hc/en-us/articles/43488732257293-What-are-the-torque-specifications-for-my-wheel-lug-nuts): especificação do fabricante do veículo.

Essas referências orientam o conceito didático; não constituem validação do conteúdo por docente do SENAI. Revisão instrucional e correspondência com o veículo real seguem pendentes.

## Cenário e fidelidade

Fotos 3, 6, 12 e 15 foram reabertas ampliadas. A atualização acrescenta volume interno cinza com aberturas decorativas, tubulações, triangulação de treliças e três aproximações visuais de conjuntos em suportes. O piso recebeu manchas e riscos procedurais. O carro utiliza a linguagem de painéis coloridos vista na foto 15, com proporções genéricas e sem marca/logotipo.

As posições, quantidade definitiva de postos e dimensões continuam estimadas. Janelas internas e portas do volume são visuais sobre a geometria sólida; a sala interna não é acessível. Os três conjuntos não têm identificação de motor confirmada e não possuem interação nesta versão. A melhoria do cenário não deve ser apresentada como reconstrução fiel concluída.

## Próximos avanços

1. Validar visualmente a prática no navegador e observar dificuldades de encaixe, leitura e toque.
2. Confirmar um veículo real e obter medidas/fotos dos componentes que serão manipulados.
3. Substituir o carro procedural por GLB com peças separadas e encaixes nomeados.
4. Implementar montagem de outro sistema com objetivos revisados pelo docente, como identificação e sequência de um conjunto de motor em bancada.
5. Evoluir o suporte de ferramentas, estados intermediários persistentes e avaliação por critérios de competência.
