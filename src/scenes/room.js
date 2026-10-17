// La chambre : rendu par couches triées en profondeur, lumières, anomalies visuelles, NOIR, mode décoration.
import { C, W, H, R, mk, ctxOf, disc, ellipse, line, text3x5, rgba, dither } from '../art/pixel.js';
import * as F from '../art/furniture.js';
import { itemSprite } from '../art/items.js';
import { bakeRoomBase, bakeCRT, drawCRTScreen, drawClockHands, drawCurtain, glow } from '../art/roomBase.js';
import { drawWindowScene, drawCloudFigure, WW, WH } from '../art/windowScenes.js';
import { ITEM_BY_ID, FIXED_ROOM, FLOOR_BAND, KEEP_CLEAR, NOIR_EQUIP_SLOTS } from '../data/items.js';
import { EXAMINE, WHISPERS } from '../data/story.js';
import { WINDOW_BY_ID, autoWindowScene } from '../data/world.js';
import { visualRect, footprint, validatePlacement, snap, clampToSlot, GRID, availableCount } from '../core/decor.js';
import { Noir, buildGrid } from '../entities/noir.js';
import { getHour, getMinute, dayIndex, isNight, sleepUntil, formatClock } from '../core/time.js';
import { rng, rectsOverlap, pointIn, clamp } from '../core/util.js';

const FX = FIXED_ROOM;
const WINDOW_LIGHT = { night_stars: '#B9A0FF', giant_moon: '#F2DDFB', purple_sky: '#B9A0FF', sunset: '#FFBE62', rain: '#00E5FF', fog: '#B9A0FF', glow_clouds: '#FF6EC7', floating_islands: '#B9A0FF', hanging_buildings: '#00E5FF', cloud_doors: '#FFBE62', night_garden: '#00E5FF', silent_sky: '#54406F', eclipse: '#FFBE62', comet: '#00E5FF', double_moon: '#F2DDFB', room_view: '#FFBE62', dawn: '#FFBE62' };
const PAINTING_TEXT = ['Une petite maison au milieu d\'un champ de nuit. Une fenêtre est allumée.', 'La porte de la maison est ouverte. Tu ne l\'avais pas remarqué.', 'La maison a disparu. Il ne reste qu\'une porte, seule, dans le champ.', 'Il y a un œil dans le ciel. Il est fermé. Presque.'];
const BOOK_FRAGMENTS = ['« …et la nuit se rangea d\'elle-même, du plus haut violet jusqu\'au dernier or. »', '« Un chat n\'a pas de passé. Il a seulement des endroits chauds. »', '« Treize fois j\'ai compté les marches. Il y en avait toujours une de plus. »', '« Ce qu\'on garde allumé finit par ressembler à quelqu\'un. »'];
const SEATS = { chair_wood: { dy: 12, cx: 10 }, stool_star: { dy: 12, cx: 7 }, armchair_velvet: { dy: 10, cx: 14 }, beanbag: { dy: 9, cx: 12 }, toybox: { dy: 12, cx: 12 } };

export class RoomScene {
  constructor(game) {
    this.g = game; this.id = 'room';
    this.base = bakeRoomBase();
    this.bed = F.bakeBed(); this.wardrobe = F.bakeWardrobe(); this.desk = F.bakeDesk(); this.bookcase = F.bakeBookcase();
    this.winFrame = F.bakeWindowFrame(); this.door = F.bakeDoor(); this.poster = F.bakePoster(); this.safe = F.bakeSafe();
    this.clock = F.bakeClockFace(); this.photos = F.bakePhotos(); this.crt = bakeCRT();
    this.paintings = [0, 1, 2, 3].map((v) => F.bakePainting(v));
    this.winCur = mk(WW, WH); this.winPrev = mk(WW, WH); this.winCurId = null; this.winFade = 1; this.winAcc = 0;
    this.noir = new Noir();
    this.t = 0; this.lampOn = true; this.lampOffAt = 0; this.windowOpen = false;
    this.particles = []; this.dust = null; this.bowl = null; this.toy = null; this.pendingToy = null;
    this.dirty = true; this._grid = null; this._spots = null; this._rects = null;
    this.deco = { active: false, selected: null, pending: null, drag: null, preview: null, valid: true, reason: '', hover: null, shake: 0 };
    this.lookAwayPending = false; this.grav = 0; this.lastWinScene = null; this.sparkles = [];
    this.pointer = { x: 160, y: 90 }; this.doorTries = 0; this.rnd = rng(4242);
    this.focusIdx = -1; this.hintCache = null;
    this.env = {
      grid: () => this._getGrid(), spots: () => this._getSpots(), isNight: () => isNight(game.hour()),
      get chapter() { return game.chapter(); }, get hint() { return game.room ? game.room._hint() : null; },
      emit: (type, n) => this._noirEvent(type, n),
    };
  }

  // ---------------------------------------------------------------- cycle de vie
  enter(params = {}) {
    const g = this.g;
    this.dirty = true;
    if (params.from && params.from !== 'room') {
      g.state.drift++;
      g.anom.trigger('furniture_shift') && g.progress.setFlag('drift_seen', true);
    }
    this._refreshAmbience();
    g.audio.setZoneTrack(g.currentTrack());
    if (g.state.window) this._pickWindow(true);
    this.noir.wake(this.env, 0.6);
  }
  exit() { this.deco.active = false; this.deco.pending = null; this.deco.selected = null; }

  markDirty() { this.dirty = true; }
  _getGrid() { if (this.dirty || !this._grid) this._rebuild(); return this._grid; }
  _getSpots() { if (this.dirty || !this._spots) this._rebuild(); return this._spots; }

  _rebuild() {
    this.dirty = false;
    const g = this.g, s = g.state;
    const rects = [FX.bed.foot, FX.bookcase.foot, FX.wardrobe.foot, FX.desk.foot];
    const spots = [
      { id: 'bed_blanket', x: 98, y: 129, z: 153.5, cozy: true, approach: { x: 98, y: 158 } },
      { id: 'bed_pillow', x: 60, y: 129, z: 153.5, cozy: true, approach: { x: 66, y: 158 } },
      { id: 'bookcase', x: 168, y: 96, z: 130.5, approach: { x: 168, y: 137 } },
      { id: 'sill', x: 172, y: 70, z: 131, cozy: true, via: 'bookcase', approach: { x: 168, y: 137 } },
      { id: 'desk', x: 264, y: 88, z: 142.5, cozy: true, approach: { x: 264, y: 150 } },
    ];
    for (const p of s.placed) {
      const it = ITEM_BY_ID[p.id]; if (!it) continue;
      if (it.slot === 'floor') rects.push(footprint(it, p.x, p.y));
      if (SEATS[p.id]) {
        const st = SEATS[p.id];
        spots.push({ id: 'seat:' + p.uid, x: p.x + st.cx, y: p.y - st.dy, z: p.y + 0.5, cozy: true, approach: { x: p.x + it.w / 2, y: Math.min(FLOOR_BAND.bottom, p.y + 5) } });
      }
      if (it.slot === 'rug') spots.push({ id: 'rug:' + p.uid, x: p.x + it.w / 2, y: p.y - 5, z: p.y - 5, floor: true, cozy: false });
    }
    this._grid = buildGrid(rects);
    const free = (x, y) => { const c = Math.floor(x / 4), r = Math.floor((y - FLOOR_BAND.top) / 4); return !this._grid[r * 80 + c]; };
    for (const [id, x, y] of [['f_center', 160, 162], ['f_door', 52, 168], ['f_window', 170, 138], ['f_desk', 262, 156], ['f_right', 296, 148], ['f_left', 24, 160], ['f_mid', 210, 150]]) if (free(x, y)) spots.push({ id, x, y, z: y, floor: true });
    this._spots = spots;
    this._rects = rects;
  }

  /** Lieu que NOIR regarde pour guider : l'affiche tant que le coffre n'est pas ouvert, puis la porte. */
  _hint() {
    const s = this.g.state;
    if (!s.puzzles.includes('safe')) return { spot: this._getSpots().find((x) => x.id === 'bed_pillow'), target: { x: 61, y: 50 } };
    if (!s.zones.includes('hallway')) { const sp = this._getSpots().find((x) => x.id === 'f_door'); return sp ? { spot: sp, target: { x: 18, y: 90 } } : null; }
    return null;
  }

  _noirEvent(type, n) {
    const g = this.g;
    if (type === 'noirSlept') { if (!g.state.flags.noir_slept) { g.state.flags.noir_slept = true; g.requestChange(); } }
    else if (type === 'pounce') { g.audio.sfx('pounce'); this._pounceToy(); }
    else if (type === 'ate') { this.bowl = null; g.state.noir.feed++; g.state.noir.mood = clamp(g.state.noir.mood + 8, 0, 100); g.audio.sfx('purr'); this._hearts(n.x, n.y - 20, 3); g.requestChange(); }
    else if (type === 'played') { this.toy = null; g.state.noir.play++; g.state.noir.mood = clamp(g.state.noir.mood + 6, 0, 100); this._hearts(n.x, n.y - 20, 2); g.requestChange(); }
    else if (type === 'noirStare' && this.rnd() < 0.35 && g.chapter() >= 2) g.progress.setFlag('noir_stared', true);
  }

  // ---------------------------------------------------------------- mise à jour
  update(dt) {
    const g = this.g, s = g.state;
    this.t += dt;
    this.noir.update(dt, this.env);
    // fenêtre
    this._pickWindow(false);
    this.winAcc += dt;
    const fps = s.settings.quality === 'low' ? 6 : s.settings.quality === 'medium' ? 15 : 30;
    if (this.winAcc >= 1 / fps) { this.winAcc = 0; this._renderWindow(); }
    if (this.winFade < 1) this.winFade = Math.min(1, this.winFade + dt / (s.settings.reduceMotion ? 0.25 : 1.6));
    // gravité inversée (anomalie)
    const gf = g.anom.isActive('gravity_flick') ? g.anom.fade() : 0;
    this.grav += (gf - this.grav) * Math.min(1, dt * 3);
    // lampe éteinte puis rallumée : souvenir
    this._updateParticles(dt);
    this._updateToy(dt);
    // retour de regard : le tableau change
    if (this.lookAwayPending && !g.blocked()) { this.lookAwayPending = false; this._swapPainting(); }
    // moon_shape : découverte passive
    if (!s.anomalies.moon_shape && s.memories.length >= 2 && ['night_stars', 'giant_moon', 'double_moon'].includes(this.winCurId)) g.anom.found('moon_shape');
    // ambiances quand la fenêtre change
    if (this.lastWinScene !== this.winCurId) { this.lastWinScene = this.winCurId; this._refreshAmbience(); }
  }

  lookAway() {
    const a = this.g.state.settings;
    if (this.g.chapter() >= 1 && Math.random() < 0.5 && this.g.state.placed.some((p) => p.id === 'painting_main')) this.lookAwayPending = true;
  }
  _swapPainting() {
    const g = this.g;
    const v = ((g.state.flags.painting_v || 0) + 1) % 4;
    g.state.flags.painting_v = v;
    g.anom.trigger('painting_swap');
  }

  _winSceneId() {
    const g = this.g, s = g.state, h = g.hour();
    const a = g.anom.active;
    if (a) {
      if (a.id === 'window_room') return 'room_view';
      if (a.id === 'rare_eclipse') return 'eclipse';
      if (a.id === 'rare_comet') return 'comet';
      if (a.id === 'rare_double_moon') return 'double_moon';
    }
    if (!s.window.auto) return s.window.scene;
    return autoWindowScene(h, dayIndex(s), (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); });
  }
  _pickWindow(force) {
    const id = this._winSceneId();
    if (id === this.winCurId && !force) return;
    if (this.winCurId && id !== this.winCurId) {
      // copie de l'ancien paysage pour le fondu
      const pg = this.winPrev.getContext('2d'); pg.clearRect(0, 0, WW, WH); pg.drawImage(this.winCur, 0, 0);
      this.winFade = this.g.state.settings.reduceMotion ? 0.9 : 0;
    }
    this.winCurId = id;
    this._renderWindow();
  }
  _renderWindow() {
    const g = this.g, s = g.state;
    const gg = this.winCur.getContext('2d'); gg.imageSmoothingEnabled = false;
    const mem = s.memories.length / 11;
    const o = { moon: 0.18 + mem * 0.82, reduce: s.settings.reduceMotion, prog: this.g.anom.active && this.g.anom.active.id === 'rare_comet' ? this.g.anom.progress() : undefined };
    drawWindowScene(gg, this.winCurId, this.t, o);
    if (g.anom.isActive('cloud_figure')) drawCloudFigure(gg, this.t, g.anom.fade());
  }

  _refreshAmbience() {
    const g = this.g;
    if (g.zoneId !== 'room') return;
    const w = WINDOW_BY_ID[this.winCurId] || {};
    const open = this.windowOpen ? 1 : 0.5;
    g.audio.setAmbient({ rain: (w.rain || 0) * open, wind: (w.wind || 0) * (this.windowOpen ? 1.4 : 0.7), hum: 0.35 });
  }
  setWindowOpen(v) { this.windowOpen = v; this._refreshAmbience(); this.g.audio.sfx(v ? 'open' : 'close'); }

  // ----------------------------------------------------------------- particules
  _hearts(x, y, n = 3) { for (let i = 0; i < n; i++) this.particles.push({ k: 'heart', x: x + (i - 1) * 6, y, vy: -14 - this.rnd() * 6, vx: (this.rnd() - 0.5) * 8, life: 1.4 + this.rnd() * 0.4, max: 1.8 }); }
  sparkle(x, y, n = 8, col = C.goldL) { for (let i = 0; i < n; i++) this.particles.push({ k: 'spark', x, y, vx: (this.rnd() - 0.5) * 40, vy: (this.rnd() - 0.8) * 30, life: 0.7 + this.rnd() * 0.5, max: 1.2, col }); }
  _updateParticles(dt) {
    const q = this.g.state.settings.quality; const reduce = this.g.state.settings.reduceMotion;
    const want = reduce ? 0 : q === 'low' ? 5 : q === 'medium' ? 12 : 22;
    if (!this.dust) this.dust = [];
    while (this.dust.length < want) this.dust.push({ x: this.rnd() * W, y: 20 + this.rnd() * 140, vx: (this.rnd() - 0.5) * 3, vy: -1 - this.rnd() * 2, p: this.rnd() * 6.28 });
    if (this.dust.length > want) this.dust.length = want;
    for (const d of this.dust) {
      d.x += (d.vx + Math.sin(this.t * 0.5 + d.p) * 2) * dt; d.y += (d.vy - this.grav * 14) * dt;
      if (d.y < 8 || d.x < 0 || d.x > W) { d.y = 150 + this.rnd() * 25; d.x = this.rnd() * W; }
    }
    for (const p of this.particles) { p.life -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.k === 'spark') p.vy += 40 * dt; }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  // --------------------------------------------------------------------- jouets
  placeToy(kind, x, y) {
    y = clamp(y, FLOOR_BAND.top + 2, FLOOR_BAND.bottom - 2);
    this.toy = { kind, x, y, vx: 0, vy: 0, t: 0, away: 0 };
    this.noir.playWith(this.env, this.toy);
    this.g.audio.sfx('pick');
  }
  _pounceToy() {
    if (!this.toy) return;
    if (this.toy.kind === 'yarn') { this.toy.vx = (this.rnd() - 0.5) * 120; this.toy.vy = (this.rnd() - 0.5) * 30; }
  }
  _updateToy(dt) {
    const t = this.toy; if (!t) return;
    t.t += dt;
    t.x = clamp(t.x + t.vx * dt, 6, W - 6); t.y = clamp(t.y + t.vy * dt, FLOOR_BAND.top + 2, FLOOR_BAND.bottom - 2);
    t.vx *= Math.pow(0.1, dt); t.vy *= Math.pow(0.1, dt);
  }
  giveFood(food) {
    const n = this.noir;
    if (n.mode === 'hop') return false;
    const bx = clamp(n.x + n.dir * 26, 16, W - 16), by = clamp(n.onFloor() ? n.y : 160, FLOOR_BAND.top + 6, FLOOR_BAND.bottom - 4);
    this.bowl = { x: bx, y: by, food, t: 0 };
    n.feed(this.env, this.bowl);
    this.g.audio.sfx('pick');
    return true;
  }

  // ------------------------------------------------------------- points d'intérêt
  _lines(t) { return this.g.say([{ who: '', text: t }]); }

  /** Liste des points d'intérêt actuels (ordre de priorité par z décroissant). */
  hotspots() {
    const g = this.g, s = g.state, h = [];
    const add = (o) => h.push(o);
    const say = (t) => () => this._lines(t);
    const R_ = (r) => ({ x: r.x, y: r.y, w: r.w, h: r.h });

    if (this.deco.active) return this._decoHotspots();

    // anomalies actives interactives
    if (g.anom.isActive('night_door')) add({ id: 'night_door', label: 'Porte pâle', rect: { x: 106, y: 64, w: 20, h: 48 }, z: 900, actions: [{ label: 'Ouvrir', run: () => this._openNightDoor() }, { label: 'Examiner', run: say('Une porte que la chambre n\'avait pas. Le bois est tiède, comme un front.') }] });
    if (g.anom.isActive('extra_shadow')) add({ id: 'shadow', label: 'Ombre', rect: { x: 74, y: 62, w: 22, h: 48 }, z: 899, actions: [{ label: 'Approcher', run: () => this._touchShadow() }, { label: 'Examiner', run: say('Une ombre au mur. Aucun objet de la chambre n\'a cette forme.') }] });
    if (g.anom.isActive('rare_visitor')) add({ id: 'visitor', label: 'Silhouette', rect: { x: 92, y: 106, w: 24, h: 30 }, z: 898, actions: [{ label: 'Regarder', run: () => this._visitor() }] });

    // NOIR
    const nr = this.noir.rect();
    add({ id: 'noir', label: 'NOIR', rect: nr, z: 800, actions: [
      { label: 'Caresser', run: () => g.petNoir() },
      { label: 'Jouer…', run: () => g.openPanel('cat', { tab: 'play' }) },
      { label: 'Nourrir…', run: () => g.openPanel('cat', { tab: 'feed' }) },
      { label: 'Accessoires…', run: () => g.openPanel('cat', { tab: 'wear' }) },
    ] });

    add({ id: 'door', label: 'Porte', rect: R_(FX.door), z: 10, actions: [{ label: 'Ouvrir', run: () => this._useDoor() }, { label: 'Examiner', run: () => this._examine('door') }] });
    add({ id: 'window', label: 'Fenêtre', rect: { x: FX.window.x - 2, y: FX.window.y, w: FX.window.w + 4, h: FX.window.h }, z: 10, actions: [{ label: 'Regarder dehors', run: () => this._lookOutside() }, { label: 'Examiner', run: () => this._examine('window') }] });
    add({ id: 'poster', label: 'Affiche', rect: R_(FX.poster), z: 11, actions: s.flags.poster_lifted ? [{ label: 'Examiner', run: () => this._examine('poster') }] : [{ label: 'Soulever', run: () => this._liftPoster() }, { label: 'Examiner', run: () => this._examine('poster') }] });
    if (s.flags.poster_lifted && !s.puzzles.includes('safe')) add({ id: 'safe', label: 'Coffre', rect: { x: 53, y: 56, w: 16, h: 14 }, z: 12, actions: [{ label: 'Ouvrir', run: () => this._openSafe() }, { label: 'Examiner', run: say('Un petit coffre métallique avec un clavier à quatre chiffres. Il ne reste que la date, quelque part.') }] });
    add({ id: 'clock', label: 'Horloge', rect: R_(FX.clock), z: 11, actions: [{ label: 'Examiner', run: () => this._clockLook() }, { label: 'Écouter', run: () => this._clockListen() }] });
    add({ id: 'bed', label: 'Lit', rect: { x: FX.bed.x, y: FX.bed.y, w: FX.bed.w, h: FX.bed.h }, z: 40, actions: [{ label: 'Dormir…', run: () => this._sleep() }, { label: 'Examiner', run: () => this._examine('bed') }] });
    add({ id: 'bookcase', label: 'Bibliothèque', rect: R_(FX.bookcase), z: 30, actions: [{ label: 'Lire', run: () => this._readBooks() }, { label: 'Examiner', run: () => this._examine('bookcase') }] });
    add({ id: 'wardrobe', label: 'Armoire', rect: R_(FX.wardrobe), z: 30, actions: [{ label: 'Ouvrir', run: () => this._openWardrobe() }, { label: 'Examiner', run: () => this._examine('wardrobe') }] });
    add({ id: 'desk', label: 'Ordinateur', rect: { x: 276, y: 56, w: 38, h: 34 }, z: 35, actions: [{ label: 'Allumer Dream.OS', run: () => g.openPanel('os') }, { label: 'Examiner', run: () => this._examine('desk') }] });
    add({ id: 'desk_top', label: 'Bureau', rect: { x: 252, y: 88, w: 62, h: 54 }, z: 20, actions: [{ label: 'Ouvrir Dream.OS', run: () => g.openPanel('os') }, { label: 'Examiner', run: () => this._examine('desk') }] });

    // objets placés
    for (const p of s.placed) {
      const it = ITEM_BY_ID[p.id]; if (!it) continue;
      const vr = this._itemRect(p, it);
      const z = it.slot === 'floor' ? p.y : it.slot === 'rug' ? 1 : 5;
      add({ id: 'item:' + p.uid, label: it.name, rect: vr, z, item: p, actions: this._itemActions(p, it) });
    }
    return h;
  }

  _itemRect(p, it) {
    const dx = this._shiftX(p), vr = visualRect(it, p.x + dx, p.y);
    return { x: vr.x, y: vr.y, w: vr.w, h: vr.h };
  }

  _itemActions(p, it) {
    const g = this.g, ex = () => g.say([{ who: '', text: it.desc }]);
    const whisper = (key) => () => { ex(); };
    const acts = [];
    switch (p.id) {
      case 'lamp_floor': acts.push({ label: this.lampOn ? 'Éteindre' : 'Allumer', run: () => this._toggleLamp() }); break;
      case 'photos_pair': acts.push({ label: 'Regarder de près', run: () => this._photos() }); break;
      case 'painting_main': acts.push({ label: 'Regarder de près', run: () => { g.say([{ text: PAINTING_TEXT[g.state.flags.painting_v || 0] }]); this._maybeWhisper('painting'); } }); break;
      case 'music_box': acts.push({ label: 'Écouter', run: () => this._playMusicBox() }); break;
      case 'tv_static': acts.push({ label: 'Allumer', run: () => { g.audio.sfx('static'); g.say([{ text: 'De la neige. Puis, pendant une demi-seconde, un mot : « RESTE ».' }]); } }); break;
      case 'mirror_odd': acts.push({ label: 'Se regarder', run: () => g.say([{ text: 'Ton reflet cligne des yeux une demi-seconde après toi. Derrière lui, un chat noir te regarde. Quand tu te retournes, NOIR est bien là — et il regarde le miroir.' }]) }); break;
      case 'golden_door': acts.push({ label: 'Frapper', run: () => { g.audio.sfx('click'); g.say([{ text: 'Trois petits coups. Quelque chose répond, très loin, une seule fois.' }]); } }); break;
      case 'crystal_moon': acts.push({ label: 'Tenir', run: () => g.say([{ text: 'Le cristal est tiède. La lune qu\'il contient a exactement la forme de ce que tu as retrouvé.' }]) }); break;
      case 'neon_dream': acts.push({ label: 'Lire', run: () => g.say([{ text: 'DREAM. Un seul mot, en cyan. Quelqu\'un l\'a laissé allumé pour toi.' }]) }); break;
      default: break;
    }
    acts.push({ label: 'Examiner', run: ex });
    return acts;
  }

  // ------------------------------------------------------------------- actions
  _examine(key) {
    const g = this.g; let t = EXAMINE[key] || '…';
    if (key === 'window') t += ' Actuellement : ' + (WINDOW_BY_ID[this.winCurId]?.name || '—').toLowerCase() + '.';
    g.say([{ text: t }]);
    this._maybeWhisper(key);
  }

  _maybeWhisper(key) {
    const g = this.g, list = WHISPERS[key];
    if (!list) return;
    const now = performance.now();
    if (now - (this._lastWhisper || 0) < 9000) return;
    if (Math.random() < 0.22 + (g.hour() < 5 ? 0.12 : 0)) {
      this._lastWhisper = now;
      g.audio.sfx('whisper');
      g.ui.whisper(list[Math.floor(Math.random() * list.length)]);
      g.anom.trigger('whisper_object');
    }
  }

  async _useDoor() {
    const g = this.g;
    if (g.flag('door_unlocked')) { g.audio.sfx('door'); g.goto('hallway', { spawn: 'room_door' }); return; }
    if (g.has('brass_key')) {
      g.audio.sfx('key');
      await g.say([{ text: 'La clé de laiton tourne sans résistance, comme si la serrure l\'attendait.' }, { text: 'Derrière la porte, une lumière blanche et un silence trop propre.' }]);
      g.setFlag('door_unlocked', true);
      g.audio.sfx('door');
      g.goto('hallway', { spawn: 'room_door' });
      return;
    }
    g.audio.sfx('doorlock'); this.doorTries++;
    this.noir.react(this.env, { x: 18, y: 90 }, 4);
    const lines = [{ text: 'Verrouillée. La serrure est en laiton, bien réelle, contrairement au reste.' }];
    if (this.doorTries >= 2) lines.push({ text: 'La clé n\'est pas perdue. Elle est cachée là où l\'on regarde depuis le lit… ou là où NOIR regarde.' });
    g.say(lines);
  }

  async _liftPoster() {
    const g = this.g;
    g.audio.sfx('page');
    g.setFlag('poster_lifted', true);
    await g.say([{ text: 'Tu soulèves le coin décollé. Derrière l\'affiche, dans le mur, un petit coffre métallique brille faiblement.' }, { text: 'Un clavier à quatre chiffres. Il faut une date. Une date entourée, quelque part…' }]);
    g.progress.discoverSecret('poster_safe', 'Le coffre derrière l\'affiche');
    this.sparkle(61, 62, 10);
  }

  async _openSafe() {
    const g = this.g;
    const code = await g.ui.keypad({ title: 'Coffre', hint: 'Quatre chiffres.', length: 4 });
    if (code == null) return;
    if (code === '1307') {
      g.audio.sfx('key');
      g.progress.solvePuzzle('safe');
      this.sparkle(61, 62, 14);
      await g.say([{ text: 'Clic. Le coffre s\'ouvre. Une clé de laiton repose sur un velours violet.' }, { text: '13/07. Tu ne savais pas que tu t\'en souvenais.' }]);
    } else {
      g.audio.sfx('error');
      await g.say([{ text: 'Le clavier clignote en rouge. Ce n\'est pas ça.' }]);
    }
  }

  _clockLook() {
    const g = this.g, h = g.hour(), m = g.minute();
    const rev = g.anom.isActive('clock_reverse');
    g.say([{ text: rev ? `Les aiguilles tournent à l'envers. Il est ${formatClock(g.state)} — ou il l'était.` : `Il est ${formatClock(g.state)}. Les aiguilles ne s'accordent pas tout à fait avec ta montre.` }]);
    if (rev) g.anom.found('clock_reverse');
    this._maybeWhisper('clock');
  }
  _clockListen() { this.g.audio.sfx('tick'); this.g.say([{ text: 'Tic. Tic. Tic. Le rythme n\'est pas celui des secondes. C\'est celui d\'un cœur de chat.' }]); }

  _toggleLamp() {
    const g = this.g;
    this.lampOn = !this.lampOn; g.audio.sfx('lamp');
    if (!this.lampOn) { this.lampOffAt = this.t; this.noir.react(this.env, { x: 124, y: 130 }, 3); g.say([{ text: 'La chambre se replie dans la pénombre. NOIR lève la tête vers le lampadaire éteint, sans comprendre.' }]); }
    else {
      const dark = this.t - this.lampOffAt;
      if (dark > 3 && isNight(g.hour())) { g.progress.addMemory('m_lamp'); this.sparkle(130, 118, 8, C.gold); g.say([{ text: 'La lumière revient. Tu laissais toujours la lampe allumée un peu plus longtemps pour qu\'il rentre sans peur.' }]); }
      else g.say([{ text: 'La lampe se rallume. Elle ne vacille jamais.' }]);
    }
    g.requestChange();
  }

  _photos() {
    const g = this.g;
    g.say([{ text: 'Deux cadres. Dans l\'un, une lampe. Dans l\'autre, un chaton noir à moitié endormi sur un pied de lit. Un seul visage est net.' }]);
    if (g.progress.addMemory('m_arrival')) this.sparkle(230, 32, 8);
    this._maybeWhisper('photos');
  }

  _playMusicBox() {
    const g = this.g, seq = g.state.chime && g.state.chime.length ? g.state.chime : [0, 2, 1, 3];
    seq.forEach((n, i) => setTimeout(() => g.audio.bell(n, 0.8), i * 420));
    g.say([{ text: 'La berceuse du jardin, quatre notes qui se répondent. Elle ne finit jamais vraiment.' }]);
  }

  _readBooks() {
    const g = this.g;
    const extra = g.chapter() >= 3 ? ['Un livre à l\'envers, couverture sans titre : « Lis le soir de haut en bas. »'] : [];
    const pool = [...BOOK_FRAGMENTS, ...extra];
    g.audio.sfx('page');
    const t = g.chapter() >= 3 && !g.flag('book_hint') ? extra[0] : pool[Math.floor(Math.random() * pool.length)];
    if (t === extra[0]) g.setFlag('book_hint', true);
    g.say([{ text: t }]);
  }

  async _openWardrobe() {
    const g = this.g;
    g.audio.sfx('creak');
    await g.say([{ text: 'Des vêtements d\'hiver, un parfum de cèdre. Le fond est plus profond que le meuble. Tu n\'oses pas vérifier.' }]);
    g.setFlag('wardrobe_seen', true);
    this._maybeWhisper('wardrobe');
  }

  async _sleep() {
    const g = this.g;
    const choice = await g.ui.choose('Dormir jusqu\'à quand ?', [
      { label: 'Trois heures du matin', value: 3 }, { label: 'L\'aube (7 h)', value: 7 }, { label: 'Le soir (20 h)', value: 20 }, { label: 'Plutôt pas', value: null },
    ]);
    if (choice == null) return;
    g.transition(() => {
      sleepUntil(g.state, choice);
      g.state.flags.slept = true;
      this._pickWindow(true);
      this.noir.setPose(this._getSpots().find((s) => s.id === 'bed_blanket') || this.noir);
      this.noir.mode = 'sleep'; this.noir.timer = 18;
      g.requestChange();
    });
  }

  _lookOutside() { this.g.openPanel('window'); const a = this.g.anom.active; if (a && ['window_room', 'cloud_figure'].includes(a.id)) this.g.anom.found(a.id); }

  async _openNightDoor() {
    const g = this.g;
    g.audio.sfx('creak'); g.anom.found('night_door');
    await g.say([{ text: 'La porte s\'ouvre sur un placard minuscule. Au fond, une petite porte dorée, grande comme ta main, et une odeur de pluie.' }, { text: 'À trois heures, il grattait toujours à la porte. Il voulait seulement que tu saches qu\'il y avait un dehors.' }]);
    g.progress.addMemory('m_door');
    g.progress.discoverSecret('night_door', 'La porte de trois heures');
    this.sparkle(116, 90, 12, C.goldL);
    g.anom.endActive();
  }

  async _touchShadow() {
    const g = this.g;
    g.anom.found('extra_shadow');
    g.audio.sfx('whisper');
    await g.say([{ text: 'Tu tends la main. L\'ombre ne bouge pas, mais elle est plus froide que le mur.' }, { who: '', text: '« Tu ne me vois pas parce que tu ne veux pas. Ce n\'est pas grave. » — la voix ne vient de nulle part.' }]);
    g.anom.endActive();
  }

  async _visitor() {
    const g = this.g;
    g.anom.found('rare_visitor');
    await g.say([{ text: 'Quelqu\'un est assis au pied du lit, de dos. NOIR le regarde sans bouger, comme on regarde un vieil ami.' }, { text: 'Quand tu clignes des yeux, il n\'y a plus que la couverture, creusée à l\'endroit où l\'on s\'assoit.' }]);
    g.anom.endActive();
  }

  // ------------------------------------------------------------------- dessin
  _shiftX(p) {
    if (!['chair_wood', 'plant_fern', 'rug_round', 'lamp_floor'].includes(p.id)) return 0;
    const d = this.g.state.drift;
    return d ? ((p.uid.charCodeAt(1) * 7 + d * 3) % 5) - 2 : 0;
  }

  draw(g, t) {
    const G = this.g, s = G.state, reduce = s.settings.reduceMotion;
    const hour = G.hour(), min = G.minute();
    g.drawImage(this.base, 0, 0);

    // --- fenêtre : paysage, fondu, cadre, lueur
    const wx = FX.window.x + 4, wy = FX.window.y + 4;
    if (this.winFade < 1) { g.drawImage(this.winPrev, wx, wy); g.save(); g.globalAlpha = Math.round(this.winFade * 5) / 5; g.drawImage(this.winCur, wx, wy); g.restore(); }
    else g.drawImage(this.winCur, wx, wy);
    // gouttes sur la vitre
    const ws = WINDOW_BY_ID[this.winCurId];
    if (ws && ws.rain > 0.3 && !reduce) for (let i = 0; i < 6; i++) { const dx = (i * 11 + 4) % 62, dy = ((t * 5 + i * 9) % 44); R(g, 'rgba(242,221,251,0.5)', wx + dx, wy + dy, 1, 2); R(g, 'rgba(242,221,251,0.25)', wx + dx, wy + dy - 2, 1, 2); }
    g.drawImage(this.winFrame, FX.window.x, FX.window.y);

    // --- mur : porte, affiche, horloge
    this._drawDoor(g, t);
    this._drawPoster(g, t);
    g.drawImage(this.clock, FX.clock.x, FX.clock.y);
    const rev = G.anom.isActive('clock_reverse');
    drawClockHands(g, FX.clock.x, FX.clock.y, hour, min, rev ? t : null);
    if (G.anom.isActive('night_door')) this._drawNightDoor(g, t);
    if (G.anom.isActive('extra_shadow')) this._drawShadow(g, t);
    this._drawWallItems(g, t);

    // --- rideaux
    const wind = (ws ? ws.wind : 0.15) * (this.windowOpen ? 2.4 : 1);
    drawCurtain(g, 120, 14, 66, -1, t, wind, reduce); drawCurtain(g, 202, 14, 66, 1, t, wind, reduce);

    // --- tapis puis liste triée par profondeur
    for (const p of s.placed) { const it = ITEM_BY_ID[p.id]; if (it && it.slot === 'rug') this._drawItem(g, p, it, t); }
    const L = [];
    L.push({ z: 130, f: () => g.drawImage(this.bookcase, FX.bookcase.x, FX.bookcase.y) });
    L.push({ z: 130, f: () => g.drawImage(this.wardrobe, FX.wardrobe.x, FX.wardrobe.y) });
    L.push({ z: 142, f: () => this._drawDesk(g, t) });
    L.push({ z: 152.4, f: () => this._drawBed(g, t) });
    for (const p of s.placed) { const it = ITEM_BY_ID[p.id]; if (it && it.slot === 'floor') L.push({ z: p.y, f: () => this._drawItem(g, p, it, t) }); }
    if (this.bowl) L.push({ z: this.bowl.y, f: () => this._drawBowl(g, t) });
    if (this.toy) L.push({ z: this.toy.y, f: () => this._drawToy(g, t) });
    L.push({ z: this.noir.z, f: () => this.noir.draw(g, t, this._acc(), reduce) });
    if (G.anom.isActive('rare_visitor')) L.push({ z: 153, f: () => this._drawVisitor(g, t) });
    L.sort((a, b) => a.z - b.z);
    for (const l of L) l.f();

    this._drawLighting(g, t, hour);
    this._drawParticles(g, t);
    if (this.deco.active) this._drawDeco(g, t);
    if (this.toyHint && this.pendingToy) this._drawToyHint(g, t);
  }

  _acc() {
    const eq = this.g.state.noir.equipped || [];
    const a = {};
    for (const id of eq) { const it = ITEM_BY_ID[id]; if (it && it.equip) a[it.equip] = true; }
    return a;
  }

  _drawDoor(g, t) {
    g.drawImage(this.door, FX.door.x, FX.door.y);
    const s = this.g.state;
    // lueur sous la porte une fois déverrouillée (liminal : blanc froid)
    if (s.flags.door_unlocked) { R(g, 'rgba(242,221,251,0.55)', FX.door.x + 2, FX.door.y + 64, 22, 1); g.save(); g.globalAlpha = 0.1; R(g, '#F2DDFB', FX.door.x - 2, FX.door.y + 66, 30, 3); g.restore(); }
  }

  _drawPoster(g, t) {
    const lifted = this.g.state.flags.poster_lifted;
    const x = FX.poster.x, y = FX.poster.y;
    if (!lifted) { g.drawImage(this.poster, x, y); return; }
    // coffre visible, affiche repliée vers le haut (3 premières rangées conservées)
    if (!this.g.state.puzzles.includes('safe')) g.drawImage(this.safe, x + 3, y + 16);
    else { R(g, C.abyss, x + 3, y + 16, 16, 14); R(g, C.p2, x + 3, y + 16, 16, 1); R(g, C.p2, x + 3, y + 16, 1, 14); R(g, C.n3, x + 4, y + 17, 14, 12); R(g, C.gold, x + 8, y + 21, 3, 5); }
    g.drawImage(this.poster, 0, 0, 22, 14, x, y - 2, 22, 14);
    R(g, C.p3, x, y + 12, 22, 1);
  }

  _drawNightDoor(g, t) {
    const f = this.g.anom.fade(); const x = 108, y = 66;
    g.save(); g.globalAlpha = 0.85 * f;
    R(g, C.moon, x - 1, y - 1, 18, 46); R(g, C.lav3, x, y, 16, 45); R(g, '#d9cbf0', x + 2, y + 3, 12, 40); R(g, C.lav, x + 3, y + 5, 4, 14); R(g, C.lav, x + 9, y + 5, 4, 14); R(g, C.lav, x + 3, y + 24, 4, 14); R(g, C.lav, x + 9, y + 24, 4, 14);
    R(g, C.gold, x + 11, y + 22, 2, 2);
    R(g, 'rgba(255,255,255,0.9)', x + 7, y + 44, 3, 1);
    g.restore();
    glow(g, x + 8, y + 24, 30, '#F2DDFB', 0.12 * f);
  }

  _drawShadow(g, t) {
    const f = this.g.anom.fade(); const x = 85 + Math.round(Math.sin(t * 0.5) * 1), y = 66;
    g.save(); g.globalAlpha = 0.8 * f;
    disc(g, '#050409', x, y + 8, 5); R(g, '#050409', x - 8, y + 14, 16, 8); R(g, '#050409', x - 6, y + 22, 12, 24);
    dither(g, '#050409', x - 11, y + 14, 3, 14); dither(g, '#050409', x + 8, y + 14, 3, 14);
    g.restore();
  }

  _drawVisitor(g, t) {
    const f = this.g.anom.fade(); const x = 104, y = 128;
    g.save(); g.globalAlpha = 0.9 * f;
    R(g, '#050409', x - 5, y - 24, 10, 10); R(g, '#050409', x - 7, y - 14, 14, 16); R(g, '#050409', x - 8, y + 2, 16, 3);
    R(g, C.lav, x - 7, y - 14, 1, 14);
    g.restore();
  }

  _drawWallItems(g, t) {
    const s = this.g.state;
    const items = s.placed.filter((p) => { const it = ITEM_BY_ID[p.id]; return it && (it.slot === 'wall' || it.slot === 'ceiling'); });
    for (const p of items) this._drawItem(g, p, ITEM_BY_ID[p.id], t);
  }

  _drawItem(g, p, it, t) {
    const s = this.g.state; const reduce = s.settings.reduceMotion;
    const dx = this._shiftX(p);
    let x = p.x + dx, y = p.y;
    if (p.id === 'painting_main') { g.drawImage(this.paintings[s.flags.painting_v || 0], x, y); return; }
    if (p.id === 'photos_pair') { g.drawImage(this.photos, x, y); return; }
    const spr = itemSprite(p.id); if (!spr) return;
    let top = it.slot === 'floor' || it.slot === 'rug' ? y - it.h : y;
    if (it.bob && !reduce) top += Math.round(Math.sin(t * 1.5 + p.x) * 2) - 2;
    if (this.grav > 0.05 && it.slot === 'floor') top -= Math.round(this.grav * (4 + (p.x % 7)));
    if (it.slot === 'floor' && !reduce && it.bob) { g.fillStyle = 'rgba(8,7,16,0.35)'; g.fillRect(x + 2, y - 1, it.w - 4, 1); }
    if (p.id === 'neon_dream') { g.save(); g.globalAlpha = Math.sin(t * 9) > 0.96 && !reduce ? 0.55 : 1; g.drawImage(spr, x, top - (spr._pad || 0)); g.restore(); return; }
    if (p.id === 'tv_static') { g.drawImage(spr, x, top - 2); this._staticScreen(g, x + 2, top, 11, 11, t); return; }
    g.drawImage(spr, x, top - (spr._pad || 0));
  }

  _staticScreen(g, x, y, w, h, t) {
    const r = rng(Math.floor(t * 12) + 5);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (r() > 0.55) { g.fillStyle = r() > 0.8 ? C.cyanL : '#6a6a8a'; g.fillRect(x + i, y + j, 1, 1); }
  }

  _drawDesk(g, t) {
    const s = this.g.state, d = FX.desk;
    g.drawImage(this.desk, d.x, d.y);
    g.drawImage(this.crt, 278, 58);
    const msg = this.g.anom.active && this.g.anom.active.id === 'pc_message' || (s.flags.pc_msg_unread);
    drawCRTScreen(g, 282, 61, t, msg ? 'message' : 'idle', 1 + Math.sin(t * 7) * 0.3);
    R(g, C.cyan, 304, 83, 1, 1);
    // clavier
    R(g, C.p2, 280, 86, 24, 2); R(g, C.p3, 280, 86, 24, 1);
    if (this.crtGlowOn !== false) glow(g, 295, 70, 34, '#00E5FF', 0.06);
  }

  _drawBed(g, t) {
    const b = FX.bed;
    g.drawImage(this.bed, b.x, b.y);
    const n = this.noir;
    const onBed = (n.spot === 'bed_blanket' || n.spot === 'bed_pillow') && n.mode !== 'hop' && n.mode !== 'walk' && n.mode !== 'run' ? n : null;
    const bump = onBed && onBed.spot === 'bed_blanket' ? { x0: onBed.x - 6 - b.x, x1: onBed.x + 12 - b.x, h: onBed.mode === 'sleep' ? 2 : 1 } : null;
    F.drawBlanket(g, b.x, b.y, t, this.g.state.settings.reduceMotion, bump);
  }

  _drawBowl(g, t) {
    const b = this.bowl; const x = Math.round(b.x), y = Math.round(b.y);
    R(g, C.n3, x - 6, y - 2, 12, 2); R(g, C.p3, x - 7, y - 3, 14, 1); R(g, C.abyss, x - 5, y, 10, 1);
    const col = { tuna: C.pink, milk: C.moon, cookie: C.gold }[b.food] || C.moon;
    R(g, col, x - 5, y - 4, 10, 1); R(g, C.white, x - 3, y - 4, 2, 1);
  }

  _drawToy(g, t) {
    const o = this.toy, x = Math.round(o.x), y = Math.round(o.y);
    if (o.kind === 'yarn') {
      disc(g, C.pink, x, y - 3, 3); R(g, C.pinkD, x - 2, y - 2, 4, 1); R(g, C.moon, x - 1, y - 5, 2, 1);
      line(g, C.pinkD, x + 3, y - 1, x + 6, y);
    } else {
      const sw = Math.round(Math.sin(t * 8) * 2);
      line(g, C.p3, x, y - 12, x + sw, y - 4);
      R(g, C.cyan, x + sw - 2, y - 4, 5, 2); R(g, C.cyanL, x + sw - 1, y - 5, 3, 1); R(g, C.pink, x + sw - 3, y - 3, 2, 1); R(g, C.pink, x + sw + 3, y - 3, 2, 1);
    }
  }

  _drawToyHint(g, t) {
    const y = FLOOR_BAND.top; g.save(); g.globalAlpha = 0.12 + Math.sin(t * 4) * 0.04; R(g, C.lav, 0, y, W, H - y); g.restore();
    text3x5(g, C.moon, 'TOUCHE LE SOL', 118, y + 4);
  }

  _drawLighting(g, t, hour) {
    const G = this.g, s = G.state;
    // obscurité selon l'heure
    let nf = 0;
    if (hour >= 21 || hour < 5) nf = 1; else if (hour >= 5 && hour < 8) nf = 1 - (hour - 5) / 3; else if (hour >= 17 && hour < 21) nf = (hour - 17) / 4;
    const dark = 0.08 + 0.34 * nf + (this.lampOn ? 0 : 0.16);
    g.fillStyle = `rgba(8,7,16,${dark})`; g.fillRect(0, 0, W, H);
    // lueur de fenêtre sur le mur et le sol
    const col = WINDOW_LIGHT[this.winCurId] || '#B9A0FF';
    g.save(); g.globalCompositeOperation = 'lighter';
    const wa = 0.035 + nf * 0.03;
    for (let y = 122; y < 176; y += 2) {
      const k = (y - 122) / 54, sh = Math.round((y - 122) * 0.55), wdt = 62 - Math.round(k * 6);
      g.fillStyle = rgba(col, wa * (1 - k * 0.7)); g.fillRect(FX.window.x + 8 + sh, y, wdt, 2);
    }
    g.restore();
    glow(g, 169, 48, 52, col, 0.07 + nf * 0.04);
    // lampes (objets avec halo)
    const flick = this.g.state.settings.reduceMotion ? 0 : Math.sin(t * 13) * 0.04 + Math.sin(t * 5.1) * 0.03;
    for (const p of s.placed) {
      const it = ITEM_BY_ID[p.id]; if (!it || !it.light) continue;
      if (p.id === 'lamp_floor' && !this.lampOn) continue;
      const r = it.light.r * (it.light.a > 0.15 && p.id !== 'lamp_floor' ? 1 : 1);
      const cy = it.slot === 'floor' ? p.y - it.h * 0.7 : p.y + it.h / 2;
      glow(g, p.x + this._shiftX(p) + it.w / 2, cy, r, it.light.color, it.light.a * (0.8 + nf * 0.5), p.id === 'lamp_floor' ? flick : 0);
    }
    // contre-jour chaud de l'ordinateur
    if (nf > 0.2) glow(g, 296, 80, 28, '#00E5FF', 0.05);
    // vignette
    dither(g, '#050409', 0, 0, W, 2); dither(g, '#050409', 0, H - 2, W, 2);
  }

  _drawParticles(g, t) {
    if (this.dust) for (const d of this.dust) {
      const near = Math.abs(d.x - 130) < 70 || (d.x > 140 && d.x < 210);
      g.fillStyle = near ? 'rgba(255,190,98,0.55)' : 'rgba(185,160,255,0.32)';
      g.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
    }
    for (const p of this.particles) {
      const a = Math.min(1, p.life / 0.5);
      g.save(); g.globalAlpha = a;
      if (p.k === 'heart') { R(g, C.pink, p.x - 1, p.y, 1, 1); R(g, C.pink, p.x + 1, p.y, 1, 1); R(g, C.pink, p.x - 1, p.y + 1, 3, 1); R(g, C.pink, p.x, p.y + 2, 1, 1); }
      else { R(g, p.col || C.goldL, p.x, p.y, 1, 1); }
      g.restore();
    }
  }

  // ------------------------------------------------------------------ décoration
  startDeco() { this.deco.active = true; this.deco.selected = null; this.deco.pending = null; this.g.audio.sfx('open'); }
  stopDeco() { this.deco.active = false; this.deco.selected = null; this.deco.pending = null; this.deco.drag = null; this.g.audio.sfx('close'); }
  startPlacing(itemId) {
    const it = ITEM_BY_ID[itemId]; if (!it) return;
    this.deco.pending = itemId; this.deco.selected = null;
    const c = it.slot === 'wall' ? { x: 130, y: 20 } : it.slot === 'ceiling' ? { x: 150, y: 0 } : { x: 160, y: 156 };
    this.deco.preview = this._snapPos(it, c.x - it.w / 2, c.y);
    this._validatePreview();
  }
  _snapPos(it, x, y) {
    const on = this.g.state.settings.grid;
    let p = clampToSlot(it, snap(x, on), snap(y, on));
    return p;
  }
  _validatePreview() {
    const d = this.deco; const g = this.g;
    const id = d.pending || (d.selected && g.state.placed.find((p) => p.uid === d.selected)?.id);
    if (!id || !d.preview) { d.valid = true; d.reason = ''; return; }
    const r = validatePlacement(g.state, id, d.preview.x, d.preview.y, d.pending ? null : d.selected);
    d.valid = r.ok; d.reason = r.reason || '';
    this.g.ui.decoStatus(d.valid, d.reason);
  }

  confirmPlace() {
    const d = this.deco, g = this.g;
    if (d.pending && d.preview) {
      const r = g.decor.place(d.pending, d.preview.x, d.preview.y);
      if (!r.ok) { g.audio.sfx('error'); d.shake = 0.3; g.ui.decoStatus(false, r.reason); return false; }
      g.audio.sfx('place'); this.markDirty(); g.requestChange();
      if (r.uid) d.selected = r.uid;
      const left = availableCount(g.state, d.pending);
      if (left <= 0) d.pending = null;
      g.ui.decoRefresh();
      return true;
    }
    return false;
  }
  cancelPlace() { this.deco.pending = null; this.g.ui.decoRefresh(); }

  selectUid(uid) {
    const p = this.g.state.placed.find((q) => q.uid === uid);
    this.deco.selected = p ? uid : null; this.deco.pending = null;
    if (p) this.deco.preview = { x: p.x, y: p.y };
    this._validatePreview(); this.g.ui.decoRefresh();
  }
  nudge(dx, dy) {
    const d = this.deco, g = this.g;
    const step = g.state.settings.grid ? GRID : 1;
    if (d.pending && d.preview) { const it = ITEM_BY_ID[d.pending]; d.preview = clampToSlot(it, d.preview.x + dx * step, d.preview.y + dy * step); this._validatePreview(); return; }
    const p = g.state.placed.find((q) => q.uid === d.selected); if (!p) return;
    const it = ITEM_BY_ID[p.id]; const np = clampToSlot(it, p.x + dx * step, p.y + dy * step);
    const r = g.decor.move(p.uid, np.x, np.y);
    if (r.ok) { d.preview = { x: p.x, y: p.y }; g.audio.sfx('tick'); this.markDirty(); g.requestChange(); }
    else { g.audio.sfx('error'); d.shake = 0.25; g.ui.decoStatus(false, r.reason); }
  }
  removeSelected() {
    const d = this.deco, g = this.g;
    if (!d.selected) return false;
    const r = g.decor.remove(d.selected);
    if (r.ok) { d.selected = null; g.audio.sfx('pick'); this.markDirty(); g.requestChange(); g.ui.decoRefresh(); }
    return r.ok;
  }
  undo() {
    const g = this.g;
    if (g.decor.undo()) { this.deco.selected = null; this.markDirty(); g.audio.sfx('pick'); g.requestChange(); g.ui.decoRefresh(); return true; }
    return false;
  }

  _decoHotspots() {
    const h = [];
    for (const p of this.g.state.placed) {
      const it = ITEM_BY_ID[p.id]; if (!it) continue;
      const vr = this._itemRect(p, it);
      h.push({ id: 'item:' + p.uid, label: it.name + ' (déplacer)', rect: vr, z: it.slot === 'floor' ? p.y : it.slot === 'rug' ? 1 : 5, item: p, actions: [{ label: 'Sélectionner', run: () => this.selectUid(p.uid) }] });
    }
    return h;
  }

  pointerDown(x, y) {
    this.pointer = { x, y };
    const d = this.deco;
    if (!d.active) return false;
    if (d.pending) { const it = ITEM_BY_ID[d.pending]; d.preview = this._snapPos(it, x - it.w / 2, it.slot === 'floor' || it.slot === 'rug' ? y + it.h / 2 : y - it.h / 2); this._validatePreview(); d.drag = { pending: true }; return true; }
    const hit = this.pick(x, y);
    if (hit && hit.item) {
      this.selectUid(hit.item.uid);
      d.drag = { uid: hit.item.uid, ox: x - hit.item.x, oy: y - hit.item.y, moved: false, from: { x: hit.item.x, y: hit.item.y } };
      this.g.audio.sfx('pick');
      return true;
    }
    d.selected = null; this.g.ui.decoRefresh();
    return true;
  }
  pointerMove(x, y) {
    this.pointer = { x, y };
    const d = this.deco;
    if (!d.active || !d.drag) return;
    if (d.drag.pending) { const it = ITEM_BY_ID[d.pending]; d.preview = this._snapPos(it, x - it.w / 2, it.slot === 'floor' || it.slot === 'rug' ? y + it.h / 2 : y - it.h / 2); this._validatePreview(); return; }
    const p = this.g.state.placed.find((q) => q.uid === d.drag.uid); if (!p) return;
    const it = ITEM_BY_ID[p.id];
    d.preview = this._snapPos(it, x - d.drag.ox, y - d.drag.oy); d.drag.moved = true;
    this._validatePreview();
  }
  pointerUp(x, y) {
    const d = this.deco;
    if (!d.active || !d.drag) return;
    const drag = d.drag; d.drag = null;
    if (drag.pending) return; // le placement se confirme par un bouton (ou un second toucher)
    if (!drag.moved) return;
    const r = this.g.decor.move(drag.uid, d.preview.x, d.preview.y);
    if (r.ok) { this.markDirty(); this.g.requestChange(); this.g.audio.sfx('place'); }
    else { this.g.audio.sfx('error'); d.shake = 0.3; const p = this.g.state.placed.find((q) => q.uid === drag.uid); if (p) d.preview = { x: p.x, y: p.y }; this.g.ui.decoStatus(false, r.reason); }
    this._validatePreview(); this.g.ui.decoRefresh();
  }

  _drawDeco(g, t) {
    const d = this.deco, s = this.g.state;
    // grille facultative
    if (s.settings.grid) { g.fillStyle = 'rgba(185,160,255,0.22)'; for (let y = 8; y < H; y += 8) for (let x = 0; x < W; x += 8) g.fillRect(x, y, 1, 1); }
    // zones à dégager
    g.fillStyle = 'rgba(255,110,199,0.12)';
    for (const k of KEEP_CLEAR) { g.fillRect(k.x, k.y, k.w, k.h); }
    for (const k of KEEP_CLEAR) { g.fillStyle = 'rgba(255,110,199,0.7)'; for (let x = k.x; x < k.x + k.w; x += 4) { g.fillRect(x, k.y, 2, 1); g.fillRect(x, k.y + k.h - 1, 2, 1); } }
    // sélection / aperçu
    const sel = d.pending ? { id: d.pending } : d.selected ? s.placed.find((p) => p.uid === d.selected) : null;
    if (sel && d.preview) {
      const it = ITEM_BY_ID[sel.id];
      const x = d.preview.x, y = d.preview.y;
      const vr = visualRect(it, x, y);
      const spr = itemSprite(sel.id);
      if (d.pending || (d.drag && d.drag.moved)) {
        g.save(); g.globalAlpha = 0.65;
        if (sel.id === 'painting_main') g.drawImage(this.paintings[0], x, y); else if (sel.id === 'photos_pair') g.drawImage(this.photos, x, y);
        else if (spr) g.drawImage(spr, x, (it.slot === 'floor' || it.slot === 'rug' ? y - it.h : y) - (spr._pad || 0));
        g.restore();
      }
      const col = d.valid ? C.cyan : C.pink;
      const sh = d.shake > 0 ? Math.round(Math.sin(t * 60) * 1) : 0;
      this._dashRect(g, vr.x - 1 + sh, vr.y - 1, vr.w + 2, vr.h + 2, col, t);
      if (it.slot === 'floor') { const f = footprint(it, x, y); g.fillStyle = d.valid ? 'rgba(0,229,255,0.28)' : 'rgba(255,110,199,0.4)'; g.fillRect(f.x, f.y, f.w, f.h); }
      if (!d.valid) { line(g, C.pink, vr.x + 1, vr.y + 1, vr.x + vr.w - 2, vr.y + vr.h - 2); line(g, C.pink, vr.x + vr.w - 2, vr.y + 1, vr.x + 1, vr.y + vr.h - 2); }
      else { g.fillStyle = C.cyan; g.fillRect(vr.x + vr.w - 3, vr.y - 3, 4, 1); g.fillRect(vr.x + vr.w - 1, vr.y - 3, 1, 4); }
    }
    if (d.shake > 0) d.shake -= 1 / 60;
  }
  _dashRect(g, x, y, w, h, col, t) {
    g.fillStyle = col; const o = Math.floor(t * 8) % 4;
    for (let i = 0; i < w; i++) if ((i + o) % 4 < 2) { g.fillRect(x + i, y, 1, 1); g.fillRect(x + i, y + h - 1, 1, 1); }
    for (let j = 0; j < h; j++) if ((j + o) % 4 < 2) { g.fillRect(x, y + j, 1, 1); g.fillRect(x + w - 1, y + j, 1, 1); }
  }

  // ------------------------------------------------------------- sélection pointeur
  pick(x, y) {
    const hs = this.hotspots();
    let best = null;
    for (const h of hs) {
      const r = h.rect;
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) {
        if (!best || h.z > best.z || (h.z === best.z && r.w * r.h < best.rect.w * best.rect.h)) best = h;
      }
    }
    return best;
  }

  /** Clic sur le sol avec un jouet en main. */
  floorTap(x, y) {
    if (!this.pendingToy || y < FLOOR_BAND.top - 4) return false;
    this.placeToy(this.pendingToy, x, y);
    this.pendingToy = null; this.toyHint = false;
    return true;
  }
}
