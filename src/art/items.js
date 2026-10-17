// Sprites des objets du catalogue (cuits à la demande) + icônes d'inventaire des objets d'histoire.
import { C, R, bake, bm, line, disc, ring, ellipse, mix, text3x5, dither } from './pixel.js';
import { ITEM_BY_ID } from '../data/items.js';
import { box, bakeRugRound } from './furniture.js';

const draw = {
  chair_wood: (g) => {
    box(g, 0, 0, 4, 15, C.wood, C.woodH, C.woodD); R(g, C.woodL, 1, 2, 1, 12);
    box(g, 0, 14, 18, 4, C.woodL, C.woodH, C.woodD);
    R(g, C.woodD, 1, 18, 3, 8); R(g, C.wood, 1, 18, 2, 8); R(g, C.woodD, 14, 18, 3, 8); R(g, C.wood, 14, 18, 2, 8);
    R(g, C.lav2, 4, 12, 13, 2); R(g, C.lav, 4, 12, 13, 1);
    R(g, C.woodD, 5, 22, 9, 1);
  },
  stool_star: (g) => {
    ellipse(g, C.woodL, 7, 3, 7, 3); ellipse(g, C.wood, 7, 4, 7, 2);
    R(g, C.gold, 6, 2, 3, 1); R(g, C.gold, 7, 1, 1, 3); R(g, C.goldL, 7, 2, 1, 1);
    R(g, C.woodD, 2, 6, 2, 8); R(g, C.wood, 2, 6, 1, 8); R(g, C.woodD, 10, 6, 2, 8); R(g, C.wood, 10, 6, 1, 8); R(g, C.woodD, 6, 7, 2, 7);
  },
  armchair_velvet: (g) => {
    box(g, 2, 0, 24, 14, C.plum, C.p3, C.n3);
    box(g, 0, 8, 6, 14, C.p2, C.p3, C.n3); box(g, 22, 8, 6, 14, C.p2, C.p3, C.n3);
    box(g, 5, 14, 18, 8, C.plum, C.p3, C.n3);
    for (const [x, y] of [[8, 3], [13, 3], [18, 3], [10, 7], [16, 7]]) R(g, C.lav, x, y, 1, 1);
    R(g, C.woodD, 1, 22, 3, 4); R(g, C.woodD, 24, 22, 3, 4);
    R(g, C.lav2, 6, 15, 16, 1);
  },
  nightstand: (g) => {
    box(g, 0, 0, 16, 18, C.wood, C.woodH, C.woodD); box(g, 2, 3, 12, 6, C.woodD, C.wood, C.abyss); R(g, C.gold, 7, 5, 2, 1);
    box(g, 2, 10, 12, 5, C.woodD, C.wood, C.abyss); R(g, C.gold, 7, 12, 2, 1); R(g, C.woodD, 1, 16, 2, 2); R(g, C.woodD, 13, 16, 2, 2);
  },
  toybox: (g) => {
    box(g, 0, 3, 24, 11, C.wood, C.woodH, C.woodD); box(g, 0, 0, 24, 4, C.woodL, C.woodH, C.woodD);
    R(g, C.gold, 10, 5, 4, 5); R(g, C.goldL, 10, 5, 4, 1); R(g, C.abyss, 11, 7, 2, 2);
    R(g, C.pink, 18, -1, 4, 2); R(g, C.pinkD, 19, 1, 3, 1); line(g, C.pink, 20, 0, 22, 4);
    for (let x = 2; x < 22; x += 5) R(g, C.woodD, x, 5, 1, 8);
  },
  dresser_gothic: (g) => {
    box(g, 0, 0, 30, 30, C.wood, C.woodH, C.woodD); box(g, 0, 0, 30, 3, C.woodL, C.woodH, C.woodD);
    for (let i = 0; i < 3; i++) {
      box(g, 2, 4 + i * 8, 26, 7, C.woodD, C.wood, C.abyss);
      R(g, C.woodL, 6, 6 + i * 8, 1, 3); R(g, C.woodL, 22, 6 + i * 8, 1, 3); R(g, C.woodL, 7, 5 + i * 8, 15, 1);
      R(g, C.gold, 13, 6 + i * 8, 4, 2); R(g, C.goldL, 13, 6 + i * 8, 1, 1);
    }
    R(g, C.woodD, 1, 28, 4, 2); R(g, C.woodD, 25, 28, 4, 2);
  },
  beanbag: (g) => {
    ellipse(g, C.lav2, 12, 7, 12, 5); ellipse(g, C.lav, 12, 5, 10, 4); ellipse(g, C.lav3, 10, 4, 6, 2);
    R(g, C.p3, 3, 10, 18, 1); R(g, C.p3, 8, 7, 1, 3); R(g, C.p3, 16, 6, 1, 4);
    R(g, C.moon, 6, 2, 3, 1);
  },
  shelf_wall: (g) => {
    box(g, 0, 8, 30, 3, C.woodL, C.woodH, C.woodD); R(g, C.woodD, 2, 11, 3, 1); R(g, C.woodD, 25, 11, 3, 1);
    R(g, C.pinkD, 3, 1, 3, 7); R(g, C.cyanD, 6, 3, 3, 5); R(g, C.p3, 9, 2, 3, 6); R(g, C.gold, 3, 3, 3, 1);
    R(g, C.green, 22, 3, 4, 5); R(g, C.greenL, 23, 1, 2, 2); R(g, C.woodD, 21, 7, 6, 1);
  },
  lamp_floor: (g) => {
    R(g, C.woodD, 5, 14, 2, 22); R(g, C.wood, 5, 14, 1, 22); R(g, C.woodD, 2, 36, 8, 2); R(g, C.wood, 3, 35, 6, 1);
    R(g, C.gold, 1, 1, 10, 3); R(g, C.goldL, 2, 0, 8, 1); R(g, C.gold, 0, 4, 12, 4); R(g, C.goldL, 1, 4, 3, 3); R(g, C.goldD, 9, 5, 3, 3);
    R(g, C.goldD, 0, 8, 12, 1); R(g, C.goldL, 5, 9, 2, 2);
  },
  lamp_moon: (g) => {
    R(g, C.woodD, 5, 14, 2, 14); R(g, C.woodD, 2, 28, 8, 2);
    disc(g, C.lav3, 6, 8, 6); disc(g, C.night, 9, 6, 5); R(g, C.moon, 2, 5, 2, 4); R(g, C.lav, 4, 11, 3, 1);
  },
  lantern_paper: (g) => {
    R(g, C.woodD, 5, 0, 2, 2); ellipse(g, C.pinkD, 6, 8, 5, 6); ellipse(g, C.pink, 6, 7, 4, 5); ellipse(g, C.moon, 5, 6, 2, 3);
    R(g, C.pinkD, 2, 8, 9, 1); R(g, C.woodD, 3, 14, 6, 2); R(g, C.gold, 5, 6, 2, 3);
  },
  candles_trio: (g) => {
    for (const [x, h, c] of [[1, 6, C.moon], [5, 8, C.lav3], [9, 5, C.moon]]) {
      R(g, c, x, 10 - h, 3, h); R(g, C.lav, x + 2, 10 - h, 1, h); R(g, C.gold, x + 1, 10 - h - 2, 1, 2); R(g, C.goldL, x + 1, 10 - h - 3, 1, 1);
    }
    R(g, C.woodD, 0, 10, 14, 0);
  },
  neon_dream: (g) => {
    R(g, C.abyss, 0, 0, 36, 10);
    let x = 3;
    for (const ch of 'DREAM') { text3x5(g, C.cyan, ch, x, 2); x += 6; }
    text3x5(g, C.cyanL, 'D', 3, 2);
    R(g, C.cyanD, 2, 8, 33, 1);
  },
  string_lights: (g) => {
    for (let x = 0; x < 90; x++) R(g, C.woodD, x, Math.round(2 + Math.sin(x / 90 * Math.PI * 3) * 2 + 3), 1, 1);
    for (let i = 0; i < 12; i++) {
      const x = 3 + i * 7, y = Math.round(2 + Math.sin(x / 90 * Math.PI * 3) * 2 + 3);
      R(g, C.gold, x, y + 1, 2, 3); R(g, C.goldL, x, y + 1, 1, 1);
    }
  },
  plant_fern: (g) => {
    R(g, C.woodD, 3, 16, 10, 8); R(g, C.wood, 3, 16, 9, 7); R(g, C.woodL, 3, 16, 10, 1); R(g, C.pinkD, 4, 19, 8, 1);
    for (const [dx, dy, l] of [[8, 15, 12], [5, 15, 9], [11, 15, 9], [3, 16, 6], [13, 16, 6]]) {
      const tx = dx + (dx < 8 ? -3 : dx > 8 ? 3 : 0);
      line(g, C.greenD, dx, dy, tx, dy - l); line(g, C.green, dx + 1, dy, tx + 1, dy - l);
      R(g, C.greenL, tx, dy - l, 1, 1);
    }
  },
  cactus_star: (g) => {
    R(g, C.woodD, 2, 11, 8, 5); R(g, C.wood, 2, 11, 7, 4); ellipse(g, C.greenD, 6, 7, 3, 5); ellipse(g, C.green, 5, 7, 2, 4); R(g, C.greenL, 4, 4, 1, 4);
    R(g, C.cyan, 5, 0, 2, 1); R(g, C.cyanL, 6, 0, 1, 1); R(g, C.cyan, 5, 1, 1, 1);
  },
  lunar_lily: (g) => {
    R(g, C.woodD, 3, 16, 8, 6); R(g, C.wood, 3, 16, 7, 5);
    R(g, C.greenD, 7, 8, 1, 9); R(g, C.green, 8, 9, 1, 8); line(g, C.green, 7, 14, 3, 11); line(g, C.green, 8, 13, 12, 10);
    ellipse(g, C.moon, 7, 5, 4, 4); ellipse(g, C.lav3, 7, 6, 3, 2); R(g, C.gold, 7, 4, 1, 2); R(g, C.white, 5, 3, 1, 1);
    R(g, C.moon, 2, 4, 2, 2); R(g, C.moon, 11, 4, 2, 2);
  },
  vine_hanging: (g) => {
    R(g, C.woodD, 5, 0, 2, 2);
    line(g, C.greenD, 6, 2, 6, 29); line(g, C.green, 7, 2, 7, 22);
    for (const [x, y] of [[3, 6], [8, 10], [2, 14], [9, 18], [4, 23], [7, 27]]) { R(g, C.green, x, y, 3, 2); R(g, C.greenL, x, y, 1, 1); R(g, C.greenD, x + 1, y + 2, 2, 1); }
  },
  terrarium: (g) => {
    ellipse(g, '#10223a', 9, 9, 8, 7); ellipse(g, '#16304d', 9, 9, 7, 6);
    R(g, C.woodD, 1, 13, 16, 3); R(g, C.greenD, 3, 11, 12, 3); R(g, C.greenL, 4, 11, 3, 1);
    R(g, C.moon, 9, 8, 2, 3); R(g, C.pink, 8, 6, 4, 2); R(g, C.pinkD, 8, 7, 4, 1);
    R(g, C.cyanL, 4, 4, 2, 2); R(g, C.lav3, 5, 5, 1, 1);
  },
  poster_castle: (g) => {
    R(g, C.paper, 0, 0, 20, 28); R(g, '#1b1633', 1, 1, 18, 26); dither(g, '#2e2455', 1, 14, 18, 12);
    disc(g, C.lav, 14, 7, 3);
    R(g, C.abyss, 3, 17, 14, 9); R(g, C.abyss, 3, 13, 3, 4); R(g, C.abyss, 7, 10, 3, 7); R(g, C.abyss, 12, 13, 4, 4);
    R(g, C.abyss, 4, 12, 1, 1); R(g, C.abyss, 8, 8, 1, 2); R(g, C.abyss, 13, 12, 1, 1);
    R(g, C.gold, 8, 14, 1, 2); R(g, C.gold, 13, 19, 1, 2);
  },
  stained_glass: (g) => {
    R(g, C.abyss, 0, 6, 18, 20); R(g, C.abyss, 3, 1, 12, 5); R(g, C.abyss, 6, 0, 6, 2);
    const cells = [[3, 8, C.pink], [8, 8, C.cyan], [13, 8, C.gold], [3, 14, C.lav], [8, 14, C.pinkD], [13, 14, C.cyanD], [3, 20, C.gold], [8, 20, C.lav], [13, 20, C.pink]];
    for (const [x, y, c] of cells) R(g, c, x - 2, y - 1, 4, 5);
    R(g, C.cyan, 7, 3, 4, 3); R(g, C.moon, 8, 1, 2, 2);
    R(g, C.abyss, 0, 25, 18, 1);
  },
  mirror_odd: (g) => {
    R(g, C.goldD, 0, 4, 18, 24); R(g, C.goldD, 2, 1, 14, 4); R(g, C.goldD, 5, 0, 8, 2);
    R(g, '#101a30', 2, 6, 14, 20); R(g, '#101a30', 4, 3, 10, 4); R(g, '#16264a', 3, 7, 12, 6);
    R(g, C.abyss, 7, 15, 5, 8); R(g, C.abyss, 7, 13, 1, 2); R(g, C.abyss, 11, 13, 1, 2); R(g, C.gold, 8, 17, 1, 1); R(g, C.gold, 10, 17, 1, 1);
    R(g, C.lav3, 3, 7, 1, 9);
  },
  calendar_wall: (g) => {
    R(g, C.paper, 0, 0, 16, 20); R(g, C.red, 0, 0, 16, 4); R(g, C.p3, 15, 0, 1, 20);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) R(g, C.p3, 2 + i * 3, 6 + j * 3, 2, 1);
    ring(g, C.pink, 8, 14, 2); R(g, C.pink, 6, 14, 1, 1);
  },
  polaroids: (g) => {
    for (const [x, y, c] of [[0, 2, C.cyanD], [8, 0, C.pinkD], [16, 3, C.goldD]]) {
      R(g, C.moon, x, y, 8, 11); R(g, '#1b1633', x + 1, y + 1, 6, 6); R(g, c, x + 2, y + 3, 3, 2); R(g, C.moon, x + 3, y + 2, 1, 1);
      R(g, C.lav, x + 3, y - 1, 2, 2);
    }
    R(g, C.abyss, 11, 6, 2, 3);
  },
  orb_chrome: (g) => {
    disc(g, C.p2, 7, 7, 7); disc(g, C.lav3, 7, 7, 6);
    for (let y = -6; y <= 6; y++) {
      const w = Math.floor(Math.sqrt(36 - y * y) + 0.5);
      const col = y < -3 ? C.moon : y < -1 ? C.cyanL : y < 1 ? C.lav : y < 3 ? C.pink : y < 5 ? C.gold : C.lav2;
      R(g, col, 7 - w + 1, 7 + y, Math.max(1, w * 2 - 1), 1);
    }
    R(g, C.white, 4, 3, 3, 2); R(g, C.white, 4, 5, 1, 1);
    R(g, C.n3, 3, 13, 8, 1);
  },
  ring_iris: (g) => {
    const cols = [C.pink, C.lav, C.cyan, C.cyanL, C.gold, C.pink];
    for (let a = 0; a < 360; a += 3) {
      const rad = (a * Math.PI) / 180;
      const col = cols[Math.floor(((a % 360) / 360) * cols.length)];
      for (const r of [9, 8, 7]) R(g, mix(col, '#ffffff', r === 9 ? 0.4 : 0), 11 + Math.cos(rad) * r, 11 + Math.sin(rad) * r, 1, 1);
    }
  },
  doll_old: (g) => {
    R(g, C.moon, 2, 0, 6, 6); R(g, C.paper, 2, 0, 6, 1); R(g, C.pinkD, 1, 0, 8, 2); R(g, C.abyss, 3, 2, 1, 2); R(g, C.abyss, 6, 2, 1, 2); R(g, C.pink, 4, 4, 2, 1);
    R(g, C.plum, 2, 6, 6, 7); R(g, C.p3, 2, 6, 1, 7); R(g, C.moon, 0, 7, 2, 4); R(g, C.moon, 8, 7, 2, 4); R(g, C.n3, 3, 13, 2, 3); R(g, C.n3, 5, 13, 2, 3);
    R(g, C.lav, 4, 8, 1, 1);
  },
  music_box: (g) => {
    box(g, 0, 3, 12, 7, C.woodL, C.woodH, C.woodD); box(g, 0, 1, 12, 3, C.wood, C.woodH, C.woodD);
    R(g, C.gold, 5, 5, 2, 2); R(g, C.cyan, 1, 0, 1, 1); R(g, C.goldD, 12, 6, 2, 1); R(g, C.gold, 13, 5, 1, 3);
  },
  floating_cube: (g) => {
    R(g, C.cyanD, 2, 2, 8, 8); R(g, C.cyan, 2, 2, 8, 1); R(g, C.cyan, 2, 2, 1, 8); R(g, C.cyanL, 2, 2, 8, 0);
    R(g, C.glass, 3, 3, 6, 6); R(g, C.cyanD, 3, 3, 6, 6); R(g, '#102d4a', 4, 4, 4, 4);
    R(g, C.pink, 8, 0, 3, 3); R(g, C.pinkD, 9, 1, 2, 2); R(g, C.cyanL, 3, 3, 2, 1);
  },
  tv_static: (g) => {
    box(g, 0, 0, 18, 16, C.p2, C.p3, C.abyss); R(g, C.abyss, 2, 2, 11, 11); R(g, C.n2, 14, 3, 2, 8); R(g, C.cyan, 14, 12, 1, 1);
    R(g, C.woodD, 3, 16, 3, 2); R(g, C.woodD, 12, 16, 3, 2);
  },
  crystal_moon: (g) => {
    R(g, C.n3, 2, 12, 8, 4); R(g, C.p2, 2, 12, 8, 1);
    disc(g, C.moon, 6, 6, 5); disc(g, '#241d44', 8, 5, 4); R(g, C.white, 2, 4, 1, 3); R(g, C.lav3, 3, 8, 2, 1); R(g, C.cyanL, 3, 3, 1, 1);
  },
  comet_jar: (g) => {
    R(g, C.glass, 1, 3, 8, 12); R(g, '#1a2c52', 2, 4, 6, 10); R(g, C.lav3, 2, 1, 6, 2); R(g, C.woodD, 1, 0, 8, 2);
    R(g, C.white, 6, 6, 2, 2); R(g, C.cyanL, 4, 8, 2, 1); R(g, C.cyan, 2, 10, 3, 1); R(g, C.cyanD, 2, 11, 2, 1);
    R(g, C.moon, 2, 4, 1, 8);
  },
  ghost_lamp: (g) => {
    R(g, C.woodD, 5, 14, 2, 10); R(g, C.woodD, 2, 22, 8, 2);
    ellipse(g, C.moon, 6, 8, 5, 7); R(g, C.moon, 1, 12, 10, 4); R(g, C.lav3, 1, 15, 3, 1); R(g, C.lav3, 5, 15, 3, 1); R(g, C.lav3, 9, 15, 2, 1);
    R(g, C.abyss, 4, 6, 2, 3); R(g, C.abyss, 8, 6, 2, 3); R(g, C.abyss, 6, 10, 1, 2);
  },
  golden_door: (g) => {
    R(g, C.goldD, 0, 3, 16, 21); R(g, C.goldD, 2, 1, 12, 2); R(g, C.goldD, 4, 0, 8, 1);
    R(g, C.gold, 2, 4, 12, 20); R(g, C.gold, 3, 2, 10, 2);
    R(g, C.goldD, 4, 6, 8, 7); R(g, C.goldL, 4, 6, 8, 1); R(g, C.goldD, 4, 15, 8, 7); R(g, C.goldL, 4, 15, 8, 1);
    R(g, C.abyss, 10, 14, 2, 2); R(g, C.n2, 5, 8, 6, 4); R(g, C.cyan, 6, 9, 1, 1);
  },
  rug_round: (g) => { g.drawImage(bakeRugRound(), 0, 0); },
  rug_checker: (g) => {
    for (let y = 0; y < 14; y++) for (let x = 0; x < 56; x++) {
      const dx = (x - 27.5) / 28, dy = (y - 6.5) / 7;
      if (dx * dx + dy * dy > 1) continue;
      R(g, ((x >> 2) + (y >> 2)) & 1 ? C.plum : C.n3, x, y, 1, 1);
    }
    for (let x = 6; x < 50; x += 8) R(g, C.lav2, x, 6, 1, 1);
  },
  rug_star: (g) => {
    ellipse(g, C.n3, 30, 7, 30, 7); ellipse(g, C.p2, 30, 7, 28, 6);
    for (const [x, y] of [[30, 7], [14, 5], [46, 9], [22, 10], [38, 4]]) { R(g, C.gold, x - 1, y, 3, 1); R(g, C.gold, x, y - 1, 1, 3); R(g, C.goldL, x, y, 1, 1); }
    for (let x = 6; x < 56; x += 5) R(g, C.lav, x, 7 + ((x / 5) % 2 ? 3 : -3), 1, 1);
  },
};

const cache = new Map();

/** Sprite cuit d'un objet du catalogue (canvas w×h). */
export function itemSprite(id) {
  if (cache.has(id)) return cache.get(id);
  const it = ITEM_BY_ID[id];
  let c = null;
  if (it && draw[id]) {
    // marge pour les débordements (bocal, flamme, câble) : le sprite est dessiné dans une boîte w×(h)
    c = bake(it.w + 4, it.h + 4, (g) => { g.translate(0, 2); draw[id](g); });
    c._pad = 2;
  } else if (it) {
    c = itemIcon(id);
  }
  cache.set(id, c);
  return c;
}

// ---- Icônes 10×10 pour les objets d'histoire et accessoires de NOIR
const P = { k: C.abyss, g: C.gold, G: C.goldL, d: C.goldD, l: C.lav, L: C.lav3, p: C.pink, P: C.pinkD, c: C.cyan, C: C.cyanL, m: C.moon, w: C.white, n: C.p2, u: C.plum };
const ICONS = {
  brass_key: ['..........', '..ggg.....', '.gGdgg....', '.g..dg....', '.gggg.....', '..gg......', '..gg......', '..gg.g....', '..gggg....', '..........'],
  lavender_key: ['..........', '..lll.....', '.lLulL....', '.l..ul....', '.llll.....', '..ll......', '..ll......', '..ll.l....', '..llll....', '..........'],
  shard_moon: ['..........', '...mmm....', '..mmw.....', '.mmw......', '.mm.......', '.mm.......', '.mmm......', '..mmmm....', '...mmm....', '..........'],
  shard_star: ['..........', '....c.....', '....C.....', '..ccCcc...', '...cCc....', '..ccCcc...', '..c.c.c...', '..........', '..........', '..........'],
  shard_heart: ['..........', '.pp..pp...', 'ppPppPPp..', 'pppppPPp..', '.ppppPP...', '..pppP....', '...pP.....', '....P.....', '..........', '..........'],
  clock_hand: ['..........', '.......g..', '......gg..', '.....gg...', '....gg....', '...gg.....', '..gg......', '.ggd......', '.dd.......', '..........'],
  lens: ['..........', '..cccc....', '.cCwwcc...', 'cCwcccc...', 'cwccccc...', 'cccccdc...', '.ccccd....', '..ddd.....', '..........', '..........'],
  collar_bell: ['..........', '.pppppp...', 'p......p..', 'p......p..', '.pppppp...', '...gg.....', '..gGgg....', '..gddg....', '...gg.....', '..........'],
  bow_pink: ['..........', '.pp....pp.', 'ppPp..pPpp', 'ppPppppPpp', 'pppPppPppp', '.pP.pp.Pp.', '.p..pp..p.', '....pp....', '..........', '..........'],
  hat_star: ['..........', '....ll....', '...lLl....', '..lLLul...', '..llluul..', '.lllluull.', 'uuuuuuuuuu', '..g.......', '..gg......', '..........'],
  scarf_lavender: ['..........', 'llllllllll', 'lLLLLLLLLl', 'llllllllll', '....lll...', '....lLl...', '....lll...', '....lLl...', '...ll.l...', '..........'],
  crown_gold: ['..........', '..........', 'g..g..g...', 'gg.gg.gg..', 'gGgggggGg.', 'gggggggGg.', 'gdgdgdgdg.', 'dddddddddd', '..........', '..........'],
};
export function itemIcon(id) {
  const rows = ICONS[id];
  if (rows) return bm(rows, P);
  // repli : petite pastille
  return bake(10, 10, (g) => { disc(g, C.p3, 4.5, 4.5, 4); R(g, C.lav, 3, 3, 2, 2); });
}
export const hasIconArt = (id) => id in ICONS;
