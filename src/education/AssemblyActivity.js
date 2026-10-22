// Máquina de estados independente do 3D: peças, ferramentas e pré-requisitos.
export class AssemblyActivity {
  constructor(definition) { this.definition = definition; this.reset(); }
  reset() {
    this.step = 0; this.selected = null; this.checked = false; this.mounted = false;
    this.fasteners = new Set(); this.tightened = []; this.calibrated = false;
    this.mistakes = 0; this.actions = []; this.completed = false;
  }
  get current() { return this.definition.steps[this.step]; }
  get totalActions() { return 12; }
  get progress() { return Number(this.checked) + Number(this.mounted) + this.fasteners.size + Number(this.calibrated) + this.tightened.length + Number(this.completed); }
  result(ok, message) { if (!ok) this.mistakes++; return { ok, message }; }
  select(id) {
    if (!['wheel', 'fastener', 'torque', 'impact'].includes(id)) return this.result(false, 'Selecione um item do inventário.');
    this.selected = id;
    return { ok: true, message: id === 'impact' ? 'Chave de impacto selecionada. Avalie se ela serve para a etapa de controle do aperto.' : 'Item selecionado. Clique no destino na cena 3D.' };
  }
  perform(action, target) {
    if (this.completed) return { ok: false, message: 'Prática concluída. Reinicie para montar novamente.' };
    let message;
    if (this.step === 0 && action === 'inspect') {
      this.checked = true; this.step++; message = 'Apoio inspecionado. Agora posicione o conjunto pneu/aro.';
    } else if (this.step === 1 && action === 'mount' && this.selected === 'wheel') {
      this.mounted = true; this.selected = null; this.step++; message = 'Roda assentada. Encaixe os quatro fixadores manualmente.';
    } else if (this.step === 2 && action === 'fit' && this.selected === 'fastener') {
      if (!Number.isInteger(target) || target < 0 || target > 3) return this.result(false, 'Escolha um dos quatro alojamentos.');
      if (this.fasteners.has(target)) return this.result(false, 'Este fixador já está encaixado. Procure um alojamento livre.');
      this.fasteners.add(target);
      if (this.fasteners.size === 4) { this.step++; this.selected = null; }
      message = this.fasteners.size === 4 ? 'Quatro fixadores encaixados. Prepare o torquímetro.' : `Fixador ${target + 1} encaixado · ${this.fasteners.size}/4.`;
    } else if (this.step === 3 && action === 'configure' && this.selected === 'torque') {
      this.calibrated = true; this.step++; message = 'Perfil didático ativo. Siga a sequência cruzada 1 → 3 → 2 → 4.';
    } else if (this.step === 4 && action === 'tighten' && this.selected === 'torque' && this.calibrated) {
      const expected = this.definition.boltOrder[this.tightened.length];
      if (target !== expected) return this.result(false, `Siga a sequência cruzada: o próximo fixador é ${expected + 1}. A ação incorreta não foi aplicada.`);
      this.tightened.push(target);
      if (this.tightened.length === 4) this.step++;
      message = this.tightened.length === 4 ? 'Sequência finalizada. Confira o conjunto no centro da roda.' : `Fixador ${target + 1} concluído. Próximo: ${this.definition.boltOrder[this.tightened.length] + 1}.`;
    } else if (this.step === 5 && action === 'verify') {
      this.completed = true; message = 'Montagem virtual conferida. Você concluiu todas as etapas práticas.';
    } else {
      if (this.selected === 'impact' && (action === 'tighten' || action === 'configure')) return this.result(false, 'Nesta etapa precisamos controlar o aperto com o torquímetro do exercício, não com a chave de impacto.');
      return this.result(false, `Ação ainda não disponível. ${this.current.instruction}`);
    }
    this.actions.push({ action, target, step: this.step });
    return { ok: true, message, completed: this.completed };
  }
}
