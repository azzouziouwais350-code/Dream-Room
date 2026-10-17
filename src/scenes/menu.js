// Scène du menu principal : la chambre sous la pluie, NOIR sur le lit, poussière qui flotte. Purement décorative.
import { C, W, H, R, mk, ctxOf, disc } from '../art/pixel.js';
import * as F from '../art/furniture.js';
import { bakeRoomBase, glow, drawCurtain } from '../art/roomBase.js';
import { drawWindowScene, WW, WH } from '../art/windowScenes.js';
import { drawCat } from '../art/cat.js';
import { FIXED_ROOM as FX } from '../data/items.js';

export class MenuScene {
  constructor(game) {
    this.g = game; this.t = 0; this.id = 'menu';
    this.base = bakeRoomBase(); this.bed = F.bakeBed(); this.frame = F.bakeWindowFrame(); this.win = mk(WW, WH); this.wardrobe = F.bakeWardrobe(); this.bookcase = F.bakeBookcase();
    this.dust = Array.from({ length: 26 }, (_, i) => ({ x: (i * 53) % W, y: 20 + ((i * 31) % 140), p: i }));
  }
  enter() {} exit() {}
  update(dt) { this.t += dt; }
  hotspots() { return []; }
  pick() { return null; }
  pointerDown() { return false; } pointerMove() {} pointerUp() {} floorTap() { return false; } lookAway() {}
  draw(g, t) {
    const reduce = this.g.state.settings.reduceMotion;
    g.drawImage(this.base, 0, 0);
    if (Math.floor(t * 20) % 2 === 0 || !this._lastWin) { drawWindowScene(this.win.getContext('2d'), 'rain', t, { moon: 0.4, reduce }); this._lastWin = true; }
    g.drawImage(this.win, FX.window.x + 4, FX.window.y + 4); g.drawImage(this.frame, FX.window.x, FX.window.y);
    g.drawImage(this.bookcase, FX.bookcase.x, FX.bookcase.y); g.drawImage(this.wardrobe, FX.wardrobe.x, FX.wardrobe.y);
    g.drawImage(this.bed, FX.bed.x, FX.bed.y); F.drawBlanket(g, FX.bed.x, FX.bed.y, t, true);
    try { drawCat(g, { x: 96, y: 132, dir: 1, pose: 'sit', t, blink: Math.sin(t * 0.8) > 0.97, acc: {} }); } catch (e) { /* ok */ }
    glow(g, 126, 130, 70, '#FFBE62', 0.1);
    for (const d of this.dust) { const y = ((d.y - t * 3 * (1 + (d.p % 3) * 0.3)) % 150 + 150) % 150 + 14; g.fillStyle = 'rgba(242,221,251,0.4)'; g.fillRect(Math.round((d.x + Math.sin(t * 0.4 + d.p) * 6 + W) % W), Math.round(y), 1, 1); }
    g.fillStyle = 'rgba(8,7,16,0.35)'; g.fillRect(0, 0, W, H);
  }
}
