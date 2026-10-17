// Barre du mode décoration : inventaire par catégories, placer / déplacer / retirer / annuler, grille, flèches tactiles.
import { h, clear } from './dom.js';
import { icon } from '../art/icons.js';
import { CATEGORIES, ITEMS, ITEM_BY_ID } from '../data/items.js';
import { itemSprite } from '../art/items.js';
import { availableCount } from '../core/decor.js';

export function spriteThumb(id, size = 28) {
  const c = document.createElement('canvas'); c.width = size; c.height = size; c.className = 'thumb';
  try {
    const spr = itemSprite(id); const k = Math.min(size / spr.width, size / spr.height, 2); const w = Math.max(1, Math.round(spr.width * k)), hh = Math.max(1, Math.round(spr.height * k));
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(spr, Math.round((size - w) / 2), Math.round((size - hh) / 2), w, hh);
  } catch (e) { /* sprite indisponible */ }
  return c;
}

export class DecoBar {
  constructor(game, ui) {
    this.g = game; this.ui = ui; this.cat = 'furniture';
    this.msg = h('div', { class: 'deco-msg', role: 'status', 'aria-live': 'polite' }, 'Choisis un objet, puis touche la pièce pour le placer.');
    this.tabs = h('div', { class: 'deco-tabs', role: 'tablist' });
    this.list = h('div', { class: 'deco-list', role: 'listbox', 'aria-label': 'Objets disponibles' });
    const room = () => game.room;
    const b = (ic, label, fn, cls = '') => h('button', { class: 'btn tool ' + cls, title: label, 'aria-label': label, onclick: () => { fn(); } }, icon(ic), h('span', { class: 'lbl' }, label));
    this.btnPlace = b('check', 'Poser', () => room().confirmPlace(), 'primary');
    this.btnCancel = b('close', 'Annuler le choix', () => room().cancelPlace());
    this.btnRemove = b('trash', 'Retirer', () => room().removeSelected());
    this.btnUndo = b('undo', 'Défaire', () => room().undo());
    this.btnGrid = b('grid', 'Grille', () => { game.state.settings.grid = !game.state.settings.grid; game.requestChange(); this.refresh(); });
    const arrows = h('div', { class: 'nudge', role: 'group', 'aria-label': 'Déplacer finement' },
      ...[['←', -1, 0], ['↑', 0, -1], ['↓', 0, 1], ['→', 1, 0]].map(([t, dx, dy]) => h('button', { class: 'btn nudge-btn', 'aria-label': 'Déplacer ' + t, onclick: () => room().nudge(dx, dy) }, t)));
    const done = b('check', 'Terminé', () => game.stopDeco());
    this.el = h('div', { class: 'deco-bar' }, this.msg, this.tabs, this.list, h('div', { class: 'deco-actions' }, this.btnPlace, this.btnCancel, arrows, this.btnRemove, this.btnUndo, this.btnGrid, done));
    this.refresh();
  }
  sync() {
    const g = this.g, d = g.room.deco;
    this.btnPlace.disabled = !d.pending; this.btnCancel.disabled = !d.pending; this.btnRemove.disabled = !d.selected || !!d.pending;
    this.btnUndo.disabled = !g.decor.canUndo;
  }
  status(valid, reason) {
    this.sync();
    this.el.classList.toggle('bad', !valid);
    this.msg.textContent = valid ? (this.g.room.deco.pending ? 'Emplacement valide : appuie sur « Poser ».' : 'Glisse l\'objet ou utilise les flèches.') : (reason || 'Emplacement impossible.');
  }
  refresh() {
    const g = this.g, st = g.state, d = g.room.deco;
    const cats = CATEGORIES.filter((c) => ITEMS.some((i) => i.cat === c.id && i.placeable && (st.owned[i.id] || 0) > 0));
    if (!cats.find((c) => c.id === this.cat) && cats.length) this.cat = cats[0].id;
    clear(this.tabs);
    for (const c of cats) this.tabs.append(h('button', { class: 'btn tab' + (c.id === this.cat ? ' on' : ''), role: 'tab', 'aria-selected': String(c.id === this.cat), onclick: () => { this.cat = c.id; this.refresh(); } }, c.label));
    clear(this.list);
    const items = ITEMS.filter((i) => i.cat === this.cat && i.placeable && (st.owned[i.id] || 0) > 0);
    for (const it of items) {
      const n = availableCount(st, it.id);
      this.list.append(h('button', { class: 'btn deco-item' + (d.pending === it.id ? ' on' : ''), role: 'option', 'aria-selected': String(d.pending === it.id), disabled: n <= 0, title: it.name + ' — ' + it.desc, onclick: () => { g.audio.sfx('click'); g.room.startPlacing(it.id); this.refresh(); } }, spriteThumb(it.id), h('span', { class: 'di-name' }, it.name), h('span', { class: 'di-n' }, '×' + n)));
    }
    if (!items.length) this.list.append(h('div', { class: 'empty' }, 'Rien ici pour l\'instant.'));
    this.sync(); this.btnGrid.classList.toggle('on', !!st.settings.grid);
    this.btnGrid.setAttribute('aria-pressed', String(!!st.settings.grid));
  }
}
