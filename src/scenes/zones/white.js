// La chambre blanche : zone finale. Révélation, trois choix, liberté après la fin.
import { BaseScene } from '../base.js';
import { C, W, H, R, disc, ellipse } from '../../art/pixel.js';
import { glow } from '../../art/roomBase.js';
import { ENDINGS } from '../../data/story.js';
import { drawCat } from '../../art/cat.js';

export class White extends BaseScene {
  constructor(game) { super(game, 'white'); this.busy = false; }
  enter() {
    const g = this.g;
    g.progress.discoverZone('white');
    g.audio.setZoneTrack('blanche'); g.audio.setAmbient({ hum: 0.2 });
    if (!g.state.ending && !g.flag('white_intro')) { g.setFlag('white_intro', true); setTimeout(() => this._reveal(), 700); }
  }
  draw(g, t) {
    const dawn = this.g.state.ending === 'dawn' || this.g.state.ending === 'lamp';
    R(g, '#e9dcff', 0, 0, W, H); R(g, '#f6eeff', 0, 120, W, 60);
    glow(g, 160, 80, 120, C.white, 0.35);
    R(g, '#cbb8f2', 0, 119, W, 1);
    // lit blanc minimal
    R(g, '#ffffff', 60, 108, 70, 12); R(g, '#d3c4ff', 60, 120, 70, 3);
    // porte blanche / matin
    R(g, '#b9a0ff', 216, 56, 50, 66); R(g, dawn ? C.goldL : '#ffffff', 220, 60, 42, 62);
    if (dawn) glow(g, 241, 90, 40, C.gold, 0.4);
    // NOIR
    try { drawCat(g, { x: 150, y: 134, dir: 1, pose: 'sit', t, blink: Math.sin(t * 0.7) > 0.96, acc: this.g.state.noir.equipped || [] }); } catch (e) { R(g, C.fur, 144, 124, 14, 10); }
    // lampe de la fin « lamp »
    if (this.g.state.ending === 'lamp') { R(g, C.woodD, 40, 94, 4, 26); glow(g, 42, 90, 26, C.gold, 0.45 + Math.sin(t * 2) * 0.03); R(g, C.goldL, 38, 88, 8, 6); }
    for (let i = 0; i < 18; i++) { const x = (i * 37 + t * 4) % W, y = (i * 23 + t * 6) % 120; g.fillStyle = 'rgba(185,160,255,0.35)'; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    R(g, C.woodD, 12, 94, 22, 28); R(g, C.wood, 14, 96, 18, 24);
  }
  hotspots() {
    const g = this.g, h = [];
    h.push({ id: 'back', label: g.state.ending ? 'Retour à la chambre' : 'Retour à la salle lunaire', rect: { x: 10, y: 92, w: 26, h: 32 }, z: 10, actions: [{ label: g.state.ending ? 'Rentrer dans la chambre' : 'Revenir', run: () => { g.audio.sfx('door'); g.goto(g.state.ending ? 'room' : 'lunar', { spawn: 'white', from: 'white' }); } }] });
    h.push({ id: 'noir', label: 'NOIR', rect: { x: 140, y: 120, w: 24, h: 22 }, z: 20, actions: [{ label: 'Caresser', run: () => { g.progress.s.noir.pet++; g.audio.sfx('purr'); this.say('Il ronronne, un tout petit peu. Pour de vrai.'); g.requestChange(); } }] });
    h.push({ id: 'door', label: 'Porte du matin', rect: { x: 214, y: 54, w: 54, h: 70 }, z: 15, actions: [
      { label: g.state.ending ? 'Rouvrir le choix' : 'Franchir', run: () => this._reveal() },
    ] });
    return h;
  }
  async _reveal() {
    const g = this.g; if (this.busy) return; this.busy = true;
    try {
      g.audio.sfx('whisper');
      if (!g.flag('white_told')) {
        g.setFlag('white_told', true);
        await g.say([
          { who: 'La Veilleuse', text: 'Cette chambre, c\'est toi qui l\'as construite la nuit du 13 juillet. Pour ne pas rentrer seul.' },
          { who: 'La Veilleuse', text: 'NOIR est parti ce soir-là. Tout le reste, la lampe, la pluie, le couloir, n\'a été qu\'une façon de ne pas le dire.' },
          { who: 'La Veilleuse', text: 'Tu n\'as pas à le dire. Mais tu peux décider de ce que la nuit devient.' },
        ]);
        g.progress.addMemory('m_white');
      }
      const opts = [{ label: 'Se réveiller', value: 'dawn' }, { label: 'Rester encore un peu', value: 'stay' }];
      if (g.flag('lighthouse_letter')) opts.push({ label: 'Se réveiller, et laisser la lampe allumée', value: 'lamp' });
      opts.push({ label: 'Pas encore', value: null });
      const v = await g.ui.choose('Que fais-tu ?', opts);
      if (!v) return;
      const e = ENDINGS[v];
      await g.say(e.lines.map((text) => ({ who: '', text })));
      g.state.ending = v;
      if (v !== 'stay') { g.state.window.auto = false; g.state.window.scene = 'dawn'; }
      g.progress.checkAchievements(); g.requestChange();
      g.ui.toast?.({ icon: 'sun', title: 'Fin : ' + e.title, text: 'La chambre reste ouverte. Tu peux continuer à explorer.' });
      await g.say([{ who: '', text: 'Le jeu continue : la chambre reste, la décoration aussi. Tu peux revenir ici quand tu veux.' }]);
      g.audio.sfx('rare'); g.openPanel('credits');
    } finally { this.busy = false; }
  }
}
