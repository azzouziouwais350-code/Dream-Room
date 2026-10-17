// Jeu : boucle, scènes, entrées, sauvegarde, passerelle entre l'état, l'audio et l'interface.
import { W, H } from './art/pixel.js';
import { Loop, fitCanvas, toLogical, Transition } from './core/engine.js';
import { SaveManager, defaultState } from './core/store.js';
import { Progress } from './core/progress.js';
import { DecorHistory } from './core/decor.js';
import { advanceClock, getHour, getMinute } from './core/time.js';
import { clamp } from './core/util.js';
import { isKnownItem } from './data/items.js';
import { INTRO_LINES } from './data/story.js';
import { WINDOW_BY_ID } from './data/world.js';
import { AudioManager } from './systems/audio.js';
import { AnomalyManager } from './systems/anomalyManager.js';
import { UI } from './ui/ui.js';
import { buildMenu, hideMenu } from './ui/menu.js';
import { download, h } from './ui/dom.js';
import { MenuScene } from './scenes/menu.js';
import { RoomScene } from './scenes/room.js';
import { Hallway } from './scenes/zones/hallway.js';
import { Library } from './scenes/zones/library.js';
import { Garden } from './scenes/zones/garden.js';
import { Inverted } from './scenes/zones/inverted.js';
import { Between } from './scenes/zones/between.js';
import { Lunar } from './scenes/zones/lunar.js';
import { Lighthouse } from './scenes/zones/lighthouse.js';
import { White } from './scenes/zones/white.js';

const SCENES = { hallway: Hallway, library: Library, garden: Garden, inverted: Inverted, between: Between, lunar: Lunar, lighthouse: Lighthouse, white: White };

export class Game {
  constructor({ canvas, root, backend }) {
    this.canvas = canvas; this.root = root; this.ctx = canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.saves = new SaveManager(backend, (kind, id) => (kind === 'item' ? isKnownItem(id) : true));
    this.audio = new AudioManager();
    this.state = null; this.loaded = false; this.loadNotice = null;
    this.running = false; this.zoneId = 'room'; this.scenes = {}; this.scene = null;
    this.transitionFx = new Transition(); this.dirty = false; this.autosaveT = 0; this.hudT = 0; this.achT = 0; this.inAch = false;
    this.hover = null; this.focusIdx = -1; this.tapStart = null; this.tip = null; this.hotCache = null;
    this.progress = new Progress(defaultState(), (t, p) => this._onProgress(t, p));
    this.anom = new AnomalyManager(this);
    this.decor = new DecorHistory(this.progress.s, () => this.requestChange());
    this.ui = new UI(this, root);
    this.loop = new Loop({ update: (dt) => this.update(dt), render: (t) => this.render(t), maxFps: 60 });
  }

  // ------------------------------------------------------------------ démarrage
  boot() {
    const st = this.saves.load();
    if (st) { this._setState(st); this.loaded = true; if (this.saves.recovered) this.loadNotice = { text: 'La sauvegarde principale était illisible : la sauvegarde de secours a été restaurée.', err: false }; }
    else {
      this._setState(this._freshState());
      if (this.saves.lastError) this.loadNotice = { text: 'Sauvegarde illisible (' + this.saves.lastError + '). Une copie a été conservée ; tu peux démarrer une nouvelle partie ou importer un fichier.', err: true };
    }
    this.menuScene = new MenuScene(this); this.scene = this.menuScene;
    this._bindInput(); this.applyQuality();
    window.addEventListener('resize', () => this.fit());
    if (window.ResizeObserver) new ResizeObserver(() => this.fit()).observe(this.ui.layers.bottom);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.saveNow(false, true); this.audio.suspend(); } else this.audio.resume(); });
    window.addEventListener('pagehide', () => this.saveNow(false, true));
    this.ui.setHudVisible(false); buildMenu(this); this.fit(); this.loop.start();
  }

  _freshState(keep) {
    const s = defaultState();
    if (keep) s.settings = { ...keep };
    else if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) s.settings.reduceMotion = true;
    return s;
  }
  _setState(st) {
    this.state = st; this.progress.setState(st); this.decor.setState(st); this.anom.reset(); this.scenes = {}; this.room = null;
    this.audio.applySettings(st.settings); this.applyQuality();
  }
  _scene(id) {
    if (id === 'room') { if (!this.room) this.room = new RoomScene(this); return this.room; }
    if (!this.scenes[id]) this.scenes[id] = new SCENES[id](this);
    return this.scenes[id];
  }

  // ------------------------------------------------------------------ parties
  continueGame() { hideMenu(this); this._start('room'); }
  async newGame() {
    if (this.loaded && this.saves.hasSave()) {
      const ok = await this.ui.confirm('Nouvelle partie ?', 'Ta sauvegarde actuelle sera remplacée. Exporte-la d\'abord si tu veux la garder.', { yes: 'Remplacer', no: 'Annuler', danger: true });
      if (!ok) return;
    }
    this.saves.wipe(); this._setState(this._freshState(this.state.settings)); this.loaded = true;
    hideMenu(this); this._start('room', true);
  }
  _start(zone, intro = false) {
    this.running = true; this.zoneId = zone; this.scene = this._scene(zone); this.scene.enter({});
    this.ui.setHudVisible(true); this.ui.updateHud(); this.fit();
    this.audio.unlock(); this.audio.applySettings(this.state.settings);
    if (this.scene.id === 'room') this.audio.setZoneTrack(this.currentTrack());
    this.progress.checkAchievements();
    if (intro) { this.state.flags.intro = true; this.say(INTRO_LINES); }
    this.saveNow(false);
  }
  returnToMenu() {
    this.saveNow(false); this.stopDeco(); this.ui.closePanel(true); this.running = false; this.scene = this.menuScene; this.zoneId = 'room';
    this.loaded = this.saves.hasSave(); this.ui.setHudVisible(false); buildMenu(this); this.audio.setAmbient({ hum: 0.2 }); this.audio.setZoneTrack('veilleuse');
  }
  wipeAndRestart() { this.running = false; this.dirty = false; this.saves.wipe(); this._setState(this._freshState(this.state.settings)); this.loaded = false; this.loadNotice = null; this.returnToMenu(); }

  // ------------------------------------------------------------------ sauvegarde
  requestChange() { this.dirty = true; }
  saveNow(manual = false, quiet = false) {
    if (!this.state || (!this.running && !manual)) return false;
    this.state.zone = this.zoneId;
    const ok = this.saves.save(this.state); this.dirty = !ok;
    if (!quiet) { if (ok) this.ui.saved(manual ? 'Sauvegardé' : 'Sauvegarde auto'); else this.ui.saveError(this.saves.lastError || 'Échec'); }
    return ok;
  }
  exportSave() {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    download(`dream-room-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`, this.saves.exportJSON(this.state));
    this.ui.toast({ icon: 'save', title: 'Export', text: 'Fichier de sauvegarde téléchargé.' });
  }
  importSavePrompt() {
    const inp = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      try {
        if (f.size > 2_000_000) throw new Error('Fichier trop volumineux.');
        const st = this.saves.parseImport(await f.text());
        if (this.saves.hasSave()) { const ok = await this.ui.confirm('Importer cette sauvegarde ?', 'Elle remplacera la sauvegarde actuelle de cet appareil.', { yes: 'Importer', no: 'Annuler', danger: true }); if (!ok) return; }
        this.ui.closePanel(true); this._setState(st); this.loaded = true; this.saves.save(st);
        this.ui.toast({ icon: 'save', title: 'Import réussi', text: 'Sauvegarde chargée.' });
        if (this.running) this.returnToMenu(); else buildMenu(this);
      } catch (e) { this.ui.alert('Import impossible', e.message + ' Ta sauvegarde actuelle n\'a pas été modifiée.'); }
    });
    document.body.append(inp); inp.click();
  }

  // ------------------------------------------------------------------ passerelle (utilisée par les scènes)
  say(lines) { return this.ui.say(lines); }
  has(id) { return this.progress.has(id); }
  flag(k) { return this.state.flags[k]; }
  setFlag(k, v = true) { return this.progress.setFlag(k, v); }
  give(id) { return this.progress.give(id); }
  hour() { return getHour(this.state); }
  minute() { return getMinute(this.state); }
  chapter() { return this.progress.chapter; }
  blocked() { return this.ui.isBlocked() || this.transitionFx.active || !this.running; }
  openPanel(name, params) { this.ui.openPanel(name, params); }
  currentTrack() { const w = this.room && WINDOW_BY_ID[this.room.winCurId]; return w && w.rain >= 0.5 ? 'pluie' : 'veilleuse'; }
  onPanelChange() { /* réservé */ }
  petNoir() {
    const r = this.room, n = this.state.noir; if (!r) return;
    if (!r.noir.pet(r.env)) return;
    n.pet++; n.mood = clamp(n.mood + 4, 0, 100); this.audio.sfx(Math.random() < 0.6 ? 'purr' : 'meow');
    r._hearts(r.noir.x, r.noir.y - 22, 3); this.requestChange();
  }
  goto(zoneId, params = {}) {
    if (this.transitionFx.active || !SCENES[zoneId] && zoneId !== 'room') return;
    this.ui.closePopover(); this.focusIdx = -1;
    const from = this.zoneId;
    this.transitionFx.start(() => {
      try { this.scene.exit && this.scene.exit(); } catch (e) { console.error(e); }
      this.zoneId = zoneId; this.scene = this._scene(zoneId); this.scene.enter({ from, ...params });
      this.ui.updateHud(); this.requestChange(); this.fit();
      if (zoneId === 'hallway' && from === 'room') this.progress.checkAchievements();
    }, { reduce: this.state.settings.reduceMotion });
  }
  transition(cb) { this.transitionFx.start(cb, { reduce: this.state.settings.reduceMotion }); }
  startDeco() { if (this.zoneId !== 'room' || !this.room) return; this.ui.closePanel(true); this.room.startDeco(); this.ui.startDeco(); this.fit(); }
  stopDeco() { if (!this.room) return; this.room.stopDeco(); this.ui.stopDeco(); this.fit(); this.saveNow(false); }
  toggleFullscreen() {
    const d = document; try { if (!d.fullscreenElement) (this.root.requestFullscreen || this.root.webkitRequestFullscreen).call(this.root); else d.exitFullscreen(); } catch (e) { this.ui.toast({ icon: 'full', title: 'Plein écran', text: 'Indisponible sur ce navigateur.' }); }
  }
  applyQuality() {
    const q = this.state ? this.state.settings.quality : 'high';
    this.loop.setMaxFps(q === 'low' ? 30 : 60);
    document.body.classList.toggle('reduce-motion', !!(this.state && this.state.settings.reduceMotion));
    document.body.dataset.quality = q;
  }
  _onProgress(type, p) {
    if (type === 'toast') { this.ui.toast(p); if (p.sfx) this.audio.sfx(p.sfx); }
    else if (type === 'changed') { this.dirty = true; this.achT = 1; }
    else if (type === 'item' && this.room) this.room.markDirty();
  }

  // ------------------------------------------------------------------ boucle
  update(dt) {
    this.transitionFx.update(dt);
    if (!this.running) { this.menuScene.update(dt); return; }
    const s = this.state;
    if (!this.ui.dlg || true) this.scene.update(dt);
    if (!this.ui.dlg && !this.ui.modalOpen) { advanceClock(s, dt); s.playSeconds += dt; }
    this.anom.update(dt, { scene: this.zoneId, blocked: this.blocked() });
    this.ui.tickPanel(dt);
    this.hudT += dt; if (this.hudT > 0.5) { this.hudT = 0; this.ui.updateHud(); }
    if (this.achT > 0) { this.achT -= dt; if (this.achT <= 0 && !this.inAch) { this.inAch = true; try { this.progress.checkAchievements(); } finally { this.inAch = false; } } }
    this.autosaveT += dt; if (this.autosaveT > 6) { this.autosaveT = 0; if (this.dirty) this.saveNow(false); }
  }
  render(t) {
    const g = this.ctx; g.imageSmoothingEnabled = false;
    try { this.scene.draw(g, t); } catch (e) { if (!this._drawErr) { this._drawErr = true; console.error('Erreur de rendu', e); } }
    if (this.running && this.focusIdx >= 0 && this.hotCache && this.hotCache[this.focusIdx]) {
      const r = this.hotCache[this.focusIdx].rect; g.strokeStyle = '#00E5FF'; g.lineWidth = 1; g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    }
    this.transitionFx.draw(g);
  }

  // ------------------------------------------------------------------ affichage
  fit() {
    const r = this.root.getBoundingClientRect();
    const top = this.running ? this.ui.layers.hud.firstChild?.offsetHeight || 0 : 0;
    const bot = this.running ? this.ui.layers.bottom.offsetHeight || 0 : 0;
    const availW = r.width, availH = Math.max(120, r.height - top - bot - 8);
    fitCanvas(this.canvas, availW, availH);
    this.canvas.parentElement.style.paddingTop = top + 'px'; this.canvas.parentElement.style.paddingBottom = bot + 'px';
  }

  // ------------------------------------------------------------------ entrées
  _bindInput() {
    const c = this.canvas;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerdown', (e) => { if (this.ui.pop && !this.ui.pop.contains(e.target)) this.ui.closePopover(); }, true);
    c.addEventListener('pointerdown', (e) => {
      this.audio.unlock();
      if (!this.running || this.blocked()) return;
      const p = toLogical(c, e.clientX, e.clientY); this.ui.closePopover();
      c.setPointerCapture(e.pointerId);
      const handled = this.scene.pointerDown ? this.scene.pointerDown(p.x, p.y) : false;
      this.tapStart = handled ? null : { x: e.clientX, y: e.clientY, p };
      if (this.scene.lookAway && !handled) { /* le regard revient après interaction */ }
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.running) return;
      const p = toLogical(c, e.clientX, e.clientY);
      if (this.scene.pointerMove) this.scene.pointerMove(p.x, p.y);
      if (this.blocked()) { this._tip(null); return; }
      const hs = this.scene.hotspots(); this.hotCache = hs;
      const hit = this.scene.pick(p.x, p.y);
      c.style.cursor = hit ? 'pointer' : 'default';
      this._tip(hit && e.pointerType !== 'touch' ? hit.label : null, e.clientX, e.clientY);
    });
    c.addEventListener('pointerleave', () => this._tip(null));
    c.addEventListener('pointerup', (e) => {
      if (!this.running) return;
      const p = toLogical(c, e.clientX, e.clientY);
      if (this.scene.pointerUp) this.scene.pointerUp(p.x, p.y);
      const ts = this.tapStart; this.tapStart = null;
      if (!ts || this.blocked()) return;
      if (Math.hypot(e.clientX - ts.x, e.clientY - ts.y) > 14) return;
      this._tap(p, e.clientX, e.clientY);
    });
    c.addEventListener('keydown', (e) => this._canvasKey(e));
    c.addEventListener('blur', () => { this.focusIdx = -1; });
  }
  _tip(label, x, y) {
    if (!this.tip) { this.tip = h('div', { class: 'hover-tip', 'aria-hidden': 'true' }); this.root.append(this.tip); }
    if (!label) { this.tip.style.display = 'none'; return; }
    this.tip.textContent = label; this.tip.style.display = 'block';
    const r = this.root.getBoundingClientRect(); this.tip.style.left = x - r.left + 14 + 'px'; this.tip.style.top = y - r.top + 16 + 'px';
  }
  _tap(p, cx, cy) {
    const s = this.scene;
    if (s.floorTap && s.floorTap(p.x, p.y)) return;
    if (s.lookAway) s.lookAway();
    const hit = s.pick(p.x, p.y);
    if (!hit) return;
    this.activate(hit, cx, cy);
  }
  activate(hit, cx, cy) {
    if (!hit.actions || !hit.actions.length) return;
    this.audio.sfx('click');
    if (hit.actions.length === 1) { hit.actions[0].run(); return; }
    this.ui.popover(hit.actions, hit.label, cx, cy);
  }
  _canvasKey(e) {
    if (!this.running || this.blocked()) return;
    const hs = (this.hotCache = this.scene.hotspots().filter((x) => x.actions && x.actions.length).sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x));
    if (e.key === 'Tab') {
      const n = this.focusIdx + (e.shiftKey ? -1 : 1);
      if (n >= 0 && n < hs.length) { e.preventDefault(); this.focusIdx = n; this._announce(hs[n].label); } else this.focusIdx = -1;
    } else if ((e.key === 'Enter' || e.key === ' ') && this.focusIdx >= 0 && hs[this.focusIdx]) {
      e.preventDefault(); const hit = hs[this.focusIdx]; const r = this.canvas.getBoundingClientRect(); const k = r.width / W;
      this.activate(hit, r.left + (hit.rect.x + hit.rect.w / 2) * k, r.top + (hit.rect.y + hit.rect.h / 2) * k);
    }
  }
  _announce(text) {
    if (!this.live) { this.live = h('div', { class: 'sr-only', 'aria-live': 'polite' }); this.root.append(this.live); }
    this.live.textContent = text;
  }
}
