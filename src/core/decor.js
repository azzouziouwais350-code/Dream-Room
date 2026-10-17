// Décoration : règles de placement, collisions, annulation. Logique pure (testable sous Node).
import { ITEM_BY_ID, FIXED_ROOM, KEEP_CLEAR, FLOOR_BAND, WALL_REGION, CEILING_REGION } from '../data/items.js';
import { rectsOverlap, clamp } from './util.js';

export const SCREEN = { w: 320, h: 180 };
export const GRID = 4;

/** Rectangle visuel (ce que le joueur voit). Pour le sol, (x,y) = coin bas-gauche (pieds). */
export function visualRect(it, x, y) {
  if (it.slot === 'floor' || it.slot === 'rug') return { x, y: y - it.h, w: it.w, h: it.h };
  return { x, y, w: it.w, h: it.h };
}

/** Empreinte au sol (collisions) pour les objets posés au sol. */
export function footprint(it, x, y) {
  if (it.slot === 'floor') return { x, y: y - Math.max(it.fd, 2), w: it.w, h: Math.max(it.fd, 2) };
  if (it.slot === 'rug') return { x, y: y - it.h, w: it.w, h: it.h };
  return null;
}

const FIXED_WALL_RECTS = ['door', 'window', 'poster', 'clock', 'wardrobe', 'bed', 'bookcase', 'desk'].map((k) => ({ k, r: FIXED_ROOM[k] }));
const FIXED_FEET = ['bed', 'bookcase', 'wardrobe', 'desk'].map((k) => FIXED_ROOM[k].foot);

export function snap(v, on, grid = GRID) { return on ? Math.round(v / grid) * grid : Math.round(v); }

/** Ramène (x,y) dans la zone autorisée pour le type d'objet (sans garantir l'absence de collision). */
export function clampToSlot(it, x, y) {
  x = clamp(Math.round(x), 0, SCREEN.w - it.w);
  if (it.slot === 'floor' || it.slot === 'rug') y = clamp(Math.round(y), Math.max(FLOOR_BAND.top, it.slot === 'rug' ? 142 : FLOOR_BAND.top), FLOOR_BAND.bottom);
  else if (it.slot === 'ceiling') y = clamp(Math.round(y), 0, 6);
  else y = clamp(Math.round(y), WALL_REGION.y, WALL_REGION.y + WALL_REGION.h - it.h);
  return { x, y };
}

/**
 * Vérifie un placement. Renvoie {ok, reason}.
 * @param ignoreUid objet en cours de déplacement (ignoré dans les collisions)
 */
export function validatePlacement(state, itemId, x, y, ignoreUid = null) {
  const it = ITEM_BY_ID[itemId];
  if (!it || !it.placeable) return { ok: false, reason: 'Cet objet ne se place pas.' };
  const c = clampToSlot(it, x, y);
  if (c.x !== Math.round(x) || c.y !== Math.round(y)) return { ok: false, reason: 'Hors de la zone autorisée.' };

  const others = state.placed.filter((p) => p.uid !== ignoreUid).map((p) => ({ p, it: ITEM_BY_ID[p.id] })).filter((o) => o.it);

  if (it.slot === 'floor') {
    const f = footprint(it, x, y);
    for (const ft of FIXED_FEET) if (rectsOverlap(f, ft)) return { ok: false, reason: 'Un meuble occupe déjà cet endroit.' };
    for (const k of KEEP_CLEAR) if (rectsOverlap(f, k)) return { ok: false, reason: 'Laisse le passage libre ' + k.why + '.' };
    for (const o of others) {
      if (o.it.slot !== 'floor') continue;
      if (rectsOverlap(f, footprint(o.it, o.p.x, o.p.y))) return { ok: false, reason: 'Ça chevauche un autre objet.' };
    }
    // un objet au sol ne doit pas masquer entièrement une fenêtre/porte : on interdit de cacher la porte
    const vr = visualRect(it, x, y);
    if (rectsOverlap(vr, FIXED_ROOM.door)) return { ok: false, reason: 'Ça cacherait la porte.' };
    return { ok: true };
  }

  if (it.slot === 'rug') {
    const f = footprint(it, x, y);
    for (const o of others) if (o.it.slot === 'rug' && rectsOverlap(f, footprint(o.it, o.p.x, o.p.y))) return { ok: false, reason: 'Un tapis recouvre déjà ce sol.' };
    return { ok: true };
  }

  // mur / plafond
  const vr = visualRect(it, x, y);
  if (it.slot === 'wall' && (vr.y < WALL_REGION.y || vr.y + vr.h > WALL_REGION.y + WALL_REGION.h)) return { ok: false, reason: 'Hors du mur.' };
  if (it.slot === 'ceiling' && vr.y + 0 > CEILING_REGION.y + 6) return { ok: false, reason: 'Ça s\'accroche au plafond.' };
  for (const f of FIXED_WALL_RECTS) if (rectsOverlap(vr, f.r)) return { ok: false, reason: 'Un élément de la chambre est déjà là.' };
  for (const o of others) {
    if (o.it.slot !== 'wall' && o.it.slot !== 'ceiling') continue;
    if (rectsOverlap(vr, visualRect(o.it, o.p.x, o.p.y))) return { ok: false, reason: 'Ça chevauche un autre objet.' };
  }
  return { ok: true };
}

export const placedCount = (state, id) => state.placed.filter((p) => p.id === id).length;
export const availableCount = (state, id) => (state.owned[id] || 0) - placedCount(state, id);

let uidCounter = 0;
function newUid(state) {
  let uid;
  do { uid = 'p' + (++uidCounter).toString(36) + Math.floor(Math.random() * 1e4).toString(36); } while (state.placed.some((p) => p.uid === uid));
  return uid;
}

/** Cherche une position valide proche de (x,y) : utilisée quand on pose un objet depuis l'inventaire. */
export function findFreeSpot(state, itemId, hintX = 160, hintY = 150) {
  const it = ITEM_BY_ID[itemId];
  if (!it) return null;
  const start = clampToSlot(it, hintX, hintY);
  for (let r = 0; r < 340; r += 4) {
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const c = clampToSlot(it, start.x + Math.cos(ang) * r, start.y + Math.sin(ang) * r * 0.6);
      if (validatePlacement(state, itemId, c.x, c.y).ok) return c;
    }
  }
  return null;
}

/** Historique d'annulation : conserve les 40 dernières opérations. */
export class DecorHistory {
  constructor(state, onChange = () => {}) { this.state = state; this.stack = []; this.onChange = onChange; }
  setState(state) { this.state = state; this.stack.length = 0; }
  push(op) { this.stack.push(op); if (this.stack.length > 40) this.stack.shift(); }
  get canUndo() { return this.stack.length > 0; }

  place(itemId, x, y) {
    if (availableCount(this.state, itemId) <= 0) return { ok: false, reason: 'Tu n\'en as plus de disponible.' };
    const v = validatePlacement(this.state, itemId, x, y);
    if (!v.ok) return v;
    const uid = newUid(this.state);
    this.state.placed.push({ uid, id: itemId, x: Math.round(x), y: Math.round(y) });
    this.state.stats.items++;
    this.push({ type: 'place', uid });
    this.onChange();
    return { ok: true, uid };
  }

  move(uid, x, y) {
    const p = this.state.placed.find((q) => q.uid === uid);
    if (!p) return { ok: false, reason: 'Introuvable.' };
    const v = validatePlacement(this.state, p.id, x, y, uid);
    if (!v.ok) return v;
    if (p.x === Math.round(x) && p.y === Math.round(y)) return { ok: true, unchanged: true };
    this.push({ type: 'move', uid, from: { x: p.x, y: p.y } });
    p.x = Math.round(x); p.y = Math.round(y);
    this.onChange();
    return { ok: true };
  }

  remove(uid) {
    const i = this.state.placed.findIndex((q) => q.uid === uid);
    if (i < 0) return { ok: false, reason: 'Introuvable.' };
    const [item] = this.state.placed.splice(i, 1);
    this.push({ type: 'remove', item, index: i });
    this.onChange();
    return { ok: true };
  }

  undo() {
    const op = this.stack.pop();
    if (!op) return false;
    if (op.type === 'place') {
      const i = this.state.placed.findIndex((q) => q.uid === op.uid);
      if (i >= 0) this.state.placed.splice(i, 1);
    } else if (op.type === 'move') {
      const p = this.state.placed.find((q) => q.uid === op.uid);
      if (p) { p.x = op.from.x; p.y = op.from.y; }
    } else if (op.type === 'remove') {
      // ne restaure que si l'emplacement est toujours valide, sinon cherche une place libre
      const it = op.item;
      const ok = validatePlacement(this.state, it.id, it.x, it.y).ok;
      const spot = ok ? { x: it.x, y: it.y } : findFreeSpot(this.state, it.id, it.x, it.y);
      if (spot) this.state.placed.splice(Math.min(op.index, this.state.placed.length), 0, { ...it, x: spot.x, y: spot.y });
    }
    this.onChange();
    return true;
  }
}
