// Progression : objets, souvenirs, documents, zones, énigmes, anomalies, succès, chapitres.
// Logique pure sur l'état ; les notifications partent par `emit` (l'interface s'y abonne).
import { ITEM_BY_ID } from '../data/items.js';
import { MEMORY_BY_ID, DOC_BY_ID, DOCS } from '../data/story.js';
import { ANOMALY_BY_ID } from '../data/anomalies.js';
import { ACHIEVEMENTS, ACH_BY_ID } from '../data/achievements.js';
import { PUZZLES, ZONES } from '../data/world.js';

const SHARD_SYMBOL = { shard_moon: 'moon', shard_star: 'star', shard_heart: 'heart' };

/** Verrou d'un document : { open: bool, hint } — fonction pure. */
export function docLockStatus(doc, s) {
  const lock = doc.lock;
  if (!lock) return { open: true };
  let open = false;
  switch (lock.type) {
    case 'flag': open = !!s.flags[lock.key]; break;
    case 'pet': open = s.noir.pet >= lock.n; break;
    case 'anomalies': open = Object.keys(s.anomalies).length >= lock.n; break;
    case 'memories': open = s.memories.length >= lock.n; break;
    case 'code': open = !!s.flags[lock.key]; break;
    case 'granted': open = s.docs.includes(doc.id); break;
    default: open = false;
  }
  return { open, hint: lock.hint || 'Verrouillé.' };
}

export function computeChapter(s) {
  if (s.ending) return 8;
  if (s.zones.includes('white')) return 7;
  if (s.puzzles.includes('lunar') || s.zones.includes('lunar')) return 6;
  if (s.puzzles.includes('between') || s.zones.includes('between')) return 5;
  if (s.shardOrder.length >= 1) return 4;
  if (s.zones.includes('hallway')) return 3;
  if (s.puzzles.includes('safe')) return 2;
  return 1;
}

export class Progress {
  /** @param {object} state  @param {(type:string, payload?:object)=>void} emit */
  constructor(state, emit = () => {}) {
    this.s = state;
    this.emit = emit;
  }

  setState(state) { this.s = state; }
  get chapter() { return computeChapter(this.s); }

  has(itemId) { return (this.s.owned[itemId] || 0) > 0; }
  flag(k) { return this.s.flags[k]; }
  setFlag(k, v = true) {
    if (this.s.flags[k] === v) return false;
    this.s.flags[k] = v;
    this.changed();
    return true;
  }
  incFlag(k, by = 1) { this.s.flags[k] = (this.s.flags[k] || 0) + by; this.changed(); return this.s.flags[k]; }

  changed() { this.emit('changed'); }

  /** Donne un objet. Renvoie true si nouveau pour le joueur. */
  give(itemId, { silent = false } = {}) {
    const it = ITEM_BY_ID[itemId];
    if (!it) return false;
    const fresh = !this.has(itemId);
    if (!fresh && (it.placeable === false)) return false; // objets d'histoire/accessoires : un seul exemplaire
    this.s.owned[itemId] = Math.min(99, (this.s.owned[itemId] || 0) + (fresh ? 1 : 0));
    if (!fresh) return false;
    if (it.cat === 'cat' && !this.s.noir.owned.includes(itemId)) this.s.noir.owned.push(itemId);
    if (SHARD_SYMBOL[itemId] && !this.s.shardOrder.includes(SHARD_SYMBOL[itemId])) {
      this.s.shardOrder.push(SHARD_SYMBOL[itemId]);
      this.addSymbol(SHARD_SYMBOL[itemId], true);
    }
    if (!silent) this.emit('toast', { icon: 'item', title: 'Nouvel objet', text: it.name, sfx: 'discover' });
    this.emit('item', { id: itemId });
    this.changed();
    return true;
  }

  addSymbol(id, silent = false) {
    if (this.s.symbols.includes(id)) return false;
    this.s.symbols.push(id);
    if (!silent) this.emit('toast', { icon: 'eye', title: 'Symbole', text: id, sfx: 'discover' });
    this.changed();
    return true;
  }

  addGallery(id) {
    if (this.s.gallery.includes(id)) return false;
    this.s.gallery.push(id);
    this.emit('toast', { icon: 'image', title: 'Galerie', text: 'Nouvelle illustration', sfx: 'discover' });
    this.changed();
    return true;
  }

  addMemory(id) {
    const m = MEMORY_BY_ID[id];
    if (!m || this.s.memories.includes(id)) return false;
    this.s.memories.push(id);
    this.emit('toast', { icon: 'moon', title: 'Souvenir retrouvé', text: m.title, sfx: 'memory' });
    this.emit('memory', { id });
    if (m.gallery) this.addGallery(m.gallery);
    if (m.give) this.give(m.give);
    this.changed();
    return true;
  }

  unlockDoc(id, silent = false) {
    if (!DOC_BY_ID[id] || this.s.docs.includes(id)) return false;
    this.s.docs.push(id);
    if (!silent) this.emit('toast', { icon: 'doc', title: 'Dream.OS', text: 'Nouveau document : ' + DOC_BY_ID[id].name, sfx: 'discover' });
    this.changed();
    return true;
  }

  discoverZone(id) {
    if (!ZONES[id] || this.s.zones.includes(id)) return false;
    this.s.zones.push(id);
    this.emit('toast', { icon: 'door', title: 'Nouveau lieu', text: ZONES[id].name, sfx: 'discover' });
    this.emit('zone', { id });
    this.changed();
    return true;
  }

  discoverSecret(id, label) {
    if (this.s.secrets.includes(id)) return false;
    this.s.secrets.push(id);
    this.emit('toast', { icon: 'key', title: 'Passage secret', text: label || id, sfx: 'secret' });
    this.changed();
    return true;
  }

  solvePuzzle(id) {
    const p = PUZZLES[id];
    if (!p || this.s.puzzles.includes(id)) return false;
    this.s.puzzles.push(id);
    this.emit('toast', { icon: 'puzzle', title: 'Énigme résolue', text: p.name, sfx: 'solve' });
    for (const r of p.rewards) this.give(r);
    if (p.memory) this.addMemory(p.memory);
    if (p.symbol) this.addSymbol(p.symbol, true);
    this.emit('puzzle', { id });
    this.changed();
    return true;
  }

  registerEvent(id) {
    if (this.s.events.includes(id)) return false;
    this.s.events.push(id);
    this.changed();
    return true;
  }

  /** Enregistre l'observation d'une anomalie (première fois = découverte, effets associés). */
  registerAnomaly(id) {
    const a = ANOMALY_BY_ID[id];
    if (!a) return false;
    const first = !this.s.anomalies[id];
    this.s.anomalies[id] = (this.s.anomalies[id] || 0) + 1;
    this.s.anomalyLast[id] = this.s.gameMinutes;
    this.s.stats.anomalies++;
    if (first) {
      this.emit('toast', { icon: 'eye', title: a.rare ? 'Événement rare' : 'Anomalie', text: a.name, sfx: a.rare ? 'rare' : 'anomaly' });
      if (a.rare) this.registerEvent(id);
      if (a.doc) this.unlockDoc(a.doc);
      if (a.give) this.give(a.give);
      if (a.gallery) this.addGallery(a.gallery);
    }
    this.changed();
    return first;
  }

  /** Évalue les succès. Peut en chaîner plusieurs (un objet gagné peut en déclencher un autre). */
  checkAchievements() {
    let granted = [];
    for (let guard = 0; guard < 6; guard++) {
      let any = false;
      for (const a of ACHIEVEMENTS) {
        if (this.s.achievements[a.id]) continue;
        let ok = false;
        try { ok = !!a.check(this.s); } catch { ok = false; }
        if (!ok) continue;
        this.s.achievements[a.id] = Date.now();
        granted.push(a.id);
        any = true;
        this.emit('toast', { icon: 'trophy', title: 'Succès', text: a.name, sfx: 'achievement' });
        if (a.give) this.give(a.give);
      }
      if (!any) break;
    }
    if (granted.length) this.changed();
    return granted;
  }

  /** Progression résumée (pour le HUD / les tests). */
  summary() {
    const s = this.s;
    return {
      chapter: this.chapter,
      memories: s.memories.length,
      zones: s.zones.length,
      puzzles: s.puzzles.length,
      achievements: Object.keys(s.achievements).length,
      total: { achievements: ACHIEVEMENTS.length, docs: DOCS.length },
    };
  }
}

export { ACH_BY_ID };
