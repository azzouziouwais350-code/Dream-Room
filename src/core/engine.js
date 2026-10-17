// Moteur : boucle requestAnimationFrame (mise à jour logique à pas fixe + rendu), mise à l'échelle entière,
// conversion des coordonnées, transitions de scène en blocs de pixels.
import { W, H } from '../art/pixel.js';
import { clamp } from './util.js';

export class Loop {
  constructor({ update, render, maxFps = 60 }) {
    this.update = update; this.render = render;
    this.step = 1 / 60;
    this.acc = 0; this.last = 0; this.running = false; this.raf = 0;
    this.minFrame = 1000 / maxFps;
    this.lastRender = 0;
    this.time = 0;
    this._tick = this._tick.bind(this);
  }
  setMaxFps(fps) { this.minFrame = 1000 / fps; }
  start() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    this.raf = requestAnimationFrame(this._tick);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  _tick(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this._tick);
    if (now - this.lastRender < this.minFrame - 1) return;
    this.lastRender = now;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25; // onglet resté en arrière-plan : pas de rattrapage massif
    this.acc += dt;
    let n = 0;
    while (this.acc >= this.step && n < 6) { this.update(this.step); this.acc -= this.step; this.time += this.step; n++; }
    if (n === 6) this.acc = 0;
    this.render(this.time);
  }
}

/** Ajuste la taille CSS du canvas : multiple entier du pixel d'appareil, pour des pixels nets et jamais déformés. */
export function fitCanvas(canvas, availW, availH) {
  const dpr = window.devicePixelRatio || 1;
  const maxScale = Math.min((availW * dpr) / W, (availH * dpr) / H);
  const scale = Math.max(1, Math.floor(maxScale));
  canvas.style.width = (W * scale) / dpr + 'px';
  canvas.style.height = (H * scale) / dpr + 'px';
  return scale / dpr;
}

export function toLogical(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H };
}

/** Transition en blocs de pixels (ou fondu simple si mouvements réduits). */
export class Transition {
  constructor() { this.active = false; this.phase = 0; this.t = 0; this.dur = 0.35; this.cb = null; this.reduce = false; this.order = null; }
  start(cb, { reduce = false, dur = 0.34 } = {}) {
    this.active = true; this.phase = 1; this.t = 0; this.cb = cb; this.reduce = reduce; this.dur = dur;
    if (!this.order) {
      this.order = [];
      for (let i = 0; i < 16 * 9; i++) this.order.push(i);
      let s = 12345;
      for (let i = this.order.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [this.order[i], this.order[j]] = [this.order[j], this.order[i]]; }
    }
  }
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    if (this.phase === 1 && this.t >= this.dur) {
      this.phase = 2; this.t = 0;
      if (this.cb) { const cb = this.cb; this.cb = null; cb(); }
    } else if (this.phase === 2 && this.t >= this.dur) { this.active = false; this.phase = 0; }
  }
  draw(g) {
    if (!this.active) return;
    const k = clamp(this.t / this.dur, 0, 1);
    const cover = this.phase === 1 ? k : 1 - k;
    if (this.reduce) { g.fillStyle = `rgba(8,7,16,${cover})`; g.fillRect(0, 0, W, H); return; }
    const n = Math.floor(cover * this.order.length);
    g.fillStyle = '#080710';
    for (let i = 0; i < n; i++) { const idx = this.order[i]; g.fillRect((idx % 16) * 20, Math.floor(idx / 16) * 20, 20, 20); }
    // liseré lavande sur le bord de la vague
    g.fillStyle = '#54406F';
    for (let i = Math.max(0, n - 6); i < Math.min(this.order.length, n + 6); i++) { const idx = this.order[i]; g.fillRect((idx % 16) * 20 + 8, Math.floor(idx / 16) * 20 + 8, 4, 4); }
  }
}
