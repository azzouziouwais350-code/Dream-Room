// Décor statique de la chambre (mur gothique, plancher, moulures) + éléments dynamiques (écran CRT, aiguilles, rideaux, halos).
import { C, W, H, R, bake, line, disc, mix, dither, text3x5, rgba } from './pixel.js';
import { FIXED_ROOM } from '../data/items.js';

/** Mur + sol cuits une fois. La fenêtre, la porte et les meubles sont dessinés par-dessus. */
export function bakeRoomBase() {
  return bake(W, H, (g) => {
    const WB = FIXED_ROOM.wallBottom;
    // papier peint : rayures verticales + motifs d'étoiles discrets
    for (let x = 0; x < W; x += 8) R(g, (x / 8) % 2 ? '#1f1833' : '#1b152e', x, 0, 8, WB);
    for (let y = 14; y < 90; y += 20) for (let x = 4 + ((y / 20) % 2) * 8; x < W; x += 16) { R(g, '#2c2248', x, y, 1, 1); R(g, '#2c2248', x - 1, y, 1, 1); R(g, '#2c2248', x + 1, y, 1, 1); R(g, '#2c2248', x, y - 1, 1, 1); R(g, '#2c2248', x, y + 1, 1, 1); }
    // lambris bas avec niches gothiques
    R(g, '#2a2040', 0, 92, W, WB - 92);
    for (let x = 4; x < W; x += 20) {
      R(g, '#1a1430', x, 98, 14, 18);
      R(g, '#1a1430', x + 2, 96, 10, 2); R(g, '#1a1430', x + 4, 94, 6, 2); R(g, '#1a1430', x + 6, 93, 2, 1);
      R(g, '#3a2e58', x, 98, 1, 18); R(g, '#3a2e58', x + 2, 96, 1, 2); R(g, '#3a2e58', x + 4, 94, 1, 2); R(g, '#3a2e58', x + 6, 93, 1, 1);
      R(g, '#150f26', x + 13, 98, 1, 18);
    }
    R(g, C.woodL, 0, 89, W, 2); R(g, C.woodH, 0, 89, W, 1); R(g, C.woodD, 0, 91, W, 1);
    // plinthe
    R(g, C.wood, 0, WB - 4, W, 4); R(g, C.woodH, 0, WB - 4, W, 1); R(g, C.woodD, 0, WB - 1, W, 1);
    // corniche + arcs pointus au plafond
    R(g, C.woodD, 0, 0, W, 3); R(g, C.wood, 0, 3, W, 2); R(g, C.woodL, 0, 5, W, 1);
    for (let x = 0; x < W; x += 24) {
      R(g, '#140f24', x + 2, 6, 20, 1); R(g, '#140f24', x + 4, 7, 16, 1); R(g, '#140f24', x + 7, 8, 10, 1); R(g, '#140f24', x + 10, 9, 4, 1); R(g, '#140f24', x + 11, 10, 2, 1);
      R(g, '#2d2350', x + 2, 6, 1, 1); R(g, '#2d2350', x + 4, 7, 1, 1);
    }
    // ombre de coin
    dither(g, '#0b0916', 0, 10, 4, 80); dither(g, '#0b0916', W - 4, 10, 4, 80);
    // plancher : lattes en perspective
    const ys = [WB, 126, 133, 141, 150, 160, 171, H];
    for (let i = 0; i < ys.length - 1; i++) {
      const y0 = ys[i], y1 = ys[i + 1];
      R(g, i % 2 ? '#241a2d' : '#2b2034', 0, y0, W, y1 - y0);
      R(g, '#170f1f', 0, y0, W, 1);
      R(g, '#3a2a44', 0, y0 + 1, W, 1);
      const step = 38 + i * 8;
      for (let x = ((i * 23) % step); x < W; x += step) R(g, '#170f1f', x, y0 + 1, 1, y1 - y0 - 1);
    }
    // ombre au pied du mur
    R(g, 'rgba(8,7,16,0.4)', 0, WB, W, 3); R(g, 'rgba(8,7,16,0.2)', 0, WB + 3, W, 3);
    dither(g, '#0b0916', 0, 160, 10, 20); dither(g, '#0b0916', W - 10, 160, 10, 20);
  });
}

export function drawClockHands(g, x, y, hour, minute, spin = null) {
  const cx = x + 9.5, cy = y + 9.5;
  let mAng, hAng;
  if (spin !== null) { mAng = -spin * 8; hAng = -spin * 0.7; }
  else { mAng = (minute / 60) * Math.PI * 2; hAng = (((hour % 12) + minute / 60) / 12) * Math.PI * 2; }
  const ex = (a, l) => [cx + Math.sin(a) * l, cy - Math.cos(a) * l];
  const [hx, hy] = ex(hAng, 4), [mx, my] = ex(mAng, 6);
  line(g, C.abyss, cx, cy, hx, hy); line(g, C.plum, cx, cy, mx, my);
  R(g, C.pink, Math.round(cx), Math.round(cy), 1, 1);
}

export function bakeCRT() {
  return bake(34, 30, (g) => {
    R(g, '#2a2440', 0, 0, 34, 26); R(g, '#4a4068', 0, 0, 34, 1); R(g, '#4a4068', 0, 0, 1, 26); R(g, '#171322', 33, 0, 1, 26); R(g, '#171322', 0, 25, 34, 1);
    R(g, '#171322', 3, 2, 28, 22); R(g, '#080710', 4, 3, 26, 20);
    R(g, '#3a3254', 0, 26, 34, 4); R(g, '#171322', 4, 29, 26, 1); R(g, '#4a4068', 2, 26, 30, 1);
    R(g, '#171322', 28, 24, 3, 1);
  });
}

/** Contenu de l'écran CRT : (sx,sy) = coin du verre (26×20). */
export function drawCRTScreen(g, sx, sy, t, mode = 'idle', pulse = 1) {
  R(g, '#06121c', sx, sy, 26, 20);
  if (mode === 'message') {
    R(g, C.cyan, sx + 6, sy + 5, 14, 9); R(g, '#06121c', sx + 7, sy + 6, 12, 7); line(g, C.cyan, sx + 7, sy + 6, sx + 13, sy + 10); line(g, C.cyan, sx + 19, sy + 6, sx + 13, sy + 10);
    if (Math.sin(t * 6) > 0) R(g, C.pink, sx + 20, sy + 4, 3, 3);
  } else {
    text3x5(g, C.cyan, 'DREAM', sx + 3, sy + 3);
    R(g, C.cyanD, sx + 3, sy + 9, 20, 1);
    for (let i = 0; i < 3; i++) R(g, i === 0 ? C.lav : C.p3, sx + 3, sy + 11 + i * 2, 8 + ((i * 7) % 11), 1);
    if (Math.sin(t * 3) > 0) R(g, C.cyan, sx + 3, sy + 17, 2, 1);
    // petite lune qui rebondit
    const mx = sx + 15 + Math.round(Math.sin(t * 0.7) * 5), my = sy + 14 + Math.round(Math.cos(t * 0.9) * 2);
    R(g, C.moon, mx, my, 2, 2);
  }
  // lignes de balayage + reflet
  g.fillStyle = 'rgba(0,0,0,0.28)';
  for (let y = 0; y < 20; y += 2) g.fillRect(sx, sy + y, 26, 1);
  g.fillStyle = `rgba(0,229,255,${0.05 * pulse})`; g.fillRect(sx, sy, 26, 20);
  R(g, 'rgba(255,255,255,0.18)', sx + 1, sy + 1, 5, 1); R(g, 'rgba(255,255,255,0.12)', sx + 1, sy + 2, 1, 3);
}

/** Rideaux animés : colonnes décalées par le vent. side = -1 (gauche) ou 1 (droite). */
export function drawCurtain(g, x, y, h, side, t, wind = 0.2, reduce = false) {
  const w = 12;
  for (let row = 0; row < h; row += 2) {
    const k = row / h;
    const sway = reduce ? 0 : Math.sin(t * 1.3 + row * 0.12) * wind * 3 * k + Math.sin(t * 0.6) * wind * 1.5 * k;
    const edge = Math.round(sway * side * -1);
    const wdt = w - Math.round(k * 2) + (side * edge > 0 ? 0 : 0);
    const x0 = side < 0 ? x : x + 4;
    R(g, C.plum, x0, y + row, wdt + edge * (side < 0 ? 1 : -1), 2);
  }
  // plis
  for (let i = 0; i < 3; i++) {
    const fx = (side < 0 ? x + 2 : x + 6) + i * 3;
    for (let row = 0; row < h; row += 2) {
      const k = row / h;
      const sway = reduce ? 0 : Math.sin(t * 1.3 + row * 0.12) * wind * 3 * k;
      R(g, i % 2 ? C.p3 : C.p2, fx + Math.round(sway * side * -1 * 0.8), y + row, 1, 2);
    }
  }
  R(g, C.gold, side < 0 ? x : x + 4, y - 1, 12, 2); R(g, C.goldL, side < 0 ? x : x + 4, y - 1, 12, 1);
}

/** Halo lumineux par anneaux concentriques (additif, sans flou). */
export function glow(g, cx, cy, r, color, a, flick = 0) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const steps = 6;
  for (let i = steps; i >= 1; i--) {
    const k = i / steps;
    g.fillStyle = rgba(color, (a * (1 - k) + a * 0.18) * (1 + flick));
    const rx = Math.round(r * k), ry = Math.round(r * k * 0.8);
    for (let y = -ry; y <= ry; y++) {
      const w = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.001)));
      g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
    }
  }
  g.restore();
}
