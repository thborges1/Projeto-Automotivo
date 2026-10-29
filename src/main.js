import { createGame } from './core/Game.js';

const game = createGame(document.querySelector('#app'));
// A page restored from the back-forward cache needs a fresh WebGL scene.
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
game.start();
