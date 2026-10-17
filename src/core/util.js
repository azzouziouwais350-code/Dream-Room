// Utilitaires purs (aucune dépendance DOM) — importables aussi par les tests Node.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (n) => Math.floor(next() * n);
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  return next;
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

/** Tirage pondéré : items = [{weight, ...}] */
export function weightedPick(items, r = Math.random) {
  const total = items.reduce((s, i) => s + (i.weight ?? 1), 0);
  if (total <= 0) return null;
  let x = r() * total;
  for (const it of items) {
    x -= it.weight ?? 1;
    if (x <= 0) return it;
  }
  return items[items.length - 1];
}

export const rectsOverlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const pointIn = (px, py, r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;

export const pad2 = (n) => String(n).padStart(2, '0');

export function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

export function isPlainObject(o) {
  return o !== null && typeof o === 'object' && !Array.isArray(o);
}

/** Chiffre de César sur A-Z (les accents sont retirés). */
export function caesar(text, shift) {
  const s = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return s.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + shift + 26 * 10) % 26) + 65));
}
