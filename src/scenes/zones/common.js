// Outils communs aux zones : couloir en perspective cuit pixel par pixel, portes murales, symboles, texte.
import { C, W, H, R, mk, ctxOf, bm, disc, line, text3x5, rgba, mix, dither } from '../../art/pixel.js';

export const K = 80; // distance focale
export const CX = 160, CY = 90;

export const hex = (c) => parseInt(c.slice(1), 16);
export const rgb = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
export function shade(n, f) { const [r, g, b] = rgb(n); return (Math.min(255, Math.round(r * f)) << 16) | (Math.min(255, Math.round(g * f)) << 8) | Math.min(255, Math.round(b * f)); }
export function blend(a, b, t) { const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b); return (Math.round(r1 + (r2 - r1) * t) << 16) | (Math.round(g1 + (g2 - g1) * t) << 8) | Math.round(b1 + (b2 - b1) * t); }

/** Projection d'un point 3D (X horizontal, Y vertical vers le bas, z profondeur). */
export const proj = (X, Y, z) => ({ x: CX + (X * K) / z, y: CY + (Y * K) / z });

/**
 * Couloir en perspective : chaque pixel est lancé comme un rayon. opts :
 * halfW, h (demi-hauteur), zEnd, wall(side,z,Y)->0xRRGGBB, floor(X,z), ceil(X,z), end(X,Y), fog:{color, amount}
 */
export function bakeCorridor({ halfW = 40, h = 36, zEnd = 100, wall, floor, ceil, end, fog = { color: 0x080710, amount: 0.7 } }) {
  const c = mk(W, H); const g = ctxOf(c);
  const img = g.createImageData(W, H); const d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dy = y - CY, dx = x - CX;
    const zf = dy !== 0 ? (h * K) / Math.abs(dy) : Infinity;
    const zw = dx !== 0 ? (halfW * K) / Math.abs(dx) : Infinity;
    let z, col;
    if (Math.min(zf, zw) > zEnd) {
      z = zEnd; col = end(((x - CX) * zEnd) / K, ((y - CY) * zEnd) / K);
    } else if (zf < zw) {
      z = zf; const X = (dx * z) / K;
      col = dy > 0 ? floor(X, z) : ceil(X, z);
    } else {
      z = zw; const Y = (dy * z) / K;
      col = wall(dx < 0 ? -1 : 1, z, Y);
    }
    const f = Math.min(1, z / zEnd) * fog.amount;
    col = blend(col, fog.color, f);
    const i = (y * W + x) * 4;
    d[i] = (col >> 16) & 255; d[i + 1] = (col >> 8) & 255; d[i + 2] = col & 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Dessine une portion de mur (colonnes de 1 px) entre deux profondeurs : porte, fenêtre, ouverture…
 * side -1 gauche / 1 droite ; Y0..Y1 hauteur ; colFn(u,v,x,y) -> couleur CSS ou null (u,v dans 0..1 sur la surface). */
export function wallPatch(g, side, z1, z2, Y0, Y1, colFn, halfW = 40) {
  const xa = Math.round(CX + (side * halfW * K) / z1), xb = Math.round(CX + (side * halfW * K) / z2);
  const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
  for (let x = x0; x < x1; x++) {
    const dx = x - CX; if (!dx) continue;
    const z = (halfW * K) / Math.abs(dx);
    const u = (z - z1) / (z2 - z1);
    const top = CY + (Y0 * K) / z, bot = CY + (Y1 * K) / z;
    const rows = Math.max(1, Math.round(bot - top));
    for (let r = 0; r < rows; r += 1) {
      const v = r / rows;
      const col = colFn(side < 0 ? u : 1 - u, v, x, top + r, rows);
      if (col) { g.fillStyle = col; g.fillRect(x, Math.round(top + r), 1, 1); }
    }
  }
  return { x: x0, y: Math.round(CY + (Math.min(Y0, Y1) * K) / ((z1 + z2) / 2)), w: x1 - x0, h: Math.round(((Y1 - Y0) * K) / ((z1 + z2) / 2)) };
}

/** Rectangle écran couvrant un morceau de mur (pour les zones cliquables). */
export function wallRect(side, z1, z2, Y0, Y1, halfW = 40) {
  const xa = CX + (side * halfW * K) / z1, xb = CX + (side * halfW * K) / z2;
  const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
  const ys = [CY + (Y0 * K) / z1, CY + (Y1 * K) / z1, CY + (Y0 * K) / z2, CY + (Y1 * K) / z2];
  return { x: Math.floor(x0), y: Math.floor(Math.min(...ys)), w: Math.ceil(x1 - x0), h: Math.ceil(Math.max(...ys) - Math.min(...ys)) };
}

// ------------------------------------------------------------------ symboles
const SYM = {
  moon: ['..###..', '.##....', '##.....', '##.....', '##.....', '.##....', '..###..'],
  star: ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...', '.......'],
  eye: ['.......', '..###..', '.#####.', '##.#.##', '.#####.', '..###..', '.......'],
  door: ['..###..', '.#####.', '.#...#.', '.#...#.', '.#..##.', '.#...#.', '.#####.'],
  lamp: ['..###..', '.#####.', '#######', '..###..', '...#...', '...#...', '..###..'],
  key: ['.###...', '#...#..', '#...#..', '.###...', '..#....', '..##...', '..#.#..'],
};
export function drawSymbol(g, id, x, y, color = C.lav, scale = 1) {
  const rows = SYM[id]; if (!rows) return;
  g.fillStyle = color;
  for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (rows[j][i] === '#') g.fillRect(x + i * scale, y + j * scale, scale, scale);
}
export const SYMBOL_COLOR = { moon: C.lav3, star: C.cyanL, heart: C.pink, door: C.gold, eye: C.moon, lamp: C.gold };

/** Petit cadre « fenêtre rétro » pixelisé pour les plaques dans les scènes. */
export function plaque(g, x, y, w, h, lines, t = 0) {
  R(g, C.abyss, x, y, w, h); R(g, C.lav, x, y, w, 1); R(g, C.lav, x, y + h - 1, w, 1); R(g, C.lav, x, y, 1, h); R(g, C.lav, x + w - 1, y, 1, h);
  lines.forEach((l, i) => text3x5(g, i === 0 ? C.moon : C.p3, l, x + 3, y + 3 + i * 6));
}

/** Étoiles de fond partagées. */
export function starsBg(g, t, n = 60, seed = 1, h = H) {
  let s = seed * 2654435761 >>> 0;
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const x = s % W;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const y = s % h;
    const tw = Math.sin(t * 1.5 + i);
    g.fillStyle = tw > 0.4 ? C.white : tw > -0.3 ? C.moon : C.p3;
    g.fillRect(x, y, 1, 1);
  }
}

export function moonDisc(g, cx, cy, r, f = 1, cracked = false) {
  const off = (1 - f) * r * 1.9;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y > r * r + r * 0.3) continue;
    const sx = x - off; if (f < 0.999 && sx * sx + y * y <= r * r) continue;
    const t = x + y * 0.4;
    g.fillStyle = t < -r * 0.25 ? C.white : t < r * 0.5 ? C.moon : C.lav3;
    g.fillRect(cx + x, cy + y, 1, 1);
  }
  if (f > 0.4) {
    const craters = [[-0.3, -0.25, 0.14], [0.25, 0.1, 0.1], [-0.05, 0.35, 0.12], [0.35, -0.35, 0.07]];
    for (const [a, b, c] of craters) { disc(g, C.lav, cx + Math.round(a * r), cy + Math.round(b * r), Math.max(1, Math.round(c * r))); }
  }
  if (cracked) { line(g, C.abyss, cx - 1, cy - r, cx + 2, cy); line(g, C.abyss, cx + 2, cy, cx + r - 1, cy + 3); line(g, C.abyss, cx + 2, cy, cx - 3, cy + r); }
}
