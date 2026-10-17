// Gestionnaire audio centralisé — 100 % synthétisé avec la Web Audio API (aucun fichier, aucun droit tiers).
// - musique : séquenceur déterministe par piste (lecture/pause/suivant/position)
// - ambiances : pluie, vent, bourdonnement, grillons, vagues (bruit filtré)
// - effets : sons d'interface, de découverte, de portes, de NOIR...
// L'audio démarre après une interaction (politique des navigateurs). Si l'API manque : tout devient silencieux sans erreur.
import { TRACKS } from '../data/world.js';
import { rng, clamp } from '../core/util.js';

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const N = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const n = (name, oct) => 12 * (oct + 1) + N[name[0]] + (name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0);

// Pistes : accords par mesure (2 phrases de 8 mesures), motif d'arpège, timbres
const TRACK_DEFS = {
  veilleuse: { bpm: 62, bars: 16, chords: [[n('D', 3), n('F', 3), n('A', 3), n('E', 4)], [n('Bb', 2), n('D', 3), n('F', 3), n('A', 3)], [n('G', 2), n('Bb', 2), n('D', 3), n('A', 3)], [n('A', 2), n('E', 3), n('G', 3), n('C#', 4)]], arp: [0, 2, 1, 3, 2, 1, 3, 2], arpWave: 'triangle', pad: 'sine', arpGain: 0.06, padGain: 0.05, bass: true, bell: 0.35 },
  pluie: { bpm: 54, bars: 16, chords: [[n('A', 2), n('E', 3), n('G', 3), n('B', 3)], [n('F', 2), n('C', 3), n('E', 3), n('A', 3)], [n('C', 3), n('G', 3), n('A', 3), n('E', 4)], [n('E', 2), n('B', 2), n('D', 3), n('G', 3)]], arp: [0, 3, 1, 2], arpWave: 'triangle', pad: 'sine', arpGain: 0.07, padGain: 0.035, bass: true, bell: 0.2, sparse: true },
  couloir: { bpm: 40, bars: 16, chords: [[n('D', 2), n('Eb', 2), n('A', 3)], [n('D', 2), n('A', 2), n('Eb', 3)], [n('C', 2), n('Gb', 2), n('Db', 3)], [n('D', 2), n('Eb', 2), n('A', 3)]], arp: [], arpWave: 'sine', pad: 'sawtooth', arpGain: 0, padGain: 0.022, bass: false, bell: 0.5, drone: true },
  bibliotheque: { bpm: 70, bars: 16, chords: [[n('E', 3), n('G', 3), n('B', 3)], [n('C', 3), n('E', 3), n('G', 3)], [n('D', 3), n('F#', 3), n('A', 3)], [n('B', 2), n('E', 3), n('G', 3)]], arp: [0, 1, 2, 1, 2, 0, 1, 2], arpWave: 'sine', pad: 'triangle', arpGain: 0.05, padGain: 0.03, bass: false, bell: 0.6, celesta: true },
  jardin: { bpm: 84, bars: 16, chords: [[n('G', 3), n('B', 3), n('D', 4)], [n('E', 3), n('G', 3), n('B', 3)], [n('C', 3), n('E', 3), n('G', 3)], [n('D', 3), n('F#', 3), n('A', 3)]], arp: [0, 1, 2, 1, 2, 1], arpWave: 'triangle', pad: 'sine', arpGain: 0.06, padGain: 0.02, bass: false, bell: 0.5, musicbox: true, triple: true },
  lune: { bpm: 48, bars: 16, chords: [[n('F', 3), n('A', 3), n('C', 4), n('E', 4)], [n('D', 3), n('F', 3), n('A', 3), n('C', 4)], [n('Bb', 2), n('D', 3), n('F', 3), n('A', 3)], [n('C', 3), n('E', 3), n('G', 3), n('B', 3)]], arp: [3, 2, 1, 0], arpWave: 'sine', pad: 'sine', arpGain: 0.04, padGain: 0.045, bass: false, bell: 0.4, celesta: true },
  blanche: { bpm: 50, bars: 16, chords: [[n('C', 3), n('E', 3), n('G', 3), n('B', 3)], [n('A', 2), n('E', 3), n('G', 3), n('C', 4)], [n('F', 2), n('C', 3), n('F', 3), n('A', 3)], [n('G', 2), n('D', 3), n('G', 3), n('B', 3)]], arp: [0, 2, 3, 1], arpWave: 'sine', pad: 'sine', arpGain: 0.045, padGain: 0.05, bass: true, bell: 0.3 },
};
export const trackDuration = (id) => { const d = TRACK_DEFS[id]; return d ? (d.bars * 4 * 60) / d.bpm : 0; };

const BELL_FREQ = [523.25, 587.33, 659.25, 783.99]; // do ré mi sol : carillon du jardin

export class AudioManager {
  constructor() {
    this.ctx = null; this.available = typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
    this.settings = { master: 80, music: 70, sfx: 80, muted: false };
    this.music = null; // {id, startTime, offset, nextStep, bus, loop, onEnd, paused, pausedPos}
    this.playerActive = false; // le lecteur de Dream.OS a pris la main
    this.zoneTrack = null;
    this.amb = {}; this.ambTarget = { rain: 0, wind: 0, hum: 0, crickets: 0, waves: 0 };
    this.activeSfx = 0; this.exclusive = {};
    this.timer = null; this.lastTick = 0; this.lastError = null;
    this.state = 'locked'; // locked | running | unavailable
  }

  /** À appeler depuis un geste utilisateur (clic, touche). */
  unlock() {
    if (!this.available) { this.state = 'unavailable'; return false; }
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.musicBus = this.ctx.createGain(); this.sfxBus = this.ctx.createGain(); this.ambBus = this.ctx.createGain();
        const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
        this.musicBus.connect(this.master); this.sfxBus.connect(this.master); this.ambBus.connect(this.sfxBus); this.master.connect(comp); comp.connect(this.ctx.destination);
        this.noise = this._noiseBuffer();
        this._buildAmbience();
        this.applySettings(this.settings);
        this.timer = setInterval(() => this._tick(), 120);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.state = 'running';
      if (this.zoneTrack && !this.music && !this.playerActive) this.playTrack(this.zoneTrack, { loop: true });
      return true;
    } catch (e) {
      this.lastError = e.message; this.available = false; this.state = 'unavailable';
      return false;
    }
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state === 'suspended' && this.state === 'running') this.ctx.resume().catch(() => {}); }

  applySettings(s) {
    this.settings = { ...this.settings, ...s };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const m = this.settings.muted ? 0 : (this.settings.master / 100) ** 1.5;
    this.master.gain.setTargetAtTime(m, t, 0.05);
    this.musicBus.gain.setTargetAtTime((this.settings.music / 100) ** 1.5 * 1.0, t, 0.05);
    this.sfxBus.gain.setTargetAtTime((this.settings.sfx / 100) ** 1.5 * 1.0, t, 0.05);
  }

  _noiseBuffer() {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    const r = rng(99);
    let b = 0;
    for (let i = 0; i < len; i++) { const w = r() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = w * 0.5 + b * 3; }
    return buf;
  }
  _noiseSrc() { const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true; return s; }

  _buildAmbience() {
    const c = this.ctx;
    const mk = (name, build) => { const g = c.createGain(); g.gain.value = 0; g.connect(this.ambBus); build(g); this.amb[name] = g; };
    mk('rain', (out) => {
      const s = this._noiseSrc(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.4;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      s.connect(bp); bp.connect(hp); hp.connect(out); s.start();
    });
    mk('wind', (out) => {
      const s = this._noiseSrc(); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 2;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.12; const lg = c.createGain(); lg.gain.value = 160; lfo.connect(lg); lg.connect(lp.frequency);
      s.connect(lp); lp.connect(out); s.start(); lfo.start();
    });
    mk('hum', (out) => {
      for (const [f, gv] of [[55, 0.5], [110.6, 0.25], [165, 0.08]]) { const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); g.gain.value = gv; o.connect(g); g.connect(out); o.start(); }
    });
    mk('waves', (out) => {
      const s = this._noiseSrc(); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      const g = c.createGain(); g.gain.value = 0.5; const lfo = c.createOscillator(); lfo.frequency.value = 0.09; const lg = c.createGain(); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(g.gain);
      s.connect(lp); lp.connect(g); g.connect(out); s.start(); lfo.start();
    });
    mk('crickets', () => {}); // grillons : impulsions programmées dans _tick
  }

  /** Ambiance cible : valeurs 0..1 (les non fournies retombent à 0). */
  setAmbient(a = {}) {
    this.ambTarget = { rain: 0, wind: 0, hum: 0, crickets: 0, waves: 0, ...a };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const gain = { rain: 0.5, wind: 0.35, hum: 0.05, waves: 0.4, crickets: 1 };
    for (const k of Object.keys(this.amb)) this.amb[k].gain.setTargetAtTime((this.ambTarget[k] || 0) * (gain[k] ?? 0.3), t, 1.2);
  }

  // ------------------------------------------------------------------ musique
  /** Musique de zone : ne coupe pas le lecteur de Dream.OS s'il est actif. */
  setZoneTrack(id) {
    this.zoneTrack = id;
    if (this.playerActive || !this.ctx) return;
    if (this.music && this.music.id === id) return;
    this.playTrack(id, { loop: true });
  }

  playTrack(id, { offset = 0, loop = true, onEnd = null, fade = 1.2 } = {}) {
    if (!this.ctx || !TRACK_DEFS[id]) return false;
    this._stopMusic(fade);
    const bus = this.ctx.createGain(); bus.gain.value = 0; bus.connect(this.musicBus);
    bus.gain.setTargetAtTime(1, this.ctx.currentTime, fade / 3);
    const def = TRACK_DEFS[id];
    const stepDur = 60 / def.bpm / 4;
    this.music = { id, def, bus, startTime: this.ctx.currentTime + 0.05 - offset, offset, nextStep: Math.floor(offset / stepDur), loop, onEnd, paused: false, pausedPos: 0, stepDur, rand: rng(id.length * 131 + 7) };
    return true;
  }

  _stopMusic(fade = 0.8) {
    const m = this.music; if (!m) return;
    this.music = null;
    const t = this.ctx.currentTime;
    m.bus.gain.cancelScheduledValues(t); m.bus.gain.setTargetAtTime(0, t, fade / 3);
    setTimeout(() => { try { m.bus.disconnect(); } catch { /* déjà détaché */ } }, fade * 1000 + 600);
  }
  stopMusic(fade = 0.8) { if (this.ctx) this._stopMusic(fade); }

  pauseMusic() {
    const m = this.music; if (!m || m.paused) return;
    m.pausedPos = this.musicPosition(); m.paused = true;
    m.bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
  }
  resumeMusic() {
    const m = this.music; if (!m || !m.paused) return;
    m.paused = false; m.startTime = this.ctx.currentTime + 0.05 - m.pausedPos; m.nextStep = Math.ceil(m.pausedPos / m.stepDur);
    m.bus.gain.setTargetAtTime(1, this.ctx.currentTime, 0.1);
  }
  seekMusic(sec) {
    const m = this.music; if (!m) return;
    const id = m.id, loop = m.loop, onEnd = m.onEnd;
    this.playTrack(id, { offset: clamp(sec, 0, trackDuration(id) - 0.5), loop, onEnd, fade: 0.2 });
  }
  musicPosition() {
    const m = this.music; if (!m) return 0;
    if (m.paused) return m.pausedPos;
    return clamp(this.ctx.currentTime - m.startTime, 0, trackDuration(m.id));
  }
  getMusicState() {
    const m = this.music;
    return { id: m ? m.id : null, pos: m ? this.musicPosition() : 0, dur: m ? trackDuration(m.id) : 0, playing: !!m && !m.paused, running: this.state === 'running' };
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const m = this.music;
    if (m && !m.paused) {
      const dur = trackDuration(m.id);
      const horizon = now + 0.6;
      while (m.startTime + m.nextStep * m.stepDur < horizon) {
        const step = m.nextStep, t = m.startTime + step * m.stepDur;
        if (step * m.stepDur >= dur) {
          if (m.loop) { m.startTime += dur; m.nextStep = 0; continue; }
          const cb = m.onEnd; this.music = null; this._stopMusic(1.0); if (cb) cb(); break;
        }
        if (t >= now - 0.05) this._musicStep(m, step, Math.max(t, now));
        m.nextStep++;
      }
    }
    // grillons
    if ((this.ambTarget.crickets || 0) > 0.05 && now - this.lastTick > 0.9 + Math.random() * 1.4) {
      this.lastTick = now;
      for (let i = 0; i < 3; i++) this._tone(4200 + Math.random() * 300, now + i * 0.07, 0.04, { type: 'sine', gain: 0.012 * this.ambTarget.crickets, bus: this.ambBus, attack: 0.005, release: 0.03 });
    }
  }

  _musicStep(m, step, t) {
    const d = m.def, bar = Math.floor(step / 16), s16 = step % 16;
    const chord = d.chords[(bar % 8) % d.chords.length];
    const phrase2 = bar >= 8;
    const len = m.stepDur * 16;
    if (s16 === 0) {
      // nappe
      chord.forEach((f, i) => {
        this._tone(mtof(f), t, len * 1.02, { type: d.pad, gain: d.padGain * (i === 0 ? 1.1 : 0.8), attack: len * 0.35, release: len * 0.4, bus: m.bus, detune: (i - 1.5) * 4 });
        if (d.pad === 'sine' || d.pad === 'triangle') this._tone(mtof(f) * 2.003, t, len, { type: 'sine', gain: d.padGain * 0.22, attack: len * 0.5, release: len * 0.4, bus: m.bus });
      });
      if (d.bass) this._tone(mtof(chord[0] - 12), t, len * 0.9, { type: 'sine', gain: 0.09, attack: 0.15, release: len * 0.3, bus: m.bus });
      if (d.drone) {
        this._tone(mtof(chord[0] - 12), t, len, { type: 'sine', gain: 0.07, attack: len * 0.4, release: len * 0.4, bus: m.bus });
        if (m.rand() < 0.5) this._tone(mtof(chord[2] + 12 * (1 + (m.rand() < 0.5 ? 1 : 0))), t + len * 0.3, 1.8, { type: 'sine', gain: 0.025, attack: 0.5, release: 1.2, bus: m.bus, detune: 18 });
      }
    }
    // arpège
    if (d.arp.length) {
      const triple = !!d.triple;
      const stepsPer = triple ? 3 : 2;
      if (s16 % stepsPer === 0 && (!d.sparse || (s16 / stepsPer) % 2 === (phrase2 ? 1 : 0))) {
        const k = d.arp[(s16 / stepsPer) % d.arp.length] % chord.length;
        const note = chord[k] + (phrase2 ? 12 : (d.musicbox ? 12 : 0)) + (d.celesta ? 12 : 0);
        const hard = d.musicbox || d.celesta;
        this._tone(mtof(note), t, hard ? 1.1 : 0.9, { type: d.arpWave, gain: d.arpGain * (0.85 + m.rand() * 0.3), attack: 0.006, release: hard ? 0.9 : 0.7, bus: m.bus, pluck: true });
        if (d.celesta) this._tone(mtof(note) * 2, t, 0.5, { type: 'sine', gain: d.arpGain * 0.25, attack: 0.003, release: 0.4, bus: m.bus });
      }
    }
    // clochettes aléatoires (déterministes)
    if (s16 % 4 === 2 && m.rand() < d.bell * 0.25) {
      const f = mtof(chord[Math.floor(m.rand() * chord.length)] + 24);
      this._tone(f, t, 1.6, { type: 'sine', gain: 0.022, attack: 0.004, release: 1.4, bus: m.bus });
      this._tone(f * 2.76, t, 0.6, { type: 'sine', gain: 0.008, attack: 0.003, release: 0.5, bus: m.bus });
    }
  }

  // --------------------------------------------------------------------- notes
  _tone(freq, t, dur, { type = 'sine', gain = 0.1, attack = 0.01, release = 0.1, bus = null, detune = 0, glideTo = null, pluck = false, filter = null } = {}) {
    if (!this.ctx) return null;
    const c = this.ctx;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    if (pluck) g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 0.25), t + Math.min(dur, 0.35));
    g.gain.setTargetAtTime(0.0001, t + Math.max(attack, dur - release), release / 3);
    let node = o;
    if (filter) { const f = c.createBiquadFilter(); f.type = filter.type; f.frequency.value = filter.freq; f.Q.value = filter.q || 1; o.connect(f); node = f; }
    node.connect(g); g.connect(bus || this.sfxBus);
    o.start(t); o.stop(t + dur + release + 0.1);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch { /* ok */ } };
    return o;
  }

  _noiseBurst(t, dur, { gain = 0.1, freq = 1200, q = 1, type = 'bandpass', attack = 0.005, release = 0.08, exclusive = null, sweepTo = null } = {}) {
    const c = this.ctx;
    const s = this._noiseSrc(); const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.setTargetAtTime(0.0001, t + Math.max(attack, dur - release), release / 3);
    s.connect(f); f.connect(g); g.connect(this.sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + release + 0.1);
    s.onended = () => { try { s.disconnect(); f.disconnect(); g.disconnect(); } catch { /* ok */ } };
    return { stop: () => { try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setTargetAtTime(0.0001, c.currentTime, 0.03); } catch { /* ok */ } } };
  }

  // ------------------------------------------------------------------- effets
  sfx(name, opts = {}) {
    if (!this.ctx || this.ctx.state !== 'running' || this.settings.muted) return;
    if (this.activeSfx > 14) return;
    const fn = SFX[name];
    if (!fn) return;
    this.activeSfx++;
    setTimeout(() => { this.activeSfx = Math.max(0, this.activeSfx - 1); }, 450);
    try { fn(this, this.ctx.currentTime + 0.005, opts); } catch (e) { this.lastError = e.message; }
  }
  /** Son exclusif (ne se superpose pas à lui-même). */
  exclusiveSfx(key, startFn) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (this.exclusive[key]) { try { this.exclusive[key].stop(); } catch { /* ok */ } }
    this.exclusive[key] = startFn();
  }
  bell(i, vel = 1) { this.sfx('bell', { i, vel }); }
  dispose() { clearInterval(this.timer); try { this.ctx && this.ctx.close(); } catch { /* ok */ } }
}

const SFX = {
  click: (a, t) => a._tone(900, t, 0.05, { type: 'square', gain: 0.025, attack: 0.002, release: 0.04 }),
  hover: (a, t) => a._tone(1400, t, 0.03, { type: 'sine', gain: 0.012, attack: 0.002, release: 0.025 }),
  open: (a, t) => { a._tone(420, t, 0.12, { type: 'triangle', gain: 0.05, glideTo: 780, release: 0.08 }); },
  close: (a, t) => { a._tone(700, t, 0.1, { type: 'triangle', gain: 0.04, glideTo: 330, release: 0.08 }); },
  toggle: (a, t) => a._tone(620, t, 0.06, { type: 'square', gain: 0.025, release: 0.05 }),
  tick: (a, t) => a._tone(1800 + Math.random() * 200, t, 0.02, { type: 'square', gain: 0.008, attack: 0.001, release: 0.02 }),
  error: (a, t) => { a._tone(160, t, 0.18, { type: 'sawtooth', gain: 0.05, release: 0.1, filter: { type: 'lowpass', freq: 600 } }); },
  step: (a, t) => a._noiseBurst(t, 0.05, { gain: 0.05, freq: 300, q: 0.7, release: 0.04 }),
  page: (a, t) => a._noiseBurst(t, 0.18, { gain: 0.06, freq: 4000, q: 0.5, type: 'highpass', release: 0.12 }),
  discover: (a, t) => { [659.25, 830.6, 987.77, 1318.5].forEach((f, i) => a._tone(f, t + i * 0.07, 0.5, { type: 'sine', gain: 0.045, attack: 0.004, release: 0.45 })); },
  memory: (a, t) => { [392, 493.9, 587.3, 783.99].forEach((f, i) => a._tone(f, t + i * 0.12, 1.6, { type: 'sine', gain: 0.04, attack: 0.25, release: 1.2 })); a._tone(196, t, 2, { type: 'sine', gain: 0.05, attack: 0.4, release: 1.4 }); },
  solve: (a, t) => { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => a._tone(f, t + i * 0.09, 0.7, { type: 'triangle', gain: 0.05, attack: 0.005, release: 0.55 })); },
  secret: (a, t) => { a._noiseBurst(t, 0.9, { gain: 0.05, freq: 300, sweepTo: 2400, q: 1.5, release: 0.4 }); [440, 659.25, 880].forEach((f, i) => a._tone(f, t + 0.5 + i * 0.1, 0.9, { type: 'sine', gain: 0.04, release: 0.7 })); },
  achievement: (a, t) => { a._tone(880, t, 0.25, { type: 'triangle', gain: 0.05, release: 0.2 }); a._tone(1318.5, t + 0.12, 0.5, { type: 'triangle', gain: 0.05, release: 0.4 }); },
  rare: (a, t) => { for (let i = 0; i < 6; i++) a._tone(1200 + i * 230, t + i * 0.1, 1.2, { type: 'sine', gain: 0.025, attack: 0.1, release: 1.0, detune: i * 5 }); },
  anomaly: (a, t) => { a._tone(73.4, t, 2.2, { type: 'sine', gain: 0.07, attack: 0.8, release: 1.2 }); a._tone(77.8, t, 2.2, { type: 'sine', gain: 0.06, attack: 0.9, release: 1.2 }); a._tone(1244, t + 0.6, 1.3, { type: 'sine', gain: 0.012, attack: 0.3, release: 0.9, detune: 30 }); },
  door: (a, t) => { a._tone(70, t, 0.25, { type: 'sine', gain: 0.18, glideTo: 40, release: 0.2 }); a._noiseBurst(t + 0.05, 0.5, { gain: 0.04, freq: 500, sweepTo: 220, q: 6, release: 0.25 }); },
  doorlock: (a, t) => { a._tone(180, t, 0.07, { type: 'square', gain: 0.04, release: 0.05 }); a._tone(150, t + 0.09, 0.07, { type: 'square', gain: 0.04, release: 0.05 }); },
  key: (a, t) => { a._tone(1760, t, 0.4, { type: 'sine', gain: 0.04, release: 0.35 }); a._tone(2349, t + 0.08, 0.5, { type: 'sine', gain: 0.03, release: 0.4 }); a._noiseBurst(t, 0.04, { gain: 0.05, freq: 5000, release: 0.03 }); },
  portal: (a, t) => { a._noiseBurst(t, 1.0, { gain: 0.06, freq: 200, sweepTo: 3200, q: 2, release: 0.5 }); a._tone(110, t, 1.1, { type: 'sine', gain: 0.07, glideTo: 440, release: 0.4 }); },
  bell: (a, t, { i = 0, vel = 1 } = {}) => { const f = BELL_FREQ[i % 4]; a._tone(f, t, 1.6, { type: 'sine', gain: 0.07 * vel, attack: 0.003, release: 1.4 }); a._tone(f * 2.756, t, 0.7, { type: 'sine', gain: 0.02 * vel, attack: 0.002, release: 0.6 }); a._tone(f * 5.4, t, 0.3, { type: 'sine', gain: 0.008 * vel, release: 0.25 }); },
  meow: (a, t) => {
    const f0 = 520 + Math.random() * 80;
    a._tone(f0, t, 0.42, { type: 'sawtooth', gain: 0.045, attack: 0.04, release: 0.2, glideTo: f0 * 0.62, filter: { type: 'bandpass', freq: 1500, q: 2.5 } });
    a._tone(f0 * 1.5, t, 0.3, { type: 'sine', gain: 0.012, attack: 0.04, release: 0.15, glideTo: f0 });
  },
  purr: (a, t) => a.exclusiveSfx('purr', () => {
    const c = a.ctx; const s = a._noiseSrc(); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const g = c.createGain(); g.gain.value = 0.0001; const lfo = c.createOscillator(); lfo.frequency.value = 24; const lg = c.createGain(); lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain);
    g.gain.setTargetAtTime(0.09, t, 0.3); g.gain.setTargetAtTime(0.0001, t + 1.8, 0.4);
    s.connect(lp); lp.connect(g); g.connect(a.sfxBus); s.start(t); lfo.start(t); s.stop(t + 3); lfo.stop(t + 3);
    s.onended = () => { try { s.disconnect(); g.disconnect(); } catch { /* ok */ } };
    return { stop: () => { try { g.gain.setTargetAtTime(0.0001, c.currentTime, 0.05); } catch { /* ok */ } } };
  }),
  whisper: (a, t) => a.exclusiveSfx('whisper', () => {
    const r1 = a._noiseBurst(t, 1.2, { gain: 0.06, freq: 3200, q: 3, attack: 0.3, release: 0.7 });
    a._noiseBurst(t + 0.35, 0.9, { gain: 0.035, freq: 2100, q: 4, attack: 0.25, release: 0.5 });
    return r1;
  }),
  pounce: (a, t) => a._noiseBurst(t, 0.12, { gain: 0.05, freq: 900, sweepTo: 300, q: 1, release: 0.08 }),
  eat: (a, t) => { for (let i = 0; i < 4; i++) a._noiseBurst(t + i * 0.12, 0.05, { gain: 0.04, freq: 1800, q: 2, release: 0.04 }); },
  lamp: (a, t) => { a._tone(240, t, 0.04, { type: 'square', gain: 0.04, release: 0.03 }); a._tone(1900, t + 0.01, 0.05, { type: 'square', gain: 0.015, release: 0.04 }); },
  place: (a, t) => { a._tone(210, t, 0.07, { type: 'triangle', gain: 0.08, glideTo: 120, release: 0.05 }); },
  pick: (a, t) => { a._tone(500, t, 0.05, { type: 'triangle', gain: 0.04, glideTo: 800, release: 0.04 }); },
  static: (a, t) => a._noiseBurst(t, 0.35, { gain: 0.05, freq: 3000, q: 0.3, release: 0.2 }),
  thunder: (a, t) => a._noiseBurst(t, 1.8, { gain: 0.08, freq: 160, q: 0.5, type: 'lowpass', attack: 0.2, release: 1.2 }),
  creak: (a, t) => a._noiseBurst(t, 0.7, { gain: 0.04, freq: 800, sweepTo: 320, q: 9, release: 0.3 }),
  lever: (a, t) => { a._tone(120, t, 0.15, { type: 'square', gain: 0.07, release: 0.1, glideTo: 70 }); a._noiseBurst(t + 0.1, 0.2, { gain: 0.04, freq: 600, release: 0.1 }); },
  grav: (a, t) => { a._tone(60, t, 1.2, { type: 'sine', gain: 0.12, glideTo: 220, release: 0.5 }); a._noiseBurst(t, 1.0, { gain: 0.04, freq: 150, sweepTo: 1500, q: 1.5, release: 0.5 }); },
};

export const SFX_NAMES = Object.keys(SFX);
export { TRACK_DEFS };
