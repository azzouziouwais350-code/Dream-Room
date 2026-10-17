// Primitives de pixel art : palette officielle + teintes dérivées, rectangles, lignes, cercles, bitmaps.
// Tous les dessins restent nets (aucun lissage) : le canvas est mis à l'échelle en nombres entiers.

export const C = {
  // Palette officielle
  abyss: '#080710', night: '#171322', lav: '#B9A0FF', moon: '#F2DDFB', pink: '#FF6EC7', cyan: '#00E5FF', gold: '#FFBE62', plum: '#54406F',
  // Teintes dérivées (restent dans la même famille : le noir et le violet dominent)
  n2: '#1f1830', n3: '#2a2040', p2: '#3d2f58', p3: '#6a5190', lav2: '#8f78d6', lav3: '#d3c4ff',
  woodD: '#241824', wood: '#38263a', woodL: '#554058', woodH: '#7a5a78',
  goldD: '#b87a30', goldL: '#ffd998', pinkD: '#b8438f', cyanD: '#0a8fa6', cyanL: '#9ff6ff',
  fur: '#0c0a15', furH: '#2c2348', glass: '#0d1730', white: '#ffffff', paper: '#e9d6f2', green: '#3c8a78', greenD: '#245a56', greenL: '#6fd0a8',
  red: '#d84a6e',
};

export const W = 320;
export const H = 180;

let _canvasFactory = null;
export function setCanvasFactory(f) { _canvasFactory = f; }
export function mk(w, h) {
  if (_canvasFactory) return _canvasFactory(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
export function ctxOf(c) {
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return g;
}

/** Rectangle plein (coordonnées arrondies : pixels nets). */
export function R(g, color, x, y, w, h) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Dessine dans un canvas neuf. fn(g) */
export function bake(w, h, fn) {
  const c = mk(w, h);
  const g = ctxOf(c);
  fn(g, w, h);
  return c;
}

/** Bitmap en chaînes : '.' transparent. pal : { char: color } */
export function bm(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  return bake(w, h, (g) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch !== '.' && ch !== ' ' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
    }
  });
}

/** Ligne de Bresenham en pixels. */
export function line(g, color, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  g.fillStyle = color;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/** Disque plein (pixels). */
export function disc(g, color, cx, cy, r) {
  g.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y) + 0.5);
    g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

/** Anneau (pixels). */
export function ring(g, color, cx, cy, r, th = 1) {
  g.fillStyle = color;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.sqrt(x * x + y * y);
    if (d <= r + 0.4 && d > r - th + 0.4) g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
  }
}

/** Ellipse pleine. */
export function ellipse(g, color, cx, cy, rx, ry) {
  g.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.0001)) + 0.5);
    g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('');
}

export function rgba(hex, a) {
  const p = parseInt(hex.slice(1), 16);
  return `rgba(${(p >> 16) & 255},${(p >> 8) & 255},${p & 255},${a})`;
}

/** Remplissage tramé (damier 2x2) pour des dégradés sans flou. */
export function dither(g, color, x, y, w, h, phase = 0) {
  g.fillStyle = color;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i += 2) g.fillRect(x + i + ((j + phase) & 1), y + j, 1, 1);
}

/** Petite police pixel 3x5 pour chiffres et lettres (utilisée sur les écrans CRT et le néon). */
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
  ':': '000010000010000', '.': '000000000000010', '-': '000000111000000', '_': '000000000000111', '>': '100010001010100', '?': '110001010000010',
  '/': '001001010100100', '!': '010010010000010', ' ': '000000000000000',
};
export function text3x5(g, color, str, x, y, scale = 1) {
  g.fillStyle = color;
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const f = FONT[ch] || FONT['?'];
    for (let i = 0; i < 15; i++) if (f[i] === '1') g.fillRect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale);
    cx += 4 * scale;
  }
  return cx - x;
}
export const text3x5Width = (str, scale = 1) => str.length * 4 * scale - scale;
