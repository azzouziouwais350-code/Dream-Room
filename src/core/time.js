// Horloge du jeu : jamais liée à l'heure réelle. Modes : 'cycle' (le temps passe) ou 'fixed' (heure figée).
import { pad2 } from './util.js';
import { DREAM_MONTHS } from '../data/world.js';

export const MINUTES_PER_REAL_SECOND = 1; // à vitesse 1 : un jour de jeu ≈ 24 minutes réelles

export function advanceClock(state, dtSec) {
  state.gameMinutes += dtSec * MINUTES_PER_REAL_SECOND * (state.settings.timeSpeed || 1);
}
export const dayIndex = (state) => Math.floor(state.gameMinutes / 1440);
export function getHour(state) {
  if (state.settings.timeMode === 'fixed') return state.settings.fixedHour;
  return Math.floor(state.gameMinutes / 60) % 24;
}
export function getMinute(state) {
  if (state.settings.timeMode === 'fixed') return 0;
  return Math.floor(state.gameMinutes) % 60;
}
export const isNight = (hour) => hour >= 21 || hour < 5;

/** Passe à l'heure demandée (le lendemain si elle est déjà passée). Utilisé par le lit. */
export function sleepUntil(state, hour) {
  const cur = state.gameMinutes % 1440;
  const target = hour * 60;
  state.gameMinutes += cur <= target ? target - cur : 1440 - cur + target;
  return state.gameMinutes;
}

export function formatClock(state, format = state.settings.clockFormat) {
  const h = getHour(state), m = getMinute(state);
  if (format === '12') {
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad2(m)} ${h < 12 ? 'AM' : 'PM'}`;
  }
  if (format === 'dream') {
    const names = ['Veille', 'Soir', 'Nuit', 'Aube'];
    const seg = h >= 5 && h < 12 ? 3 : h >= 12 && h < 18 ? 1 : h >= 18 && h < 21 ? 1 : h >= 21 || h < 2 ? 0 : 2;
    return `${names[seg]} ${pad2(h)}h${pad2(m)}`;
  }
  return `${pad2(h)}:${pad2(m)}`;
}

/** Date fictive : « 13 Lunaire — Nuit 4 » */
export function formatDate(state) {
  const d = dayIndex(state);
  const month = DREAM_MONTHS[Math.floor((d + 12) / 30) % DREAM_MONTHS.length];
  const day = ((d + 12) % 30) + 1;
  return `${day} ${month} · Nuit ${d + 1}`;
}
