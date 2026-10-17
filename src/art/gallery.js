// Illustrations de la galerie : peintes par le code (160×100). Aucune image externe.
import { C, R, disc, ellipse, line, ring, mk, ctxOf, dither } from './pixel.js';
import { moonDisc, drawSymbol } from '../scenes/zones/common.js';
import { drawCat } from './cat.js';

export const GW = 160, GH = 100;
const stars = (g, n, seed, h = GH) => { let s = seed; for (let i = 0; i < n; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const x = s % GW; s = (Math.imul(s, 1664525) + 1013904223) >>> 0; R(g, i % 3 ? C.moon : C.lav, x, s % h, 1, 1); } };
const cat = (g, x, y, pose = 'sit', dir = 1) => { try { drawCat(g, { x, y, dir, pose, t: 0, acc: [] }); } catch (e) { R(g, C.fur, x - 6, y - 10, 12, 10); } };
const frame = (g) => { R(g, C.abyss, 0, 0, GW, 2); R(g, C.abyss, 0, GH - 2, GW, 2); R(g, C.abyss, 0, 0, 2, GH); R(g, C.abyss, GW - 2, 0, 2, GH); };

const ART = {
  g_arrival(g) {
    R(g, C.n2, 0, 0, GW, GH); for (let x = 0; x < GW; x += 5) R(g, C.cyanD, x, ((x * 7) % 60), 1, 6); // pluie
    R(g, C.glass, 0, 0, GW, 60); for (let x = 12; x < GW; x += 9) R(g, C.cyan, x, (x * 13) % 56, 1, 5);
    R(g, C.wood, 0, 70, GW, 30); R(g, C.p3, 60, 66, 40, 4); R(g, C.paper, 70, 60, 20, 8);
    cat(g, 80, 70, 'sit'); R(g, C.gold, 112, 40, 8, 20); disc(g, C.goldL, 116, 38, 5);
  },
  g_lamp(g) {
    R(g, C.abyss, 0, 0, GW, GH); for (let r = 50; r > 5; r -= 6) { g.fillStyle = `rgba(255,190,98,${0.04 + (50 - r) * 0.004})`; disc(g, g.fillStyle, 80, 50, r); }
    R(g, C.gold, 76, 30, 8, 40); R(g, C.goldL, 74, 24, 12, 8); R(g, C.woodD, 70, 70, 20, 4); R(g, C.wood, 0, 78, GW, 22);
    cat(g, 112, 78, 'loaf');
  },
  g_garden(g) {
    R(g, C.abyss, 0, 0, GW, GH); stars(g, 40, 3, 60); moonDisc(g, 120, 22, 10, 0.9);
    R(g, C.woodD, 0, 70, GW, 30); R(g, C.wood, 0, 66, GW, 4);
    for (let i = 0; i < 4; i++) { const x = 30 + i * 28; R(g, C.p3, x, 20, 1, 20); disc(g, [C.pink, C.cyan, C.gold, C.lav][i], x, 44, 5); }
    cat(g, 100, 66, 'sit');
  },
  g_door(g) {
    R(g, C.abyss, 0, 0, GW, GH); R(g, C.n3, 40, 0, 80, GH);
    R(g, C.woodD, 62, 14, 36, 80); R(g, C.wood, 66, 18, 28, 74); R(g, C.gold, 88, 58, 3, 4);
    for (let r = 34; r > 8; r -= 4) { g.fillStyle = `rgba(185,160,255,${0.03})`; disc(g, g.fillStyle, 80, 54, r + 20); }
    cat(g, 52, 94, 'sit', 1); R(g, C.cyan, 56, 78, 1, 1);
  },
  g_light(g) {
    R(g, C.abyss, 0, 0, GW, 62); stars(g, 40, 9, 50); R(g, C.glass, 0, 62, GW, 38);
    ellipse(g, C.n3, 80, 72, 50, 8); R(g, C.moon, 72, 22, 16, 50); for (let y = 28; y < 70; y += 12) R(g, C.pink, 72, y, 16, 4);
    R(g, C.goldL, 74, 14, 12, 8); for (let i = 0; i < 30; i++) R(g, 'rgba(255,190,98,0.2)', 86 + i * 2, 17 + i * 0.3, 2, 2);
  },
  g_watcher(g) {
    R(g, C.n2, 0, 0, GW, GH); stars(g, 40, 4); moonDisc(g, 80, 38, 26, 1);
    ellipse(g, C.abyss, 80, 70, 8, 22); disc(g, C.abyss, 80, 44, 6); R(g, C.moon, 78, 43, 1, 1); R(g, C.moon, 82, 43, 1, 1);
    for (let x = 0; x < GW; x += 12) ellipse(g, C.p2, x, 92, 14, 4);
  },
  g_white(g) {
    R(g, '#e9dcff', 0, 0, GW, GH); R(g, '#f6eeff', 0, 64, GW, 36); R(g, C.white, 20, 54, 80, 12);
    R(g, C.moon, 100, 56, 10, 10); cat(g, 70, 56, 'loaf'); R(g, C.p3, 104, 50, 2, 6);
    for (let i = 0; i < 10; i++) R(g, C.lav3, (i * 37) % GW, (i * 17) % 60, 1, 1);
  },
  g_odd1(g) {
    R(g, C.n2, 0, 0, GW, GH); R(g, C.wood, 0, 70, GW, 30); R(g, C.n3, 20, 20, 40, 50); R(g, C.glass, 100, 20, 36, 30);
    ellipse(g, 'rgba(8,7,16,0.9)', 80, 74, 12, 3); ellipse(g, C.abyss, 80, 52, 5, 18); disc(g, C.abyss, 80, 30, 5);
  },
  g_odd2(g) {
    R(g, C.abyss, 0, 0, GW, GH); R(g, C.p3, 40, 12, 80, 76); R(g, C.glass, 46, 18, 68, 64);
    R(g, C.wood, 52, 56, 56, 24); R(g, C.paper, 60, 44, 10, 14); R(g, C.cyanD, 90, 40, 8, 18); cat(g, 80, 56, 'sit');
    R(g, C.p3, 79, 18, 2, 64);
  },
  g_odd3(g) {
    R(g, C.abyss, 0, 0, GW, GH); stars(g, 60, 6); moonDisc(g, 54, 46, 24, 1); moonDisc(g, 112, 36, 14, 0.8);
    R(g, C.woodD, 0, 86, GW, 14);
  },
};
export const GALLERY_IDS = Object.keys(ART);
export function drawGallery(id, canvas) {
  canvas.width = GW; canvas.height = GH;
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  (ART[id] || ART.g_white)(g); frame(g);
}
