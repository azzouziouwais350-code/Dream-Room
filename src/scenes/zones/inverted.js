// La chambre inversée : tout ce qui est léger repose au plafond. Un levier caché derrière le rideau inverse la gravité.
// Énigme : « Ce qui tombe vers le haut finit par atteindre le sol » — inverser la gravité fait tomber le vase, qui libère l'éclat.
import { BaseScene } from '../base.js';
import { C, W, H, R, mk, ctxOf, disc, ellipse, line, text3x5, rgba, dither } from '../../art/pixel.js';
import * as F from '../../art/furniture.js';
import { bakeRoomBase, drawCurtain, glow } from '../../art/roomBase.js';
import { drawWindowScene, WW, WH } from '../../art/windowScenes.js';
import { itemSprite } from '../../art/items.js';
import { FIXED_ROOM } from '../../data/items.js';

const FX = FIXED_ROOM;

function bakeVase() {
  const c = mk(16, 22); const g = ctxOf(c);
  R(g, C.cyanD, 4, 0, 8, 3); R(g, C.cyan, 5, 0, 6, 1); R(g, C.cyanD, 2, 3, 12, 14); R(g, C.cyan, 3, 4, 3, 10); R(g, C.cyanD, 4, 17, 8, 3); R(g, C.abyss, 5, 20, 6, 1);
  R(g, C.pink, 6, 7, 4, 1); R(g, C.pink, 5, 10, 6, 1); R(g, C.gold, 7, 13, 2, 2);
  return c;
}
function flipV(src) {
  const c = mk(src.width, src.height); const g = ctxOf(c); g.translate(0, src.height); g.scale(1, -1); g.drawImage(src, 0, 0); return c;
}

export class Inverted extends BaseScene {
  constructor(game) {
    super(game, 'inverted');
    this.base = bakeRoomBase();
    this.vase = bakeVase(); this.vaseUp = flipV(this.vase);
    this.bed = F.bakeBed(); this.bookcase = F.bakeBookcase(); this.wardrobe = F.bakeWardrobe(); this.winFrame = F.bakeWindowFrame(); this.door = F.bakeDoor(); this.clock = F.bakeClockFace();
    this.win = mk(WW, WH);
    this.grav = 1; // 1 = gravité inversée (les objets sont au plafond), 0 = normale (au sol)
    this.fallT = 1; this.curtainOpen = false; this.flash = 0;
    // objets légers : x, hauteur au sol / au plafond, sprite
    this.loose = [
      { id: 'vase', x: 168, spr: 'vase', fy: 150, w: 16, h: 22, bounce: 0 },
      { id: 'chair', x: 70, spr: 'chair_wood', fy: 152, w: 18, h: 26, bounce: 0 },
      { id: 'stool', x: 262, spr: 'stool_star', fy: 150, w: 14, h: 14, bounce: 0 },
      { id: 'cup', x: 116, spr: 'cup', fy: 148, w: 8, h: 8, bounce: 0 },
    ];
  }

  enter() {
    const g = this.g;
    g.progress.discoverZone('inverted');
    g.audio.setZoneTrack('couloir'); g.audio.setAmbient({ hum: 1, wind: 0.2 });
    this.grav = g.state.puzzles.includes('inverted') ? 0 : 1; this.fallT = 1; this.curtainOpen = g.flag('inv_curtain') === true;
  }

  update(dt) {
    super.update(dt);
    if (this.fallT < 1) this.fallT = Math.min(1, this.fallT + dt / 1.1);
    if (this.flash > 0) this.flash -= dt;
    const gg = this.win.getContext('2d'); drawWindowScene(gg, 'hanging_buildings', this.t, { moon: 0.5, reduce: this.g.state.settings.reduceMotion });
  }

  /** Position verticale d'un objet léger : 0 = plafond, 1 = sol. */
  _ky(o) {
    const target = this.grav ? 0 : 1; const from = this.grav ? 1 : 0;
    const k = this.fallT;
    if (k >= 1) return target;
    const e = this.grav ? k * k : k * k; // accélération
    let v = from + (target - from) * e;
    if (!this.grav && k > 0.85) v = target - Math.sin((k - 0.85) / 0.15 * Math.PI) * 0.04;
    return v;
  }

  _objY(o, ky) { const ceilY = 12, floorY = o.fy; return ceilY + (floorY - o.h - ceilY) * ky; }

  draw(g, t) {
    const G = this.g, s = G.state;
    g.drawImage(this.base, 0, 0);
    // fenêtre : bâtiments suspendus
    g.drawImage(this.win, FX.window.x + 4, FX.window.y + 4); g.drawImage(this.winFrame, FX.window.x, FX.window.y);
    g.drawImage(this.door, FX.door.x, FX.door.y); R(g, C.cyan, FX.door.x + 8, FX.door.y + 4, 10, 1);
    g.drawImage(this.clock, 96, 38);
    // horloge à l'envers : aiguilles qui tournent à rebours
    const a = -t * 0.9, cx = 105.5, cy = 47.5;
    line(g, C.abyss, cx, cy, cx + Math.sin(a) * 4, cy - Math.cos(a) * 4); line(g, C.plum, cx, cy, cx + Math.sin(a * 6) * 6, cy - Math.cos(a * 6) * 6);
    // rideau (ferme le levier tant qu'il n'est pas tiré)
    if (!this.curtainOpen) { drawCurtain(g, 124, 14, 66, -1, t, 0.15); drawCurtain(g, 124 + 36, 14, 66, 1, t, 0.15); drawCurtain(g, 148, 14, 66, -1, t, 0.15); drawCurtain(g, 188, 14, 66, 1, t, 0.15); R(g, C.p2, 136, 15, 60, 62); for (let x = 136; x < 196; x += 4) R(g, (x / 4) % 2 ? C.plum : C.p3, x, 15, 2, 62); R(g, C.gold, 132, 13, 68, 2); }
    else { drawCurtain(g, 120, 14, 66, -1, t, 0.15); drawCurtain(g, 202, 14, 66, 1, t, 0.15); }
    g.drawImage(this.bookcase, FX.bookcase.x, FX.bookcase.y); g.drawImage(this.wardrobe, FX.wardrobe.x, FX.wardrobe.y);
    g.drawImage(this.bed, FX.bed.x, FX.bed.y); F.drawBlanket(g, FX.bed.x, FX.bed.y, t, true);
    // levier (derrière le rideau)
    if (this.curtainOpen) this._drawLever(g, t);
    // plaque
    const pr = this._plaqueRect();
    R(g, C.abyss, pr.x, pr.y, pr.w, pr.h); R(g, C.lav, pr.x, pr.y, pr.w, 1); R(g, C.lav, pr.x, pr.y + pr.h - 1, pr.w, 1);
    text3x5(g, C.moon, 'CE QUI TOMBE', pr.x + 3, pr.y + 3); text3x5(g, C.lav, 'VERS LE HAUT', pr.x + 3, pr.y + 9); text3x5(g, C.lav, 'FINIT AU SOL', pr.x + 3, pr.y + 15);
    // objets légers
    for (const o of this.loose) this._drawLoose(g, o, t);
    // flash de gravité
    if (this.flash > 0) { g.fillStyle = `rgba(242,221,251,${Math.min(0.7, this.flash)})`; g.fillRect(0, 0, W, H); }
    // éclat qui scintille après la chute
    if (!this.grav && this.fallT >= 1 && !G.has('shard_heart')) { glow(g, 176, 140, 24, '#FF6EC7', 0.25); if (Math.sin(t * 6) > 0) R(g, C.white, 175, 138, 1, 1); }
    // poussière qui monte ou qui tombe
    for (let i = 0; i < 14; i++) { const dirn = this.grav ? -1 : 1; const y = (((i * 31 + t * 6 * dirn) % 170) + 170) % 170 + 4, x = (i * 47) % W; g.fillStyle = 'rgba(185,160,255,0.4)'; g.fillRect(x, Math.round(y), 1, 1); }
    g.fillStyle = 'rgba(8,7,16,0.25)'; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  }

  _drawLoose(g, o, t) {
    const ky = this._ky(o), y = Math.round(this._objY(o, ky));
    const up = this.grav ? ky < 0.5 : ky < 0.5;
    const flipped = this.grav ? ky < 0.9 : ky < 0.35; // retourné tant qu'il est près du plafond
    let spr;
    if (o.spr === 'vase') spr = flipped ? this.vaseUp : this.vase;
    else if (o.spr === 'cup') { const c = mk(8, 8); const gg = ctxOf(c); R(gg, C.moon, 0, 0, 7, 7); R(gg, C.lav, 1, 1, 5, 2); R(gg, C.p3, 7, 2, 1, 3); spr = flipped ? flipV(c) : c; }
    else { const base = itemSprite(o.spr); spr = flipped ? flipV(base) : base; }
    const pad = spr._pad || 0;
    g.drawImage(spr, o.x, y - (o.spr === 'vase' || o.spr === 'cup' ? 0 : 0));
    if (this.grav === 0 && this.fallT >= 1) { g.fillStyle = 'rgba(8,7,16,0.35)'; g.fillRect(o.x + 1, o.fy, o.w - 2, 1); }
    if (o.id === 'vase' && !this.grav && this.fallT >= 1 && !this.g.has('shard_heart')) { /* éclat visible : voir _drawGlow */ }
  }

  _drawLever(g, t) {
    const p = this._leverRect();
    R(g, C.abyss, p.x - 2, p.y + 12, 20, 6); R(g, C.p2, p.x - 1, p.y + 13, 18, 4); R(g, C.gold, p.x + 6, p.y + 12, 4, 2);
    const ang = this.grav ? -1 : 1;
    line(g, C.moon, p.x + 8, p.y + 14, p.x + 8 + ang * 6, p.y + 2); disc(g, C.pink, p.x + 8 + ang * 6, p.y + 1, 2);
  }

  _leverRect() { return { x: 158, y: 36, w: 18, h: 28 }; }
  _plaqueRect() { return { x: 52, y: 90, w: 52, h: 22 }; }

  hotspots() {
    const g = this.g, h = [], s = g.state;
    h.push({ id: 'exit', label: 'Porte du couloir', rect: { x: FX.door.x, y: FX.door.y, w: FX.door.w, h: FX.door.h }, z: 20, actions: [{ label: 'Retourner au couloir', run: () => { g.audio.sfx('door'); g.goto('hallway', { spawn: 'inverted' }); } }] });
    h.push({ id: 'plaque', label: 'Plaque', rect: this._plaqueRect(), z: 30, actions: [{ label: 'Lire', run: () => this.say('« Ce qui tombe vers le haut finit par atteindre le sol. » Quelqu\'un a ajouté, plus petit : « …quand on retourne la pièce. »') }] });
    if (!this.curtainOpen) h.push({ id: 'curtain', label: 'Rideau', rect: { x: 134, y: 14, w: 64, h: 64 }, z: 40, actions: [{ label: 'Écarter', run: () => this._openCurtain() }, { label: 'Examiner', run: () => this.say('Un rideau épais qui tombe vers le haut. Derrière, quelque chose de métallique respire.') }] });
    else h.push({ id: 'lever', label: 'Levier', rect: this._leverRect(), z: 45, actions: [{ label: this.grav ? 'Inverser la gravité' : 'Rétablir le plafond', run: () => this._lever() }, { label: 'Examiner', run: () => this.say('Un levier de laiton, rose au bout. Une flèche sur la plaque : haut, bas.') }] });
    const vase = this.loose[0];
    const vy = Math.round(this._objY(vase, this._ky(vase)));
    const reachable = !this.grav && this.fallT >= 1;
    if (!s.puzzles.includes('inverted')) h.push({ id: 'vase', label: 'Vase', rect: { x: vase.x - 2, y: vy - 2, w: 20, h: 26 }, z: 60, actions: reachable ? [{ label: 'Prendre l\'éclat', run: () => this._takeShard() }, { label: 'Examiner', run: () => this.say('Le vase est fêlé. Dans la fissure, un éclat rose bat doucement.') }] : [{ label: 'Examiner', run: () => this.say(this.grav ? 'Un vase est posé au plafond, juste hors de portée. Quelque chose bat à l\'intérieur.' : 'Le vase est en train de tomber.') }] });
    else h.push({ id: 'vase', label: 'Vase fêlé', rect: { x: vase.x - 2, y: vy - 2, w: 20, h: 26 }, z: 60, actions: [{ label: 'Examiner', run: () => this.say('Le vase est vide. Il a rendu ce qu\'il gardait.') }] });
    for (const o of this.loose.slice(1)) {
      const y = Math.round(this._objY(o, this._ky(o)));
      h.push({ id: o.id, label: o.id === 'chair' ? 'Chaise' : o.id === 'stool' ? 'Tabouret' : 'Tasse', rect: { x: o.x, y, w: o.w, h: o.h }, z: 55, actions: [{ label: 'Examiner', run: () => this.say(this.grav ? 'Cet objet repose au plafond, comme si le plafond était un sol.' : 'Il est retombé, tranquille, comme si de rien n\'était.') }] });
    }
    h.push({ id: 'window', label: 'Fenêtre', rect: { x: FX.window.x, y: FX.window.y, w: FX.window.w, h: FX.window.h }, z: 10, actions: [{ label: 'Examiner', run: () => this.say('Dehors, des immeubles pendent du ciel comme des stalactites. Leurs fenêtres sont allumées.') }] });
    h.push({ id: 'bed', label: 'Lit', rect: { x: FX.bed.x, y: FX.bed.y, w: FX.bed.w, h: FX.bed.h }, z: 20, actions: [{ label: 'Examiner', run: () => this.say('Le lit est fait, ni vraiment défait. Dans cette pièce, il n\'y a pas de nuit : seulement un autre côté.') }] });
    return h;
  }

  async _openCurtain() {
    const g = this.g;
    g.audio.sfx('page'); this.curtainOpen = true; g.setFlag('inv_curtain', true);
    await this.say('Tu écartes le rideau. Un levier de laiton dépasse du mur, un peu rose au bout. Une flèche : haut, bas.');
  }

  async _lever() {
    const g = this.g;
    g.audio.sfx('lever'); setTimeout(() => g.audio.sfx('grav'), 120);
    this.grav = this.grav ? 0 : 1; this.fallT = 0; this.flash = 0.35;
    if (!this.grav) await this.say('La pièce se retourne sur elle-même. Tout ce qui flottait retombe d\'un coup, et un vase se fend en touchant le sol.');
    else await this.say('La gravité repart vers le haut. Les objets légers remontent doucement au plafond, comme des ballons.');
  }

  async _takeShard() {
    const g = this.g;
    g.audio.sfx('discover');
    await this.say('Dans la fissure du vase, un éclat de lune en forme de cœur. Il bat comme quelque chose de vivant, de petit, de tiède.');
    g.progress.solvePuzzle('inverted');
    await this.say('Il y a eu un jour où tout est tombé vers le haut. Tu as tenu la gravité à deux mains.');
  }
}
