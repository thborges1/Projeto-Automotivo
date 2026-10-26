export const jobs = {
  filter: { title: 'Trocar filtro de ar', steps: ['Clique na tampa para abrir a caixa.', 'Retire o filtro usado.', 'Encaixe o filtro novo.', 'Feche a tampa.'], targets: ['cover', 'filter', 'filter', 'cover'] },
  battery: { title: 'Testar bateria', steps: ['Encoste a ponta vermelha no terminal +.', 'Encoste a ponta preta no terminal −.', 'Leia o multímetro e desconecte as pontas.'], targets: ['positive', 'negative', 'meter'] },
  lights: { title: 'Testar luzes', steps: ['Acenda os faróis.', 'Ligue o pisca-alerta.', 'Desligue as luzes para finalizar.'], targets: ['headlights', 'hazards', 'off'] },
};

export class ServiceActivity {
  constructor(id) { this.id = id; this.definition = jobs[id]; if (!this.definition) throw new Error('Serviço desconhecido'); this.step = 0; }
  get completed() { return this.step === this.definition.steps.length; }
  get target() { return this.definition.targets[this.step]; }
  perform(target) {
    if (this.completed || target !== this.target) return false;
    this.step++; return true;
  }
}
