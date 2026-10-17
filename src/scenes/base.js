// Scène de base : sélection de points d'intérêt, utilitaires de texte.
export class BaseScene {
  constructor(game, id) { this.g = game; this.id = id; this.t = 0; this.pointer = { x: 160, y: 90 }; }
  enter() {}
  exit() {}
  update(dt) { this.t += dt; }
  draw() {}
  hotspots() { return []; }
  lookAway() {}
  floorTap() { return false; }
  pointerDown(x, y) { this.pointer = { x, y }; return false; }
  pointerMove(x, y) { this.pointer = { x, y }; }
  pointerUp() {}
  say(t) { return this.g.say([{ text: t }]); }
  pick(x, y) {
    let best = null;
    for (const h of this.hotspots()) {
      const r = h.rect;
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) {
        if (!best || h.z > best.z || (h.z === best.z && r.w * r.h < best.rect.w * best.rect.h)) best = h;
      }
    }
    return best;
  }
}
