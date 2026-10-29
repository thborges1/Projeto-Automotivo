# Troca de óleo interativa

Entre na oficina, aproxime-se de um comando dos elevadores azuis e pressione E
para subir. Quando parar no alto, aproxime-se e olhe para o cárter sob o motor:
aparece **Iniciar manutenção — Troca de óleo**. E ou o botão de interação abre
a atividade. Ela não abre com elevador baixo, em movimento ou reservado.

O elevador 1 usa o perfil didático Corolla Hybrid e o 2 usa HB20. Antes da primeira
confirmação, o seletor em Ficha técnica permite usar Gol ou outro perfil.
Isso adapta a posição ilustrativa do filtro; as carrocerias continuam genéricas.
Nenhum perfil declara ano/motor, tipo real de filtro, referência, óleo, volume ou
torque. Essas informações precisam de uma ficha verificada da versão exata antes
de serem ensinadas como especificação. O filtro cilíndrico é um proxy visual.

## Interação

As nove etapas contêm 25 ações validadas. Selecione a ferramenta na faixa inferior
e clique na peça na cena. O botão **Interagir** é uma alternativa acessível que
executa a mesma validação, incluindo ferramenta, posição, altura e estado da peça.
O quadro de destaque localiza a próxima peça; o raycast considera objetos que a
ocultam e não seleciona peças através da carroceria.

Arraste o coletor no piso, com Mover coletor selecionado, ou use as quatro setas
do painel para ajustes de 10 cm. A marca verde indica o centro esperado. Valide
o posicionamento antes de soltar o bujão. Remoção, instalação e drenagem possuem
tempo próprio: clicar repetidamente não as acelera. O óleo usa uma malha de fluxo
que afina e uma superfície crescente no coletor, sem física ou partículas novas.

Depois do filtro e bujão, mova o coletor para a marca externa. Clique na saída
verde ou no comando correspondente para caminhar por um trajeto verificado contra
as colisões existentes. A descida exige coletor fora, câmera fora, filtro instalado
e bujão conferido. O elevador usa sua animação original e fica reservado durante
o exercício. A trava de ocupação também impede a descida normal com o jogador
embaixo do carro. O capô e o abastecimento só liberam após chegar ao piso.

A conferência de vazamentos usa uma câmera de inspeção estática próxima do chão,
sem atravessar o carro. Não há partida do motor nem certificação de ausência real
de vazamentos: toda a atividade é um treino visual de sequência e montagem.

ESC ou Sair restaura as peças do exercício e fecha a interface. A altura do
elevador é preservada. Se o carro foi baixado, o jogador retorna à saída externa,
em vez de reaparecer dentro da carroceria. Exercícios incompletos não são salvos.
Ao concluir, o resultado fica salvo em `troca-oleo-{perfil}`. **Elevar e repetir**
aguarda a elevação completa antes de restaurar a sequência para uma nova tentativa.

## Organização e extensão

- `OilChangeActivity`: sequência independente da renderização, ferramentas,
  pré-condições, tempos e progresso. Não conhece DOM ou Three.js.
- `MaintenanceStation`: disponibilidade, ponto de aproximação e destaque no HUD;
  pode servir de base para suspensão, escapamento e freios.
- `OilChangeRig`: peças móveis e efeitos leves, criados somente ao abrir o posto.
  As geometrias simples e materiais são reutilizados. Perfis usam coordenadas locais
  do carro atual: frente -X, vertical +Y, bitola Z.
- `OilChangeSession`: câmera, seleção por raycast, arraste no piso, interface,
  integração com elevador e gravação do resultado.
- `VehicleLift.maintenanceOwner` reserva o elevador; `canLower` verifica ocupação.
  Nenhum volume de colisão é removido. Capô e bujão dos carros de serviço ficam
  separados dos lotes estáticos; o restante preserva o batching.

O loop atualiza apenas o posto ativo. Geometrias são construídas na abertura e
reutilizadas ao repetir; o descarte retira listeners, controles e recursos da GPU.
Atualização dos textos ocorre nas transições, e raycast completo só no clique.
O fluxo é um cilindro de 12 segmentos, sem sombras reais, física ou alocações de
vetores no loop. O desempenho real depende do dispositivo; não foi certificado
60 FPS em hardware de produção.

## Validação

`npm test` inclui ordem, condições de segurança, coletor mal posicionado,
ferramentas erradas, filtro de outro perfil, duração das animações, drenagem,
descida, abastecimento, três perfis completos, repetição, câmera e descarte.
Os testes anteriores verificam colisão, elevadores, batching e outras práticas.

Para revisão manual, use mouse e toque; teste arraste errado, cliques em peças
ocultas, saída durante drenagem/descida, pausa em outra aba, repetição e saída
após baixar o carro. Meça tempo de quadro em dispositivo real separadamente.

Precaução sobre READY baseada no [manual oficial Toyota](https://techinfo.toyota.com/t3Portal/document/om-s/OM47568U/pdf/OM47568U.pdf?locale=en&siid=1770066716290&sisuffix=ff).
Não foram transferidas especificações desse manual para os perfis do simulador.
As [orientações oficiais Hyundai sobre óleo](https://ownersmanual.hyundai.com/full_webhelp/LX3/2026/en_US/topic_epw_g5d_qcc.html)
também reforçam a necessidade do plano de manutenção específico do veículo.
