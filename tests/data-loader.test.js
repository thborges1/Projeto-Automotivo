import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJSON } from '../src/systems/DataLoader.js';

test('carrega JSON como dados e propaga falhas HTTP ou conteúdo inválido', async () => {
  assert.deepEqual(await loadJSON('/data.json', async () => new Response('{"width":20}')), { width: 20 });
  await assert.rejects(() => loadJSON('/missing.json', async () => new Response('', { status: 404 })), /404/);
  await assert.rejects(() => loadJSON('/invalid.json', async () => new Response('<html>erro</html>')), SyntaxError);
});
