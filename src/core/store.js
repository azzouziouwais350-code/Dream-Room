// Sauvegarde : état par défaut, migration, validation stricte, localStorage, export/import.
// Aucune dépendance DOM : le stockage est injecté (testable sous Node).
import { clamp, deepClone, isPlainObject } from './util.js';

export const SCHEMA_VERSION = 2;
export const SAVE_KEY = 'dreamroom:save';
export const BACKUP_KEY = 'dreamroom:save:bak';
export const FORMAT_TAG = 'dream-room-save';

export const DEFAULT_SETTINGS = {
  master: 80,
  music: 70,
  sfx: 80,
  muted: false,
  quality: 'high', // low | medium | high
  reduceMotion: false,
  grid: false,
  clockFormat: '24', // 24 | 12 | dream
  timeMode: 'cycle', // cycle | fixed
  fixedHour: 23,
  timeSpeed: 1, // 0.5 | 1 | 2
  textSpeed: 'normal', // instant | normal
};

/** Décoration de base : identifiants de catalogue + position (voir data/items.js). */
export const BASE_PLACED = [
  { uid: 'b1', id: 'chair_wood', x: 238, y: 156 },
  { uid: 'b2', id: 'rug_round', x: 128, y: 170 },
  { uid: 'b3', id: 'lamp_floor', x: 124, y: 150 },
  { uid: 'b4', id: 'plant_fern', x: 298, y: 176 },
  { uid: 'b5', id: 'painting_main', x: 262, y: 22 },
  { uid: 'b6', id: 'photos_pair', x: 216, y: 18 },
  { uid: 'b7', id: 'vine_hanging', x: 118, y: 0 },
];

export const BASE_OWNED = {
  chair_wood: 1, rug_round: 1, lamp_floor: 1, plant_fern: 1, painting_main: 1, photos_pair: 1, vine_hanging: 1,
};

export function defaultState(now = Date.now()) {
  return {
    format: FORMAT_TAG,
    version: SCHEMA_VERSION,
    createdAt: now,
    savedAt: now,
    playSeconds: 0,
    gameMinutes: 23 * 60, // il est 23:00 au début de la partie
    zone: 'room',
    flags: {},
    owned: { ...BASE_OWNED },
    placed: BASE_PLACED.map((p) => ({ ...p })),
    memories: [],
    docs: ['bienvenue', 'calendrier'],
    symbols: [],
    zones: ['room'],
    puzzles: [],
    anomalies: {}, // id -> nombre de fois vu
    anomalyLast: {}, // id -> gameMinutes du dernier déclenchement
    events: [], // événements rares découverts
    secrets: [],
    codex: [],
    gallery: [],
    achievements: {}, // id -> timestamp
    shardOrder: [], // ordre de découverte des éclats (symboles)
    noir: { pet: 0, play: 0, feed: 0, equipped: [], mood: 70, owned: [] },
    window: { auto: true, scene: 'night_stars' },
    chime: [], // séquence du carillon du jardin (générée une fois)
    notes: '',
    drift: 0,
    ending: null,
    settings: { ...DEFAULT_SETTINGS },
    stats: { anomalies: 0, items: 0 },
  };
}

// ---------------------------------------------------------------- migration

/** v1 = ancien format de prototype : inventory sous forme de tableau, volumes à plat, pas de tag de format. */
function migrate1to2(s) {
  const out = deepClone(s);
  if (Array.isArray(out.inventory)) {
    out.owned = {};
    for (const id of out.inventory) out.owned[id] = (out.owned[id] || 0) + 1;
    delete out.inventory;
  }
  const settings = { ...DEFAULT_SETTINGS, ...(out.settings || {}) };
  if (typeof out.volume === 'number') settings.master = clamp(Math.round(out.volume), 0, 100);
  if (typeof out.musicVolume === 'number') settings.music = clamp(Math.round(out.musicVolume), 0, 100);
  if (typeof out.sfxVolume === 'number') settings.sfx = clamp(Math.round(out.sfxVolume), 0, 100);
  delete out.volume; delete out.musicVolume; delete out.sfxVolume;
  out.settings = settings;
  if (typeof out.notes !== 'string') out.notes = '';
  out.format = FORMAT_TAG;
  out.version = 2;
  return out;
}

const MIGRATIONS = { 1: migrate1to2 };

export function migrate(raw) {
  if (!isPlainObject(raw)) throw new Error('Sauvegarde illisible : objet attendu.');
  let s = raw;
  let v = typeof s.version === 'number' ? s.version : 1;
  if (v > SCHEMA_VERSION) throw new Error(`Sauvegarde issue d'une version plus récente (v${v}).`);
  while (v < SCHEMA_VERSION) {
    const fn = MIGRATIONS[v];
    if (!fn) throw new Error(`Aucune migration depuis la version ${v}.`);
    s = fn(s);
    v = s.version;
  }
  return s;
}

// --------------------------------------------------------------- validation

const isStrArr = (a, max = 500) => Array.isArray(a) && a.length <= max && a.every((x) => typeof x === 'string' && x.length <= 80);
const isId = (x) => typeof x === 'string' && /^[a-z0-9_.\-]{1,60}$/i.test(x);

/**
 * Validation stricte + normalisation : renvoie un état complet et sûr ou lève une erreur.
 * Les champs inconnus sont ignorés (jamais copiés), les valeurs hors bornes sont rejetées ou bornées.
 * @param {(kind:string,id:string)=>boolean} [known] vérificateur facultatif d'identifiants de catalogue
 */
export function validateState(input, known = null) {
  const s = migrate(input);
  const d = defaultState();
  const err = (m) => { throw new Error('Sauvegarde invalide : ' + m); };

  if (s.format !== undefined && s.format !== FORMAT_TAG) err('format inconnu.');
  const out = d;
  const num = (v, a, b, name) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) err(`${name} doit être un nombre.`);
    return clamp(v, a, b);
  };

  out.createdAt = num(s.createdAt ?? d.createdAt, 0, 8.64e15, 'createdAt');
  out.savedAt = num(s.savedAt ?? d.savedAt, 0, 8.64e15, 'savedAt');
  out.playSeconds = num(s.playSeconds ?? 0, 0, 1e9, 'playSeconds');
  out.gameMinutes = num(s.gameMinutes ?? d.gameMinutes, 0, 1e9, 'gameMinutes');
  out.drift = Math.floor(num(s.drift ?? 0, 0, 1e6, 'drift'));

  if (!isId(s.zone ?? 'room')) err('zone.');
  out.zone = s.zone ?? 'room';

  if (!isPlainObject(s.flags ?? {})) err('flags.');
  out.flags = {};
  for (const [k, v] of Object.entries(s.flags ?? {})) {
    if (!isId(k)) err('nom de drapeau.');
    if (typeof v === 'boolean' || typeof v === 'number' || (typeof v === 'string' && v.length <= 80)) out.flags[k] = v;
    else err('valeur de drapeau.');
  }

  if (!isPlainObject(s.owned ?? {})) err('owned.');
  out.owned = {};
  for (const [k, v] of Object.entries(s.owned ?? {})) {
    if (!isId(k)) err('identifiant d\'objet.');
    if (known && !known('item', k)) continue; // objet inconnu : ignoré
    out.owned[k] = Math.floor(num(v, 0, 99, 'quantité'));
  }

  if (!Array.isArray(s.placed ?? [])) err('placed.');
  const placed = s.placed ?? [];
  if (placed.length > 200) err('trop d\'objets placés.');
  out.placed = [];
  const seen = new Set();
  for (const p of placed) {
    if (!isPlainObject(p) || !isId(p.id) || !isId(p.uid)) err('objet placé.');
    if (seen.has(p.uid)) err('uid dupliqué.');
    seen.add(p.uid);
    if (known && !known('item', p.id)) continue;
    out.placed.push({ uid: p.uid, id: p.id, x: Math.round(num(p.x, -50, 400, 'x')), y: Math.round(num(p.y, -50, 300, 'y')) });
  }

  for (const key of ['memories', 'docs', 'symbols', 'zones', 'puzzles', 'events', 'secrets', 'codex', 'gallery', 'shardOrder']) {
    const arr = s[key] ?? d[key];
    if (!isStrArr(arr)) err(key + '.');
    out[key] = [...new Set(arr)];
  }
  if (!out.zones.includes('room')) out.zones.unshift('room');

  if (!isPlainObject(s.anomalies ?? {})) err('anomalies.');
  out.anomalies = {};
  for (const [k, v] of Object.entries(s.anomalies ?? {})) { if (isId(k)) out.anomalies[k] = Math.floor(num(v, 0, 1e6, 'anomalie')); }
  out.anomalyLast = {};
  for (const [k, v] of Object.entries(s.anomalyLast ?? {})) { if (isId(k)) out.anomalyLast[k] = num(v, 0, 1e9, 'anomalyLast'); }
  out.achievements = {};
  for (const [k, v] of Object.entries(s.achievements ?? {})) { if (isId(k)) out.achievements[k] = num(v, 0, 8.64e15, 'succès'); }

  const n = s.noir ?? d.noir;
  if (!isPlainObject(n)) err('noir.');
  out.noir = {
    pet: Math.floor(num(n.pet ?? 0, 0, 1e6, 'pet')),
    play: Math.floor(num(n.play ?? 0, 0, 1e6, 'play')),
    feed: Math.floor(num(n.feed ?? 0, 0, 1e6, 'feed')),
    mood: num(n.mood ?? 70, 0, 100, 'mood'),
    equipped: (() => { const e = n.equipped ?? (n.accessory ? [n.accessory] : []); if (!isStrArr(e, 8)) err('accessoires.'); return [...new Set(e)]; })(),
    owned: isStrArr(n.owned ?? []) ? [...new Set(n.owned ?? [])] : err('noir.owned.'),
  };

  const w = s.window ?? d.window;
  if (!isPlainObject(w) || !isId(w.scene ?? 'night_stars')) err('window.');
  out.window = { auto: w.auto !== false, scene: w.scene ?? 'night_stars' };

  if (!Array.isArray(s.chime ?? [])) err('chime.');
  out.chime = (s.chime ?? []).map((x) => Math.floor(num(x, 0, 3, 'chime')));
  if (typeof (s.notes ?? '') !== 'string' || (s.notes ?? '').length > 20000) err('notes.');
  out.notes = s.notes ?? '';
  if (s.ending != null && !['dawn', 'stay', 'lamp'].includes(s.ending)) err('fin.');
  out.ending = s.ending ?? null;

  const st = s.settings ?? {};
  if (!isPlainObject(st)) err('settings.');
  const S = { ...DEFAULT_SETTINGS };
  for (const k of ['master', 'music', 'sfx']) if (st[k] !== undefined) S[k] = Math.round(num(st[k], 0, 100, k));
  if (st.muted !== undefined) S.muted = !!st.muted;
  if (st.reduceMotion !== undefined) S.reduceMotion = !!st.reduceMotion;
  if (st.grid !== undefined) S.grid = !!st.grid;
  const oneOf = (v, list, name) => (v === undefined ? undefined : list.includes(v) ? v : err(name + '.'));
  S.quality = oneOf(st.quality, ['low', 'medium', 'high'], 'qualité') ?? S.quality;
  S.clockFormat = oneOf(st.clockFormat, ['24', '12', 'dream'], 'format horloge') ?? S.clockFormat;
  S.timeMode = oneOf(st.timeMode, ['cycle', 'fixed'], 'mode horaire') ?? S.timeMode;
  S.textSpeed = oneOf(st.textSpeed, ['instant', 'normal'], 'vitesse texte') ?? S.textSpeed;
  if (st.fixedHour !== undefined) S.fixedHour = Math.floor(num(st.fixedHour, 0, 23, 'fixedHour'));
  if (st.timeSpeed !== undefined) S.timeSpeed = [0.5, 1, 2].includes(st.timeSpeed) ? st.timeSpeed : err('vitesse.');
  out.settings = S;
  out.stats = { anomalies: Math.floor(num(s.stats?.anomalies ?? 0, 0, 1e6, 'stats')), items: Math.floor(num(s.stats?.items ?? 0, 0, 1e6, 'stats')) };
  out.version = SCHEMA_VERSION;
  out.format = FORMAT_TAG;
  return out;
}

// ------------------------------------------------------------------ stockage

export function createStorage(backend) {
  const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
  return {
    available: () => safe(() => { backend.setItem('__t', '1'); backend.removeItem('__t'); return true; }, false),
    get: (k) => safe(() => backend.getItem(k), null),
    set: (k, v) => safe(() => { backend.setItem(k, v); return true; }, false),
    remove: (k) => safe(() => { backend.removeItem(k); return true; }, false),
  };
}

export class SaveManager {
  constructor(backend, known = null) {
    this.store = createStorage(backend);
    this.known = known;
    this.lastError = null;
    this.recovered = false;
  }

  hasSave() { return !!(this.store.get(SAVE_KEY) || this.store.get(BACKUP_KEY)); }

  /** Charge la sauvegarde ; en cas de corruption, tente la sauvegarde de secours, sinon renvoie null. */
  load() {
    this.lastError = null;
    this.recovered = false;
    for (const key of [SAVE_KEY, BACKUP_KEY]) {
      const raw = this.store.get(key);
      if (!raw) continue;
      try {
        const st = validateState(JSON.parse(raw), this.known);
        if (key === BACKUP_KEY) this.recovered = true;
        return st;
      } catch (e) {
        this.lastError = e.message;
        if (key === SAVE_KEY) this.store.set(SAVE_KEY + ':corrupt', raw); // conservé pour inspection
      }
    }
    return null;
  }

  save(state) {
    state.savedAt = Date.now();
    const json = JSON.stringify(state);
    const prev = this.store.get(SAVE_KEY);
    if (prev) { try { validateState(JSON.parse(prev), this.known); this.store.set(BACKUP_KEY, prev); } catch { /* copie corrompue : on garde l'ancienne sauvegarde de secours */ } }
    const ok = this.store.set(SAVE_KEY, json);
    if (!ok) this.lastError = 'Écriture impossible (stockage plein ou bloqué).';
    return ok;
  }

  wipe() {
    this.store.remove(SAVE_KEY); this.store.remove(BACKUP_KEY); this.store.remove(SAVE_KEY + ':corrupt');
  }

  exportJSON(state) { return JSON.stringify({ ...state, savedAt: Date.now() }, null, 2); }

  /** Import strict : renvoie l'état validé ou lève une erreur. Ne touche jamais au stockage. */
  parseImport(text) {
    if (typeof text !== 'string' || text.length > 2_000_000) throw new Error('Fichier trop volumineux ou illisible.');
    let obj;
    try { obj = JSON.parse(text); } catch { throw new Error('Ce fichier n\'est pas un JSON valide.'); }
    if (!isPlainObject(obj)) throw new Error('Ce fichier n\'est pas une sauvegarde Dream Room.');
    if (obj.format !== undefined && obj.format !== FORMAT_TAG) throw new Error('Ce fichier n\'est pas une sauvegarde Dream Room.');
    return validateState(obj, this.known);
  }
}
