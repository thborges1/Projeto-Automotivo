import { Engine } from './core/Engine.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { ProgressSystem } from './systems/ProgressSystem.js';
import { AudioSystem } from './systems/AudioSystem.js';
import { AppUI } from './ui/AppUI.js';
import { EquipmentPanel } from './ui/EquipmentPanel.js';
import { bindTouchControls } from './ui/TouchControls.js';
import { loadJSON } from './systems/DataLoader.js';
import { VehicleStation } from './objects/VehicleStation.js';
import { AssemblySession } from './systems/AssemblySession.js';

let config, equipment, activities, assemblyDefinition;

const ui = new AppUI(document.querySelector('#app'));
const progress = new ProgressSystem();
const audio = new AudioSystem();
let engine, interaction, panel, assembly, state = 'loading', mode = 'free', returnState = 'home', guideStep = 0;
let resetTouch = () => {};
const modeNames = { free: 'EXPLORAÇÃO LIVRE', guided: 'VISITA GUIADA', mission: 'MISSÃO · CONHECER A BANCADA' };

function refreshProgress() {
  ui.updateProgress(progress);
  if (!progress.available) ui.toast('Armazenamento local indisponível. O progresso será mantido apenas nesta sessão.');
  updateObjective();
}
function updateObjective() {
  const objective = ui.$('objective');
  ui.$('mode-label').textContent = modeNames[mode];
  objective.classList.toggle('hidden', mode === 'free');
  const visited = progress.data.visited.includes('bancada-demo');
  const done = Boolean(progress.data.completed['preparar-bancada']);
  if (mode === 'guided') objective.textContent = guideStep === 0 ? '01 / 03 · Caminhe até a bancada com morsa no setor de motores, à frente e à direita.' : guideStep === 1 ? '02 / 03 · Conheça os componentes e os cuidados. Abra a aba Atividade.' : '03 / 03 · Visita concluída. Continue explorando ou repita a atividade.';
  if (mode === 'mission') objective.textContent = `Conhecer o posto · ${Number(visited) + Number(done)}/2\n${!visited ? 'Encontre e abra o painel da bancada didática.' : !done ? 'Conclua as duas perguntas da aba Atividade.' : 'Missão concluída. Consulte seu resultado no painel.'}`;
}
function setState(next) {
  state = next;
  ui.show('home', next === 'home'); ui.show('hud', next === 'playing');
  document.body.classList.toggle('at-home', next === 'home');
  if (next !== 'playing') { engine?.controls.stop(); resetTouch(); ui.show('interact', false); }
}
function home() {
  panel?.close(); ui.closeModal(); setState('home');
  const view = config.reconstruction.comparisonViews[0];
  engine.camera.position.fromArray(view.position);
  engine.camera.lookAt(...view.target);
  refreshProgress(); ui.$('enter').focus();
}
function enter(selectedMode = mode) {
  mode = selectedMode; guideStep = 0;
  panel.close(); ui.closeModal(); engine.controls.reset();
  ui.$('objective').textContent = ''; updateObjective();
  setState('playing'); engine.controls.start();
}
function resume() {
  ui.closeModal(); panel.close(); setState('playing'); engine.controls.start();
}
function pause(message) {
  if (!engine || state !== 'playing') return;
  setState('paused'); showPause(message);
}
function showPause(message) {
  ui.modal('Uma pausa na oficina', `<p>${message || 'Seu ponto no ambiente foi mantido.'}</p><div class="button-stack"><button id="resume" class="primary">Retomar exploração →</button><button id="pause-settings">Configurações</button><button id="reset-position">Voltar ao ponto inicial</button><button id="back-home">Tela inicial</button></div>`);
  ui.bind('resume', resume); ui.bind('pause-settings', () => showSettings('paused'));
  ui.bind('reset-position', () => { engine.controls.reset(); resume(); }); ui.bind('back-home', home);
}
function showHelp(origin = state) {
  if (origin === 'playing') setState('paused');
  returnState = origin === 'home' ? 'home' : 'paused'; state = 'help';
  ui.modal('Como explorar', `<p>Conheça o espaço e aproxime-se da bancada didática à esquerda da entrada. Olhe para ela até aparecer a indicação de interação.</p><dl class="controls-list"><div><dt>W A S D / setas</dt><dd>Caminhar</dd></div><div><dt>Mouse</dt><dd>Olhar ao redor</dd></div><div><dt>E</dt><dd>Conhecer o equipamento em foco</dd></div><div><dt>Shift</dt><dd>Caminhar um pouco mais rápido</dd></div><div><dt>ESC</dt><dd>Pausar e liberar o cursor</dd></div></dl><p class="note">No celular: joystick à esquerda, arraste à direita para olhar e toque na indicação do equipamento para interagir. Use o botão Ⅱ para pausar.</p><button id="help-close" class="primary">Entendi</button>`);
  ui.bind('help-close', () => { state = returnState; if (state === 'home') home(); else showPause(); });
}
function showSettings(origin = state) {
  returnState = origin === 'home' ? 'home' : 'paused'; state = 'settings';
  const s = progress.data.settings;
  ui.modal('Sua experiência', `<div class="setting-row"><label for="quality">Qualidade gráfica<small>Sombras e resolução de renderização</small></label><select id="quality"><option value="low">Baixa · sem sombras</option><option value="medium">Média · equilibrada</option><option value="high">Alta · mais detalhes</option></select></div><div class="setting-row"><label for="sensitivity">Sensibilidade do olhar</label><input id="sensitivity" type="range" min="0.4" max="2" step="0.1" value="${s.sensitivity}"></div><div class="setting-row"><label for="audio">Feedback sonoro<small>Discreto e opcional</small></label><input id="audio" type="checkbox" ${s.audio ? 'checked' : ''}></div><div class="button-stack"><button id="save-settings" class="primary">Aplicar configurações</button><button id="reset-progress">Reiniciar progresso educativo</button><button id="settings-close">Voltar</button></div><p class="muted">O progresso é local a este navegador. Nenhum dado de aluno é solicitado.</p>`);
  ui.$('quality').value = s.quality;
  ui.bind('save-settings', () => {
    progress.settings({ quality: ui.$('quality').value, sensitivity: Number(ui.$('sensitivity').value), audio: ui.$('audio').checked });
    engine.applySettings(progress.data.settings); audio.enabled = progress.data.settings.audio; audio.play();
    ui.toast('Configurações aplicadas.'); refreshProgress();
  });
  ui.bind('reset-progress', () => {
    ui.modal('Reiniciar progresso?', '<p>As visitas e os resultados salvos neste navegador serão apagados. As configurações gráficas serão mantidas.</p><div class="button-stack"><button id="confirm-reset" class="primary">Reiniciar progresso</button><button id="cancel-reset">Cancelar</button></div>');
    ui.bind('confirm-reset', () => { progress.reset(); guideStep = 0; refreshProgress(); showSettings(returnState); });
    ui.bind('cancel-reset', () => showSettings(returnState));
  });
  ui.bind('settings-close', () => { state = returnState; if (state === 'home') home(); else showPause(); });
}
function showActivities() {
  state = 'activities';
  ui.modal('Escolha seu percurso', `<p>Escolha uma prática para começar.</p><div class="mode-cards"><button id="start-practice"><span>OFICINA PRÁTICA · 4 SERVIÇOS</span><strong>Mexer no carro</strong><small>Monte a roda, troque o filtro, teste a bateria e acenda as luzes.</small></button><button data-mode="free"><span>EXPLORAÇÃO LIVRE</span><strong>Conheça no seu ritmo</strong><small>Caminhe até o veículo à direita ou conheça a bancada à esquerda.</small></button><button data-mode="guided"><span>VISITA GUIADA</span><strong>Fundamentos da bancada</strong><small>Siga três etapas: encontre, conheça e responda.</small></button><button data-mode="mission"><span>MISSÃO EDUCATIVA</span><strong>Conhecer o posto</strong><small>Encontre a bancada e conclua uma atividade de duas questões.</small></button></div><button id="activities-close">Voltar</button>`);
  ui.$('modal').querySelectorAll('[data-mode]').forEach(b => b.onclick = () => enter(b.dataset.mode));
  ui.bind('activities-close', home);
  ui.bind('start-practice', startAssembly);
}
function startAssembly() {
  if (state === 'assembly') return;
  if (state === 'home' || state === 'activities') engine.controls.reset();
  panel.close(); ui.closeModal(); setState('assembly'); assembly.open();
}
function openEquipment() {
  if (state !== 'playing' || !interaction.current) return;
  const item = interaction.current;
  if (item.data.type === 'assembly') { startAssembly(); return; }
  setState('panel'); engine.focus(item); item.setHighlight(true);
  panel.open(item, activities.find(a => a.id === item.data.activityId));
  guideStep = Math.max(guideStep, 1); refreshProgress(); audio.play();
}

async function boot() {
  try {
    [config, equipment, activities, assemblyDefinition] = await Promise.all([
      loadJSON(`${import.meta.env.BASE_URL}data/workshop.json`),
      loadJSON(`${import.meta.env.BASE_URL}data/equipment.json`),
      loadJSON(`${import.meta.env.BASE_URL}data/activities.json`),
      loadJSON(`${import.meta.env.BASE_URL}data/assembly.json`),
    ]);
    engine = new Engine(ui.$('viewport'), config, progress.data.settings, pause);
    audio.enabled = progress.data.settings.audio;
    resetTouch = bindTouchControls(ui, engine.controls);
    interaction = new InteractionSystem(engine);
    panel = new EquipmentPanel(ui, progress, audio, () => { panel.close(); setState('paused'); showPause(); }, () => { guideStep = 2; refreshProgress(); });
    for (const data of equipment) await engine.registry.register(data, message => ui.toast(message));
    engine.registry.attach(new VehicleStation(engine.world.vehicle));
    assembly = new AssemblySession(engine, ui, assemblyDefinition, progress, audio, () => {
      setState('paused'); refreshProgress(); showPause('Prática encerrada. Você pode retomar a exploração ou voltar ao menu.');
    });
    ui.bind('enter', () => enter('free')); ui.bind('how', () => showHelp('home'));
    ui.bind('activities', showActivities); ui.bind('settings', () => showSettings('home'));
    ui.bind('practice', startAssembly);
    ui.bind('pause', () => pause()); ui.bind('help', () => showHelp('playing')); ui.bind('interact', openEquipment);
    ui.bind('fullscreen', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else ui.toast('Tela cheia não está disponível neste navegador.');
      } catch { ui.toast('O navegador não permitiu ativar tela cheia.'); }
    });
    document.addEventListener('keydown', e => {
      if (e.code === 'KeyE' && !e.repeat && state === 'playing') openEquipment();
      if (e.code === 'Escape') {
        if (state === 'playing') pause();
        else if (state === 'panel') { panel.close(); setState('paused'); showPause(); }
        else if (['settings', 'help'].includes(state)) { state = returnState; state === 'home' ? home() : showPause(); }
        else if (state === 'activities') home();
      }
    });
    engine.start(dt => {
      assembly.update(dt);
      const target = interaction.update(state === 'playing');
      ui.show('interact', Boolean(target) && state === 'playing');
      if (target) ui.$('target-name').textContent = target.data.name;
    });
    ui.show('loading', false); home();
    window.addEventListener('pagehide', () => { assembly.dispose(); engine.dispose(); audio.dispose(); });
    window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
  } catch (error) {
    console.error('Falha ao iniciar a oficina:', error);
    engine?.dispose();
    ui.error('Verifique se o navegador oferece WebGL 2 e aceleração gráfica. Se já estiverem ativos, recarregue a página. Detalhes técnicos no console.');
  }
}
boot();
