// L'espace entre les portes : trois portes flottantes. Il faut les ouvrir dans l'ordre où les éclats ont été trouvés.
import { BaseScene } from '../base.js';
import { C, W, H, R, disc, line, text3x5, ring } from '../../art/pixel.js';
import { glow } from '../../art/roomBase.js';
import { starsBg, drawSymbol, SYMBOL_COLOR } from './common.js';

const DOORS = [
  { sym: 'heart', x: 62 }, { sym: 'moon', x: 148 }, { sym: 'star', x: 234 },
];
const NAMES = { moon: 'croissant', star: 'étoile', heart: 'cœur' };

export class Between extends BaseScene {
  constructor(game) { super(game, 'between'); this.step = 0; this.lit = {}; this.err = 0; this.portal = 0; }

  enter() {
    const g = this.g;
    g.progress.discoverZone('between');
    g.audio.setZoneTrack('lune'); g.audio.setAmbient({ wind: 0.5 });
    this.step = 0; this.lit = {}; this.err = 0;
  }
  _solved() { return this.g.state.puzzles.includes('between'); }
  _order() { return this.g.state.shardOrder.slice(0, 3); }

  update(dt) {
    super.update(dt);
    if (this.err > 0) this.err -= dt;
    this.portal = this._solved() ? Math.min(1, this.portal + dt) : 0;
  }

  draw(g, t) {
    const reduce = this.g.state.settings.reduceMotion;
    R(g, C.abyss, 0, 0, W, H);
    starsBg(g, t, 90, 7);
    for (let i = 0; i < 6; i++) { const y = 140 + i * 6; g.fillStyle = `rgba(185,160,255,${0.05 + i * 0.01})`; g.fillRect(0, y, W, 5); }
    for (const [i, d] of DOORS.entries()) {
      const bob = reduce ? 0 : Math.round(Math.sin(t * 0.9 + i * 2) * 3);
      const x = d.x + (this.err > 0 && !reduce ? Math.round(Math.sin(t * 60) * 2) : 0), y = 44 + bob;
      const lit = !!this.lit[d.sym] || this._solved();
      glow(g, x + 13, y + 28, 36, SYMBOL_COLOR[d.sym], lit ? 0.3 : 0.08);
      R(g, C.woodD, x - 2, y - 2, 30, 62); R(g, lit ? C.p3 : C.wood, x, y, 26, 58); R(g, C.woodL, x + 3, y + 3, 20, 24); R(g, C.woodL, x + 3, y + 31, 20, 23);
      R(g, C.gold, x + 20, y + 30, 2, 3);
      drawSymbol(g, d.sym, x + 9, y - 12, lit ? SYMBOL_COLOR[d.sym] : C.p3);
      R(g, C.abyss, x + 4, y + 62 + bob * -1, 18, 2); // ombre
    }
    if (this._solved()) {
      const k = this.portal, cx = 160, cy = 118;
      glow(g, cx, cy, 28 + k * 10, C.moon, 0.25 * k);
      for (let r = 4; r < 18 * k; r += 3) ring(g, r % 6 ? C.lav : C.moon, cx, cy, r, 1);
      disc(g, C.white, cx, cy, Math.round(3 * k));
    }
    // porte de retour (bas gauche)
    R(g, C.woodD, 8, 120, 22, 38); R(g, C.wood, 10, 122, 18, 34); R(g, C.gold, 24, 140, 2, 2);
    g.fillStyle = 'rgba(8,7,16,0.25)'; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  }

  hotspots() {
    const g = this.g, h = [];
    for (const d of DOORS) {
      h.push({ id: 'door_' + d.sym, label: 'Porte ' + NAMES[d.sym], rect: { x: d.x - 2, y: 30, w: 30, h: 76 }, z: 20, actions: [
        { label: 'Ouvrir', run: () => this._open(d.sym) },
        { label: 'Examiner', run: () => this.say(`Une porte flottante, marquée d'un ${NAMES[d.sym]}. Elle pèse ce que pèse un oubli.`) },
      ] });
    }
    h.push({ id: 'back', label: 'Retour au couloir', rect: { x: 6, y: 118, w: 26, h: 42 }, z: 10, actions: [{ label: 'Revenir', run: () => { g.audio.sfx('door'); g.goto('hallway', { spawn: 'between' }); } }] });
    if (this._solved()) h.push({ id: 'portal', label: 'Portail lunaire', rect: { x: 134, y: 94, w: 52, h: 48 }, z: 30, actions: [{ label: 'Traverser', run: () => { g.audio.sfx('portal'); g.goto('lunar', { spawn: 'between' }); } }] });
    h.push({ id: 'void', label: 'Le vide', rect: { x: 0, y: 0, w: W, h: H }, z: 0, actions: [{ label: 'Écouter', run: () => this.say(this._solved() ? 'Un portail respire entre les portes. Il sent le froid de la lune.' : 'Du vide, un silence plein. Les portes attendent d\'être ouvertes dans l\'ordre où on a oublié : celui où les éclats sont venus à toi.') }] });
    return h;
  }

  async _open(sym) {
    const g = this.g;
    if (this._solved()) { g.audio.sfx('click'); await this.say('La porte est déjà ouverte sur rien. Le portail, au centre, mène plus loin.'); return; }
    const order = this._order();
    if (order.length < 3) { g.audio.sfx('doorlock'); await this.say('Elle ne s\'ouvre pas. Il te manque encore des éclats : la mémoire n\'est pas complète.'); return; }
    if (order[this.step] === sym) {
      this.lit[sym] = true; this.step++; g.audio.bell(this.step % 4); g.audio.sfx('key');
      if (this.step >= 3) { g.progress.solvePuzzle('between'); g.audio.sfx('portal'); await this.say('Les trois portes s\'ouvrent sur rien, puis sur quelque chose. Entre elles, un portail d\'argent respire doucement.'); }
    } else {
      this.step = 0; this.lit = {}; this.err = 0.5; g.audio.sfx('error');
      await this.say('Les portes se referment toutes à la fois. Ce n\'était pas dans cet ordre. (Le journal garde l\'ordre des éclats.)');
    }
  }
}
