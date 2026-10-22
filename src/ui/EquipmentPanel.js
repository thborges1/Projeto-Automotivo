import { QuizSystem } from '../education/QuizSystem.js';

export class EquipmentPanel {
  constructor(ui, progress, audio, onClose, onComplete) {
    Object.assign(this, { ui, progress, audio, onClose, onComplete });
    ui.bind('close-panel', onClose);
    this.tabNames = [['overview', 'Visão geral'], ['components', 'Componentes'], ['operation', 'Funcionamento'], ['safety', 'Segurança'], ['activity', 'Atividade']];
    this.timer = null;
  }
  open(item, activity) {
    this.item = item; this.activity = activity; this.quiz = null; this.finished = false;
    this.ui.$('equipment-name').textContent = item.data.name;
    this.ui.$('equipment-category').textContent = item.data.category;
    this.progress.visit(item.data.id);
    this.ui.show('panel'); this.renderTab('overview'); this.ui.$('close-panel').focus();
  }
  close() {
    clearTimeout(this.timer);
    if (this.item) { this.item.demonstrating = false; this.item.selectComponent(null); this.item.setHighlight(false); }
    this.ui.show('panel', false);
  }
  renderTab(tab) {
    clearTimeout(this.timer); this.item.demonstrating = false; this.item.selectComponent(null);
    const tabs = this.ui.$('tabs');
    tabs.innerHTML = this.tabNames.map(([id, text]) => `<button role="tab" id="tab-${id}" aria-selected="${id === tab}" aria-controls="panel-body" tabindex="${id === tab ? 0 : -1}" data-tab="${id}">${text}</button>`).join('');
    tabs.querySelectorAll('button').forEach((b, i) => {
      b.onclick = () => { this.renderTab(b.dataset.tab); document.getElementById(b.id).focus(); };
      b.onkeydown = e => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const n = e.key === 'Home' ? 0 : e.key === 'End' ? this.tabNames.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + this.tabNames.length) % this.tabNames.length;
        this.renderTab(this.tabNames[n][0]); document.getElementById(`tab-${this.tabNames[n][0]}`).focus();
      };
    });
    this.ui.$('panel-body').setAttribute('aria-labelledby', `tab-${tab}`);
    const body = this.ui.$('panel-body'), d = this.item.data;
    body.innerHTML = '';
    const p = text => { const el = document.createElement('p'); el.textContent = text; body.append(el); };
    if (tab === 'overview') {
      body.innerHTML = '<div class="section-number">01 / CONHECER O POSTO</div><h3>Um bom trabalho começa pela organização.</h3>';
      p(d.description);
      body.insertAdjacentHTML('beforeend', '<div class="note">Observe a bancada no cenário. Use as abas para destacar componentes, conhecer os cuidados e responder à atividade.</div><button id="start-activity" class="primary">Iniciar atividade →</button>');
      this.ui.bind('start-activity', () => this.renderTab('activity'));
    } else if (tab === 'components') {
      p('Selecione um componente para destacá-lo na cena.');
      d.components.forEach(c => {
        const button = document.createElement('button'); button.className = 'component-card';
        const name = document.createElement('strong'), desc = document.createElement('span');
        name.textContent = c.name; desc.textContent = c.description; button.append(name, desc);
        button.onclick = () => { body.querySelectorAll('.component-card').forEach(b => b.classList.remove('selected')); button.classList.add('selected'); this.item.selectComponent(c.id); this.audio.play(); };
        body.append(button);
      });
    } else if (tab === 'operation') {
      body.innerHTML = '<h3>Reconheça os pontos de apoio</h3>'; p(d.operation);
      body.insertAdjacentHTML('beforeend', '<button id="demonstrate" class="primary" aria-pressed="false">Iniciar demonstração visual</button><p class="muted">Destaque sequencial dos componentes cadastrados. Sem simulação mecânica.</p>');
      this.ui.bind('demonstrate', () => {
        this.item.demonstrating = !this.item.demonstrating;
        this.ui.$('demonstrate').textContent = this.item.demonstrating ? 'Parar demonstração' : 'Iniciar demonstração visual';
        this.ui.$('demonstrate').setAttribute('aria-pressed', this.item.demonstrating);
        if (!this.item.demonstrating) this.item.selectComponent(null);
      });
    } else if (tab === 'safety') {
      body.innerHTML = '<h3>Preparação e supervisão</h3>';
      d.safety.forEach((text, i) => { const el = document.createElement('div'); el.className = 'safety-card'; el.textContent = `${String(i + 1).padStart(2, '0')} · ${text}`; body.append(el); });
    } else {
      this.quiz ||= new QuizSystem(this.activity);
      if (this.finished) this.renderResult(); else this.renderQuestion();
    }
  }
  renderQuestion() {
    const body = this.ui.$('panel-body'), q = this.quiz.question;
    body.innerHTML = `<div class="section-number">ATIVIDADE · ${this.quiz.index + 1} / ${this.activity.questions.length}</div><h3></h3><p class="activity-objective"></p><div class="answers"></div><div id="feedback" aria-live="polite"></div><button id="next-question" class="primary hidden">Continuar →</button>`;
    body.querySelector('h3').textContent = q.prompt;
    body.querySelector('.activity-objective').textContent = this.activity.objective;
    q.options.forEach((option, i) => {
      const button = document.createElement('button'); button.className = 'answer'; button.textContent = `${String.fromCharCode(65 + i)}. ${option}`;
      button.onclick = () => {
        const result = this.quiz.answer(i);
        body.querySelectorAll('.answer').forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add('correct'); if (j === i && !result.correct) b.classList.add('incorrect'); });
        const feedback = this.ui.$('feedback'); feedback.className = `feedback ${result.correct ? 'success' : ''}`;
        feedback.textContent = `${result.correct ? 'Resposta correta. ' : 'Vamos revisar. '}${q.explanation}`;
        this.audio.play(result.correct); this.ui.show('next-question'); this.ui.$('next-question').focus();
      };
      body.querySelector('.answers').append(button);
    });
    this.ui.bind('next-question', () => {
      if (this.quiz.next()) { this.renderQuestion(); this.ui.$('panel-body').focus(); }
      else {
        this.finished = true; this.progress.complete(this.activity.id, this.quiz.score, this.activity.questions.length);
        this.onComplete(); this.renderResult(); this.audio.play(true);
      }
    });
    // Retomar uma pergunta respondida ao alternar de aba não permite nova pontuação.
    const previous = this.quiz.answers[this.quiz.index];
    if (previous) body.querySelectorAll('.answer')[previous.choice].click();
  }
  renderResult() {
    const score = this.quiz.score, total = this.activity.questions.length;
    this.ui.$('panel-body').innerHTML = `<div class="result-mark">✓</div><div class="section-number">PERCURSO CONCLUÍDO</div><h3>${score === total ? 'Pronto para a próxima descoberta.' : 'Revisar também faz parte de aprender.'}</h3><p>Você acertou <strong>${score} de ${total}</strong> questões. O resultado foi registrado neste navegador.</p><div class="note">Na oficina real, siga sempre as instruções do docente. Esta demonstração não habilita a operar equipamentos.</div><button id="repeat" class="primary">Repetir atividade</button>`;
    this.ui.bind('repeat', () => { this.quiz = new QuizSystem(this.activity); this.finished = false; this.renderQuestion(); });
  }
}
