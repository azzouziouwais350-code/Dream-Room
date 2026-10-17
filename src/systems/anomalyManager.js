// Exécution des anomalies : planification (voir data/anomalies.js), durée de vie, découverte et sauvegarde.
// Règles : une seule anomalie « auto » active à la fois, délai minimal entre deux, événements rares très espacés,
// jamais pendant un dialogue ou un panneau ouvert.
import { ANOMALY_BY_ID, SCHEDULER, pickAnomaly } from '../data/anomalies.js';

export class AnomalyManager {
  /** @param game objet de jeu (state, progress, ui, audio, hour(), chapter()) */
  constructor(game) {
    this.game = game;
    this.active = null; // { id, a, until, started, found }
    this.nowSec = 0; this.lastAnySec = -30; this.lastRareSec = 0; this.sinceCheck = 0;
    this.listeners = [];
    this.debugForce = null;
  }

  on(fn) { this.listeners.push(fn); }
  _emit(type, p) { for (const f of this.listeners) f(type, p); }

  reset() { this.active = null; this.lastAnySec = this.nowSec - 20; this.sinceCheck = 0; }

  isActive(id) { return !!this.active && this.active.id === id; }
  /** Progression 0..1 de l'anomalie active (pour les animations d'entrée / sortie). */
  progress() { return this.active ? Math.min(1, (this.nowSec - this.active.started) / Math.max(0.1, this.active.a.duration)) : 0; }
  fade() {
    if (!this.active) return 0;
    const a = this.active, e = this.nowSec - a.started, left = a.until - this.nowSec;
    return Math.max(0, Math.min(1, e / 1.5, left / 1.5));
  }

  update(dt, ctx) {
    this.nowSec += dt;
    if (this.active && this.nowSec >= this.active.until) {
      const a = this.active; this.active = null;
      this._emit('end', a);
    }
    this.sinceCheck += dt;
    if (this.sinceCheck < SCHEDULER.checkEverySec) return;
    this.sinceCheck = 0;
    const g = this.game;
    if (this.debugForce) { const id = this.debugForce; this.debugForce = null; this.trigger(id); return; }
    const pick = pickAnomaly({
      state: g.state, scene: ctx.scene, hour: g.hour(), chapter: g.chapter(), nowSec: this.nowSec,
      lastAnySec: this.lastAnySec, lastRareSec: this.lastRareSec, active: this.active, blocked: ctx.blocked,
    });
    if (pick) this.trigger(pick.id);
  }

  /** Déclenche une anomalie (planificateur ou événement : look-away, retour, entrée de zone...). */
  trigger(id) {
    const a = ANOMALY_BY_ID[id];
    if (!a) return false;
    const g = this.game;
    if (a.duration > 0) {
      if (this.active) return false;
      this.active = { id, a, started: this.nowSec, until: this.nowSec + a.duration, found: false };
      this.lastAnySec = this.nowSec;
      if (a.rare) this.lastRareSec = this.nowSec;
    }
    // les anomalies d'ambiance et les événements rares sont « vus » dès qu'ils se produisent ;
    // les indices et déblocages le sont quand le joueur les trouve (voir found()).
    if (a.kind === 'atmos' || a.rare) this.found(id);
    g.audio.sfx(a.rare ? 'rare' : 'anomaly');
    this._emit('start', { id, a });
    return true;
  }

  /** Le joueur a trouvé / interagi : enregistre la découverte (une seule fois par apparition). */
  found(id) {
    const g = this.game;
    const act = this.active && this.active.id === id ? this.active : null;
    if (act) { if (act.found) return false; act.found = true; }
    const first = g.progress.registerAnomaly(id);
    this._emit('found', { id, first });
    return first;
  }

  endActive() { if (this.active) { const a = this.active; this.active = null; this._emit('end', a); } }
}
