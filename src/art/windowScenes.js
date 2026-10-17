// Paysages de la fenêtre : zone vitrée de 66×46 pixels. Chaque scène est une fonction (g, t, o).
// o = { moon: 0..1 (phase issue des souvenirs), wind: 0..1, reduce: bool, figure: bool (silhouette dans les nuages), prog: 0..1 (événements) }
import { C, R, disc, ellipse, line, mix, dither, rgba } from './pixel.js';
import { rng } from '../core/util.js';

export const WW = 66, WH = 46;

const SR = rng(77);
const STARS = Array.from({ length: 80 }, () => ({ x: SR.int(WW), y: SR.int(WH - 8), p: SR() * 6.28, big: SR() < 0.12, hue: SR() }));

function bands(g, list, dith = true) {
  // list : [[color, y0, y1]...] ; zones adjacentes tramées pour un dégradé sans flou
  for (let i = 0; i < list.length; i++) {
    const [c, y0, y1] = list[i];
    R(g, c, 0, y0, WW, y1 - y0);
    if (dith && i + 1 < list.length) dither(g, list[i + 1][0], 0, y1 - 2, WW, 2, i);
  }
}

function stars(g, t, n = 70, maxY = WH - 10, calm = false) {
  for (let i = 0; i < Math.min(n, STARS.length); i++) {
    const s = STARS[i];
    if (s.y > maxY) continue;
    const tw = calm ? 0.8 : Math.sin(t * 1.6 + s.p);
    const col = tw > 0.5 ? C.white : tw > -0.2 ? C.moon : C.p3;
    R(g, col, s.x, s.y, 1, 1);
    if (s.big && tw > 0.2) { R(g, C.lav, s.x - 1, s.y, 1, 1); R(g, C.lav, s.x + 1, s.y, 1, 1); R(g, C.lav, s.x, s.y - 1, 1, 1); R(g, C.lav, s.x, s.y + 1, 1, 1); }
  }
}

/** Lune avec phase f (0 = invisible, 1 = pleine). Fissurée tant que peu de souvenirs. */
function moon(g, cx, cy, r, f, cracked = false) {
  const off = (1 - f) * r * 1.9;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y > r * r + r * 0.3) continue;
    const sx = x - off;
    if (f < 0.999 && sx * sx + y * y <= r * r) continue;
    const shade = x + y * 0.4 < -r * 0.2 ? C.white : x + y * 0.4 < r * 0.5 ? C.moon : C.lav3;
    R(g, shade, cx + x, cy + y, 1, 1);
  }
  if (f > 0.5 && r >= 4) { R(g, C.lav, cx - Math.round(r * 0.3), cy - Math.round(r * 0.2), 2, 2); R(g, C.lav, cx + Math.round(r * 0.25), cy + Math.round(r * 0.3), Math.max(1, r > 8 ? 3 : 1), 1); }
  if (cracked) {
    line(g, C.abyss, cx - 1, cy - r, cx + 1, cy - 1); line(g, C.abyss, cx + 1, cy - 1, cx + r - 1, cy + 2); line(g, C.abyss, cx + 1, cy - 1, cx - 2, cy + r);
  }
}

function cloud(g, x, y, w, col, hi) {
  ellipse(g, col, x, y, w, Math.max(2, Math.round(w / 3)));
  ellipse(g, col, x - Math.round(w * 0.5), y + 1, Math.round(w * 0.6), Math.max(2, Math.round(w / 4)));
  ellipse(g, col, x + Math.round(w * 0.55), y + 1, Math.round(w * 0.55), Math.max(2, Math.round(w / 4)));
  if (hi) R(g, hi, x - Math.round(w * 0.5), y - Math.round(w / 3) + 1, Math.round(w * 0.9), 1);
}

function drift(t, x0, speed, w) { return ((x0 + t * speed) % (WW + w * 2 + 8) + WW + w * 2 + 8) % (WW + w * 2 + 8) - w - 4; }

function castle(g, x, base, col, s = 1) {
  const h = (n) => Math.round(n * s);
  R(g, col, x, base - h(10), h(14), h(10));
  R(g, col, x - h(3), base - h(16), h(4), h(16)); R(g, col, x + h(13), base - h(18), h(4), h(18));
  for (const tx of [x - h(3), x + h(13)]) { R(g, col, tx + 1, base - h(21) - (tx > x ? 2 : 0), 2, h(3)); }
  R(g, col, x + h(5), base - h(14), h(4), h(4));
  for (let i = 0; i < 4; i++) R(g, col, x + i * h(4), base - h(12), h(2), 2);
}

function ground(g, col, y, ridge = 0) {
  R(g, col, 0, y, WW, WH - y);
  for (let x = 0; x < WW; x += 2) R(g, col, x, y - ((x * 7 + ridge) % 3), 2, 3);
}

function lights(g, list, t) {
  for (const [x, y, c] of list) if (Math.sin(t * 2 + x) > -0.8) R(g, c, x, y, 1, 1);
}

const SCENES = {
  night_stars(g, t, o) {
    bands(g, [[C.abyss, 0, 14], [C.night, 14, 28], [C.n2, 28, 38], [C.n3, 38, WH]]);
    stars(g, t, 80);
    moon(g, 48, 11, 5, o.moon ?? 0.6, (o.moon ?? 1) < 0.3);
    ground(g, '#0c0a18', 40, 3); castle(g, 8, 41, '#0c0a18'); R(g, C.gold, 12, 33, 1, 2); R(g, C.gold, 20, 36, 1, 1);
    lights(g, [[26, 38, C.gold], [48, 40, C.cyan]], t);
  },
  giant_moon(g, t, o) {
    bands(g, [[C.abyss, 0, 12], [C.night, 12, 24], [C.p2, 24, 34], [C.plum, 34, WH]]);
    stars(g, t, 30, 14);
    moon(g, 34, 28, 24, Math.max(0.5, o.moon ?? 0.8), false);
    R(g, C.lav3, 24, 14, 5, 1); R(g, C.lav, 40, 20, 6, 2); R(g, C.lav, 22, 30, 3, 3);
    ground(g, '#0b0916', 41, 1);
    const bx = drift(t, 10, 6, 2); R(g, C.abyss, bx, 12, 3, 1); R(g, C.abyss, bx + 1, 11, 1, 1);
  },
  purple_sky(g, t, o) {
    bands(g, [[C.lav2, 0, 14], [C.lav, 14, 26], [C.lav3, 26, 36], [C.moon, 36, WH]]);
    cloud(g, drift(t, 10, 3, 9), 10, 9, C.moon, C.white); cloud(g, drift(t, 40, 2, 7), 22, 7, C.lav3, C.moon);
    ground(g, C.plum, 40, 5); castle(g, 40, 41, C.p2, 0.8);
    moon(g, 12, 7, 3, 0.4);
  },
  sunset(g, t) {
    // ordre du haut vers le bas : prune, lavande, rose, or  (indice de la bibliothèque)
    bands(g, [[C.plum, 0, 11], [C.lav, 11, 21], [C.pink, 21, 31], [C.gold, 31, 40], [C.goldD, 40, WH]]);
    disc(g, C.goldL, 33, 40, 9);
    R(g, C.gold, 24, 36, 18, 1);
    cloud(g, drift(t, 5, 2.5, 8), 17, 7, C.pinkD); cloud(g, drift(t, 45, 2, 6), 27, 5, C.p3);
    ground(g, '#241a38', 41, 2); castle(g, 10, 42, '#1a1330'); castle(g, 46, 42, '#1a1330', 0.7);
  },
  rain(g, t, o) {
    bands(g, [[C.abyss, 0, 16], [C.n2, 16, 30], [C.n3, 30, WH]]);
    ground(g, '#0b0916', 38, 1);
    lights(g, [[10, 36, C.gold], [30, 34, C.pink], [50, 37, C.cyan], [44, 35, C.gold]], t);
    if (!o.reduce) for (let i = 0; i < 26; i++) {
      const x = (i * 11 + 3) % WW, y = Math.floor((t * 60 + i * 17) % (WH + 8)) - 4;
      R(g, 'rgba(185,160,255,0.55)', x, y, 1, 3);
    }
    for (let i = 0; i < 7; i++) {
      const x = (i * 9 + 5) % WW, y = Math.floor((t * 4 + i * 13) % (WH + 6));
      R(g, C.lav3, x, y, 1, 1); R(g, C.lav, x, y + 1, 1, 1);
    }
  },
  fog(g, t) {
    bands(g, [[C.night, 0, 20], [C.n3, 20, WH]]);
    lights(g, [[20, 30, C.gold], [44, 26, C.pink], [12, 36, C.cyan]], t);
    for (let i = 0; i < 5; i++) {
      const y = 12 + i * 7;
      const x = drift(t, i * 15, 3 + i, 20);
      for (const dx of [0, 40]) { ellipse(g, i % 2 ? 'rgba(185,160,255,0.16)' : 'rgba(242,221,251,0.13)', x + dx, y, 22, 3); }
    }
    ground(g, 'rgba(8,7,16,0.8)', 42, 0);
  },
  glow_clouds(g, t) {
    bands(g, [[C.night, 0, 14], [C.p2, 14, 28], [C.plum, 28, WH]]);
    stars(g, t, 30, 18);
    const cs = [[drift(t, 0, 4, 12), 12, 11, C.lav, C.cyan], [drift(t, 30, 3, 10), 24, 10, C.pink, C.moon], [drift(t, 55, 5, 12), 34, 12, C.lav2, C.pink], [drift(t, 20, 2, 8), 40, 8, C.plum, C.lav]];
    for (const [x, y, w, c, hi] of cs) { cloud(g, x, y, w, mix(c, '#000000', 0.2), hi); }
  },
  floating_islands(g, t) {
    bands(g, [[C.n2, 0, 14], [C.p2, 14, 28], [C.plum, 28, WH]]);
    stars(g, t, 40, 16);
    const isl = (cx, cy, w, s) => {
      const y = cy + Math.round(Math.sin(t * 0.8 + cx) * s);
      R(g, C.woodD, cx - w, y, w * 2, 2); for (let i = 0; i < 6; i++) R(g, C.wood, cx - w + i + 2, y + 2 + i, w * 2 - 2 * i - 3, 1);
      R(g, C.green, cx - w, y - 1, w * 2, 2); R(g, C.greenL, cx - w, y - 1, w * 2, 1);
      return y;
    };
    let y = isl(16, 20, 11, 2); R(g, C.abyss, 12, y - 6, 2, 5); R(g, C.abyss, 11, y - 8, 4, 3); R(g, C.gold, 12, y - 5, 1, 1);
    y = isl(48, 30, 9, 3); R(g, C.greenD, 46, y - 5, 4, 5); R(g, C.green, 47, y - 7, 2, 3);
    for (let i = 0; i < 8; i++) R(g, i % 2 ? C.cyanL : C.cyan, 56, y + 4 + ((t * 20 + i * 4) % 14), 1, 2);
    y = isl(34, 10, 5, 1); R(g, C.moon, 33, y - 3, 3, 3);
  },
  hanging_buildings(g, t) {
    bands(g, [[C.plum, 0, 10], [C.p2, 10, 28], [C.n3, 28, WH]]);
    stars(g, t, 24, 30);
    const tw = [[4, 22, 6], [12, 30, 5], [22, 18, 8], [34, 26, 6], [44, 32, 7], [54, 20, 6]];
    for (const [x, h, w] of tw) {
      R(g, C.abyss, x, 0, w, h); R(g, C.n2, x, 0, 1, h);
      R(g, C.abyss, x + 1, h, w - 2, 3); R(g, C.abyss, x + 2, h + 3, w - 4, 2);
      for (let y = 3; y < h - 1; y += 4) if (Math.sin(t * 0.5 + x + y) > -0.3) R(g, (x + y) % 3 === 0 ? C.cyan : C.gold, x + 2 + ((y / 4) % 2) * 2, y, 1, 2);
    }
    ground(g, 'rgba(8,7,16,0.4)', 44, 0);
  },
  cloud_doors(g, t) {
    bands(g, [[C.abyss, 0, 12], [C.n3, 12, 26], [C.plum, 26, WH]]);
    stars(g, t, 36, 16);
    const bx = drift(t, 0, 2, 14); cloud(g, bx, 40, 14, C.p3, C.lav); cloud(g, bx + 40, 38, 12, C.p3, C.lav);
    const door = (x, y, c) => { R(g, c, x, y, 7, 11); R(g, C.abyss, x + 1, y + 2, 5, 9); R(g, c, x + 2, y - 1, 3, 1); R(g, C.cyanL, x + 5, y + 6, 1, 1); R(g, C.n2, x + 2, y + 4, 3, 7); };
    door(Math.round(bx) - 3, 30, C.gold); door(Math.round(bx) + 37, 28, C.pink);
    cloud(g, drift(t, 20, 3, 10), 18, 9, C.lav2, C.lav3);
  },
  night_garden(g, t) {
    bands(g, [[C.abyss, 0, 10], [C.night, 10, 22], [C.n2, 22, WH]]);
    stars(g, t, 24, 12);
    moon(g, 54, 8, 3, 0.6);
    ground(g, '#0c0a18', 34, 4);
    for (let i = 0; i < 9; i++) {
      const x = 4 + i * 7, h = 6 + ((i * 5) % 6), y = WH - h - 4;
      R(g, C.greenD, x + 1, y + 2, 1, h); R(g, C.n3, x, y + 3, 1, 3);
      const glow = Math.sin(t * 1.5 + i) > -0.4;
      R(g, [C.cyan, C.pink, C.gold, C.lav][i % 4], x, y, 3, 2); if (glow) R(g, C.white, x + 1, y, 1, 1);
    }
    for (let i = 0; i < 5; i++) {
      const fx = (i * 14 + Math.sin(t * 0.7 + i) * 6 + 8 + WW) % WW, fy = 20 + i * 4 + Math.sin(t * 1.1 + i * 2) * 3;
      if (Math.sin(t * 2 + i * 3) > 0) R(g, C.goldL, fx, fy, 1, 1);
    }
  },
  silent_sky(g, t) {
    bands(g, [[C.n2, 0, 22], [C.n3, 22, 36], [C.p2, 36, WH]]);
    R(g, C.moon, 40, 9, 1, 1);
    R(g, C.p3, 0, 38, WW, 1);
  },
  eclipse(g, t, o) {
    bands(g, [[C.abyss, 0, 20], [C.night, 20, WH]]);
    stars(g, t, 50, 30, true);
    const pulse = Math.sin(t * 1.4) * 0.5 + 0.5;
    disc(g, pulse > 0.5 ? C.goldD : C.plum, 33, 20, 13); disc(g, C.lav, 33, 20, 11); disc(g, C.abyss, 33, 20, 10);
    ring(g, C.gold, 33, 20, 11, 1);
  },
  comet(g, t, o) {
    bands(g, [[C.abyss, 0, 14], [C.night, 14, 28], [C.n2, 28, WH]]);
    stars(g, t, 60, 30);
    const p = (o.prog ?? ((t * 0.05) % 1));
    const x = -6 + p * 78, y = 4 + p * 26;
    for (let i = 0; i < 18; i++) { const k = i / 18; R(g, k < 0.3 ? C.cyanL : k < 0.6 ? C.cyan : C.cyanD, x - i * 1.6, y - i * 0.9, Math.max(1, 3 - Math.round(k * 3)), 1); }
    disc(g, C.white, x, y, 2); R(g, C.cyanL, x - 3, y - 1, 2, 3);
    ground(g, '#0c0a18', 40, 2);
  },
  double_moon(g, t, o) {
    bands(g, [[C.abyss, 0, 14], [C.night, 14, 30], [C.n3, 30, WH]]);
    stars(g, t, 60, 30);
    moon(g, 22, 18, 9, 1); moon(g, 48, 12, 6, 0.85);
    R(g, C.abyss, 20, 40, 2, 0);
    ground(g, '#0c0a18', 40, 2);
  },
  room_view(g, t) {
    // la même chambre, vue de l'extérieur : lampe allumée, une silhouette assise au bureau
    R(g, C.n3, 0, 0, WW, WH);
    R(g, C.p2, 0, 34, WW, 12); R(g, C.n2, 4, 4, 58, 30);
    R(g, C.plum, 8, 8, 14, 12); R(g, C.p3, 9, 9, 12, 1);
    R(g, C.gold, 44, 10, 5, 9); R(g, C.goldL, 45, 10, 3, 2); R(g, C.woodD, 46, 19, 1, 14);
    R(g, C.cyan, 28, 20, 9, 7); R(g, C.glass, 29, 21, 7, 5);
    R(g, C.woodL, 24, 28, 18, 3);
    R(g, C.abyss, 15, 24, 6, 9); R(g, C.abyss, 16, 20, 4, 5);
    R(g, C.lav3, 11, 36, 12, 2); R(g, C.abyss, 38, 30, 7, 4);
    R(g, C.gold, 18, 22, 1, 1);
    if (Math.sin(t * 3) > 0.9) R(g, C.abyss, 15, 24, 6, 0);
  },
  dawn(g, t) {
    bands(g, [[C.lav2, 0, 10], [C.pink, 10, 20], [C.goldL, 20, 30], [C.gold, 30, WH]]);
    cloud(g, drift(t, 8, 2, 9), 12, 9, C.moon, C.white); cloud(g, drift(t, 40, 2.5, 7), 22, 7, C.lav3);
    ground(g, '#3a2a55', 40, 6); castle(g, 22, 41, '#2a1f45', 0.8);
    R(g, C.white, 52, 6, 1, 1);
  },
};

function ring(g, col, cx, cy, r, th) {
  g.fillStyle = col;
  for (let a = 0; a < 360; a += 6) { const rad = (a * Math.PI) / 180; g.fillRect(Math.round(cx + Math.cos(rad) * r), Math.round(cy + Math.sin(rad) * r), 1, 1); }
}

/** Silhouette dans les nuages (anomalie) : une forme humaine claire, sans visage, dont les yeux s'allument à peine. */
export function drawCloudFigure(g, t, a = 1) {
  g.save(); g.globalAlpha = 0.7 * a;
  const cx = 33, by = 40;
  R(g, C.lav3, cx - 6, by - 12, 12, 12); R(g, C.lav3, cx - 4, by - 18, 8, 7); R(g, C.lav3, cx - 3, by - 20, 6, 3);
  R(g, C.lav, cx - 7, by - 6, 14, 6);
  g.restore();
  if (Math.sin(t * 2) > 0.3) { R(g, C.cyan, cx - 2, by - 15, 1, 1); R(g, C.cyan, cx + 1, by - 15, 1, 1); }
}

export function drawWindowScene(g, id, t, o = {}) {
  const f = SCENES[id] || SCENES.night_stars;
  f(g, t, o);
}
export const hasWindowScene = (id) => id in SCENES;
