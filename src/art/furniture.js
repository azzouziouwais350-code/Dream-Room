// Meubles fixes de la chambre (liés à l'histoire) : sprites cuits une seule fois.
// Convention : coordonnées locales, (0,0) = coin haut-gauche du sprite.
import { C, R, bake, line, disc, ring, ellipse, mix, dither } from './pixel.js';

export const box = (g, x, y, w, h, base, hi, lo) => {
  R(g, base, x, y, w, h);
  if (hi) { R(g, hi, x, y, w, 1); R(g, hi, x, y, 1, h); }
  if (lo) { R(g, lo, x, y + h - 1, w, 1); R(g, lo, x + w - 1, y, 1, h); }
};

export function bakeBed() {
  return bake(82, 42, (g) => {
    R(g, C.woodD, 3, 38, 4, 4); R(g, C.woodD, 75, 38, 4, 4);
    // cadre
    box(g, 0, 30, 82, 9, C.wood, C.woodH, C.woodD);
    R(g, C.woodL, 2, 33, 78, 1);
    // tête de lit gothique
    box(g, 0, 6, 9, 33, C.wood, C.woodH, C.woodD);
    R(g, C.wood, 1, 3, 7, 3); R(g, C.wood, 2, 1, 5, 2); R(g, C.woodL, 3, 0, 3, 1);
    R(g, C.woodH, 1, 3, 1, 3); R(g, C.gold, 4, 1, 1, 1);
    R(g, C.woodD, 3, 10, 3, 12); R(g, C.woodD, 4, 8, 1, 2); // arche
    R(g, C.woodL, 4, 11, 1, 10);
    // pied de lit
    box(g, 73, 21, 9, 18, C.wood, C.woodH, C.woodD);
    R(g, C.gold, 76, 22, 3, 1);
    // matelas
    R(g, C.lav3, 9, 24, 64, 6); R(g, C.lav, 9, 28, 64, 2); R(g, C.lav2, 9, 29, 64, 1);
    // oreiller
    R(g, C.lav3, 11, 16, 17, 9); R(g, C.moon, 12, 15, 15, 3); R(g, C.moon, 12, 17, 15, 6);
    R(g, C.lav, 12, 23, 15, 2); R(g, C.lav3, 14, 19, 8, 1); R(g, C.lav, 26, 18, 1, 6);
  });
}

/** Couverture animée : dessinée en direct (respiration + vague). bump = bosse (NOIR endormi dessus). */
export function drawBlanket(g, ox, oy, t, reduce = false, bump = null) {
  const x0 = 27, x1 = 74;
  for (let x = x0; x < x1; x++) {
    const wave = reduce ? 0 : Math.round(Math.sin(t * 1.1 + x * 0.22) * 0.6 + 0.2);
    let top = 19 + wave;
    if (bump && x >= bump.x0 && x < bump.x1) top -= Math.round(Math.sin(((x - bump.x0) / (bump.x1 - bump.x0)) * Math.PI) * bump.h);
    R(g, C.lav2, ox + x, oy + top, 1, 28 - top + 1 > 0 ? 29 - top : 1);
    R(g, C.lav, ox + x, oy + top, 1, 1);
    // plis
    if ((x + 3) % 9 === 0) R(g, C.p3, ox + x, oy + top + 3, 1, 5);
    if ((x + 1) % 8 === 0) R(g, C.lav, ox + x, oy + top + 2, 1, 1);
  }
  // motif d'étoiles
  for (let i = 0; i < 5; i++) { R(g, C.moon, ox + 33 + i * 9, oy + 24 + (i % 2) * 3, 1, 1); R(g, C.gold, ox + 36 + i * 9, oy + 26 - (i % 2) * 3, 1, 1); }
  R(g, C.p3, ox + x0, oy + 28, x1 - x0, 1);
  R(g, C.plum, ox + x0, oy + 29, x1 - x0, 1);
  R(g, C.lav, ox + x0 - 1, oy + 20, 1, 9);
}

export function bakeWardrobe() {
  return bake(34, 80, (g) => {
    box(g, 0, 0, 34, 80, C.wood, C.woodH, C.woodD);
    // corniche gothique
    box(g, 0, 0, 34, 7, C.woodL, C.woodH, C.woodD); R(g, C.woodD, 0, 7, 34, 1);
    for (let i = 0; i < 6; i++) R(g, C.woodD, 3 + i * 5, 3, 2, 2);
    // portes
    for (const dx of [3, 18]) {
      R(g, C.woodD, dx, 11, 13, 62);
      R(g, C.wood, dx + 1, 12, 11, 60);
      // arche pointue dans le panneau
      R(g, C.woodL, dx + 2, 18, 9, 1); R(g, C.woodL, dx + 3, 16, 7, 1); R(g, C.woodL, dx + 5, 14, 3, 1);
      R(g, C.woodL, dx + 2, 18, 1, 20); R(g, C.woodL, dx + 10, 18, 1, 20);
      R(g, C.woodD, dx + 3, 20, 7, 16);
      R(g, C.woodL, dx + 2, 44, 9, 1); R(g, C.woodL, dx + 2, 44, 1, 22); R(g, C.woodL, dx + 10, 44, 1, 22);
      R(g, C.woodD, dx + 3, 46, 7, 19);
    }
    R(g, C.woodD, 16, 11, 2, 62);
    // croissant doré au centre
    disc(g, C.gold, 17, 8, 2); disc(g, C.wood, 18, 7, 2);
    R(g, C.gold, 12, 41, 2, 4); R(g, C.gold, 20, 41, 2, 4); R(g, C.goldL, 12, 41, 1, 1); R(g, C.goldL, 20, 41, 1, 1);
    // pieds
    R(g, C.woodD, 1, 74, 5, 6); R(g, C.woodD, 28, 74, 5, 6);
    R(g, C.abyss, 0, 78, 34, 2);
  });
}

export function bakeDesk() {
  return bake(62, 54, (g) => {
    // plateau
    box(g, 0, 0, 62, 5, C.woodL, C.woodH, C.woodD);
    R(g, C.woodH, 1, 1, 60, 1);
    // côté gauche : jambe
    box(g, 2, 5, 5, 49, C.wood, C.woodL, C.woodD);
    // caisson à tiroirs à droite
    box(g, 36, 5, 24, 49, C.wood, C.woodL, C.woodD);
    for (let i = 0; i < 3; i++) {
      box(g, 38, 8 + i * 14, 20, 12, C.woodD, C.wood, C.abyss);
      R(g, C.gold, 46, 13 + i * 14, 4, 1);
    }
    // traverse + ombre
    R(g, C.woodD, 7, 5, 29, 4);
    R(g, C.abyss, 7, 9, 29, 45); R(g, C.n2, 8, 10, 27, 44);
    dither(g, C.abyss, 8, 10, 27, 20);
    // câbles
    line(g, C.p2, 10, 10, 14, 24); line(g, C.p2, 14, 24, 20, 26);
    // tasse
    R(g, C.moon, 4, -4, 5, 4); R(g, C.lav, 4, -1, 5, 1); R(g, C.moon, 9, -3, 1, 2);
    R(g, C.pink, 5, -3, 3, 1);
  });
}

export function bakeBookcase() {
  return bake(70, 34, (g) => {
    box(g, 0, 0, 70, 34, C.wood, C.woodH, C.woodD);
    R(g, C.abyss, 3, 3, 64, 12); R(g, C.n2, 3, 3, 64, 11);
    R(g, C.abyss, 3, 18, 64, 12); R(g, C.n2, 3, 18, 64, 11);
    R(g, C.woodL, 2, 15, 66, 2); R(g, C.woodD, 2, 17, 66, 1);
    const cols = [C.plum, C.lav2, C.p3, C.pinkD, C.cyanD, C.goldD, C.n3, C.lav, C.p2];
    let x = 4;
    for (let i = 0; x < 64; i++) {
      const w = 2 + ((i * 7) % 3), h = 8 + ((i * 5) % 4);
      const col = cols[(i * 3 + 1) % cols.length];
      R(g, col, x, 14 - h, w, h); R(g, mix(col, '#ffffff', 0.25), x, 14 - h, 1, h);
      if (i % 4 === 1) R(g, C.gold, x, 14 - h + 2, w, 1);
      x += w;
      if (i === 8) x += 6;
    }
    x = 4;
    for (let i = 0; x < 58; i++) {
      const w = 2 + ((i * 5) % 3), h = 7 + ((i * 3) % 5);
      const col = cols[(i * 5 + 2) % cols.length];
      R(g, col, x, 29 - h, w, h); R(g, mix(col, '#ffffff', 0.2), x, 29 - h, 1, h);
      x += w;
      if (i === 6) x += 8;
    }
    // livre à l'envers (indice)
    R(g, C.moon, 56, 19, 3, 10); R(g, C.p3, 56, 19, 1, 10); R(g, C.gold, 56, 27, 3, 1);
    R(g, C.woodD, 0, 33, 70, 1);
  });
}

/** Encadrement de la fenêtre (le paysage est dessiné en dessous). Zone vitrée : (4,4) 66x46. */
export function bakeWindowFrame() {
  return bake(74, 62, (g) => {
    // cadre extérieur (le centre est transparent)
    R(g, C.woodL, 0, 0, 74, 54); R(g, C.woodH, 0, 0, 74, 1); R(g, C.woodD, 0, 53, 74, 1);
    g.clearRect(4, 4, 66, 46);
    R(g, C.woodD, 3, 3, 68, 1); R(g, C.woodD, 3, 50, 68, 1); R(g, C.woodD, 3, 3, 1, 48); R(g, C.woodD, 70, 3, 1, 48);
    // meneaux
    R(g, C.woodL, 36, 4, 2, 46); R(g, C.woodD, 38, 4, 1, 46); R(g, C.woodH, 36, 4, 1, 46);
    R(g, C.woodL, 4, 25, 66, 2); R(g, C.woodD, 4, 27, 66, 1);
    // ogive au sommet (gothique)
    R(g, C.woodD, 4, 4, 3, 1); R(g, C.woodD, 67, 4, 3, 1);
    // appui de fenêtre
    box(g, -2, 54, 78, 6, C.woodL, C.woodH, C.woodD); R(g, C.woodD, 0, 60, 74, 2);
    // petits objets sur l'appui : un caillou lunaire
    R(g, C.moon, 60, 52, 3, 2);
  });
}

export function bakeDoor() {
  return bake(26, 68, (g) => {
    box(g, 0, 0, 26, 68, C.woodD, C.wood, C.abyss);
    // arche
    R(g, 'rgba(0,0,0,0)', 0, 0, 0, 0);
    R(g, C.woodL, 2, 3, 22, 65);
    R(g, C.wood, 3, 4, 20, 63);
    for (const [x, y, w, h] of [[5, 7, 6, 24], [14, 7, 7, 24], [5, 36, 6, 26], [14, 36, 7, 26]]) {
      R(g, C.woodD, x, y, w, h); R(g, C.wood, x + 1, y + 1, w - 2, h - 2); R(g, C.woodL, x + 1, y + 1, w - 2, 1);
    }
    // pointe gothique dans les panneaux hauts
    R(g, C.woodD, 7, 6, 2, 1); R(g, C.woodD, 16, 6, 3, 1);
    // plaque et serrure en laiton
    R(g, C.goldD, 19, 31, 5, 8); R(g, C.gold, 19, 31, 4, 7); R(g, C.goldL, 19, 31, 4, 1);
    R(g, C.abyss, 21, 34, 1, 3);
    R(g, C.gold, 16, 33, 3, 2); R(g, C.goldL, 16, 33, 1, 1);
    // seuil
    R(g, C.abyss, 0, 66, 26, 2);
  });
}

export function bakePoster() {
  return bake(22, 36, (g) => {
    R(g, C.night, 0, 0, 22, 36); R(g, C.paper, 0, 0, 22, 1); R(g, C.paper, 0, 0, 1, 36); R(g, C.p2, 21, 0, 1, 36); R(g, C.p2, 0, 35, 22, 1);
    R(g, '#201a3a', 1, 1, 20, 34);
    dither(g, '#2c2450', 1, 18, 20, 16);
    disc(g, C.moon, 11, 14, 7); disc(g, C.lav3, 12, 15, 6);
    R(g, C.lav, 8, 12, 2, 2); R(g, C.lav, 13, 17, 2, 2); R(g, C.lav, 10, 19, 1, 1);
    for (const [x, y] of [[3, 4], [17, 5], [5, 25], [18, 22], [14, 3], [3, 15]]) R(g, C.moon, x, y, 1, 1);
    R(g, C.gold, 8, 28, 6, 1);
    R(g, C.paper, 5, 31, 12, 1);
    // coin décollé
    R(g, C.lav3, 18, 0, 4, 1); R(g, C.lav3, 19, 1, 3, 1); R(g, C.p3, 20, 2, 2, 1);
  });
}

/** Coffre derrière l'affiche */
export function bakeSafe() {
  return bake(16, 14, (g) => {
    box(g, 0, 0, 16, 14, C.p2, C.p3, C.abyss);
    R(g, C.n3, 2, 2, 12, 10);
    R(g, C.abyss, 3, 3, 6, 8); R(g, C.glass, 4, 4, 4, 6);
    R(g, C.cyan, 5, 5, 2, 1); R(g, C.cyanD, 5, 7, 2, 1);
    R(g, C.gold, 11, 5, 2, 2); R(g, C.goldL, 11, 5, 1, 1); R(g, C.gold, 11, 9, 2, 1);
  });
}

export function bakeClockFace() {
  return bake(20, 20, (g) => {
    disc(g, C.woodD, 9.5, 9.5, 10); disc(g, C.gold, 9.5, 9.5, 9); disc(g, C.goldD, 10, 10, 9);
    disc(g, C.gold, 9, 9, 8); disc(g, C.moon, 9.5, 9.5, 7); disc(g, C.paper, 10, 10, 6);
    for (const [x, y] of [[9, 3], [9, 15], [3, 9], [15, 9]]) R(g, C.plum, x, y, 2, 2);
    for (const [x, y] of [[13, 4], [16, 7], [16, 13], [13, 16], [6, 16], [3, 13], [3, 7], [6, 4]]) R(g, C.p3, x, y, 1, 1);
    R(g, C.goldL, 5, 2, 3, 1);
  });
}

/** Tableau principal : variantes qui changent quand on détourne le regard. */
export function bakePainting(v) {
  return bake(36, 36, (g) => {
    box(g, 0, 0, 36, 36, C.goldD, C.goldL, C.woodD);
    R(g, C.woodD, 2, 2, 32, 32);
    R(g, '#1a1636', 3, 3, 30, 30);
    dither(g, '#262050', 3, 20, 30, 13);
    R(g, '#120f26', 3, 28, 30, 5);
    disc(g, C.moon, 26, 10, 4); disc(g, '#1a1636', 28, 9, 3);
    for (const [x, y] of [[6, 6], [12, 9], [18, 5], [8, 14], [20, 12], [5, 20]]) R(g, C.moon, x, y, 1, 1);
    if (v === 0) {
      // petite maison, fenêtre allumée
      R(g, C.n3, 12, 22, 10, 7); R(g, C.p2, 11, 20, 12, 2); R(g, C.p2, 13, 19, 8, 1); R(g, C.gold, 15, 24, 2, 2); R(g, C.n2, 19, 24, 2, 5);
    } else if (v === 1) {
      // la porte est ouverte, une silhouette sur le seuil
      R(g, C.n3, 12, 22, 10, 7); R(g, C.p2, 11, 20, 12, 2); R(g, C.p2, 13, 19, 8, 1); R(g, C.gold, 15, 24, 2, 2); R(g, C.goldL, 19, 24, 2, 5);
      R(g, C.abyss, 20, 25, 1, 4); R(g, C.abyss, 20, 24, 1, 1);
    } else if (v === 2) {
      // plus de maison : une porte, seule, dans le champ
      R(g, C.plum, 15, 19, 6, 10); R(g, C.n2, 16, 20, 4, 9); R(g, C.gold, 19, 24, 1, 1); R(g, C.cyan, 16, 28, 4, 1);
    } else {
      // un œil dans le ciel
      R(g, C.plum, 12, 22, 10, 7); R(g, C.abyss, 13, 23, 8, 5);
      R(g, C.moon, 9, 12, 7, 3); R(g, C.pink, 12, 12, 1, 3); R(g, C.abyss, 12, 13, 1, 1);
    }
    R(g, C.goldL, 1, 1, 34, 1);
  });
}

export function bakePhotos() {
  return bake(28, 26, (g) => {
    line(g, C.p3, 7, 0, 14, 5); line(g, C.p3, 21, 0, 14, 5);
    // cadre 1 : la lampe
    box(g, 1, 6, 12, 15, C.moon, C.white, C.p3); R(g, C.n2, 3, 8, 8, 10);
    R(g, C.gold, 6, 10, 3, 3); R(g, C.goldL, 7, 10, 1, 1); R(g, C.goldD, 7, 13, 1, 4); R(g, C.p3, 5, 17, 5, 1);
    // cadre 2 : le chat
    box(g, 15, 8, 12, 15, C.moon, C.white, C.p3); R(g, C.n2, 17, 10, 8, 10);
    R(g, C.abyss, 19, 14, 5, 5); R(g, C.abyss, 20, 12, 1, 2); R(g, C.abyss, 23, 12, 1, 2); R(g, C.gold, 20, 15, 1, 1); R(g, C.gold, 22, 15, 1, 1);
  });
}

export function bakeRugRound() {
  return bake(64, 14, (g) => {
    ellipse(g, C.n3, 32, 7, 31, 6); ellipse(g, C.plum, 32, 7, 29, 5); ellipse(g, C.p2, 32, 7, 25, 4);
    ellipse(g, C.n3, 32, 7, 19, 3); ellipse(g, C.p3, 32, 7, 14, 2);
    ellipse(g, C.lav2, 32, 7, 8, 1);
    for (let i = 0; i < 12; i++) R(g, C.lav, 6 + i * 5, 7 + (i % 2 ? 2 : -3), 1, 1);
  });
}
