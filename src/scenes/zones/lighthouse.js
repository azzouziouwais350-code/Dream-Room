// Le phare oublié (zone cachée) : une lettre, un coffre avec la lentille, une lampe à rallumer.
import { BaseScene } from '../base.js';
import { C, W, H, R, disc, line, ellipse } from '../../art/pixel.js';
import { glow } from '../../art/roomBase.js';
import { starsBg, moonDisc } from './common.js';

export class Lighthouse extends BaseScene {
  constructor(game) { super(game, 'lighthouse'); }
  enter() {
    const g = this.g;
    g.progress.discoverZone('lighthouse');
    g.audio.setZoneTrack('jardin'); g.audio.setAmbient({ wind: 0.5, waves: 0.7 });
  }
  _lit() { return !!this.g.state.flags.lighthouse_lit; }

  draw(g, t) {
    R(g, C.abyss, 0, 0, W, 100); R(g, C.n2, 0, 60, W, 40);
    starsBg(g, t, 60, 23, 70); moonDisc(g, 250, 30, 12, 0.85);
    // mer
    R(g, C.glass, 0, 100, W, 80);
    for (let y = 102; y < 170; y += 4) for (let x = 0; x < W; x += 8) { const o = Math.sin(t * 1.2 + x * 0.1 + y) > 0.4 ? 2 : 0; R(g, y > 130 ? C.cyanD : C.p3, x + o + (y % 8), y, 3, 1); }
    // île + phare
    ellipse(g, C.n3, 110, 140, 70, 12); R(g, C.n3, 40, 128, 140, 12);
    R(g, C.moon, 98, 56, 24, 76); for (let y = 62; y < 130; y += 12) R(g, C.pink, 98, y, 24, 5);
    R(g, C.abyss, 92, 50, 36, 6); R(g, C.p3, 100, 38, 20, 12); R(g, this._lit() ? C.goldL : C.glass, 103, 40, 14, 8);
    R(g, C.abyss, 96, 30, 28, 8); R(g, C.pinkD, 102, 24, 16, 6);
    if (this._lit()) {
      glow(g, 110, 44, 60, C.gold, 0.28 + Math.sin(t * 2) * 0.03);
      const a = t * 0.8; g.fillStyle = 'rgba(255,190,98,0.18)';
      for (let i = 0; i < 40; i++) g.fillRect(Math.round(110 + Math.cos(a) * i * 4), Math.round(44 + Math.sin(a) * i * 1.2 * (i / 20)), 3, 2);
    }
    // petite table + lettre, coffre
    R(g, C.woodD, 196, 126, 28, 3); R(g, C.wood, 198, 129, 3, 12); R(g, C.wood, 220, 129, 3, 12);
    if (!this.g.flag('lighthouse_letter')) { R(g, C.paper, 204, 121, 12, 6); R(g, C.pink, 209, 123, 2, 2); }
    R(g, C.woodD, 240, 122, 26, 20); R(g, C.wood, 242, 124, 22, 16); R(g, C.gold, 251, 128, 4, 4);
    // porte de retour
    R(g, C.woodD, 14, 116, 18, 30); R(g, C.wood, 16, 118, 14, 26);
    g.fillStyle = 'rgba(8,7,16,0.25)'; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  }

  hotspots() {
    const g = this.g, h = [];
    h.push({ id: 'back', label: 'Retour au couloir', rect: { x: 12, y: 114, w: 22, h: 34 }, z: 10, actions: [{ label: 'Revenir', run: () => { g.audio.sfx('door'); g.goto('hallway', { spawn: 'secret' }); } }] });
    h.push({ id: 'letter', label: g.flag('lighthouse_letter') ? 'Table' : 'Lettre', rect: { x: 194, y: 116, w: 34, h: 28 }, z: 20, actions: [{ label: g.flag('lighthouse_letter') ? 'Relire' : 'Lire la lettre', run: () => this._letter() }] });
    h.push({ id: 'chest', label: 'Coffre', rect: { x: 238, y: 120, w: 30, h: 24 }, z: 20, actions: [{ label: g.has('lens') ? 'Examiner' : 'Ouvrir', run: () => this._chest() }] });
    h.push({ id: 'lighthouse', label: 'Phare', rect: { x: 92, y: 22, w: 36, h: 110 }, z: 15, actions: [{ label: this._lit() ? 'Éteindre la lampe' : 'Allumer la lampe', run: () => this._lamp() }, { label: 'Examiner', run: () => this.say('Un phare minuscule. Sa lampe est vide, comme une bouche qui n\'a plus rien à dire.') }] });
    h.push({ id: 'sea', label: 'La mer', rect: { x: 0, y: 100, w: W, h: 80 }, z: 0, actions: [{ label: 'Écouter', run: () => this.say('Une mer qui n\'existe nulle part. Elle bat comme quelque chose de patient.') }] });
    return h;
  }

  async _letter() {
    const g = this.g, first = !g.flag('lighthouse_letter');
    g.audio.sfx('page');
    await this.say('« À celle ou celui qui lira ceci, je suis venue ici avant toi, après un autre 13 juillet. On ne garde pas quelqu\'un en refusant le matin. On le garde en laissant une lampe allumée dans la chambre où il dormait. Quand tu te réveilleras, ne l\'éteins pas. — Celle qui allumait le phare »');
    if (first) { g.setFlag('lighthouse_letter', true); g.progress.unlockDoc('lettre_phare'); g.progress.addMemory('m_light'); g.progress.discoverSecret('lighthouse', 'Le phare derrière le mur'); }
  }
  async _chest() {
    const g = this.g;
    if (g.has('lens')) { await this.say('Le coffre est vide. La lentille est dans ta poche, tiède comme un galet.'); return; }
    g.audio.sfx('key'); g.progress.give('lens');
    await this.say('Dans le coffre, une lentille de verre épais. Quand tu la tiens vers la lampe, tout ce qui est flou devient simplement lointain.');
  }
  async _lamp() {
    const g = this.g;
    if (!g.has('lens')) { g.audio.sfx('error'); await this.say('La lampe est éteinte, et il lui manque une lentille. Il y en a sûrement une, quelque part ici.'); return; }
    g.setFlag('lighthouse_lit', !this._lit()); g.audio.sfx('lamp');
    await this.say(this._lit() ? 'Le faisceau part en travers de la mer immobile. Quelque part, quelqu\'un le voit.' : 'Tu éteins la lumière. Le phare reste, de toute façon.');
  }
}
