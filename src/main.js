import '@fontsource/press-start-2p/400.css';
import '@fontsource/vt323/400.css';
import './style.css';
import { Game } from './game.js';

function start() {
  const canvas = document.getElementById('screen');
  const root = document.getElementById('app');
  let backend;
  try { backend = window.localStorage; backend.getItem('x'); } catch (e) { backend = { _m: {}, getItem(k) { return this._m[k] ?? null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } }; }
  const game = new Game({ canvas, root, backend });
  window.__dream = game; // utile au débogage et aux tests de navigateur
  game.boot();
}
start();
