// Succès : conditions pures sur l'état. give : objet débloqué en récompense.
import { MEMORIES } from './story.js';

const nonBaseCount = (s) => s.stats.items;
const rareOwned = (s) => ['crystal_moon', 'comet_jar', 'ghost_lamp', 'golden_door'].filter((id) => (s.owned[id] || 0) > 0).length;

export const MAIN_PUZZLES = ['safe', 'library', 'garden', 'inverted', 'between', 'lunar'];
export const ALL_ZONES = ['hallway', 'library', 'garden', 'inverted', 'between', 'lunar', 'lighthouse', 'white'];

export const ACHIEVEMENTS = [
  { id: 'first_steps', name: 'Les yeux ouverts', desc: 'Commencer une partie.', icon: 'eye', check: () => true },
  { id: 'first_door', name: 'Première porte', desc: 'Franchir la porte de la chambre.', icon: 'door', check: (s) => s.zones.includes('hallway') },
  { id: 'explore_all', name: 'Cartographe de rien', desc: 'Visiter tous les lieux.', icon: 'compass', give: 'dresser_gothic', check: (s) => ALL_ZONES.every((z) => s.zones.includes(z)) },
  { id: 'anomaly_3', name: 'Détails qui ne collent pas', desc: 'Observer 3 anomalies différentes.', icon: 'eye', give: 'doll_old', check: (s) => Object.keys(s.anomalies).length >= 3 },
  { id: 'anomaly_8', name: 'Œil de veilleur', desc: 'Observer 8 anomalies différentes.', icon: 'eye', give: 'stained_glass', check: (s) => Object.keys(s.anomalies).length >= 8 },
  { id: 'rare_event', name: 'Pas tous les soirs', desc: 'Assister à un événement rare.', icon: 'star', check: (s) => s.events.length >= 1 },
  { id: 'secret_1', name: 'Un mur qui cède', desc: 'Découvrir un passage secret.', icon: 'key', check: (s) => s.secrets.length >= 1 },
  { id: 'secret_3', name: 'Chasseur de passages', desc: 'Découvrir trois secrets.', icon: 'key', give: 'crown_gold', check: (s) => s.secrets.length >= 3 },
  { id: 'pet_3', name: 'Premières caresses', desc: 'Caresser NOIR 3 fois.', icon: 'cat', check: (s) => s.noir.pet >= 3 },
  { id: 'pet_10', name: 'Ronronnement', desc: 'Caresser NOIR 10 fois.', icon: 'cat', give: 'bow_pink', check: (s) => s.noir.pet >= 10 },
  { id: 'play_3', name: 'Jeux de pattes', desc: 'Jouer 3 fois avec NOIR.', icon: 'cat', give: 'toybox', check: (s) => s.noir.play >= 3 },
  { id: 'play_5', name: 'Chasseur de plumes', desc: 'Jouer 5 fois avec NOIR.', icon: 'cat', give: 'hat_star', check: (s) => s.noir.play >= 5 },
  { id: 'feed_3', name: 'Gourmandise', desc: 'Nourrir NOIR 3 fois.', icon: 'cat', give: 'scarf_lavender', check: (s) => s.noir.feed >= 3 },
  { id: 'noir_sleep', name: 'Le sommeil du chat', desc: 'Voir NOIR s\'endormir.', icon: 'cat', give: 'beanbag', check: (s) => !!s.flags.noir_slept },
  { id: 'decor_3', name: 'Chez soi', desc: 'Placer 3 objets dans la chambre.', icon: 'home', give: 'stool_star', check: (s) => nonBaseCount(s) >= 3 },
  { id: 'decor_8', name: 'Décorateur de rêves', desc: 'Placer 8 objets dans la chambre.', icon: 'home', give: 'nightstand', check: (s) => nonBaseCount(s) >= 8 },
  { id: 'rares_3', name: 'Collectionneur', desc: 'Posséder 3 objets rares.', icon: 'star', check: (s) => rareOwned(s) >= 3 },
  { id: 'puzzle_3', name: 'Esprit logique', desc: 'Résoudre 3 énigmes.', icon: 'puzzle', check: (s) => MAIN_PUZZLES.filter((p) => s.puzzles.includes(p)).length >= 3 },
  { id: 'puzzle_all', name: 'Toutes les serrures', desc: 'Résoudre les 6 énigmes principales.', icon: 'puzzle', check: (s) => MAIN_PUZZLES.every((p) => s.puzzles.includes(p)) },
  { id: 'terminal_5', name: 'Mains sur le clavier', desc: 'Utiliser 5 commandes du terminal.', icon: 'term', give: 'neon_dream', check: (s) => (s.flags.term_cmds || 0) >= 5 },
  { id: 'first_sleep', name: 'Quelques heures de plus', desc: 'Dormir une première fois.', icon: 'moon', give: 'string_lights', check: (s) => !!s.flags.slept },
  { id: 'memory_5', name: 'Cinq souvenirs', desc: 'Retrouver 5 souvenirs.', icon: 'moon', check: (s) => s.memories.length >= 5 },
  { id: 'memory_all', name: 'Lune entière', desc: 'Retrouver tous les souvenirs.', icon: 'moon', check: (s) => s.memories.length >= MEMORIES.length },
  { id: 'finish', name: 'Le matin arrive', desc: 'Terminer l\'histoire.', icon: 'sun', give: 'lunar_lily', check: (s) => !!s.ending },
  { id: 'true_end', name: 'La lampe reste allumée', desc: 'Découvrir la fin secrète.', icon: 'lamp', check: (s) => s.ending === 'lamp' },
];
export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
