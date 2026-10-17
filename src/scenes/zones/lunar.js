// La salle lunaire : une lune immense, un piédestal à trois emplacements, une silhouette qui regarde.
import { BaseScene } from '../base.js';
import { C, W, H, R, disc, ring, line, ellipse } from '../../art/pixel.js';
import { glow } from '../../art/roomBase.js';
import { starsBg, moonDisc, drawSymbol, SYMBOL_COLOR } from './common.js';

const SHARDS = [{ item: 'shard_moon', sym: 'moon', x: 140 }, { item: 'shard_star', sym: 'star', x: 160 }, { item: 'shard_heart', sym: 'heart', x: 180 }];

export class Lunar extends BaseScene {
  constructor(game) { super(game, 'lunar'); this.glowK = 0; }
  enter() {
    const g = this.g;
    g.progress.discoverZone('lunar');
    g.audio.setZoneTrack('lune'); g.audio.setAmbient({ hum: 0.4, wind: 0.2 });
  }
  _placed() { const v = this.g.state.flags.lunar_placed; return typeof v === 'string' && v ? v.split(',') : []; }
  _solved() { return this.g.state.puzzles.includes('lunar'); }
  update(dt) { super.update(dt); this.glowK += ((this._solved() ? 1 : this._placed().length / 3) - this.glowK) * Math.min(1, dt * 2); }

  draw(g, t) {
    const G = this.g, mem = G.state.memories.length;
    R(g, C.abyss, 0, 0, W, H); starsBg(g, t, 70, 11, 120);
    const f = Math.min(1, 0.35 + mem * 0.065 + (this._solved() ? 0.3 : 0));
    glow(g, 160, 62, 70, C.lav, 0.12 + this.glowK * 0.18);
    moonDisc(g, 160, 62, 42, f, !this._solved());
    // silhouette de La Veilleuse, dans les nuages en bas de la lune
    if (G.state.puzzles.includes('inverted') || this._solved()) {
      const k = Math.sin(t * 0.4) * 1.5;
      g.fillStyle = 'rgba(8,7,16,0.85)'; g.fillRect(212, 70 + k, 8, 3); ellipse(g, 'rgba(8,7,16,0.85)', 216, 84 + k, 6, 12); disc(g, 'rgba(8,7,16,0.9)', 216, 66 + k, 4);
      if (Math.sin(t * 3) > -0.2) { R(g, C.moon, 214, 65 + k, 1, 1); R(g, C.moon, 217, 65 + k, 1, 1); }
    }
    // sol de nuages
    R(g, C.n2, 0, 138, W, 42);
    for (let i = 0; i < 30; i++) { const x = (i * 29 + t * 2 * (1 + (i % 3))) % (W + 20) - 10; ellipse(g, i % 2 ? C.n3 : C.p2, x, 146 + (i % 5) * 7, 16, 3); }
    // piédestal
    R(g, C.p3, 128, 118, 64, 6); R(g, C.p2, 132, 124, 56, 18); R(g, C.p3, 128, 142, 64, 4);
    const placed = this._placed();
    for (const s of SHARDS) {
      const on = placed.includes(s.sym);
      R(g, C.abyss, s.x - 6, 112, 12, 7);
      if (on) { glow(g, s.x, 108, 14, SYMBOL_COLOR[s.sym], 0.4); drawSymbol(g, s.sym, s.x - 3, 105 + Math.round(Math.sin(t * 2 + s.x) * 1), SYMBOL_COLOR[s.sym]); }
      else drawSymbol(g, s.sym, s.x - 3, 113, C.p2);
    }
    // porte blanche
    if (this._solved()) {
      glow(g, 288, 120, 30, C.white, 0.25);
      R(g, C.moon, 276, 98, 24, 42); R(g, C.white, 278, 100, 20, 40); R(g, C.lav, 292, 120, 2, 3);
    }
    // porte de retour
    R(g, C.woodD, 14, 98, 24, 42); R(g, C.wood, 16, 100, 20, 38); R(g, C.gold, 31, 118, 2, 2);
    g.fillStyle = 'rgba(8,7,16,0.25)'; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  }

  hotspots() {
    const g = this.g, h = [];
    h.push({ id: 'back', label: 'Retour', rect: { x: 12, y: 96, w: 28, h: 46 }, z: 10, actions: [{ label: 'Revenir entre les portes', run: () => { g.audio.sfx('door'); g.goto('between', { spawn: 'lunar' }); } }] });
    h.push({ id: 'moon', label: 'La lune', rect: { x: 110, y: 18, w: 100, h: 90 }, z: 5, actions: [{ label: 'Observer', run: () => this.say(this._solved() ? 'La lune est entière. Elle a l\'air de respirer, enfin.' : 'La lune est fêlée en trois endroits. Un peu plus pleine à chaque souvenir retrouvé.') }] });
    h.push({ id: 'pedestal', label: 'Piédestal', rect: { x: 126, y: 100, w: 68, h: 48 }, z: 20, actions: [
      { label: 'Déposer les éclats', run: () => this._deposit() },
      { label: 'Examiner', run: () => this.say('Trois creux : un croissant, une étoile, un cœur. Chacun attend sa petite lune.') },
    ] });
    if (g.state.puzzles.includes('inverted') || this._solved()) h.push({ id: 'watcher', label: 'Silhouette', rect: { x: 206, y: 56, w: 20, h: 40 }, z: 25, actions: [{ label: 'Regarder', run: () => this._watcher() }] });
    if (this._solved()) h.push({ id: 'white_door', label: 'Porte blanche', rect: { x: 274, y: 96, w: 28, h: 46 }, z: 30, actions: [{ label: 'Entrer', run: () => { g.audio.sfx('portal'); g.goto('white', { spawn: 'lunar' }); } }] });
    return h;
  }

  async _watcher() {
    const g = this.g;
    g.audio.sfx('whisper');
    await this.say('Elle ne bouge pas. Elle te regarde comme on regarde quelqu\'un qui dort debout. « Je suis La Veilleuse, » dit-elle sans voix. « Je ne suis pas venue t\'effrayer. »');
    if (!this._solved()) await this.say('« Pose les trois éclats sur le piédestal. Puis je t\'ouvrirai la dernière porte. »');
    else await this.say('« La porte est ouverte. Tu choisiras en entrant. Aucun choix n\'est une faute. »');
  }

  async _deposit() {
    const g = this.g, placed = this._placed().slice();
    let added = 0;
    for (const s of SHARDS) if (!placed.includes(s.sym) && g.has(s.item)) { placed.push(s.sym); added++; }
    if (!added) { g.audio.sfx('error'); await this.say(placed.length ? 'Tu n\'as plus d\'éclat à poser.' : 'Tu n\'as encore aucun éclat. Chaque lieu en garde un.'); return; }
    g.state.flags.lunar_placed = placed.join(','); g.requestChange(); g.audio.sfx('place');
    if (placed.length < 3) { await this.say(`${added > 1 ? 'Les éclats s\'ajustent' : 'L\'éclat s\'ajuste'} avec un petit tintement. Il en manque encore.`); return; }
    g.setFlag('lunar_solved', true); g.progress.solvePuzzle('lunar'); g.audio.sfx('portal');
    await this.say('La lune se ressoude dans un souffle. Au fond de la salle, une porte blanche apparaît. Elle n\'a pas de poignée : elle attend.');
  }
}
