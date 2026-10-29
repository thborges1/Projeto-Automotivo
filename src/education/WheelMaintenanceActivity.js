export const WHEEL_MANUAL_LIMITS = Object.freeze({
  // Interaction distances/turns are virtual teaching controls, not service specifications.
  snapDistance: 0.16,
  alignmentTolerance: 0.14,
  clearance: 0.45,
  removalTravel: 0.3,
  pixelsPerTurn: 130,
});

export const WHEEL_TOOLS = [
  { id: 'inspect', label: 'Inspeção' },
  { id: 'socket', label: 'Chave de soquete' },
  { id: 'hand', label: 'Mãos' },
  { id: 'torque', label: 'Torquímetro didático' },
];

export function wheelAlignmentError(angle) {
  if (!Number.isFinite(angle)) return Infinity;
  const pitch = Math.PI / 2;
  return Math.abs(angle - Math.round(angle / pitch) * pitch);
}

/** Rules only: input may come from a mouse, touch controller or a future XR adapter. */
export class WheelMaintenanceActivity {
  constructor(order = [0, 2, 1, 3]) {
    if (
      !Array.isArray(order) ||
      order.length !== 4 ||
      new Set(order).size !== 4 ||
      !order.every(i => Number.isInteger(i) && i >= 0 && i < 4)
    )
      throw new Error('A roda requer quatro fixadores e uma sequência válida.');
    this.order = [...order];
    this.phase = 'prepare';
    this.tool = 'inspect';
    this.loosened = new Set();
    this.removed = new Set();
    this.installed = new Set();
    this.tightened = [];
    this.turns = [0, 0, 0, 0];
    this.mistakes = 0;
  }

  get completed() {
    return this.phase === 'complete';
  }
  get nextBolt() {
    return this.order[this.tightened.length];
  }
  get instruction() {
    const instructions = {
      prepare:
        'O veículo didático está imobilizado em apoios fixos. Selecione Inspeção e clique no marcador do apoio para conferir antes de começar.',
      loosen: `Selecione a chave de soquete. Segure cada fixador 3D e arraste para a esquerda para soltá-lo (${this.loosened.size}/4). A roda permanece bloqueada.`,
      removeBolts: `Selecione Mãos e clique em cada fixador solto para retirá-lo e guardá-lo na bandeja (${this.removed.size}/4).`,
      removeWheel:
        'Com todos os fixadores retirados, selecione Mãos. Segure o pneu ou aro e arraste para fora do cubo; solte para apoiar a roda na área de trabalho.',
      returnWheel:
        'Arraste a roda de volta ao anel do cubo. Perto e alinhada, ela se encaixa ao soltar. Shift + arrastar gira a roda para alinhar os alojamentos.',
      installBolts: `Com a roda assentada, mantenha Mãos e clique individualmente nos fixadores da bandeja para iniciá-los sem ferramenta (${this.installed.size}/4).`,
      tighten: `Selecione o torquímetro didático. Segure o fixador ${this.nextBolt + 1} e arraste para a direita. Sequência cruzada: ${this.order.map(i => i + 1).join(' → ')}. Sem torque real presumido.`,
      verify:
        'Selecione Inspeção e clique no centro da roda para conferir assentamento e fixadores. O exercício não autoriza operar um veículo real.',
      complete:
        'Troca de roda simulada concluída: retirada, encaixe e fixação conferidos. Resultado salvo. Treinamento real exige supervisão e especificações do veículo.',
    };
    return instructions[this.phase];
  }

  fail(message) {
    this.mistakes++;
    return { ok: false, message };
  }
  success() {
    return { ok: true, message: this.instruction };
  }
  selectTool(id) {
    if (!WHEEL_TOOLS.some(tool => tool.id === id)) return this.fail('Ferramenta desconhecida.');
    this.tool = id;
    return this.success();
  }
  confirmSupport(supported) {
    if (this.phase !== 'prepare' || this.tool !== 'inspect' || supported !== true)
      return this.fail('Confira o apoio virtual com a ferramenta Inspeção.');
    this.phase = 'loosen';
    return this.success();
  }
  turnBolt(index, delta) {
    if (!Number.isInteger(index) || index < 0 || index > 3 || !Number.isFinite(delta))
      return this.fail('Fixador ou movimento inválido.');
    const loosening = this.phase === 'loosen';
    if (!loosening && this.phase !== 'tighten')
      return this.fail('Esta etapa ainda não permite girar fixadores.');
    if (this.tool !== (loosening ? 'socket' : 'torque'))
      return this.fail(
        loosening
          ? 'Selecione a chave de soquete para soltar.'
          : 'Selecione o torquímetro didático para o aperto final.',
      );
    if (!loosening && index !== this.nextBolt)
      return this.fail(`Siga a sequência cruzada: próximo fixador ${this.nextBolt + 1}.`);
    if (loosening && this.loosened.has(index)) return this.fail('Este fixador já está solto.');
    this.turns[index] = Math.max(0, Math.min(1, this.turns[index] + delta));
    if (this.turns[index] === 1) {
      if (loosening) {
        this.loosened.add(index);
        if (this.loosened.size === 4) this.phase = 'removeBolts';
      } else {
        this.tightened.push(index);
        if (this.tightened.length === 4) this.phase = 'verify';
      }
    }
    return this.success();
  }
  removeBolt(index) {
    if (
      this.phase !== 'removeBolts' ||
      this.tool !== 'hand' ||
      !this.loosened.has(index) ||
      this.removed.has(index)
    )
      return this.fail('Solte todos os fixadores antes de retirá-los individualmente com Mãos.');
    this.removed.add(index);
    if (this.removed.size === 4) this.phase = 'removeWheel';
    return this.success();
  }
  detachWheel(travel, clearance) {
    if (this.phase !== 'removeWheel' || this.tool !== 'hand' || this.removed.size !== 4)
      return this.fail('A roda só é liberada após retirar os quatro fixadores.');
    if (
      !Number.isFinite(travel) ||
      !Number.isFinite(clearance) ||
      travel < WHEEL_MANUAL_LIMITS.removalTravel ||
      clearance < WHEEL_MANUAL_LIMITS.clearance
    )
      return this.fail('Puxe a roda um pouco mais para liberar o cubo.');
    this.phase = 'returnWheel';
    return this.success();
  }
  canSnap(distance, angle) {
    return (
      this.phase === 'returnWheel' &&
      this.tool === 'hand' &&
      Number.isFinite(distance) &&
      distance >= 0 &&
      distance <= WHEEL_MANUAL_LIMITS.snapDistance &&
      wheelAlignmentError(angle) <= WHEEL_MANUAL_LIMITS.alignmentTolerance
    );
  }
  seatWheel(distance, angle) {
    if (!this.canSnap(distance, angle))
      return this.fail('Aproxime o centro da roda do cubo e alinhe os alojamentos.');
    this.phase = 'installBolts';
    return this.success();
  }
  installBolt(index) {
    if (
      this.phase !== 'installBolts' ||
      this.tool !== 'hand' ||
      !this.removed.has(index) ||
      this.installed.has(index)
    )
      return this.fail('Assente a roda antes de iniciar os fixadores à mão.');
    this.installed.add(index);
    this.turns[index] = 0;
    if (this.installed.size === 4) this.phase = 'tighten';
    return this.success();
  }
  verify() {
    if (this.phase !== 'verify' || this.tool !== 'inspect')
      return this.fail('Conclua a fixação cruzada e selecione Inspeção para conferir.');
    this.phase = 'complete';
    return this.success();
  }
}
