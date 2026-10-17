// Monde : scènes de fenêtre, zones, énigmes, pistes musicales (métadonnées).

// ---- Fenêtre : états visuels. rain/wind = intensité sonore associée ; time : plages horaires où l'auto-sélection les choisit
export const WINDOW_SCENES = [
  { id: 'night_stars', name: 'Nuit étoilée', rain: 0, wind: 0.15, night: true },
  { id: 'giant_moon', name: 'Lune gigantesque', rain: 0, wind: 0.1, night: true },
  { id: 'purple_sky', name: 'Ciel violet', rain: 0, wind: 0.2, any: true },
  { id: 'sunset', name: 'Coucher de soleil irréel', rain: 0, wind: 0.1, dusk: true },
  { id: 'rain', name: 'Pluie sur la vitre', rain: 1, wind: 0.2, night: true, any: true },
  { id: 'fog', name: 'Brouillard mouvant', rain: 0.1, wind: 0.35, night: true, dusk: true },
  { id: 'glow_clouds', name: 'Nuages lumineux', rain: 0, wind: 0.25, any: true },
  { id: 'floating_islands', name: 'Îles flottantes', rain: 0, wind: 0.3, night: true, dusk: true },
  { id: 'hanging_buildings', name: 'Bâtiments suspendus', rain: 0, wind: 0.2, night: true },
  { id: 'cloud_doors', name: 'Portes dans les nuages', rain: 0, wind: 0.15, night: true, dusk: true },
  { id: 'night_garden', name: 'Jardin nocturne', rain: 0.05, wind: 0.2, night: true },
  { id: 'silent_sky', name: 'Ciel silencieux', rain: 0, wind: 0, night: true },
  { id: 'eclipse', name: 'Éclipse', rain: 0, wind: 0.05, rare: true },
  { id: 'comet', name: 'Comète', rain: 0, wind: 0.05, rare: true },
  { id: 'double_moon', name: 'Seconde lune', rain: 0, wind: 0.05, rare: true },
  { id: 'room_view', name: 'Une pièce', rain: 0, wind: 0, rare: true },
  { id: 'dawn', name: 'Aube', rain: 0, wind: 0.1, ending: true },
];
export const WINDOW_BY_ID = Object.fromEntries(WINDOW_SCENES.map((w) => [w.id, w]));
/** Scènes que le joueur peut choisir lui-même (hors événements rares). */
export const WINDOW_PICKABLE = WINDOW_SCENES.filter((w) => !w.rare);

export function autoWindowScene(hour, dayIndex, rnd) {
  const night = hour >= 21 || hour < 5;
  const dusk = (hour >= 17 && hour < 21) || (hour >= 5 && hour < 8);
  const pool = WINDOW_SCENES.filter((w) => !w.rare && !w.ending && (night ? w.night : dusk ? w.dusk : w.any));
  const slot = Math.floor(hour / 2); // change toutes les 2 heures de jeu
  return pool[Math.floor(rnd(dayIndex * 31 + slot * 7) * pool.length) % pool.length].id;
}

// ---- Zones
export const ZONES = {
  room: { id: 'room', name: 'La Chambre', track: 'veilleuse', ambient: { hum: 0.5 } },
  hallway: { id: 'hallway', name: 'Le couloir liminal', track: 'couloir', ambient: { hum: 0.8, wind: 0.1 }, discover: 'Un couloir sans fin, trop propre. Les portes ont toutes la même poignée.' },
  library: { id: 'library', name: 'La bibliothèque infinie', track: 'bibliotheque', ambient: { hum: 0.3 }, discover: 'Des étagères jusqu\'au plafond, et le plafond n\'existe pas.' },
  garden: { id: 'garden', name: 'Le jardin nocturne', track: 'jardin', ambient: { wind: 0.4, crickets: 0.5 }, discover: 'Un balcon sans fin, des fleurs qui brillent à peine, des carillons.' },
  inverted: { id: 'inverted', name: 'La chambre inversée', track: 'couloir', ambient: { hum: 0.9, wind: 0.3 }, discover: 'Ta chambre, mais tout est au plafond. Ou c\'est toi.' },
  between: { id: 'between', name: 'L\'espace entre les portes', track: 'lune', ambient: { wind: 0.6 }, discover: 'Du vide, des portes flottantes, un silence plein.' },
  lunar: { id: 'lunar', name: 'La salle lunaire', track: 'lune', ambient: { hum: 0.4, wind: 0.2 }, discover: 'Une lune immense pend au centre. Quelqu\'un a laissé un piédestal vide.' },
  lighthouse: { id: 'lighthouse', name: 'Le phare oublié', track: 'jardin', ambient: { wind: 0.5, waves: 0.6 }, discover: 'Un phare minuscule, au bord d\'une mer qui n\'existe nulle part.' },
  white: { id: 'white', name: 'La chambre blanche', track: 'blanche', ambient: { hum: 0.2 }, discover: 'Une chambre vide, si blanche qu\'on entend les pas.' },
};

// ---- Énigmes (identifiants utilisés par progress.solvePuzzle). rewards : objets donnés à la résolution
export const PUZZLES = {
  safe: { name: 'Le coffre derrière l\'affiche', rewards: ['brass_key'], memory: 'm_date' },
  library: { name: 'L\'ordre du ciel du soir', rewards: ['lavender_key', 'shard_moon', 'armchair_velvet'], memory: 'm_library', symbol: 'moon' },
  garden: { name: 'Le carillon du jardin', rewards: ['clock_hand', 'shard_star', 'music_box', 'terrarium', 'rug_checker'], memory: 'm_garden', symbol: 'star' },
  inverted: { name: 'Ce qui tombe vers le haut', rewards: ['shard_heart', 'mirror_odd'], memory: 'm_inverted', symbol: 'heart' },
  between: { name: 'L\'ordre de l\'oubli', rewards: ['ring_iris', 'orb_chrome'], symbol: 'door' },
  lunar: { name: 'Le piédestal des trois éclats', rewards: ['ghost_lamp', 'rug_star'], memory: 'm_watcher', symbol: 'eye' },
};

// ---- Pistes musicales (synthétisées par systems/audio.js). unlock : zone à avoir visitée (ou null)
export const TRACKS = [
  { id: 'veilleuse', title: 'Veilleuse', unlock: null },
  { id: 'pluie', title: 'Pluie sur le verre', unlock: null },
  { id: 'couloir', title: 'Couloir 7', unlock: 'hallway' },
  { id: 'bibliotheque', title: 'Bibliothèque infinie', unlock: 'library' },
  { id: 'jardin', title: 'Jardin de minuit', unlock: 'garden' },
  { id: 'lune', title: 'Lune pâle', unlock: 'between' },
  { id: 'blanche', title: 'Chambre blanche', unlock: 'white' },
];
export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]));

// Noms de mois fictifs pour la date du jeu
export const DREAM_MONTHS = ['Brumaire', 'Veillose', 'Lunaire', 'Cendral', 'Étoilis', 'Nuitral'];
