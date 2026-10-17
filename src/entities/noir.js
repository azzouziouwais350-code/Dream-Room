// NOIR : comportement autonome (déplacements A* autour des obstacles, sauts vers les lieux confortables,
// sommeil, toilette, étirements, jeu, repas, réactions). Aucune dépendance obligatoire pour finir le jeu.
import { drawCat, drawCatShadow } from '../art/cat.js';
import { FLOOR_BAND } from '../data/items.js';
import { clamp, rng } from '../core/util.js';

const CELL = 4;
const COLS = 80;
const ROWS = Math.ceil((FLOOR_BAND.bottom - FLOOR_BAND.top) / CELL) + 1;

export function buildGrid(rects) {
  const blocked = new Uint8Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = c * CELL + CELL / 2, y = FLOOR_BAND.top + r * CELL + CELL / 2;
    for (const k of rects) if (x >= k.x - 5 && x <= k.x + k.w + 5 && y >= k.y - 2 && y <= k.y + k.h + 2) { blocked[r * COLS + c] = 1; break; }
  }
  return blocked;
}
const cellOf = (x, y) => ({ c: clamp(Math.floor(x / CELL), 0, COLS - 1), r: clamp(Math.floor((y - FLOOR_BAND.top) / CELL), 0, ROWS - 1) });
const pointOf = (c, r) => ({ x: c * CELL + CELL / 2, y: FLOOR_BAND.top + r * CELL + CELL / 2 });

function nearestFree(blocked, c0, r0) {
  if (!blocked[r0 * COLS + c0]) return { c: c0, r: r0 };
  for (let d = 1; d < 40; d++) for (let dr = -d; dr <= d; dr++) for (let dc = -d; dc <= d; dc++) {
    if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue;
    const c = c0 + dc, r = r0 + dr;
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
    if (!blocked[r * COLS + c]) return { c, r };
  }
  return { c: c0, r: r0 };
}

/** A* 8 directions sur la grille du sol. Renvoie une liste de points ou null. */
export function findPath(blocked, from, to) {
  const s0 = cellOf(from.x, from.y), g0 = cellOf(to.x, to.y);
  const s = nearestFree(blocked, s0.c, s0.r), g = nearestFree(blocked, g0.c, g0.r);
  const key = (c, r) => r * COLS + c;
  const open = [key(s.c, s.r)];
  const came = new Map(); const gs = new Map([[open[0], 0]]); const fs = new Map();
  const h = (c, r) => Math.hypot(c - g.c, r - g.r);
  fs.set(open[0], h(s.c, s.r));
  const closed = new Set();
  let guard = 0;
  while (open.length && guard++ < 4000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (fs.get(open[i]) < fs.get(open[bi])) bi = i;
    const cur = open.splice(bi, 1)[0];
    const cc = cur % COLS, cr = Math.floor(cur / COLS);
    if (cc === g.c && cr === g.r) {
      const pts = []; let k = cur;
      while (k !== undefined) { pts.push(pointOf(k % COLS, Math.floor(k / COLS))); k = came.get(k); }
      pts.reverse();
      // lissage : retire les points colinéaires
      const out = [pts[0]];
      for (let i = 1; i < pts.length - 1; i++) {
        const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
        if ((b.x - a.x) * (c.y - b.y) !== (b.y - a.y) * (c.x - b.x)) out.push(b);
      }
      out.push(pts[pts.length - 1]);
      return out;
    }
    closed.add(cur);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nc = cc + dc, nr = cr + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const nk = key(nc, nr);
      if (blocked[nk] || closed.has(nk)) continue;
      if (dc && dr && (blocked[key(cc + dc, cr)] || blocked[key(cc, cr + dr)])) continue; // pas de coupe-coin
      const ng = gs.get(cur) + (dc && dr ? 1.41 : 1);
      if (ng < (gs.get(nk) ?? Infinity)) { came.set(nk, cur); gs.set(nk, ng); fs.set(nk, ng + h(nc, nr)); if (!open.includes(nk)) open.push(nk); }
    }
  }
  return null;
}

export class Noir {
  constructor() {
    this.x = 92; this.y = 129; this.z = 153.5; this.dir = 1;
    this.mode = 'sleep'; this.timer = 20; this.plan = []; this.path = null; this.spot = 'bed_blanket';
    this.ph = 0; this.blinkT = 2; this.blink = 0; this.turnT = 0; this.pendingDir = null;
    this.hop = null; this.look = { x: 0, y: 0 }; this.stareTarget = null; this.sleepStart = 0; this.t = 0;
    this.pounces = 0; this.toy = null; this.bowl = null; this.hearts = 0; this.rand = rng((Date.now() & 0xffff) + 1);
    this.stretchK = 0; this.queue = []; this.onSleptLongEnough = null;
  }

  get sleeping() { return this.mode === 'sleep'; }
  get busy() { return ['pet', 'eat', 'play'].includes(this.mode); }

  rect() {
    const h = this.mode === 'sleep' || this.mode === 'loaf' ? 12 : 24;
    return { x: this.x - 14, y: this.y - h, w: 28, h: h + 2 };
  }

  setPose(spot) {
    this.spot = spot.id; this.x = spot.x; this.y = spot.y; this.z = spot.z;
  }

  // -------------------------------------------------------------- planification
  _floorPathTo(env, tx, ty) {
    const path = findPath(env.grid(), { x: this.x, y: this.y }, { x: tx, y: ty });
    return path;
  }

  _spotById(env, id) { return env.spots().find((s) => s.id === id) || null; }

  /** Construit un plan vers un lieu (sol ou surélevé). */
  goToSpot(env, spot, { run = false, then = null } = {}) {
    const plan = [];
    const cur = this.spot ? this._spotById(env, this.spot) : null;
    let from = { x: this.x, y: this.y };
    if (cur && !cur.floor) { // descendre d'abord
      const via = cur.via ? this._spotById(env, cur.via) : null;
      if (via) plan.push({ t: 'hop', to: via, down: true });
      const land = (via || cur).landing || (via || cur).approach;
      plan.push({ t: 'hop', to: { x: land.x, y: land.y, z: land.y, floor: true }, down: true });
      from = { x: land.x, y: land.y };
    }
    if (spot.floor) {
      plan.push({ t: 'walk', to: { x: spot.x, y: spot.y }, run, from });
    } else {
      plan.push({ t: 'walk', to: spot.approach, run, from });
      if (spot.via) {
        const via = this._spotById(env, spot.via);
        if (via) plan.push({ t: 'hop', to: via });
      }
      plan.push({ t: 'hop', to: spot });
    }
    if (then) plan.push(then);
    this.plan = plan; this.mode = 'idle'; this.timer = 0; this._advance(env);
  }

  _advance(env) {
    const step = this.plan.shift();
    if (!step) { this.mode = 'idle'; this.timer = 1.5 + this.rand() * 3; this.path = null; return; }
    if (step.t === 'walk') {
      const start = step.from || { x: this.x, y: this.y };
      this.x = this.spot && !this.onFloor() ? this.x : this.x;
      const path = findPath(env.grid(), start, step.to);
      if (!path || path.length < 1) { this.plan = []; this.mode = 'idle'; this.timer = 1; return; }
      this.path = path; this.pi = 0; this.run = !!step.run; this.mode = this.run ? 'run' : 'walk';
    } else if (step.t === 'hop') {
      this._startHop(step.to);
    } else if (step.t === 'do') {
      this._startDo(step);
    } else if (step.t === 'call') {
      step.fn(); this._advance(env);
    }
  }

  onFloor() { return !this.spot || this.spot === 'floor'; }

  _startHop(to) {
    this.mode = 'hop'; this.hopT = 0; this.hopCrouch = 0.18; this.hopDur = 0.5;
    this.hop = { x0: this.x, y0: this.y, x1: to.x, y1: to.y, z1: to.z ?? to.y, id: to.floor ? 'floor' : to.id, h: Math.max(10, Math.abs(to.y - this.y) + 8) };
    if (to.x !== this.x) this.dir = to.x > this.x ? 1 : -1;
  }

  _startDo(step) {
    this.mode = step.mode; this.timer = step.dur; this.pounces = 0;
    if (step.mode === 'sleep') { this.sleepStart = this.t; this.sleepDur = step.dur; }
  }

  think(env) {
    const spots = env.spots();
    const night = env.isNight();
    const opts = [
      ['wander', 3],
      ['cozy', night ? 3.2 : 1.8],
      ['groom', 1.6],
      ['stretch', 0.9],
      ['sleep', night ? 2.2 : 0.7],
      ['stare', env.chapter >= 2 ? 0.45 : 0],
      ['hint', env.hint ? 0.5 : 0],
    ];
    const total = opts.reduce((s, o) => s + o[1], 0);
    let x = this.rand() * total, pick = 'wander';
    for (const [k, w] of opts) { x -= w; if (x <= 0) { pick = k; break; } }
    const onFloor = this.onFloor();
    switch (pick) {
      case 'wander': {
        const floors = spots.filter((s) => s.floor);
        const target = floors.length ? floors[Math.floor(this.rand() * floors.length)] : null;
        const pt = target || { x: 30 + this.rand() * 260, y: FLOOR_BAND.top + 6 + this.rand() * 40, floor: true, id: 'floor' };
        this.goToSpot(env, { ...pt, floor: true, id: 'floor', z: pt.y }, { run: this.rand() < 0.12 });
        break;
      }
      case 'cozy': case 'sleep': {
        const cozy = spots.filter((s) => s.cozy && s.id !== this.spot);
        if (!cozy.length) { this.timer = 2; break; }
        const target = cozy[Math.floor(this.rand() * cozy.length)];
        this.goToSpot(env, target, { then: pick === 'sleep' ? { t: 'do', mode: 'sleep', dur: 25 + this.rand() * 45 } : { t: 'do', mode: 'loaf', dur: 8 + this.rand() * 14 } });
        break;
      }
      case 'groom': this._startDo({ mode: 'groom', dur: 3 + this.rand() * 3 }); break;
      case 'stretch': this._startDo({ mode: 'stretch', dur: 2.4 }); break;
      case 'stare': {
        this.stareTarget = { x: this.x + (this.rand() < 0.5 ? -1 : 1) * (30 + this.rand() * 60), y: this.y - 20 };
        this.dir = this.stareTarget.x > this.x ? 1 : -1;
        this._startDo({ mode: 'stare', dur: 4 + this.rand() * 4 });
        env.emit('noirStare', this);
        break;
      }
      case 'hint': {
        const hnt = env.hint;
        if (hnt && hnt.spot) { this.goToSpot(env, hnt.spot, { then: { t: 'call', fn: () => { this.stareTarget = hnt.target; this.dir = hnt.target.x > this.x ? 1 : -1; } } });
          this.plan.push({ t: 'do', mode: 'stare', dur: 8 }); }
        break;
      }
      default: break;
    }
  }

  // ---------------------------------------------------------------- interactions
  pet(env) {
    if (this.mode === 'hop') return false;
    const wasAsleep = this.mode === 'sleep';
    this.plan = []; this.path = null;
    this.mode = 'pet'; this.timer = 2.6; this.petBounce = 0;
    if (wasAsleep) this.timer = 3;
    return true;
  }

  wake(env, dur = 1.4) {
    if (this.mode !== 'sleep' && this.mode !== 'loaf') return;
    this.mode = 'alert'; this.timer = dur; this.plan = [];
  }

  react(env, target, dur = 5) {
    if (this.busy || this.mode === 'hop') return;
    this.plan = []; this.path = null;
    this.stareTarget = target; this.dir = target.x > this.x ? 1 : -1;
    this.mode = 'stare'; this.timer = dur;
  }

  feed(env, bowlPos) {
    this.bowl = bowlPos;
    this.plan = [];
    this.goToSpot(env, { x: bowlPos.x - 14 * this.dir, y: bowlPos.y, floor: true, id: 'floor', z: bowlPos.y }, { run: false, then: { t: 'do', mode: 'eat', dur: 2.6 } });
  }

  playWith(env, toy) {
    this.toy = toy;
    this.goToSpot(env, { x: toy.x - 16, y: clamp(toy.y, FLOOR_BAND.top + 2, FLOOR_BAND.bottom), floor: true, id: 'floor', z: toy.y }, { run: true, then: { t: 'do', mode: 'play', dur: 5 } });
  }

  // ---------------------------------------------------------------------- boucle
  update(dt, env) {
    this.t += dt;
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.14; this.blinkT = 2 + this.rand() * 4; }
    if (this.blink > 0) this.blink -= dt;
    if (this.turnT > 0) { this.turnT -= dt; if (this.turnT <= 0 && this.pendingDir) { this.dir = this.pendingDir; this.pendingDir = null; } return; }

    switch (this.mode) {
      case 'walk': case 'run': {
        const sp = this.mode === 'run' ? 78 : 30;
        let left = sp * dt;
        while (left > 0 && this.path && this.pi < this.path.length) {
          const p = this.path[this.pi];
          const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
          if (d < 0.5) { this.pi++; continue; }
          const nd = Math.abs(dx) > 0.8 ? (dx > 0 ? 1 : -1) : this.dir;
          if (nd !== this.dir && this.mode === 'walk') { this.pendingDir = nd; this.turnT = 0.14; return; }
          this.dir = nd;
          const m = Math.min(left, d);
          this.x += (dx / d) * m; this.y += (dy / d) * m; left -= m;
          this.ph += m * 0.55;
        }
        this.z = this.y; this.spot = 'floor';
        if (!this.path || this.pi >= this.path.length) { this.path = null; this._advance(env); }
        break;
      }
      case 'hop': {
        this.hopT += dt;
        const h = this.hop;
        if (this.hopT < this.hopCrouch) break;
        const k = clamp((this.hopT - this.hopCrouch) / this.hopDur, 0, 1);
        this.x = h.x0 + (h.x1 - h.x0) * k;
        this.y = h.y0 + (h.y1 - h.y0) * k - Math.sin(k * Math.PI) * h.h;
        this.z = Math.max(h.z1, this.z);
        if (k >= 1) { this.x = h.x1; this.y = h.y1; this.z = h.z1; this.spot = h.id; this.hop = null; this._advance(env); }
        break;
      }
      case 'sleep': case 'loaf': {
        this.timer -= dt;
        if (this.mode === 'sleep' && this.t - this.sleepStart > 6) env.emit('noirSlept', this);
        if (this.timer <= 0) { this.mode = 'idle'; this.timer = 1; }
        break;
      }
      case 'pet': case 'eat': case 'play': case 'groom': case 'stretch': case 'stare': case 'alert': {
        this.timer -= dt;
        if (this.mode === 'play') {
          // trois bonds sur le jouet
          const cycle = 1.3;
          const n = Math.floor((5 - this.timer) / cycle);
          if (n > this.pounces && n <= 3) { this.pounces = n; env.emit('pounce', this); }
        }
        if (this.timer <= 0) {
          const was = this.mode;
          this.mode = 'idle'; this.timer = 1.2 + this.rand() * 2;
          if (was === 'eat') env.emit('ate', this);
          if (was === 'play') env.emit('played', this);
        }
        break;
      }
      default: {
        this.timer -= dt;
        if (this.timer <= 0) this.think(env);
      }
    }
  }

  // ---------------------------------------------------------------------- dessin
  draw(g, t, acc, reduce = false) {
    const m = this.mode;
    let pose = 'sit', extra = {};
    const o = { x: this.x, y: this.y, dir: this.dir, t, ph: this.ph, blink: this.blink > 0, acc };
    if (this.turnT > 0) { o.pose = 'stand'; o.sx = 0.45; }
    else if (m === 'walk') { o.pose = 'walk'; }
    else if (m === 'run') { o.pose = 'run'; }
    else if (m === 'hop') {
      if (this.hopT < this.hopCrouch) o.pose = 'crouch'; else o.pose = 'leap';
    } else if (m === 'sleep' || m === 'loaf') { o.pose = 'loaf'; if (m === 'loaf') o.blink = false; }
    else if (m === 'groom') o.pose = 'groom';
    else if (m === 'stretch') { o.pose = 'stretch'; o.ph = Math.sin((1 - this.timer / 2.4) * Math.PI); }
    else if (m === 'pet') o.pose = 'pet';
    else if (m === 'eat') { o.pose = 'crouch'; o.wag = 0; }
    else if (m === 'play') {
      const c = (5 - this.timer) % 1.3;
      o.pose = c < 0.6 ? 'crouch' : c < 0.95 ? 'leap' : 'sit';
    } else if (m === 'alert') { o.pose = 'alert'; }
    else if (m === 'stare') {
      o.pose = 'sit'; o.eyes = 'open'; o.look = { x: this.stareTarget && this.stareTarget.x > this.x ? 1 : -1, y: -1 };
      o.blink = false;
    } else o.pose = 'sit';
    if (m === 'stretch' && this.timer > 1.7) o.pose = 'stand';
    drawCatShadow(g, this.x - 2 * this.dir, this.y, m === 'sleep' || m === 'loaf' ? 12 : 10);
    drawCat(g, o);
    if (m === 'sleep' && !reduce) {
      const zz = Math.floor(t * 0.8) % 3;
      g.fillStyle = '#B9A0FF';
      for (let i = 0; i <= zz; i++) { const zx = Math.round(this.x + 10 * this.dir + i * 3), zy = Math.round(this.y - 14 - i * 4 - ((t * 6) % 3)); g.fillRect(zx, zy, 3, 1); g.fillRect(zx + 2, zy + 1, 1, 1); g.fillRect(zx + 1, zy + 2, 1, 1); g.fillRect(zx, zy + 3, 3, 1); }
    }
  }
}
