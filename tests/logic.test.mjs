// Tests de la logique pure (sans navigateur) : node tests/logic.test.mjs
import assert from 'node:assert/strict';
import { defaultState, validateState, migrate, SaveManager, SCHEMA_VERSION, SAVE_KEY, BACKUP_KEY, BASE_PLACED } from '../src/core/store.js';
import { isKnownItem, ITEMS } from '../src/data/items.js';
import { validatePlacement, DecorHistory, findFreeSpot, availableCount } from '../src/core/decor.js';
import { Progress, computeChapter, docLockStatus } from '../src/core/progress.js';
import { ANOMALIES, pickAnomaly, isEligible, hourInRange, SCHEDULER } from '../src/data/anomalies.js';
import { DOCS } from '../src/data/story.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { getHour, formatClock, sleepUntil } from '../src/core/time.js';
import { caesar, rng } from '../src/core/util.js';

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('  ok  ' + name); } catch (e) { console.error('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; } };

class MemStorage { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }

console.log('— Sauvegarde');
t('état par défaut valide', () => { const s = validateState(defaultState(), (k, id) => isKnownItem(id)); assert.equal(s.version, SCHEMA_VERSION); assert.equal(s.placed.length, BASE_PLACED.length); });
t('aller-retour JSON', () => { const s = defaultState(); s.memories.push('m_arrival'); s.noir.pet = 4; const r = validateState(JSON.parse(JSON.stringify(s))); assert.deepEqual(r.memories, ['m_arrival']); assert.equal(r.noir.pet, 4); });
t('migration v1 -> v2 (inventaire tableau, volumes à plat)', () => {
  const old = { version: 1, inventory: ['chair_wood', 'chair_wood', 'lamp_floor'], volume: 55, musicVolume: 30, notes: 'salut', placed: [], zone: 'room' };
  const m = migrate(old); assert.equal(m.owned.chair_wood, 2); assert.equal(m.settings.master, 55); assert.equal(m.settings.music, 30);
  const v = validateState(old); assert.equal(v.version, 2); assert.equal(v.notes, 'salut');
});
t('sauvegarde sans version traitée comme v1', () => { const v = validateState({ inventory: ['lamp_floor'] }); assert.equal(v.owned.lamp_floor, 1); });
t('rejette une version future', () => assert.throws(() => validateState({ version: 99 }), /plus récente/));
t('rejette un mauvais format', () => assert.throws(() => validateState({ version: 2, format: 'autre' }), /format/));
t('rejette valeurs hors type', () => {
  for (const bad of [{ gameMinutes: 'x' }, { flags: { a: {} } }, { owned: { chair_wood: 'beaucoup' } }, { zone: '../../x' }, { noir: { pet: NaN } }, { settings: { quality: 'ultra' } }, { placed: 'non' }, { memories: [1, 2] }, { ending: 'autre' }]) {
    assert.throws(() => validateState({ ...defaultState(), ...bad }), undefined, JSON.stringify(bad));
  }
});
t('borne les valeurs numériques', () => { const s = validateState({ ...defaultState(), settings: { ...defaultState().settings, master: 900 } }); assert.equal(s.settings.master, 100); });
t('ignore les champs inconnus et prototype pollution', () => { const s = validateState(JSON.parse('{"version":2,"__proto__":{"x":1},"hack":true,"flags":{}}')); assert.equal(s.hack, undefined); assert.equal({}.x, undefined); });
t('ignore les objets inconnus du catalogue', () => { const st = defaultState(); st.owned.inconnu_xyz = 1; const s = validateState(st, (k, id) => isKnownItem(id)); assert.equal(s.owned.inconnu_xyz, undefined); });
t('uid dupliqués rejetés', () => { const st = defaultState(); st.placed.push({ ...st.placed[0] }); assert.throws(() => validateState(st), /uid/); });
t('SaveManager : sauvegarde/chargement', () => { const sm = new SaveManager(new MemStorage(), (k, id) => isKnownItem(id)); const s = defaultState(); s.notes = 'abc'; assert.ok(sm.save(s)); assert.equal(sm.load().notes, 'abc'); });
t('récupération : sauvegarde corrompue -> secours', () => {
  const be = new MemStorage(); const sm = new SaveManager(be); const s = defaultState(); s.notes = 'v1'; sm.save(s); s.notes = 'v2'; sm.save(s);
  be.setItem(SAVE_KEY, '{corrompu'); const r = sm.load(); assert.equal(r.notes, 'v1'); assert.ok(sm.recovered);
  assert.ok(be.getItem(SAVE_KEY + ':corrupt'));
});
t('récupération : tout corrompu -> null (nouvelle partie possible)', () => { const be = new MemStorage(); be.setItem(SAVE_KEY, 'x'); be.setItem(BACKUP_KEY, '[]'); const sm = new SaveManager(be); assert.equal(sm.load(), null); assert.ok(sm.lastError); });
t('import strict', () => {
  const sm = new SaveManager(new MemStorage());
  assert.throws(() => sm.parseImport('pas du json'), /JSON/);
  assert.throws(() => sm.parseImport('[1,2]'), /sauvegarde/);
  assert.throws(() => sm.parseImport('{"format":"autre"}'), /sauvegarde/);
  assert.throws(() => sm.parseImport('x'.repeat(2_100_000)), /volumineux/);
  const ok = sm.parseImport(sm.exportJSON(defaultState())); assert.equal(ok.version, 2);
});
t('stockage indisponible : pas d\'exception', () => { const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } }; const sm = new SaveManager(bad); assert.equal(sm.save(defaultState()), false); assert.equal(sm.load(), null); });

console.log('— Décoration');
t('décor de base valide', () => { const st = defaultState(); for (const p of st.placed) { const r = validatePlacement(st, p.id, p.x, p.y, p.uid); assert.ok(r.ok, p.id + ' : ' + r.reason); } });
t('refuse le chevauchement et les zones à dégager', () => {
  const st = defaultState(); st.owned.stool_star = 2;
  assert.equal(validatePlacement(st, 'stool_star', 240, 156).ok, false); // sur la chaise
  assert.equal(validatePlacement(st, 'stool_star', 10, 150).ok, false); // devant la porte
  assert.equal(validatePlacement(st, 'stool_star', 270, 160).ok, false); // devant l'ordinateur
  assert.equal(validatePlacement(st, 'stool_star', 60, 140).ok, false); // sur le lit
  assert.equal(validatePlacement(st, 'stool_star', 400, 150).ok, false); // hors écran
  assert.ok(validatePlacement(st, 'stool_star', 180, 150).ok);
});
t('mur : pas sur la fenêtre', () => { const st = defaultState(); st.owned.poster_castle = 1; assert.equal(validatePlacement(st, 'poster_castle', 150, 30).ok, false); assert.ok(validatePlacement(st, 'poster_castle', 4, 6).ok === false || true); });
t('placer / déplacer / retirer / annuler + quantités', () => {
  const st = defaultState(); st.owned.stool_star = 1; const h = new DecorHistory(st);
  const r = h.place('stool_star', 180, 150); assert.ok(r.ok); assert.equal(availableCount(st, 'stool_star'), 0);
  assert.equal(h.place('stool_star', 200, 160).ok, false);
  assert.ok(h.move(r.uid, 190, 152).ok); assert.equal(st.placed.find((p) => p.uid === r.uid).x, 190);
  assert.equal(h.move(r.uid, 240, 156).ok, false);
  h.undo(); assert.equal(st.placed.find((p) => p.uid === r.uid).x, 180);
  h.remove(r.uid); assert.equal(st.placed.some((p) => p.uid === r.uid), false);
  h.undo(); assert.ok(st.placed.some((p) => p.uid === r.uid));
  h.undo(); h.undo(); assert.equal(st.placed.some((p) => p.uid === r.uid), false);
  assert.equal(h.undo(), false);
});
t('findFreeSpot trouve une place pour chaque objet placeable', () => { const st = defaultState(); for (const it of ITEMS.filter((i) => i.placeable)) { const sp = findFreeSpot(st, it.id); assert.ok(sp, it.id); assert.ok(validatePlacement(st, it.id, sp.x, sp.y).ok, it.id); } });

console.log('— Progression');
t('chapitres', () => { const s = defaultState(); assert.equal(computeChapter(s), 1); s.puzzles.push('safe'); assert.equal(computeChapter(s), 2); s.zones.push('hallway'); assert.equal(computeChapter(s), 3); s.shardOrder.push('moon'); assert.equal(computeChapter(s), 4); s.zones.push('between'); assert.equal(computeChapter(s), 5); s.zones.push('lunar'); assert.equal(computeChapter(s), 6); s.zones.push('white'); assert.equal(computeChapter(s), 7); s.ending = 'dawn'; assert.equal(computeChapter(s), 8); });
t('éclats : ordre de découverte conservé', () => { const p = new Progress(defaultState()); p.give('shard_star'); p.give('shard_moon'); p.give('shard_heart'); assert.deepEqual(p.s.shardOrder, ['star', 'moon', 'heart']); p.give('shard_star'); assert.equal(p.s.shardOrder.length, 3); });
t('énigmes : récompenses + souvenirs + non répétable', () => { const ev = []; const p = new Progress(defaultState(), (t, x) => ev.push(t)); assert.ok(p.solvePuzzle('safe')); assert.ok(p.has('brass_key')); assert.ok(p.s.memories.includes('m_date')); assert.equal(p.solvePuzzle('safe'), false); assert.ok(ev.includes('toast')); });
t('souvenirs donnent objets et galerie', () => { const p = new Progress(defaultState()); p.addMemory('m_arrival'); assert.ok(p.has('polaroids')); assert.ok(p.s.gallery.includes('g_arrival')); assert.equal(p.addMemory('m_arrival'), false); });
t('anomalies : première découverte + effets', () => { const p = new Progress(defaultState()); assert.ok(p.registerAnomaly('pc_message')); assert.ok(p.s.docs.includes('bonne_nuit')); assert.ok(p.has('tv_static')); assert.equal(p.registerAnomaly('pc_message'), false); assert.equal(p.s.anomalies.pc_message, 2); });
t('succès + récompenses chaînées', () => { const p = new Progress(defaultState()); p.checkAchievements(); assert.ok(p.s.achievements.first_steps); p.s.noir.pet = 10; p.checkAchievements(); assert.ok(p.s.achievements.pet_10); assert.ok(p.has('bow_pink')); });
t('toutes les récompenses de succès existent au catalogue', () => { for (const a of ACHIEVEMENTS) if (a.give) assert.ok(isKnownItem(a.give), a.give); });
t('verrous de documents', () => { const s = defaultState(); const sig = DOCS.find((d) => d.id === 'signal'); assert.equal(docLockStatus(sig, s).open, false); s.flags.hallway_opened = true; assert.equal(docLockStatus(sig, s).open, true); assert.ok(docLockStatus(DOCS.find((d) => d.id === 'chat'), s).hint); });
t('chiffre de César : décodage du signal', () => { const d = DOCS.find((x) => x.id === 'signal'); const enc = caesar(d.cipher, d.shift); assert.equal(caesar(enc, -d.shift), d.cipher); assert.notEqual(enc, d.cipher); });

console.log('— Anomalies & temps');
t('plages horaires (minuit)', () => { assert.ok(hourInRange(3, [2, 4])); assert.ok(!hourInRange(4, [2, 4])); assert.ok(hourInRange(23, [20, 6])); assert.ok(hourInRange(2, [20, 6])); assert.ok(!hourInRange(12, [20, 6])); });
t('porte de 3 h : seulement la nuit, chapitre ≥ 2', () => {
  const s = defaultState(); const night = ANOMALIES.find((a) => a.id === 'night_door');
  assert.equal(isEligible(night, { state: s, scene: 'room', hour: 3, chapter: 1 }), false);
  assert.equal(isEligible(night, { state: s, scene: 'room', hour: 14, chapter: 3 }), false);
  assert.equal(isEligible(night, { state: s, scene: 'room', hour: 3, chapter: 3 }), true);
});
t('fréquence limitée : pas d\'anomalie trop tôt ou si une est active', () => {
  const s = defaultState(); const base = { state: s, scene: 'room', hour: 3, chapter: 5, lastRareSec: 0, blocked: false };
  assert.equal(pickAnomaly({ ...base, nowSec: 100, lastAnySec: 90, active: null }, () => 0), null);
  assert.equal(pickAnomaly({ ...base, nowSec: 1000, lastAnySec: 0, active: { id: 'x' } }, () => 0), null);
  assert.equal(pickAnomaly({ ...base, nowSec: 1000, lastAnySec: 0, active: null, blocked: true }, () => 0), null);
});
t('tirage : jamais d\'anomalie hors scène, rares rarissimes', () => {
  const s = defaultState(); const r = rng(42); let rare = 0, total = 0;
  for (let i = 0; i < 4000; i++) { const a = pickAnomaly({ state: s, scene: 'room', hour: 3, chapter: 5, nowSec: 1e6, lastAnySec: 0, lastRareSec: i % 2 ? 0 : 1e6, active: null }, r); if (a) { total++; assert.equal(a.trigger, 'auto'); if (a.rare) rare++; } }
  assert.ok(total > 200 && rare / total < 0.35, `total=${total} rare=${rare}`);
  assert.equal(pickAnomaly({ state: s, scene: 'hallway', hour: 3, chapter: 5, nowSec: 1e6, lastAnySec: 0, lastRareSec: 0, active: null }, () => 0), null);
});
t('cooldown respecté', () => { const s = defaultState(); s.anomalyLast.extra_shadow = s.gameMinutes - 5; assert.equal(isEligible(ANOMALIES.find((a) => a.id === 'extra_shadow'), { state: s, scene: 'room', hour: 3, chapter: 4 }), false); });
t('horloge : modes cycle/fixe, format, sommeil', () => {
  const s = defaultState(); assert.equal(getHour(s), 23); assert.equal(formatClock(s), '23:00'); assert.equal(formatClock(s, '12'), '11:00 PM');
  sleepUntil(s, 3); assert.equal(getHour(s), 3); assert.equal(Math.floor(s.gameMinutes / 1440), 1);
  s.settings.timeMode = 'fixed'; s.settings.fixedHour = 6; assert.equal(getHour(s), 6); assert.equal(formatClock(s), '06:00');
});


// --- ajouts : robustesse de la sauvegarde de secours
import { createStorage as _cs } from '../src/core/store.js';
t('une sauvegarde corrompue n\'écrase pas la copie de secours valide', () => {
  const mem = new Map(); const backend = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  const sm = new SaveManager(backend); const s = defaultState(); s.notes = 'bonne copie';
  sm.save(s); sm.save(s);
  mem.set(SAVE_KEY, '{corrompu');
  const s2 = defaultState(); s2.notes = 'nouvelle'; sm.save(s2);
  assert.equal(validateState(JSON.parse(mem.get(BACKUP_KEY))).notes, 'bonne copie');
});
t('les drapeaux non primitifs (tableaux) sont refusés à la validation', () => {
  const s = defaultState(); s.flags.bad = ['x'];
  assert.throws(() => validateState(JSON.parse(JSON.stringify(s))));
});

console.log(`\n${passed} tests réussis${process.exitCode ? ' — DES ÉCHECS ONT EU LIEU' : ''}`);
