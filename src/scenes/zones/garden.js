// Le jardin nocturne. Énigme : le carillon — écouter la berceuse de la boîte à musique, puis rejouer les cinq notes.
// Les cloches se distinguent par leur forme, leur nombre de points et leur son (pas seulement par la couleur).
import { BaseScene } from '../base.js';
import { C, W, H, R, disc, ellipse, line, text3x5, rgba, dither } from '../../art/pixel.js';
import { glow } from '../../art/roomBase.js';
import { starsBg, moonDisc, drawSymbol } from './common.js';
import { rng } from '../../core/util.js';

const BELLS = [
  { x: 112, col: C.pink, hi: C.moon, dots: 1, name: 'Cloche à un point' },
  { x: 146, col: C.cyan, hi: C.cyanL, dots: 2, name: 'Cloche à deux points' },
  { x: 180, col: C.gold, hi: C.goldL, dots: 3, name: 'Cloche à trois points' },
  { x: 214, col: C.lav, hi: C.lav3, dots: 4, name: 'Cloche à quatre points' },
];

export class Garden extends BaseScene {
  constructor(game) {
    super(game, 'garden');
    this.input = []; this.playing = null; this.glowT = [0, 0, 0, 0]; this.swing = [0, 0, 0, 0];
    this.errT = 0;
  }

  _sequence() {
    const s = this.g.state;
    if (!s.chime || s.chime.length !== 5) {
      const r = rng((s.createdAt % 100000) + 17);
      const seq = [];
      while (seq.length < 5) { const n = r.int(4); if (seq.length && seq[seq.length - 1] === n) continue; seq.push(n); }
      s.chime = seq; this.g.requestChange();
    }
    return s.chime;
  }

  enter() {
    const g = this.g;
    g.progress.discoverZone('garden');
    g.audio.setZoneTrack('jardin'); g.audio.setAmbient({ wind: 0.45, crickets: 0.9 });
    this.input = []; this.playing = null; this._sequence();
  }

  update(dt) {
    super.update(dt);
    for (let i = 0; i < 4; i++) { this.glowT[i] = Math.max(0, this.glowT[i] - dt); this.swing[i] *= Math.pow(0.35, dt); }
    if (this.errT > 0) this.errT -= dt;
    if (this.playing) {
      this.playing.t += dt;
      const step = Math.floor(this.playing.t / 0.62);
      if (step !== this.playing.last && step < this.playing.seq.length) { this.playing.last = step; this._ring(this.playing.seq[step], 0.8); }
      if (step >= this.playing.seq.length + 1) this.playing = null;
    }
  }

  _ring(i, vel = 1) { this.glowT[i] = 0.7; this.swing[i] = 1 * vel; this.g.audio.bell(i, vel); }

  draw(g, t) {
    const G = this.g, s = G.state, solved = s.puzzles.includes('garden');
    // ciel
    for (let y = 0; y < 130; y += 2) { const k = y / 130; R(g, k < 0.4 ? C.abyss : k < 0.7 ? C.night : C.n3, 0, y, W, 2); }
    dither(g, C.night, 0, 52, W, 2); dither(g, C.n3, 0, 90, W, 2);
    starsBg(g, t, 70, 5, 100);
    moonDisc(g, 66, 38, 22, 0.35 + (s.memories.length / 11) * 0.65, s.memories.length < 3);
    glow(g, 66, 38, 50, '#B9A0FF', 0.08);
    // château lointain
    R(g, '#0c0a18', 250, 92, 40, 38); R(g, '#0c0a18', 244, 76, 8, 54); R(g, '#0c0a18', 288, 70, 8, 60); R(g, '#0c0a18', 262, 82, 10, 10);
    for (const x of [250, 258, 266, 274, 282]) R(g, '#0c0a18', x, 89, 4, 3);
    R(g, C.gold, 246, 90, 1, 2); R(g, C.cyan, 291, 84, 1, 2); R(g, C.gold, 270, 100, 2, 2);
    // collines
    for (let x = 0; x < W; x += 2) { const y = 120 + Math.round(Math.sin(x * 0.04) * 4 + Math.sin(x * 0.11) * 2); R(g, '#0e0b1c', x, y, 2, 40); }
    // balustrade + terrasse
    R(g, '#2a2040', 0, 128, W, 4); R(g, '#3d3257', 0, 128, W, 1);
    for (let x = 6; x < W; x += 20) { R(g, '#2a2040', x, 132, 8, 22); R(g, '#3d3257', x, 132, 1, 22); R(g, '#1a1430', x + 7, 132, 1, 22); R(g, '#3d3257', x - 1, 130, 10, 2); }
    R(g, '#1a1430', 0, 152, W, 3);
    for (let row = 0; row < 5; row++) { const y = 155 + row * 5 + row; for (let x = -((row * 17) % 22); x < W; x += 22) { R(g, (x / 22 + row) & 1 ? '#2d2447' : '#251d3c', x, y, 21, 5 + row); } R(g, '#171126', 0, y, W, 1); }
    // fleurs lumineuses entre les piliers
    for (let i = 0; i < 12; i++) {
      const x = 14 + i * 26, y = 150, col = [C.cyan, C.pink, C.lav][i % 3];
      R(g, C.greenD, x, y - 8, 1, 8); R(g, C.green, x + 1, y - 6, 1, 6); R(g, col, x - 1, y - 11, 3, 3); if (Math.sin(t * 1.3 + i) > 0.2) R(g, C.white, x, y - 11, 1, 1);
    }
    // arche en fer forgé + cloches
    R(g, '#0c0a18', 96, 14, 140, 3);
    for (let x = 96; x < 236; x += 4) R(g, '#0c0a18', x, 17 + Math.round(Math.sin(x * 0.3) * 1), 2, 2);
    R(g, '#0c0a18', 96, 14, 3, 54); R(g, '#0c0a18', 233, 14, 3, 54);
    for (let i = 0; i < 4; i++) this._drawBell(g, i, t);
    // table + boîte à musique
    const tb = this._tableRect();
    R(g, C.woodD, tb.x + 4, tb.y + 14, 3, 16); R(g, C.woodD, tb.x + 25, tb.y + 14, 3, 16); R(g, C.woodL, tb.x, tb.y + 10, 32, 4); R(g, C.woodH, tb.x, tb.y + 10, 32, 1);
    R(g, C.woodL, tb.x + 6, tb.y + 2, 18, 8); R(g, C.woodH, tb.x + 6, tb.y + 2, 18, 1); R(g, C.wood, tb.x + 5, tb.y, 20, 3); R(g, C.gold, tb.x + 13, tb.y + 5, 3, 2);
    if (this.playing && Math.floor(t * 8) % 2) R(g, C.cyanL, tb.x + 26, tb.y - 4, 2, 2);
    drawSymbol(g, 'star', tb.x + 12, tb.y - 12 + Math.round(Math.sin(t * 2) * 1), solved ? C.goldL : C.p3);
    // porte de retour
    const dr = this._exitRect(); R(g, '#0c0a18', dr.x - 2, dr.y - 2, dr.w + 4, dr.h + 2); R(g, C.woodL, dr.x, dr.y, dr.w, dr.h); R(g, C.wood, dr.x + 2, dr.y + 2, dr.w - 4, dr.h - 2); R(g, C.gold, dr.x + dr.w - 5, dr.y + dr.h / 2, 2, 2);
    // lanterne
    glow(g, 40, 112, 30, '#FFBE62', 0.12);
    R(g, C.woodD, 39, 96, 2, 14); R(g, C.pinkD, 35, 108, 10, 12); R(g, C.pink, 36, 109, 8, 9); R(g, C.gold, 38, 111, 4, 4);
    if (this.errT > 0) { g.fillStyle = `rgba(8,7,16,${this.errT * 0.35})`; g.fillRect(0, 0, W, H); }
    // progression de la séquence saisie
    const seq = this._sequence();
    for (let i = 0; i < seq.length; i++) R(g, i < this.input.length ? C.gold : C.p2, 130 + i * 10, 74, 6, 6);
    // lucioles
    for (let i = 0; i < 9; i++) { const x = (i * 37 + Math.sin(t * 0.6 + i) * 14 + W) % W, y = 80 + ((i * 23) % 60) + Math.sin(t * 0.9 + i * 2) * 6; if (Math.sin(t * 2 + i * 3) > 0) { R(g, C.goldL, x, y, 1, 1); R(g, 'rgba(255,190,98,0.3)', x - 1, y, 3, 1); } }
    g.fillStyle = 'rgba(8,7,16,0.18)'; g.fillRect(0, 0, W, 3); g.fillRect(0, H - 3, W, 3);
  }

  _drawBell(g, i, t) {
    const b = BELLS[i], sw = Math.round(Math.sin(t * 6 + i) * this.swing[i] * 3);
    const x = b.x + sw, y = 74;
    R(g, '#0c0a18', b.x, 17, 1, y - 17 - 14);
    const lit = this.glowT[i] > 0;
    if (lit) glow(g, x, y + 4, 34, b.col, 0.3 * (this.glowT[i] / 0.7));
    // corps de cloche (silhouette distincte par cloche)
    const w = 8 + i;
    R(g, lit ? b.hi : b.col, x - w / 2 + 1, y - 10, w - 2, 3);
    R(g, b.col, x - w / 2, y - 7, w, 7); R(g, b.col, x - w / 2 - 1, y - 1, w + 2, 3); R(g, b.hi, x - w / 2, y - 7, 2, 7);
    R(g, C.abyss, x - w / 2 - 1, y + 2, w + 2, 1); R(g, C.goldD, x - 1, y + 3, 2, 2);
    for (let d = 0; d < b.dots; d++) R(g, C.abyss, x - b.dots + d * 2 + 1, y - 4, 1, 1);
    text3x5(g, C.p3, String(i + 1), x - 1, y + 8);
  }

  _tableRect() { return { x: 40, y: 134, w: 32, h: 32 }; }
  _exitRect() { return { x: 8, y: 98, w: 24, h: 30 }; }

  hotspots() {
    const g = this.g, h = [];
    BELLS.forEach((b, i) => h.push({ id: 'bell' + i, label: b.name, rect: { x: b.x - 9, y: 60, w: 18, h: 28 }, z: 50, actions: [{ label: 'Faire sonner', run: () => this._press(i) }, { label: 'Examiner', run: () => this.say(`${b.name}. Elle a la même note, chaque fois, comme une promesse.`) }] }));
    const tb = this._tableRect();
    h.push({ id: 'musicbox', label: 'Boîte à musique', rect: { x: tb.x + 2, y: tb.y - 4, w: 28, h: 16 }, z: 60, actions: [{ label: 'Écouter la berceuse', run: () => this._listen() }, { label: 'Examiner', run: () => this.say(g.state.puzzles.includes('garden') ? 'La boîte est ouverte et vide. Elle garde la berceuse, pas les objets.' : 'Une petite boîte à musique en bois. Quand tu tournes la clé, elle joue cinq notes, toujours les mêmes. Il suffit de les écouter.') }] });
    const dr = this._exitRect();
    h.push({ id: 'exit', label: 'Porte du couloir', rect: dr, z: 40, actions: [{ label: 'Retourner au couloir', run: () => { g.audio.sfx('door'); g.goto('hallway', { spawn: 'garden' }); } }] });
    h.push({ id: 'flowers', label: 'Fleurs', rect: { x: 8, y: 136, w: 304, h: 18 }, z: 5, actions: [{ label: 'Examiner', run: () => this.say('Des fleurs qui brillent à peine : lavande, rose, cyan. Elles ne penchent que vers toi.') }] });
    h.push({ id: 'moon', label: 'Lune', rect: { x: 40, y: 14, w: 52, h: 48 }, z: 3, actions: [{ label: 'Examiner', run: () => this.say(g.state.memories.length < 3 ? 'La lune est fêlée, comme une assiette qu\'on a gardée quand même.' : g.state.memories.length < 8 ? 'La lune se complète à mesure que tu te souviens.' : 'La lune est presque entière.') }] });
    h.push({ id: 'lantern', label: 'Lanterne', rect: { x: 30, y: 94, w: 20, h: 28 }, z: 8, actions: [{ label: 'Examiner', run: () => this.say('Une lanterne rose. La flamme n\'a besoin de rien.') }] });
    return h;
  }

  _listen() {
    const g = this.g, seq = this._sequence();
    this.playing = { seq, t: 0, last: -1 };
    this.input = [];
    g.audio.sfx('tick');
  }

  async _press(i) {
    const g = this.g, seq = this._sequence();
    this._ring(i);
    if (g.state.puzzles.includes('garden')) return;
    if (this.playing) return;
    const want = seq[this.input.length];
    if (i === want) {
      this.input.push(i);
      if (this.input.length === seq.length) {
        this.input = [];
        g.audio.sfx('solve');
        await this.say('Les cinq notes se répondent. La boîte à musique s\'ouvre dans un souffle, et laisse tomber une aiguille d\'horloge et un éclat de lune étoilé.');
        g.progress.solvePuzzle('garden');
        await this.say('Tu te souviens : il aimait le balcon la nuit. Il regardait bouger les carillons sans jamais les toucher.');
      }
    } else {
      this.input = []; this.errT = 0.5;
      g.audio.sfx('error');
      if (!g.flag('chime_hint')) { g.setFlag('chime_hint', true); this.say('Ce n\'est pas la bonne cloche. La boîte à musique, sur la table, connaît l\'ordre : il suffit de l\'écouter.'); }
    }
  }
}
