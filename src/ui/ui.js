// Interface DOM : HUD, dialogues, toasts, fenêtres modales, panneaux. Tout est réel et accessible au clavier.
import { h, clear, trapFocus } from './dom.js';
import { icon } from '../art/icons.js';
import { formatClock, formatDate } from '../core/time.js';
import { ZONES } from '../data/world.js';
import { PANELS } from './panels.js';
import { DecoBar } from './deco.js';

export class UI {
  constructor(game, root) {
    this.g = game; this.root = root;
    this.layers = {};
    for (const id of ['hud', 'bottom', 'toasts', 'whisper', 'popover', 'dialogue', 'panel', 'modal', 'menu']) {
      this.layers[id] = h('div', { id: 'l-' + id, class: 'layer' }); root.append(this.layers[id]);
    }
    this.dlgQueue = []; this.dlg = null; this.modalOpen = 0; this.panel = null; this.menuOpen = false;
    this.deco = null; this.statusTimer = 0;
    this._buildHud();
    this.layers.panel.addEventListener('pointerdown', (e) => { if (e.target === this.layers.panel) this.closePanel(); });
    document.addEventListener('keydown', (e) => this._key(e));
  }

  isBlocked() { return !!this.dlg || this.dlgQueue.length > 0 || !!this.panel || this.modalOpen > 0 || this.menuOpen; }
  sfx(n) { this.g.audio.sfx(n); }

  // ------------------------------------------------------------------ HUD
  _buildHud() {
    const g = this.g;
    this.zoneEl = h('span', { class: 'hud-zone' }); this.clockEl = h('span', { class: 'hud-clock', 'aria-live': 'off' }); this.dateEl = h('span', { class: 'hud-date' });
    this.saveEl = h('span', { class: 'hud-save', role: 'status', 'aria-live': 'polite' });
    this.chapEl = h('span', { class: 'hud-chap' });
    const top = h('div', { class: 'hud-top' }, h('div', { class: 'hud-left' }, this.zoneEl, this.chapEl), h('div', { class: 'hud-right' }, this.saveEl, h('span', { class: 'hud-time' }, this.clockEl, this.dateEl)));
    this.layers.hud.append(top);
    const b = (ic, label, fn, id) => h('button', { class: 'btn tool', title: label, 'aria-label': label, id, onclick: () => { this.sfx('click'); fn(); } }, icon(ic), h('span', { class: 'lbl' }, label));
    this.backBtn = b('home', 'Chambre', () => g.goto('room', { from: g.zoneId }), 'btn-back');
    this.toolbar = h('div', { class: 'toolbar', role: 'toolbar', 'aria-label': 'Actions' },
      this.backBtn,
      b('home', 'Décorer', () => g.startDeco(), 'btn-deco'),
      b('bag', 'Objets', () => this.openPanel('items'), 'btn-items'),
      b('book', 'Journal', () => this.openPanel('journal'), 'btn-journal'),
      b('moon', 'Collection', () => this.openPanel('collection'), 'btn-collection'),
      b('window', 'Fenêtre', () => this.openPanel('window'), 'btn-window'),
      b('cat', 'NOIR', () => this.openPanel('cat'), 'btn-cat'),
      b('term', 'Dream.OS', () => this.openPanel('os'), 'btn-os'),
      b('gear', 'Réglages', () => this.openPanel('settings'), 'btn-settings'),
    );
    this.layers.bottom.append(this.toolbar);
    this.hudDirty = 0;
  }

  setHudVisible(v) { this.layers.hud.style.display = v ? '' : 'none'; this.layers.bottom.style.display = v ? '' : 'none'; }

  updateHud() {
    const g = this.g, s = g.state; if (!s) return;
    const zone = ZONES[g.zoneId];
    this.zoneEl.textContent = zone ? zone.name : '';
    this.clockEl.textContent = formatClock(s); this.dateEl.textContent = formatDate(s);
    this.chapEl.textContent = 'Chap. ' + g.chapter();
    const inRoom = g.zoneId === 'room';
    this.backBtn.style.display = inRoom ? 'none' : '';
    for (const id of ['btn-deco', 'btn-cat', 'btn-os']) { const el = this.toolbar.querySelector('#' + id); if (el) el.style.display = inRoom ? '' : 'none'; }
    const win = this.toolbar.querySelector('#btn-window'); if (win) win.style.display = inRoom ? '' : 'none';
  }

  saved(text = 'Sauvegardé') {
    this.saveEl.textContent = '✓ ' + text; this.saveEl.classList.add('on');
    clearTimeout(this.statusTimer); this.statusTimer = setTimeout(() => { this.saveEl.classList.remove('on'); this.saveEl.textContent = ''; }, 2200);
  }
  saveError(text) { this.saveEl.textContent = '⚠ ' + text; this.saveEl.classList.add('on', 'err'); clearTimeout(this.statusTimer); this.statusTimer = setTimeout(() => { this.saveEl.classList.remove('on', 'err'); this.saveEl.textContent = ''; }, 5000); }

  // ------------------------------------------------------------------ toasts, murmures
  toast({ icon: ic = 'star', title, text }) {
    const el = h('div', { class: 'toast', role: 'status' }, icon(ic), h('div', {}, h('div', { class: 'toast-t' }, title), h('div', { class: 'toast-x' }, text)));
    this.layers.toasts.append(el);
    while (this.layers.toasts.children.length > 4) this.layers.toasts.firstChild.remove();
    setTimeout(() => el.classList.add('out'), 4200); setTimeout(() => el.remove(), 4800);
  }
  whisper(text) {
    const el = h('div', { class: 'whisper', 'aria-live': 'polite' }, text);
    this.layers.whisper.append(el); setTimeout(() => el.classList.add('out'), 3800); setTimeout(() => el.remove(), 5000);
  }

  // ------------------------------------------------------------------ popover d'actions
  popover(actions, label, cx, cy) {
    this.closePopover();
    const box = h('div', { class: 'popover', role: 'menu', 'aria-label': label });
    box.append(h('div', { class: 'pop-title' }, label));
    actions.forEach((a, i) => box.append(h('button', { class: 'btn pop-btn', role: 'menuitem', onclick: () => { this.closePopover(); this.sfx('click'); a.run(); } }, a.label)));
    this.layers.popover.append(box); this.pop = box;
    const r = this.root.getBoundingClientRect(), bw = box.offsetWidth, bh = box.offsetHeight;
    box.style.left = Math.max(4, Math.min(r.width - bw - 4, cx - r.left - bw / 2)) + 'px';
    box.style.top = Math.max(4, Math.min(r.height - bh - 4, cy - r.top + 12)) + 'px';
    const first = box.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  closePopover() { if (this.pop) { this.pop.remove(); this.pop = null; } }

  // ------------------------------------------------------------------ dialogue
  say(lines) {
    const arr = (Array.isArray(lines) ? lines : [lines]).map((l) => (typeof l === 'string' ? { text: l } : l)).filter((l) => l && l.text);
    if (!arr.length) return Promise.resolve();
    return new Promise((res) => { this.dlgQueue.push({ lines: arr, res }); if (!this.dlg) this._nextDialogue(); });
  }
  _nextDialogue() {
    const job = this.dlgQueue.shift(); if (!job) { this.dlg = null; return; }
    this.closePopover();
    const g = this.g, instant = g.state.settings.textSpeed === 'instant';
    const who = h('div', { class: 'dlg-who' }), txt = h('div', { class: 'dlg-text', 'aria-live': 'polite' }), more = h('div', { class: 'dlg-more' }, '▼');
    const box = h('div', { class: 'dlg', role: 'dialog', 'aria-label': 'Dialogue', tabindex: '0' }, who, txt, more);
    const wrap = h('div', { class: 'dlg-wrap' }, box); this.layers.dialogue.append(wrap);
    const st = { job, i: -1, typing: false, timer: 0, wrap, full: '' };
    this.dlg = st;
    const showLine = () => {
      st.i++;
      if (st.i >= job.lines.length) { wrap.remove(); this.dlg = null; job.res(); this._nextDialogue(); return; }
      const l = job.lines[st.i]; who.textContent = l.who || ''; who.style.display = l.who ? '' : 'none'; st.full = l.text; txt.textContent = ''; more.style.visibility = 'hidden';
      if (instant) { txt.textContent = l.text; more.style.visibility = 'visible'; st.typing = false; return; }
      st.typing = true; let n = 0;
      const step = () => { n += 1; txt.textContent = st.full.slice(0, n); if (n >= st.full.length) { st.typing = false; more.style.visibility = 'visible'; } else st.timer = setTimeout(step, 18); };
      step();
    };
    st.advance = () => {
      if (st.typing) { clearTimeout(st.timer); st.typing = false; txt.textContent = st.full; more.style.visibility = 'visible'; return; }
      this.sfx('tick'); showLine();
    };
    wrap.addEventListener('pointerdown', (e) => { e.preventDefault(); st.advance(); });
    st.skipAll = () => { clearTimeout(st.timer); wrap.remove(); this.dlg = null; job.res(); this._nextDialogue(); };
    showLine(); box.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ modales
  _modal(build, { dismiss = null } = {}) {
    return new Promise((resolve) => {
      this.modalOpen++; this.closePopover();
      const prev = document.activeElement;
      const done = (v) => { this.modalOpen--; back.remove(); try { prev && prev.focus && prev.focus({ preventScroll: true }); } catch (e) { /* ok */ } resolve(v); };
      const card = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
      const back = h('div', { class: 'modal-back' }, card);
      build(card, done);
      card.addEventListener('keydown', (e) => { trapFocus(card, e); if (e.key === 'Escape') { e.stopPropagation(); done(dismiss); } });
      this.layers.modal.append(back);
      const f = card.querySelector('[data-focus]') || card.querySelector('button'); if (f) f.focus({ preventScroll: true });
    });
  }
  choose(title, options) {
    return this._modal((card, done) => {
      card.append(h('h2', { class: 'modal-title' }, title));
      const list = h('div', { class: 'choices' });
      options.forEach((o, i) => list.append(h('button', { class: 'btn choice', 'data-focus': i === 0 ? '1' : null, onclick: () => { this.sfx('click'); done(o.value); } }, o.label)));
      card.append(list);
    }, { dismiss: null });
  }
  confirm(title, text, { yes = 'Confirmer', no = 'Annuler', danger = false } = {}) {
    return this._modal((card, done) => {
      card.append(h('h2', { class: 'modal-title' }, title), h('p', { class: 'modal-text' }, text),
        h('div', { class: 'row end' }, h('button', { class: 'btn', 'data-focus': '1', onclick: () => done(false) }, no), h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => done(true) }, yes)));
    }, { dismiss: false });
  }
  alert(title, text) {
    return this._modal((card, done) => { card.append(h('h2', { class: 'modal-title' }, title), h('p', { class: 'modal-text' }, text), h('div', { class: 'row end' }, h('button', { class: 'btn primary', 'data-focus': '1', onclick: () => done(true) }, 'OK'))); }, { dismiss: true });
  }
  keypad({ title = 'Code', hint = '', length = 4 } = {}) {
    return this._modal((card, done) => {
      let v = '';
      const disp = h('div', { class: 'kp-disp', 'aria-live': 'polite', 'aria-label': 'Code saisi' });
      const draw = () => { disp.textContent = v.padEnd(length, '·').split('').join(' '); };
      const press = (d) => { if (v.length < length) { v += d; this.sfx('tick'); draw(); if (v.length === length) setTimeout(() => done(v), 160); } };
      const del = () => { v = v.slice(0, -1); draw(); };
      const pad = h('div', { class: 'kp-pad' });
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].forEach((k) => pad.append(h('button', { class: 'btn kp-key', 'aria-label': k === '⌫' ? 'Effacer' : k, onclick: () => { if (k === '⌫') del(); else if (k === 'OK') { if (v.length) done(v); } else press(k); } }, k)));
      card.append(h('h2', { class: 'modal-title' }, title), hint ? h('p', { class: 'modal-text' }, hint) : null, disp, pad, h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => done(null) }, 'Annuler')));
      card.addEventListener('keydown', (e) => { if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); } else if (e.key === 'Backspace') { del(); e.preventDefault(); } });
      draw();
    }, { dismiss: null });
  }

  // ------------------------------------------------------------------ panneaux
  openPanel(name, params = {}) {
    const make = PANELS[name]; if (!make) return;
    if (this.panel && this.panel.name === name) { this.panel.refresh && this.panel.refresh(params); return; }
    this.closePanel(true); this.closePopover();
    const prev = document.activeElement;
    const content = h('div', { class: 'panel-body' });
    const title = h('h2', { class: 'panel-title' });
    const closeBtn = h('button', { class: 'btn icon', 'aria-label': 'Fermer', title: 'Fermer (Échap)', onclick: () => this.closePanel() }, icon('close'));
    const frame = h('section', { class: 'panel panel-' + name, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'panel-title' }, h('header', { class: 'panel-head' }, title, closeBtn), content);
    title.id = 'panel-title';
    this.layers.panel.append(frame); this.layers.panel.classList.add('open');
    const api = make(this.g, params, { content, setTitle: (t) => { title.textContent = t; }, close: () => this.closePanel(), frame });
    this.panel = { name, frame, prev, ...api };
    frame.addEventListener('keydown', (e) => trapFocus(frame, e));
    this.g.audio.sfx('open'); this.g.onPanelChange?.(true);
    const f = frame.querySelector('[data-focus]') || closeBtn; f.focus({ preventScroll: true });
  }
  closePanel(silent = false) {
    const p = this.panel; if (!p) return;
    this.panel = null; try { p.onClose && p.onClose(); } catch (e) { console.error(e); }
    p.frame.remove(); this.layers.panel.classList.remove('open');
    if (!silent) { this.g.audio.sfx('close'); try { p.prev && p.prev.focus && p.prev.focus({ preventScroll: true }); } catch (e) { /* ok */ } this.g.onPanelChange?.(false); }
  }
  tickPanel(dt) { if (this.panel && this.panel.tick) this.panel.tick(dt); }

  // ------------------------------------------------------------------ décoration
  startDeco() {
    if (this.deco) return;
    this.deco = new DecoBar(this.g, this); this.layers.bottom.classList.add('deco');
    this.layers.bottom.append(this.deco.el); this.toolbar.style.display = 'none';
  }
  stopDeco() {
    if (!this.deco) return; this.deco.el.remove(); this.deco = null; this.layers.bottom.classList.remove('deco'); this.toolbar.style.display = '';
  }
  decoStatus(valid, reason) { if (this.deco) this.deco.status(valid, reason); }
  decoRefresh() { if (this.deco) this.deco.refresh(); }

  // ------------------------------------------------------------------ clavier
  _key(e) {
    const g = this.g;
    if (this.menuOpen && !this.modalOpen) return;
    if (this.dlg) { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); if (e.key === 'Escape') this.dlg.skipAll(); else this.dlg.advance(); } return; }
    if (this.modalOpen) return;
    const tag = (e.target && e.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);
    if (e.key === 'Escape') {
      if (this.pop) { this.closePopover(); return; }
      if (this.panel) { if (!(this.panel.name === 'os' && this.panel.escape && this.panel.escape())) this.closePanel(); return; }
      if (this.deco) { g.stopDeco(); return; }
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.panel) return;
    const k = e.key.toLowerCase();
    if (this.deco) {
      const room = g.room;
      if (k === 'arrowleft' || k === 'a') { room.nudge(-1, 0); e.preventDefault(); } else if (k === 'arrowright' || k === 'd') { room.nudge(1, 0); e.preventDefault(); }
      else if (k === 'arrowup' || k === 'w') { room.nudge(0, -1); e.preventDefault(); } else if (k === 'arrowdown' || k === 's') { room.nudge(0, 1); e.preventDefault(); }
      else if (k === 'enter') { room.confirmPlace(); e.preventDefault(); } else if (k === 'delete' || k === 'backspace') { room.removeSelected(); e.preventDefault(); }
      else if (k === 'z') room.undo(); else if (k === 'g') { g.state.settings.grid = !g.state.settings.grid; g.requestChange(); this.decoRefresh(); }
      return;
    }
    const map = { i: 'items', j: 'journal', c: 'collection', o: 'os', n: 'cat', w: 'window', p: 'settings', ',': 'settings' };
    if (k === 'h' || k === '?') { this.alert('Raccourcis', 'Clic / toucher : interagir. Tab : parcourir les points d\'intérêt, Entrée : agir. I : objets · J : journal · C : collection · O : Dream.OS · N : NOIR · W : fenêtre · D : décorer · P : réglages · M : muet · F : plein écran · Échap : fermer.'); return; }
    if (k === 'd' && g.zoneId === 'room') { g.startDeco(); return; }
    if (k === 'm') { g.state.settings.muted = !g.state.settings.muted; g.audio.applySettings(g.state.settings); g.requestChange(); this.toast({ icon: g.state.settings.muted ? 'mute' : 'vol', title: 'Son', text: g.state.settings.muted ? 'Coupé' : 'Activé' }); return; }
    if (k === 'f') { g.toggleFullscreen(); return; }
    if (map[k]) { if (['cat', 'os', 'window'].includes(map[k]) && g.zoneId !== 'room') return; this.openPanel(map[k]); }
  }
}
