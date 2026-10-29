import { Engine } from './core/Engine.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadJSON } from './systems/DataLoader.js';

const $ = id => document.getElementById(id);
let engine, orbit, config, current;
function download(blob, name) {
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function selectView() {
  current = config.reconstruction.comparisonViews.find(v => v.id === $('view').value);
  engine.camera.position.fromArray(current.position); orbit.target.fromArray(current.target); engine.camera.fov = current.fov; engine.camera.updateProjectionMatrix(); orbit.update();
  $('fov').value = current.fov; $('fov-value').textContent = `${current.fov}°`; $('reference').src = `${import.meta.env.BASE_URL}referencias/${encodeURIComponent(current.photo)}`; $('overlay').src = $('reference').src;
  $('photo-name').textContent = current.photo; $('landmarks').replaceChildren();
  for (const text of current.landmarks) { const li = document.createElement('li'); li.textContent = text; $('landmarks').append(li); }
  $('notes').value = '';
  $('status').textContent = `Pose “${current.id}” carregada. Ainda precisa de comparação humana e ajuste da perspectiva.`;
}
async function boot() {
  try {
    config = await loadJSON(`${import.meta.env.BASE_URL}data/workshop.json`);
    engine = new Engine($('viewport'), config, { quality: 'high', sensitivity: 1 }, () => {});
    const equipment = await loadJSON(`${import.meta.env.BASE_URL}data/equipment.json`);
    for (const data of equipment) await engine.registry.register(data, message => { $('status').textContent = message; });
    orbit = new OrbitControls(engine.camera, engine.renderer.domElement); orbit.enableDamping = true; orbit.maxDistance = 35; orbit.minDistance = 0.5;
    for (const view of config.reconstruction.comparisonViews) { const o = document.createElement('option'); o.value = view.id; o.textContent = `${view.id} · ${view.photo}`; $('view').append(o); }
    $('view').onchange = selectView; $('restore').onclick = selectView;
    $('fov').oninput = () => { engine.camera.fov = Number($('fov').value); engine.camera.updateProjectionMatrix(); $('fov-value').textContent = `${engine.camera.fov}°`; };
    $('opacity').oninput = () => { $('overlay').style.opacity = $('opacity').value; };
    $('pose').onclick = () => {
      const data = { reference: current.photo, position: engine.camera.position.toArray(), target: orbit.target.toArray(), fov: engine.camera.fov, notes: $('notes').value, createdAt: new Date().toISOString() };
      download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `pose-${current.id}.json`);
    };
    $('capture').onclick = async () => {
      try {
        await $('reference').decode();
        engine.renderer.render(engine.scene, engine.camera);
        const screenshot = new Image(); screenshot.src = engine.renderer.domElement.toDataURL('image/png'); await screenshot.decode();
        const canvas = document.createElement('canvas'); canvas.width = 1440; canvas.height = 1080; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#16212b'; ctx.fillRect(0, 0, 1440, 1080);
        ctx.fillStyle = '#e5ebec'; ctx.font = '20px Arial'; ctx.fillText(`Referência: ${current.photo}`, 30, 35); ctx.fillText(`Reconstrução 3D · ${current.id}`, 750, 35);
        function contain(img, x) { const scale = Math.min(660 / img.width, 880 / img.height); const w = img.width * scale, h = img.height * scale; ctx.drawImage(img, x + (660 - w) / 2, 65 + (880 - h) / 2, w, h); }
        contain($('reference'), 30); contain(screenshot, 750);
        ctx.font = '15px Arial'; ctx.fillText('Câmera aproximada · medidas não aferidas · registro manual de revisão', 30, 985);
        const note = $('notes').value.slice(0, 160); if (note) ctx.fillText(note, 30, 1025, 1360);
        canvas.toBlob(blob => { if (blob) download(blob, `comparacao-${current.id}.png`); });
        $('status').textContent = `Comparação exportada. Objetos visíveis: ${engine.renderer.info.render.calls} chamadas de desenho; ${engine.renderer.info.render.triangles} triângulos no último frame.`;
      } catch (error) { console.error(error); $('status').textContent = 'Não foi possível exportar. Verifique o carregamento da referência e tente novamente.'; }
    };
    selectView(); engine.start(() => orbit.update());
    window.addEventListener('pagehide', () => { orbit.dispose(); engine.dispose(); });
  } catch (error) {
    orbit?.dispose(); engine?.dispose();
    console.error(error); $('status').textContent = `Falha ao preparar a comparação: ${error.message}`;
  }
}
boot();
