// Menu principal : Nouvelle partie / Continuer / Importer / Réglages / Crédits.
import { h, clear } from './dom.js';
import { icon } from '../art/icons.js';

export function buildMenu(g) {
  const root = g.ui.layers.menu; clear(root);
  const hasSave = g.saves.hasSave();
  const msg = [];
  if (g.loadNotice) msg.push(h('p', { class: 'menu-note ' + (g.loadNotice.err ? 'err' : ''), role: 'alert' }, g.loadNotice.text));
  const b = (label, fn, cls = '', ic) => h('button', { class: 'btn menu-btn ' + cls, onclick: () => { g.audio.unlock(); g.audio.sfx('click'); fn(); } }, ic ? icon(ic) : null, label);
  const list = h('div', { class: 'menu-list', role: 'menu' },
    hasSave && g.loaded ? b('Continuer', () => g.continueGame(), 'primary', 'play') : null,
    b('Nouvelle partie', () => g.newGame(), hasSave && g.loaded ? '' : 'primary', 'star'),
    b('Importer une sauvegarde', () => g.importSavePrompt(), '', 'save'),
    b('Réglages', () => g.ui.openPanel('settings'), '', 'gear'),
    b('Crédits', () => g.ui.openPanel('credits'), '', 'heart'));
  const box = h('div', { class: 'menu-box' },
    h('h1', { class: 'menu-title' }, h('span', {}, 'DREAM'), h('span', {}, 'ROOM')),
    h('div', { class: 'menu-sub' }, 'ULTIMATE EDITION'),
    h('p', { class: 'menu-sig' }, 'A little room between reality and dreams.'),
    ...msg, list,
    h('p', { class: 'menu-foot' }, 'Sauvegarde locale à cet appareil (localStorage). Le son démarre après ton premier clic.'));
  root.append(box);
  root.classList.add('open');
  const first = list.querySelector('button'); if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
}
export function hideMenu(g) { g.ui.layers.menu.classList.remove('open'); clear(g.ui.layers.menu); }
