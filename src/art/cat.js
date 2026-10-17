// NOIR : chat noir dessiné pose par pose en pixel art (aucune recoloration d'un sprite unique).
// Repère local : pieds en (0,0), +x = vers l'avant, y négatif = vers le haut. La direction (±1) retourne le dessin.
import { C, R, line } from './pixel.js';

const FUR = C.fur, RIM = C.furH, FAR = '#16112a', EAR = '#7a3d7a';

/**
 * o = { x, y, dir, pose, t, ph, blink, eyes, look, tail, wag, sx, breathe, acc:{collar,bow,hat,scarf,crown}, hop }
 * poses : stand walk run sit groom loaf stretch crouch leap alert pet
 */
export function drawCat(g, o) {
  const dir = o.dir < 0 ? -1 : 1;
  const sx = o.sx ?? 1;
  const t = o.t || 0;
  const px = Math.round(o.x), py = Math.round(o.y);
  const r = (lx, ly, w, h, c) => {
    const a = lx * sx, b = Math.max(1, Math.round(w * sx));
    const X = dir > 0 ? px + Math.round(a) : px - Math.round(a) - b;
    g.fillStyle = c; g.fillRect(X, py + ly, b, h);
  };
  const lineL = (x0, y0, x1, y1, c, th = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) r(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), th, th, c);
  };
  const eyes = (ex, ey, kind = 'open', big = false) => {
    if (kind === 'closed') { r(ex, ey + 1, 2, 1, RIM); r(ex + 3, ey + 1, 2, 1, RIM); return; }
    if (kind === 'happy') { r(ex, ey + 1, 1, 1, C.gold); r(ex + 1, ey, 1, 1, C.gold); r(ex + 2, ey + 1, 1, 1, C.gold); r(ex + 3, ey + 1, 1, 1, C.gold); r(ex + 4, ey, 1, 1, C.gold); r(ex + 5, ey + 1, 1, 1, C.gold); return; }
    const h = big ? 3 : 2;
    r(ex, ey, 2, h, C.gold); r(ex + 3, ey, 2, h, C.gold);
    r(ex + 1, ey, 1, h, C.abyss); r(ex + 4, ey, 1, h, C.abyss);
    r(ex, ey, 1, 1, C.goldL);
  };
  const eyeKind = o.blink ? 'closed' : o.eyes || 'open';
  const lk = o.look || { x: 0, y: 0 };
  const acc = o.acc || {};
  let head = { x: 4, y: -16 }; // coin haut-gauche de la tête (pour les accessoires)
  let neck = { x: 3, y: -11 };

  const tail = (bx, by, len, lift, wag, ph = 0) => {
    for (let i = 0; i < len; i++) {
      const x = bx - 1 - Math.round(i * (1 - lift * 0.6));
      const y = by - Math.round(i * lift * 1.5 + Math.sin(t * 3.2 + i * 0.55 + ph) * wag * (i / len) * 2);
      r(x, y, 2, 2, i % 3 === 2 ? RIM : FUR);
    }
  };

  switch (o.pose) {
    case 'walk': case 'stand': case 'run': case 'alert': {
      const run = o.pose === 'run';
      const ph = o.ph || 0;
      const moving = o.pose !== 'stand' && o.pose !== 'alert';
      const amp = run ? 4 : 2;
      const lo = (k) => (moving ? Math.round(Math.sin(ph + k) * amp) : 0);
      const lift = (k) => (moving && Math.cos(ph + k) > 0.4 ? (run ? 2 : 1) : 0);
      const bob = moving ? Math.round(Math.abs(Math.sin(ph)) * (run ? 1 : 0)) : 0;
      const bodyY = run ? -9 : -11;
      // pattes lointaines puis proches
      for (const [lx, k, c] of [[5, Math.PI, FAR], [-6, 0, FAR]]) r(lx + lo(k), -4 - lift(k) + 0, 2, 4 - 0, c);
      // corps
      r(-9, bodyY + 1 - bob, run ? 17 : 14, 6, FUR); r(-8, bodyY - bob, run ? 15 : 12, 1, FUR); r(-8, bodyY + 7 - bob, run ? 15 : 12, 1, FUR);
      r(-7, bodyY - bob, run ? 14 : 10, 1, RIM); r(-9, bodyY + 1 - bob, 1, 2, RIM);
      // tête
      const hy = run ? -14 : (o.pose === 'alert' ? -17 : -16);
      const hx = run ? 7 : 4;
      head = { x: hx, y: hy - bob }; neck = { x: hx - 1, y: hy + 5 - bob };
      r(hx - 1, hy + 3 - bob, 4, 4, FUR);
      r(hx + (lk.x > 0 ? 1 : 0), hy - bob, 8, 7, FUR); r(hx + 1, hy - 1 - bob, 6, 1, FUR); r(hx + 2, hy - 1 - bob, 4, 1, RIM);
      const ey = o.pose === 'alert' ? 2 : 0;
      r(hx + 1, hy - 3 - bob - ey, 2, 3 + ey, FUR); r(hx + 6, hy - 3 - bob - ey, 2, 3 + ey, FUR); r(hx + 2, hy - 2 - bob - ey, 1, 2, EAR); r(hx + 6, hy - 2 - bob - ey, 1, 2, EAR);
      eyes(hx + 2, hy + 2 - bob, eyeKind, o.pose === 'alert');
      r(hx + 8, hy + 4 - bob, 1, 1, C.pinkD); r(hx + 7, hy + 5 - bob, 1, 1, RIM);
      // pattes proches
      for (const [lx, k] of [[3, 0], [-8, Math.PI]]) {
        r(lx + lo(k), -4 - lift(k), 2, 4, FUR); r(lx + lo(k), -1 - lift(k), 3, 1, RIM);
      }
      if (run) { r(-11, -8, 3, 2, FUR); }
      tail(-9, run ? -7 : -9, run ? 8 : 7, run ? 0.1 : (o.tail ?? 0.55), o.wag ?? 0.7);
      break;
    }
    case 'sit': case 'groom': case 'pet': {
      const groom = o.pose === 'groom';
      const happy = o.pose === 'pet';
      const up = happy ? -1 : 0;
      // queue au sol
      for (let i = 0; i < 8; i++) r(-9 - i, -2 + (i > 5 ? -Math.round(Math.sin(t * (happy ? 7 : 2.4)) * (i - 5) * 0.8 + (i - 5)) : 0), 2, 2, i % 3 === 2 ? RIM : FUR);
      // arrière-train + dos
      r(-8, -9, 10, 9, FUR); r(-7, -10, 8, 1, FUR); r(-6, -10, 6, 1, RIM); r(-9, -6, 1, 5, FUR);
      r(-4, -14, 7, 6, FUR); r(-3, -15, 5, 1, RIM);
      r(0, -13, 5, 13, FUR); r(5, -8, 1, 8, FAR);
      // pattes avant
      r(2, -8, 2, 8, FUR); r(2, -1, 5, 1, RIM); r(3, -8, 1, 7, FAR);
      // tête
      const hy = groom ? -17 : -22 + up;
      const hx = groom ? 2 : 1;
      head = { x: hx, y: hy }; neck = { x: hx + 1, y: hy + 7 };
      r(hx, hy, 10, 8, FUR); r(hx + 1, hy - 1, 8, 1, FUR); r(hx + 2, hy - 1, 6, 1, RIM);
      const earUp = o.pose === 'alert' ? 1 : 0;
      r(hx + 1, hy - 4 - earUp, 2, 4 + earUp, FUR); r(hx + 7, hy - 4 - earUp, 2, 4 + earUp, FUR); r(hx + 2, hy - 3 - earUp, 1, 2, EAR); r(hx + 7, hy - 3 - earUp, 1, 2, EAR);
      eyes(hx + 2 + (lk.x > 0 ? 1 : 0), hy + 3 + (lk.y < 0 ? -1 : 0), groom ? 'closed' : happy ? 'happy' : eyeKind);
      r(hx + 9, hy + 5, 1, 1, C.pinkD); r(hx + 8, hy + 6, 1, 1, RIM);
      if (groom) {
        const lick = Math.sin(t * 9) > 0;
        r(7, -14 - (lick ? 2 : 0), 2, 6, FUR); r(7, -14 - (lick ? 2 : 0), 2, 1, RIM);
        if (lick) r(hx + 8, hy + 7, 2, 1, C.pink);
      }
      break;
    }
    case 'loaf': {
      const br = Math.round(Math.sin(t * 1.7) * 0.7 + 0.5);
      const rows = [[-11, 8], [-12, 9], [-12, 9], [-11, 8], [-9, 6], [-6, 3]];
      rows.forEach(([a, b], i) => { r(a, -1 - i - (i > 3 ? 0 : 0) - (i >= 3 ? br : 0), b - a + 1, 1, i === 5 ? RIM : FUR); });
      r(-10, -4, 1, 2, RIM);
      // tête posée sur les pattes
      head = { x: 4, y: -6 }; neck = { x: 4, y: -3 };
      r(4, -6, 8, 6, FUR); r(5, -7, 6, 1, FUR); r(5, -7, 4, 1, RIM);
      r(5, -9, 2, 3, FUR); r(9, -9, 2, 3, FUR); r(6, -8, 1, 2, EAR); r(9, -8, 1, 2, EAR);
      eyes(6, -4, o.blink ? 'closed' : 'closed');
      r(12, -3, 1, 1, C.pinkD);
      // queue enroulée devant
      r(0, -1, 10, 1, RIM); r(10, -2, 2, 2, FUR);
      break;
    }
    case 'stretch': {
      const k = o.ph || 0; // 0..1
      const up = Math.round(4 + k * 3);
      // pattes arrière droites
      r(-9, -up - 2, 2, up + 2, FUR); r(-6, -up - 2, 2, up + 2, FAR);
      // dos incliné
      for (let i = 0; i < 12; i++) { const y = -up - 4 + Math.round((i / 11) * (up - 1)); r(-8 + i, y, 2, 4, i % 4 === 0 ? RIM : FUR); }
      // pattes avant tendues
      lineL(3, -3, 11, -1, FUR, 2); lineL(5, -2, 12, 0, FAR, 1);
      r(10, -1, 3, 1, RIM);
      head = { x: 5, y: -8 }; neck = { x: 5, y: -5 };
      r(5, -7, 8, 6, FUR); r(6, -8, 6, 1, RIM); r(6, -10, 2, 3, FUR); r(10, -10, 2, 3, FUR);
      eyes(7, -5, 'closed');
      tail(-9, -up - 2, 8, 0.9, 0.4);
      break;
    }
    case 'crouch': case 'leap': {
      const leap = o.pose === 'leap';
      if (leap) {
        lineL(-9, -2, 5, -10, FUR, 4); lineL(-8, -3, 4, -11, RIM, 1);
        lineL(-10, -1, -12, 2, FUR, 2); lineL(-7, -1, -9, 3, FAR, 2);
        lineL(5, -9, 12, -12, FUR, 2); lineL(3, -8, 10, -10, FAR, 2);
        head = { x: 6, y: -17 }; neck = { x: 5, y: -12 };
        r(6, -16, 8, 7, FUR); r(7, -17, 6, 1, RIM); r(7, -20, 2, 4, FUR); r(11, -20, 2, 4, FUR);
        eyes(8, -14, 'open', true);
        tail(-10, -3, 8, 0.2, 0.3);
      } else {
        const wig = Math.round(Math.sin(t * 22) * 1);
        r(-9 + wig, -7, 15, 5, FUR); r(-8 + wig, -8, 13, 1, FUR); r(-7 + wig, -8, 10, 1, RIM);
        r(-9, -4 - 0, 2, 4, FUR); r(-5, -2, 2, 2, FAR); r(2, -3, 2, 3, FUR); r(2, -1, 5, 1, RIM);
        head = { x: 6, y: -10 }; neck = { x: 5, y: -7 };
        r(6, -10, 8, 7, FUR); r(7, -11, 6, 1, RIM); r(7, -13, 2, 3, FUR); r(11, -13, 2, 3, FUR); r(8, -12, 1, 2, EAR); r(11, -12, 1, 2, EAR);
        eyes(8, -8, 'open', true);
        tail(-9, -6, 7, 0.4, 1.8);
      }
      break;
    }
    default: break;
  }

  // accessoires
  if (acc.collar) { r(neck.x, neck.y, 5, 1, C.pink); r(neck.x + 2, neck.y + 1, 1, 1, C.gold); }
  if (acc.scarf) { r(neck.x - 1, neck.y - 1, 6, 2, C.lav); r(neck.x - 1, neck.y - 1, 6, 1, C.lav3); r(neck.x - 1, neck.y + 1, 2, 4, C.lav2); r(neck.x - 1, neck.y + 3, 2, 1, C.lav3); }
  if (acc.bow) { r(neck.x + 1, neck.y - 1, 2, 3, C.pink); r(neck.x + 3, neck.y - 1, 2, 3, C.pink); r(neck.x + 2, neck.y, 1, 1, C.pinkD); r(neck.x + 1, neck.y + 2, 1, 1, C.pinkD); }
  if (acc.hat) { r(head.x + 1, head.y - 2, 7, 2, C.lav); r(head.x + 2, head.y - 5, 5, 3, C.lav2); r(head.x + 3, head.y - 7, 3, 2, C.lav2); r(head.x + 4, head.y - 9, 1, 2, C.gold); r(head.x + 3, head.y - 8, 3, 1, C.gold); r(head.x + 2, head.y - 3, 1, 1, C.gold); }
  if (acc.crown) { r(head.x + 2, head.y - 3, 6, 2, C.gold); r(head.x + 2, head.y - 5, 1, 2, C.gold); r(head.x + 4, head.y - 6, 1, 3, C.gold); r(head.x + 7, head.y - 5, 1, 2, C.gold); r(head.x + 3, head.y - 3, 1, 1, C.goldL); }
}

/** Ombre portée (ellipse aplatie, trame pour rester nette). */
export function drawCatShadow(g, x, y, w = 12) {
  g.fillStyle = 'rgba(8,7,16,0.45)';
  g.fillRect(Math.round(x - w), Math.round(y), w * 2, 2);
  g.fillStyle = 'rgba(8,7,16,0.25)';
  g.fillRect(Math.round(x - w - 2), Math.round(y) + 1, w * 2 + 4, 1);
}
