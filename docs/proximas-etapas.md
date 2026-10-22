# Próximas etapas

**Após a revisão 03:** a prioridade é executar a comparação renderizada em `/comparacao.html`, porque a inicialização do navegador foi bloqueada no ambiente de desenvolvimento. Confirmar a topologia global com croqui/medidas antes de refinar mais peças. O setor de motores, laboratório, elevadores e veículos foi reorganizado, mas ainda não deve ser considerado levantamento fiel concluído. Veja `reconstrucao-03.md`.

Atualização 02 implementada: prática de montagem de roda e carro procedural com capô, descrita em `pratica-montagem.md`. A prioridade agora é validar essa interação no navegador e escolher o primeiro sistema real de veículo para modelagem detalhada e revisão docente.

1. Validar manualmente navegação, pointer lock, tela cheia, toque e aparência em um navegador com GPU. Registrar FPS em máquinas de laboratório e ajustar a qualidade padrão.
2. Confirmar medidas básicas e um croqui. Reconstruir o volume interno cinza e corrigir caixilhos, cobertura e distribuição dos postos.
3. Confirmar nomes dos equipamentos e localização da balanceadora citada nos documentos. Escolher apenas um equipamento real para o próximo ciclo.
4. Preparar GLB otimizado em metros, nomes de componentes, materiais PBR e volume de colisão. Fotografias orientam a modelagem; não substituem levantamento.
5. Submeter conteúdo técnico, segurança e perguntas ao docente antes de uso curricular. Solicitar autorização antes de incorporar logotipo, fotos ou documentos na interface pública.
6. Expandir os percursos e estados educativos por componentes; separar coordenação de missão em módulo próprio quando houver mais de uma estação.
7. Medir draw calls, texturas, memória e carregamento dos GLBs. Introduzir compressão, LOD e iluminação assada com base nesses resultados.

Entregue nesta versão: fundação, arquitetura provisória, controles, interfaces e uma estação educativa com quiz. As fases de réplica real, veículos e conteúdo avançado continuam pendentes.
