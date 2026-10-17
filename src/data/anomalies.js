// Anomalies : le cœur du jeu. Données pures + planificateur testable (aucun DOM).
// kind : 'atmos' (ambiance) | 'clue' (révèle un indice) | 'unlock' (débloque du contenu)
// scene : où l'anomalie peut survenir ; trigger : 'auto' (planificateur) | 'lookaway' | 'return' | 'enter_hall' | 'interact'
// hours : [début, fin[ en heures de jeu (peut enjamber minuit) ; cooldown : minutes de jeu ; duration : secondes réelles
import { weightedPick } from '../core/util.js';

export const ANOMALIES = [
  { id: 'painting_swap', name: 'Le tableau qui change', kind: 'atmos', scene: 'room', trigger: 'lookaway', minChapter: 1, chance: 0.5, cooldown: 20, duration: 0,
    desc: 'Quand tu détournes le regard, le tableau en profite pour montrer autre chose.' },
  { id: 'furniture_shift', name: 'Le meuble différent', kind: 'atmos', scene: 'room', trigger: 'return', minChapter: 2, chance: 0.6, cooldown: 30, duration: 0,
    desc: 'Après chaque retour, un meuble est légèrement différent. Tu ne sais pas lequel.' },
  { id: 'extra_shadow', name: 'L\'ombre sans objet', kind: 'clue', scene: 'room', trigger: 'auto', minChapter: 2, weight: 1, cooldown: 120, duration: 70,
    desc: 'Une ombre au mur ne correspond à aucun objet de la chambre.', gallery: 'g_odd1' },
  { id: 'window_room', name: 'La fenêtre-chambre', kind: 'clue', scene: 'room', trigger: 'auto', minChapter: 2, weight: 0.8, cooldown: 180, duration: 28,
    desc: 'La fenêtre montre une pièce au lieu du paysage. La même pièce. Vue de dehors.', gallery: 'g_odd2' },
  { id: 'clock_reverse', name: 'L\'horloge à l\'envers', kind: 'atmos', scene: 'room', trigger: 'auto', minChapter: 1, weight: 1, cooldown: 90, duration: 45,
    desc: 'Les aiguilles tournent à l\'envers. Quelqu\'un remonte quelque chose.' },
  { id: 'cloud_figure', name: 'La silhouette des nuages', kind: 'atmos', scene: 'room', trigger: 'auto', minChapter: 3, weight: 0.8, cooldown: 150, duration: 26, hours: [20, 6],
    desc: 'Une silhouette se dessine dans les nuages, puis refuse de se défaire.' },
  { id: 'night_door', name: 'La porte de trois heures', kind: 'unlock', scene: 'room', trigger: 'auto', minChapter: 2, weight: 3, cooldown: 240, duration: 100, hours: [2, 4],
    desc: 'Une porte pâle n\'apparaît qu\'entre deux et quatre heures du matin.', memory: 'm_door' },
  { id: 'pc_message', name: 'Le message de l\'ordinateur', kind: 'unlock', scene: 'room', trigger: 'auto', minChapter: 2, weight: 1.6, cooldown: 400, duration: 0, once: true,
    desc: 'L\'ordinateur reçoit un message que personne n\'a écrit.', doc: 'bonne_nuit', give: 'tv_static' },
  { id: 'gravity_flick', name: 'Les objets qui montent', kind: 'atmos', scene: 'room', trigger: 'auto', minChapter: 3, weight: 0.7, cooldown: 200, duration: 9,
    desc: 'Pendant un instant, tout ce qui est léger monte vers le plafond.' },
  { id: 'new_corridor', name: 'Le couloir qui n\'existait pas', kind: 'clue', scene: 'hallway', trigger: 'enter_hall', minChapter: 3, chance: 0.5, cooldown: 60, duration: 0,
    desc: 'Au bout du couloir, un tronçon supplémentaire est apparu. Il n\'y était pas avant.' },
  { id: 'whisper_object', name: 'L\'objet qui murmure', kind: 'atmos', scene: 'any', trigger: 'interact', minChapter: 1, chance: 0.22, cooldown: 4, duration: 0,
    desc: 'Un objet, que tu n\'as fait qu\'effleurer, murmure un fragment d\'histoire.' },
  { id: 'moon_shape', name: 'La lune qui se souvient', kind: 'atmos', scene: 'room', trigger: 'passive', minChapter: 1, duration: 0,
    desc: 'La forme de la lune dehors change selon les souvenirs que tu as retrouvés.' },
  // --- Événements rares : ne se produisent pas à chaque partie
  { id: 'rare_visitor', name: 'Le visiteur du pied du lit', kind: 'atmos', scene: 'room', trigger: 'auto', rare: true, minChapter: 3, weight: 0.25, cooldown: 800, duration: 12, hours: [0, 5],
    desc: 'Une silhouette est assise au pied du lit. NOIR la regarde sans bouger.' },
  { id: 'rare_eclipse', name: 'Éclipse dans la fenêtre', kind: 'atmos', scene: 'room', trigger: 'auto', rare: true, minChapter: 2, weight: 0.25, cooldown: 900, duration: 40,
    desc: 'La lune est mangée par un disque plus noir que la nuit.' },
  { id: 'rare_comet', name: 'La comète', kind: 'unlock', scene: 'room', trigger: 'auto', rare: true, minChapter: 2, weight: 0.25, cooldown: 900, duration: 22, give: 'comet_jar',
    desc: 'Une comète traverse la fenêtre, lentement, comme pour être vue.' },
  { id: 'rare_double_moon', name: 'La seconde lune', kind: 'clue', scene: 'room', trigger: 'auto', rare: true, minChapter: 4, weight: 0.2, cooldown: 1200, duration: 35, gallery: 'g_odd3',
    desc: 'Deux lunes dans le ciel. Une des deux ne projette pas d\'ombre.' },
];

export const ANOMALY_BY_ID = Object.fromEntries(ANOMALIES.map((a) => [a.id, a]));

export const SCHEDULER = {
  checkEverySec: 10, // fréquence de vérification (secondes réelles)
  rollChance: 0.3, // probabilité qu'une vérification tente un déclenchement
  minGapSec: 45, // temps minimal entre deux anomalies « auto » (fréquence limitée)
  rareGapSec: 360, // temps minimal entre deux événements rares
  rareChance: 0.18, // probabilité qu'un tirage rare soit tenté quand il est autorisé
};

export function hourInRange(hour, range) {
  if (!range) return true;
  const [a, b] = range;
  return a <= b ? hour >= a && hour < b : hour >= a || hour < b;
}

/** Une anomalie est-elle éligible dans ce contexte ? */
export function isEligible(a, c) {
  if (a.trigger !== 'auto') return false;
  if (a.scene !== 'any' && a.scene !== c.scene) return false;
  if (c.chapter < (a.minChapter ?? 1)) return false;
  if (!hourInRange(c.hour, a.hours)) return false;
  if (a.once && (c.state.anomalies[a.id] || 0) > 0) return false;
  const last = c.state.anomalyLast[a.id];
  if (last !== undefined && c.state.gameMinutes - last < (a.cooldown ?? 60) && c.state.gameMinutes >= last) return false;
  return true;
}

/**
 * Planificateur : choisit (ou non) une anomalie automatique.
 * ctx = { state, scene, hour, chapter, nowSec, lastAnySec, lastRareSec, active, blocked }
 * Renvoie une anomalie ou null. `rand` injectable pour les tests.
 */
export function pickAnomaly(ctx, rand = Math.random) {
  if (ctx.blocked || ctx.active) return null;
  if (ctx.nowSec - ctx.lastAnySec < SCHEDULER.minGapSec) return null;
  if (rand() > SCHEDULER.rollChance) return null;
  const pool = ANOMALIES.filter((a) => isEligible(a, ctx));
  const common = pool.filter((a) => !a.rare);
  const rare = pool.filter((a) => a.rare);
  const rareAllowed = ctx.nowSec - ctx.lastRareSec >= SCHEDULER.rareGapSec && rare.length && rand() < SCHEDULER.rareChance;
  return weightedPick(rareAllowed ? rare : common, rand);
}
