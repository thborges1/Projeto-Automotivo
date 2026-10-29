export const oilProfiles = {
  corolla: { name: 'Toyota Corolla Hybrid', hybrid: true, plug: [-1.48, 0.182, 0.1], filter: [-1.64, 0.25, 0.36] },
  hb20: { name: 'Hyundai HB20', plug: [-1.48, 0.182, 0.1], filter: [-1.08, 0.25, 0.38] },
  gol: { name: 'Volkswagen Gol', plug: [-1.48, 0.182, 0.1], filter: [-1.64, 0.26, -0.38] },
};
// Positions are teaching adapters for the generic mesh, not manufacturer dimensions.
// No torque, capacity, filter part number or viscosity without year/engine/source.
export const oilSteps = [
  { id: 'power', stage: 1, target: 'power', text: 'Confirme motor desligado e chave afastada. No híbrido, READY deve estar apagado.', learning: 'O motor de um híbrido pode iniciar automaticamente se o sistema estiver ativo.' },
  { id: 'supports', stage: 1, target: 'supports', text: 'Confira veículo centralizado, apoios e travas do elevador.', learning: 'Os apoios sustentam a estrutura; a elevação deve estar parada e travada.' },
  { id: 'ppe', stage: 1, target: 'ppe', text: 'Confirme óculos, luvas, temperatura segura e destinação do óleo usado.', learning: 'Não toque no escapamento quente. Óleo usado deve ser encaminhado à coleta apropriada.' },
  { id: 'pan', stage: 2, target: 'pan', tool: 'inspect', text: 'Selecione Inspeção e clique no cárter sob o motor.', learning: 'O cárter armazena o óleo de lubrificação do motor.' },
  { id: 'locatePlug', stage: 2, target: 'plug', tool: 'inspect', text: 'Identifique o bujão na face inferior do cárter.', learning: 'O bujão fecha o ponto de drenagem. Não o confunda com fixadores da suspensão.' },
  { id: 'collector', stage: 3, target: 'collector', tool: 'collector', text: 'Arraste o coletor pelo piso até a marca sob o bujão e valide a posição.', learning: 'O coletor precisa interceptar o escoamento antes da abertura do cárter.' },
  { id: 'removePlug', stage: 4, target: 'plug', tool: 'socket', duration: 1.2, text: 'Selecione a chave de soquete e clique no bujão para soltá-lo.', learning: 'Use a ferramenta adequada ao fixador; o óleo inicia a drenagem após a remoção.' },
  { id: 'drain', stage: 5, duration: 7, text: 'Observe a drenagem. Aguarde o fluxo diminuir e cessar.', learning: 'O fluxo e o volume coletado são representações visuais, sem unidade de litros.' },
  { id: 'locateFilter', stage: 6, target: 'filter', tool: 'inspect', text: 'Localize o filtro de óleo. A posição destacada é uma adaptação didática.', learning: 'O filtro retém contaminantes. Posição, tipo e referência dependem do motor e ano.' },
  { id: 'removeFilter', stage: 6, target: 'filter', tool: 'filterWrench', duration: 1.1, text: 'Use a chave de filtro no filtro usado para removê-lo.', learning: 'Mantenha o coletor na área de manutenção; a peça usada permanece na bandeja de serviço.' },
  { id: 'cleanSeat', stage: 6, target: 'filterSeat', tool: 'cloth', text: 'Limpe o alojamento e confira que não restou a vedação antiga.', learning: 'Uma vedação duplicada ou uma superfície suja pode causar vazamento.' },
  { id: 'installFilter', stage: 6, target: 'filterSeat', tool: 'newFilter', duration: 1.2, text: 'Selecione o filtro novo do perfil escolhido e instale-o no alojamento.', learning: 'A peça é um proxy educativo. Referência, preparo da vedação e aperto reais exigem a ficha do motor.' },
  { id: 'seal', stage: 7, target: 'plug', tool: 'seal', text: 'Substitua o elemento de vedação do bujão nesta montagem didática.', learning: 'O tipo e a necessidade de troca do elemento real devem ser confirmados na documentação.' },
  { id: 'installPlug', stage: 7, target: 'plug', tool: 'hand', duration: 0.9, text: 'Rosqueie o bujão manualmente no cárter.', learning: 'Iniciar manualmente ajuda a evitar danos à rosca.' },
  { id: 'tighten', stage: 7, target: 'plug', tool: 'torque', duration: 1, text: 'Confira o aperto com o torquímetro didático, sem um valor de torque presumido.', learning: 'Não há torque cadastrado: esta animação não substitui a especificação do veículo.' },
  { id: 'parkCollector', stage: 8, target: 'collector', tool: 'collector', text: 'Retire o coletor: arraste-o para a marca fora da projeção do veículo.', learning: 'A área sob o carro deve ficar livre de recipientes e ferramentas antes da descida.' },
  { id: 'leave', stage: 8, target: 'exit', duration: 1.6, text: 'Clique na saída verde para caminhar até fora da área do elevador.', learning: 'A descida fica bloqueada enquanto a câmera estiver sob o veículo.' },
  { id: 'lower', stage: 8, target: 'lift', text: 'Acione Descer elevador e aguarde a parada completa.', learning: 'O comando só libera a descida após conferir peças, coletor e área de trabalho.' },
  { id: 'hood', stage: 8, target: 'hood', tool: 'hand', duration: 1, text: 'Com o carro no piso, clique no capô para abri-lo.', learning: 'O abastecimento ocorre pelo ponto superior do motor, nunca pelo bujão inferior.' },
  { id: 'cap', stage: 8, target: 'cap', tool: 'hand', duration: 0.6, text: 'Localize e remova a tampa de abastecimento.', learning: 'Confira a identificação do ponto de abastecimento antes de adicionar fluido.' },
  { id: 'fill', stage: 8, target: 'filler', tool: 'oil', duration: 4, text: 'Selecione óleo novo e clique no bocal para simular o abastecimento.', learning: 'Viscosidade, aprovação e volume dependem de ano/motor. Sem ficha verificada, o frasco não exibe especificação ou litros.' },
  { id: 'closeCap', stage: 8, target: 'cap', tool: 'hand', duration: 0.6, text: 'Reinstale a tampa de abastecimento.', learning: 'A tampa precisa estar instalada antes da conferência final.' },
  { id: 'level', stage: 9, target: 'dipstick', tool: 'inspect', duration: 1, text: 'Com o carro nivelado, confira a vareta de óleo.', learning: 'O nível virtual deve ficar entre as marcas. A condição de leitura e o tempo de espera reais são os do manual.' },
  { id: 'leaks', stage: 9, target: 'leakCheck', tool: 'inspect', text: 'Inspecione os pontos de drenagem e filtragem quanto a vazamentos.', learning: 'Esta inspeção é estática e simulada. Não ligamos o motor nesta atividade.' },
  { id: 'verify', stage: 9, target: 'hood', tool: 'hand', duration: 1, text: 'Confira as peças, feche o capô e conclua o serviço.', learning: 'Registre o serviço e encaminhe óleo/filtro usados para destinação apropriada.' },
];

export class OilChangeActivity {
  constructor(profile = 'corolla') { this.reset(profile); }
  reset(profile = this.profile) {
    if (!oilProfiles[profile]) throw new Error('Perfil de óleo desconhecido.');
    this.profile = profile; this.index = 0; this.selected = 'inspect'; this.pending = false;
    this.elapsed = 0; this.mistakes = 0; this.drained = 0; this.filled = 0;
    this.plugRemoved = false; this.filterRemoved = false; this.filterInstalled = false;
    this.sealReplaced = false; this.tightened = false; this.capOpen = false;
    this.leftArea = false; this.levelChecked = false; this.leaksChecked = false;
  }
  get current() { return oilSteps[this.index]; }
  get completed() { return this.index === oilSteps.length; }
  get stage() { return this.current?.stage || 9; }
  get busy() { return this.pending || this.current?.id === 'drain'; }
  fail(message) { this.mistakes++; return { ok: false, message }; }
  select(tool) { if (!this.busy && !this.completed) this.selected = tool; }
  guard(context) {
    const id = this.current?.id;
    if (!context.centered || !context.supported || !context.engineOff) return 'Confira veículo desligado, centralizado e apoiado.';
    if ((this.stage < 8 || ['parkCollector', 'leave'].includes(id)) && (!context.raised || context.moving)) return 'A atividade inferior exige elevador alto, travado e parado.';
    if (['collector', 'removePlug'].includes(id) && !context.collectorAligned) return 'Posicione o coletor diretamente sob o bujão antes de continuar.';
    if (id === 'parkCollector' && !context.collectorClear) return 'Mova o coletor completamente para fora da projeção do carro.';
    if (id === 'lower' && (!this.leftArea || !context.areaClear || !context.collectorClear || !this.tightened || !this.filterInstalled)) return 'Retire o coletor e saia de baixo; confira bujão e filtro instalados.';
    if (this.stage >= 8 && !['parkCollector', 'leave', 'lower'].includes(id) && (!context.lowered || context.moving)) return 'Aguarde o elevador chegar ao piso e parar.';
    if (id === 'installFilter' && context.filterProfile !== this.profile) return 'O filtro selecionado não corresponde ao perfil didático deste veículo.';
    return null;
  }
  perform(target, context) {
    if (this.completed || this.busy) return { ok: false, message: 'Aguarde a animação ou a drenagem terminar.' };
    const step = this.current;
    if (target !== step.target) return this.fail('Componente incorreto para esta etapa. Consulte a orientação ou destaque o alvo.');
    if (step.tool && this.selected !== step.tool) return this.fail('Selecione a ferramenta ou peça indicada antes de interagir.');
    const problem = this.guard(context); if (problem) return this.fail(problem);
    if (step.duration || step.id === 'lower') { this.pending = true; this.elapsed = 0; }
    else this.finish();
    return { ok: true, message: step.learning };
  }
  finish() {
    switch (this.current.id) {
      case 'removePlug': this.plugRemoved = true; break;
      case 'removeFilter': this.filterRemoved = true; break;
      case 'installFilter': this.filterRemoved = false; this.filterInstalled = true; break;
      case 'seal': this.sealReplaced = true; break;
      case 'installPlug': this.plugRemoved = false; break;
      case 'tighten': this.tightened = true; break;
      case 'leave': this.leftArea = true; break;
      case 'cap': this.capOpen = true; break;
      case 'closeCap': this.capOpen = false; break;
      case 'level': this.levelChecked = true; break;
      case 'leaks': this.leaksChecked = true; break;
    }
    this.index++; this.pending = false; this.elapsed = 0;
  }
  update(dt, context) {
    if (!Number.isFinite(dt) || dt <= 0 || this.completed) return false;
    const step = this.current;
    if (step.id !== 'drain' && !this.pending) return false;
    // Pause automatic progress if the mechanical prerequisites cease to hold.
    if (this.guard(context)) return false;
    if (step.id === 'lower') {
      if (context.lowered && !context.moving) { this.finish(); return true; }
      return false;
    }
    this.elapsed = Math.min(step.duration, this.elapsed + Math.min(dt, 0.1));
    const t = this.elapsed / step.duration;
    if (step.id === 'drain') this.drained = t;
    if (step.id === 'fill') this.filled = t;
    if (t >= 1) { this.finish(); return true; }
    return false;
  }
}
