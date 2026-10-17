// La bibliothèque infinie. Énigme : ranger cinq livres lumineux « dans l'ordre du ciel du soir » (prune, lavande, rose, or).
// Secret : un livre de travers révèle une alcôve.
import { BaseScene } from '../base.js';
import { C, W, H, R, disc, line, text3x5, rgba } from '../../art/pixel.js';
import { glow } from '../../art/roomBase.js';
import { bakeCorridor, wallPatch, wallRect, proj, hex, shade, drawSymbol, K, CX, CY } from './common.js';

// ordre correct = ordre des bandes du coucher de soleil, de haut en bas : prune, lavande, rose, or
const SOLUTION = ['plum', 'lav', 'pink', 'gold'];
const BOOKS = [
  { id: 'gold', color: C.gold, hi: C.goldL, name: 'Livre doré' },
  { id: 'plum', color: C.plum, hi: C.p3, name: 'Livre prune' },
  { id: 'cyan', color: C.cyanD, hi: C.cyan, name: 'Livre cyan' },
  { id: 'pink', color: C.pinkD, hi: C.pink, name: 'Livre rose' },
  { id: 'lav', color: C.lav2, hi: C.lav3, name: 'Livre lavande' },
];
const BOOK_PAL = [hex(C.plum), hex(C.lav2), hex(C.p3), hex(C.pinkD), hex(C.cyanD), hex(C.goldD), hex(C.n3), hex(C.woodL), hex('#7a5a78')];
const hash2 = (a, b) => { let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };

export class Library extends BaseScene {
  constructor(game) {
    super(game, 'library');
    const wall = (side, z, Y) => {
      const lit = 0.85 + 0.2 * Math.exp(-(((z - 45) / 14) ** 2));
      if (Y > 33) return shade(hex(C.woodD), lit);
      if (Y < -33) return shade(hex(C.woodL), lit);
      const row = Math.floor((Y + 36) / 12), yIn = (Y + 36) - row * 12;
      if (yIn > 11) return shade(hex(C.woodH), lit);
      if (yIn < 0.8) return shade(hex(C.woodD), lit);
      const col = Math.floor(z / 2.4);
      const hsh = hash2(col + (side > 0 ? 500 : 0), row);
      const h = 7 + (hsh % 4); // hauteur du livre
      if (yIn > 11 - h) {
        const edge = (z / 2.4) - col;
        if (edge < 0.12) return shade(hex(C.abyss), lit);
        if (hsh % 7 === 0) return shade(hex(C.n2), lit);
        return shade(BOOK_PAL[hsh % BOOK_PAL.length], lit * (edge > 0.7 ? 0.85 : 1));
      }
      return shade(hex('#0d0a18'), lit);
    };
    const floor = (X, z) => {
      const plank = Math.floor((X + 100) / 7), seam = (Math.floor(z / 11) + plank) % 5 === 0;
      let c = Math.abs(X) < 11 ? (Math.abs(Math.abs(X) - 9) < 0.7 ? hex(C.gold) : hex(C.plum)) : seam ? hex('#241a2d') : ((plank & 1) ? hex('#2b2034') : hex('#33263c'));
      return shade(c, 0.9 + 0.2 * Math.exp(-(((z - 45) / 16) ** 2)));
    };
    const ceil = (X, z) => {
      const rib = Math.abs(((z + 10) % 22) - 11) < 1.2;
      const arch = Math.abs(X) > 28;
      return rib ? hex(C.woodL) : arch ? hex('#1b1530') : hex('#120d22');
    };
    const end = (X, Y) => {
      if (Math.abs(X) < 14 && Y > -6) return Math.abs(X) < 9 && Y > 0 ? hex('#f5e9ff') : hex(C.gold);
      return hex('#150f26');
    };
    this.bg = bakeCorridor({ wall, floor, ceil, end, zEnd: 120, fog: { color: hex('#0b0816'), amount: 0.8 } });
    this.reset();
  }

  reset() { this.seq = []; this.lift = {}; this.errT = 0; }

  enter() {
    const g = this.g;
    g.progress.discoverZone('library');
    g.audio.setZoneTrack('bibliotheque'); g.audio.setAmbient({ hum: 0.3, wind: 0.04 });
    this.reset();
  }

  update(dt) { super.update(dt); if (this.errT > 0) this.errT -= dt; }

  _bookRect(i) { return { x: 96 + i * 28, y: 118 + Math.round(Math.sin(i * 1.7) * 2), w: 20, h: 22 }; }

  draw(g, t) {
    const G = this.g, s = G.state, solved = s.puzzles.includes('library');
    g.drawImage(this.bg, 0, 0);
    // plaque murale (énigme)
    const pr = this._plaqueRect();
    R(g, C.abyss, pr.x, pr.y, pr.w, pr.h); R(g, C.gold, pr.x, pr.y, pr.w, 1); R(g, C.gold, pr.x, pr.y + pr.h - 1, pr.w, 1);
    text3x5(g, C.moon, 'LIS LE SOIR', pr.x + 3, pr.y + 3); text3x5(g, C.lav, 'DE HAUT EN BAS', pr.x + 3, pr.y + 10);
    // issue
    const dr = this._exitRect(); R(g, C.woodD, dr.x, dr.y, dr.w, dr.h); R(g, C.woodL, dr.x + 1, dr.y + 1, dr.w - 2, dr.h - 1); R(g, C.gold, dr.x + dr.w - 4, dr.y + dr.h / 2, 2, 2);
    drawSymbol(g, 'moon', dr.x + 4, dr.y - 10, C.lav3);
    // livre de travers (secret)
    const ob = this._oddRect(), nookOpen = G.flag('library_nook');
    if (!nookOpen) { R(g, C.moon, ob.x, ob.y, ob.w, ob.h); R(g, C.p3, ob.x + 1, ob.y + 1, ob.w - 2, ob.h - 2); R(g, C.gold, ob.x + 1, ob.y + 2, ob.w - 2, 1); }
    else this._drawNook(g, t);
    // pupitre
    R(g, C.woodD, 78, 142, 164, 5); R(g, C.woodL, 78, 141, 164, 1); R(g, C.wood, 90, 147, 140, 14); R(g, C.woodD, 90, 160, 140, 2);
    for (let i = 0; i < 5; i++) {
      const b = BOOKS[i], r = this._bookRect(i), lifted = this.seq.includes(b.id);
      const dy = lifted ? -6 + Math.round(Math.sin(t * 3 + i) * 1) : Math.round(Math.sin(t * 1.2 + i) * 1);
      const bx = r.x, by = r.y + dy;
      glow(g, bx + 10, by + 10, lifted ? 26 : 16, b.hi, lifted ? 0.2 : 0.09);
      R(g, C.abyss, bx - 1, by - 1, 22, 24); R(g, b.color, bx, by, 20, 22); R(g, b.hi, bx, by, 20, 2); R(g, b.hi, bx, by, 2, 22);
      R(g, C.abyss, bx + 4, by + 6, 12, 1); R(g, C.moon, bx + 5, by + 9, 10, 1); R(g, C.moon, bx + 5, by + 12, 7, 1);
      if (lifted) { R(g, C.white, bx + 8, by - 4, 4, 2); }
    }
    // progression : petits points
    for (let i = 0; i < 4; i++) { R(g, i < this.seq.length ? C.gold : C.p2, 150 + i * 6, 134, 3, 3); }
    if (this.errT > 0) { g.fillStyle = `rgba(255,110,199,${this.errT * 0.3})`; g.fillRect(0, 0, W, H); }
    // poussière + lueur
    for (let i = 0; i < 16; i++) { const x = (i * 41 + t * 2 * ((i % 3) + 1)) % W, y = 20 + ((i * 31 + Math.sin(t * 0.4 + i) * 10) % 130); g.fillStyle = 'rgba(255,190,98,0.35)'; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    if (solved) { const v = Math.sin(t * 1.5) * 0.02; glow(g, 160, 118, 60, '#B9A0FF', 0.08 + v); }
    g.fillStyle = 'rgba(8,7,16,0.25)'; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  }

  _plaqueRect() { return { x: 226, y: 54, w: 62, h: 19 }; }
  _exitRect() { return { x: 20, y: 86, w: 24, h: 50 }; }
  _oddRect() { return { x: 286, y: 100, w: 5, h: 14 }; }
  _nookRect() { return { x: 262, y: 70, w: 52, h: 60 }; }

  _drawNook(g, t) {
    const r = this._nookRect();
    R(g, C.abyss, r.x, r.y, r.w, r.h); R(g, '#150f26', r.x + 2, r.y + 2, r.w - 4, r.h - 2);
    glow(g, r.x + 26, r.y + 36, 30, '#FFBE62', 0.1);
    R(g, C.n3, r.x + 6, r.y + 44, 40, 4); R(g, C.paper, r.x + 14, r.y + 38, 18, 6); R(g, C.p3, r.x + 16, r.y + 40, 14, 1);
    if (!this.g.has('poster_castle') && (this.g.state.owned.poster_castle || 0) === 0) { R(g, C.n2, r.x + 34, r.y + 14, 10, 26); R(g, C.p3, r.x + 35, r.y + 15, 8, 24); }
  }

  hotspots() {
    const g = this.g, h = [];
    const s = g.state, solved = s.puzzles.includes('library');
    for (let i = 0; i < 5; i++) {
      const b = BOOKS[i];
      h.push({ id: 'book_' + b.id, label: b.name, rect: this._bookRect(i), z: 50, actions: [{ label: 'Prendre', run: () => this._press(b.id) }, { label: 'Examiner', run: () => this.say(`${b.name}. Le dos est vide, mais la couverture a la couleur d\'une heure du ciel.`) }] });
    }
    h.push({ id: 'plaque', label: 'Plaque', rect: this._plaqueRect(), z: 30, actions: [{ label: 'Lire', run: () => this.say('« Les jours se rangent comme le ciel du soir : du plus haut au plus bas. »') }] });
    h.push({ id: 'exit', label: 'Porte du couloir', rect: this._exitRect(), z: 30, actions: [{ label: 'Retourner au couloir', run: () => { g.audio.sfx('door'); g.goto('hallway', { spawn: 'library' }); } }] });
    if (!g.flag('library_nook')) h.push({ id: 'odd_book', label: 'Livre de travers', rect: this._oddRect(), z: 40, actions: [{ label: 'Tirer', run: () => this._nook() }, { label: 'Examiner', run: () => this.say('Un seul livre dépasse, de travers, sans titre. Il a l\'air d\'attendre qu\'on le tire.') }] });
    else h.push({ id: 'nook', label: 'Alcôve', rect: this._nookRect(), z: 40, actions: [{ label: 'Fouiller', run: () => this._searchNook() }] });
    h.push({ id: 'shelves', label: 'Étagères', rect: { x: 0, y: 0, w: W, h: 86 }, z: 1, actions: [{ label: 'Examiner', run: () => this.say(['Des livres à perte de vue. Aucun titre, rien que des couleurs : chaque jour a sa teinte.', 'Chaque étagère se répète un peu plus loin. Tu reconnais le même livre rose, à gauche, trois fois.'][Math.floor(this.t) % 2]) }] });
    return h;
  }

  async _press(id) {
    const g = this.g;
    if (g.state.puzzles.includes('library')) { g.audio.sfx('page'); this.say('Les livres brillent calmement. Le ciel du soir est rangé.'); return; }
    if (this.seq.includes(id)) return;
    const expected = SOLUTION[this.seq.length];
    g.audio.sfx('bell', {}); g.audio.bell(this.seq.length, 0.8);
    if (id === expected) {
      this.seq.push(id);
      if (this.seq.length === SOLUTION.length) {
        g.audio.sfx('solve');
        await this.say('Les quatre livres s\'alignent d\'eux-mêmes. Le cinquième, cyan, s\'éteint : il n\'a jamais fait partie du soir.');
        g.progress.solvePuzzle('library');
        await this.say('Dans l\'ombre du pupitre, quelque chose a roulé jusqu\'à toi : une clé lavande, et un éclat de lune en forme de croissant.');
      }
    } else {
      this.seq = []; this.errT = 0.6;
      g.audio.sfx('error');
      this.say(id === 'cyan' ? 'Le livre cyan reste froid. Le soir n\'a pas cette couleur-là.' : 'Les livres retombent un à un sur le pupitre. Ce n\'est pas l\'ordre du ciel du soir.');
    }
  }

  async _nook() {
    const g = this.g;
    g.audio.sfx('secret'); g.setFlag('library_nook', true);
    await this.say('Tu tires le livre de travers. Un pan d\'étagère glisse sans bruit : une petite alcôve, chaude, pleine de papiers.');
    g.progress.discoverSecret('library_nook', 'L\'alcôve de la bibliothèque');
  }
  async _searchNook() {
    const g = this.g;
    const had = g.has('poster_castle');
    g.give('poster_castle');
    await this.say(had ? 'Un papier plié : « Ceux qui lisent le ciel du soir n\'ont jamais peur du noir. »' : 'Une affiche enroulée représentant un château vu de très loin, et un mot : « Il y a des endroits qu\'on ne voit que de loin. »');
  }
}
