// Panneaux : objets, journal, collection, réglages, fenêtre, NOIR, crédits. (Dream.OS : os.js)
import { h, clear, download } from './dom.js';
import { icon } from '../art/icons.js';
import { CATEGORIES, ITEMS, ITEM_BY_ID } from '../data/items.js';
import { MEMORIES, GALLERY, SYMBOLS, CHAPTERS, CREDITS } from '../data/story.js';
import { ANOMALIES } from '../data/anomalies.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { WINDOW_PICKABLE, WINDOW_BY_ID, ZONES } from '../data/world.js';
import { ALL_ZONES } from '../data/achievements.js';
import { availableCount } from '../core/decor.js';
import { drawGallery } from '../art/gallery.js';
import { spriteThumb } from './deco.js';
import { openOS } from './os.js';

const tabsBar = (items, cur, on) => h('div', { class: 'tabs', role: 'tablist' }, items.map(([id, label]) => h('button', { class: 'btn tab' + (id === cur ? ' on' : ''), role: 'tab', 'aria-selected': String(id === cur), onclick: () => on(id) }, label)));

// ---------------------------------------------------------------- objets
function items(g, params, { content, setTitle, close }) {
  setTitle('Objets');
  const render = () => {
    clear(content);
    const st = g.state;
    content.append(h('p', { class: 'hint' }, 'Les objets posables se placent depuis le mode Décorer. Les objets d\'histoire servent à ouvrir des portes.'));
    for (const c of CATEGORIES) {
      const list = ITEMS.filter((i) => i.cat === c.id && (st.owned[i.id] || 0) > 0);
      if (!list.length) continue;
      content.append(h('h3', { class: 'sect' }, c.label));
      const grid = h('div', { class: 'list' });
      for (const it of list) {
        const n = availableCount(st, it.id);
        const row = h('div', { class: 'row-item' }, spriteThumb(it.id, 32), h('div', { class: 'ri-main' }, h('div', { class: 'ri-name' }, it.name), h('div', { class: 'ri-desc' }, it.desc)));
        if (it.placeable) row.append(h('button', { class: 'btn', disabled: n <= 0 || g.zoneId !== 'room', title: g.zoneId !== 'room' ? 'Retourne dans la chambre pour décorer' : 'Poser dans la chambre', onclick: () => { close(); g.startDeco(); g.room.startPlacing(it.id); } }, n > 0 ? `Poser (${n})` : 'Posé'));
        grid.append(row);
      }
      content.append(grid);
    }
  };
  render();
  return { refresh: render };
}

// ---------------------------------------------------------------- journal
function journal(g, params, { content, setTitle }) {
  setTitle('Journal');
  let tab = params.tab || 'notes';
  const render = () => {
    clear(content); const st = g.state;
    content.append(tabsBar([['notes', 'Notes'], ['story', 'Souvenirs'], ['clues', 'Indices'], ['chapter', 'Histoire']], tab, (t) => { tab = t; render(); }));
    if (tab === 'notes') {
      const ta = h('textarea', { class: 'notes', 'data-focus': '1', 'aria-label': 'Tes notes', maxlength: '20000', placeholder: 'Écris ici ce que tu remarques : un code, une date, une couleur…' });
      ta.value = st.notes; let t = 0;
      const info = h('div', { class: 'hint' }, 'Enregistré automatiquement.');
      ta.addEventListener('input', () => { st.notes = ta.value; clearTimeout(t); t = setTimeout(() => { g.requestChange(); info.textContent = 'Enregistré.'; }, 500); info.textContent = 'Saisie…'; });
      content.append(ta, info);
    } else if (tab === 'story') {
      if (!st.memories.length) content.append(h('p', { class: 'empty' }, 'Aucun souvenir pour l\'instant. Ils reviennent quand on résout les énigmes.'));
      for (const m of MEMORIES) if (st.memories.includes(m.id)) content.append(h('article', { class: 'mem' }, h('h3', {}, m.title), h('p', {}, m.text)));
      content.append(h('p', { class: 'hint' }, `${st.memories.length} / ${MEMORIES.length} souvenirs`));
    } else if (tab === 'clues') {
      const entries = [];
      if (st.flags.poster_lifted) entries.push('Un coffre est caché derrière l\'affiche de la chambre. Il veut une date.');
      if (st.puzzles.includes('safe')) entries.push('Le coffre contenait la clé de laiton : le code était 1307 (13 juillet).');
      if (st.zones.includes('library')) entries.push('Bibliothèque : les livres se rangent dans l\'ordre des couleurs du ciel du soir, de haut en bas.');
      if (st.zones.includes('garden')) entries.push('Jardin : la boîte à musique joue la mélodie des cloches. Les cloches se reconnaissent à leur nombre de points.');
      if (st.zones.includes('inverted')) entries.push('Chambre inversée : « Ce qui tombe vers le haut finit par atteindre le sol. »');
      if (st.shardOrder.length) { const nm = { moon: '☾ croissant', star: '✦ étoile', heart: '♥ cœur' }; entries.push('Ordre où les éclats sont venus à toi : ' + st.shardOrder.map((s, i) => `${i + 1}. ${nm[s]}`).join('  ')); }
      if (st.flags.hall_secret) entries.push('Trois clignements de l\'ampoule du couloir ont fait céder un mur.');
      if (st.zones.includes('lunar')) entries.push('Salle lunaire : trois creux sur le piédestal, une silhouette qui regarde.');
      if (!entries.length) content.append(h('p', { class: 'empty' }, 'Rien de noté pour l\'instant.'));
      entries.forEach((e) => content.append(h('p', { class: 'clue' }, '◇ ' + e)));
      content.append(h('h3', { class: 'sect' }, 'Symboles'), h('div', { class: 'chips' }, SYMBOLS.map((s) => h('span', { class: 'chip' + (st.symbols.includes(s.id) ? '' : ' off') }, st.symbols.includes(s.id) ? s.name : '???'))));
      content.append(h('h3', { class: 'sect' }, 'Passages secrets'), h('p', {}, `${st.secrets.length} découvert(s).`));
    } else {
      const ch = g.chapter();
      CHAPTERS.forEach((c) => content.append(h('article', { class: 'chap' + (c.id <= ch ? '' : ' off') }, h('h3', {}, c.id <= ch ? c.title : '???'), h('p', {}, c.id <= ch ? c.desc : '…'))));
      if (st.ending) content.append(h('p', { class: 'hint' }, 'Fin atteinte : ' + { dawn: 'L\'Aube', stay: 'Le Rêve sans fin', lamp: 'La Veilleuse' }[st.ending] + '.'));
    }
  };
  render();
  return { refresh: (p) => { if (p && p.tab) tab = p.tab; render(); } };
}

// ---------------------------------------------------------------- collection
function collection(g, params, { content, setTitle }) {
  setTitle('Collection');
  let tab = params.tab || 'items';
  const render = () => {
    clear(content); const st = g.state;
    content.append(tabsBar([['items', 'Objets'], ['anom', 'Anomalies'], ['gallery', 'Galerie'], ['ach', 'Succès'], ['zones', 'Lieux']], tab, (t) => { tab = t; render(); }));
    if (tab === 'items') {
      const own = ITEMS.filter((i) => (st.owned[i.id] || 0) > 0).length;
      content.append(h('p', { class: 'hint' }, `${own} / ${ITEMS.length} objets`));
      const grid = h('div', { class: 'cards' });
      for (const it of ITEMS) { const has = (st.owned[it.id] || 0) > 0;
        grid.append(h('div', { class: 'card' + (has ? '' : ' off'), title: has ? it.desc : it.hint }, has ? spriteThumb(it.id, 40) : icon('lock', 'big'), h('div', { class: 'card-t' }, has ? it.name : '???'), h('div', { class: 'card-d' }, has ? it.desc : it.hint))); }
      content.append(grid);
    } else if (tab === 'anom') {
      const seen = Object.keys(st.anomalies).length;
      content.append(h('p', { class: 'hint' }, `${seen} / ${ANOMALIES.filter((a) => a.kind !== 'passive').length} anomalies observées`));
      for (const a of ANOMALIES) { const n = st.anomalies[a.id] || 0;
        content.append(h('article', { class: 'mem' + (n ? '' : ' off') }, h('h3', {}, n ? a.name + (a.rare ? ' ★' : '') : '???'), h('p', {}, n ? a.desc : 'Pas encore observée. Reviens à d\'autres heures, dans d\'autres lieux.'), n ? h('small', {}, `Vue ${n} fois`) : null)); }
    } else if (tab === 'gallery') {
      const grid = h('div', { class: 'gallery' });
      for (const e of GALLERY) {
        const has = st.gallery.includes(e.id);
        const cv = h('canvas', { class: 'gal-cv', role: 'img', 'aria-label': has ? e.title : 'Illustration verrouillée' });
        if (has) drawGallery(e.id, cv); else { cv.width = 160; cv.height = 100; const x = cv.getContext('2d'); x.fillStyle = '#171322'; x.fillRect(0, 0, 160, 100); }
        grid.append(h('figure', { class: 'fig' + (has ? '' : ' off') }, cv, h('figcaption', {}, has ? e.title : e.hint)));
      }
      content.append(grid);
    } else if (tab === 'ach') {
      const n = Object.keys(st.achievements).length;
      content.append(h('p', { class: 'hint' }, `${n} / ${ACHIEVEMENTS.length} succès`));
      for (const a of ACHIEVEMENTS) { const has = !!st.achievements[a.id];
        content.append(h('div', { class: 'row-item' + (has ? '' : ' off') }, icon(has ? a.icon : 'lock', 'big'), h('div', { class: 'ri-main' }, h('div', { class: 'ri-name' }, has || !a.secret ? a.name : '???'), h('div', { class: 'ri-desc' }, a.desc)))); }
    } else {
      for (const z of ALL_ZONES) { const has = st.zones.includes(z);
        content.append(h('div', { class: 'row-item' + (has ? '' : ' off') }, icon(has ? 'map' : 'lock', 'big'), h('div', { class: 'ri-main' }, h('div', { class: 'ri-name' }, has ? ZONES[z].name : '???'), h('div', { class: 'ri-desc' }, has ? ZONES[z].discover : 'Un lieu que tu n\'as pas encore trouvé.')))); }
    }
  };
  render();
  return { refresh: render };
}

// ---------------------------------------------------------------- fenêtre
function windowPanel(g, params, { content, setTitle }) {
  setTitle('La fenêtre');
  const render = () => {
    clear(content); const st = g.state, room = g.room, ending = !!st.ending;
    const auto = h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.window.auto, 'data-focus': '1', onchange: (e) => { st.window.auto = e.target.checked; g.requestChange(); room._pickWindow(true); render(); } }), ' Paysage automatique (suit l\'heure du jeu)');
    const open = h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: room.windowOpen, onchange: (e) => { room.setWindowOpen(e.target.checked); } }), ' Fenêtre ouverte (les bruits du dehors entrent)');
    content.append(auto, open, h('p', { class: 'hint' }, 'Actuellement : ' + (WINDOW_BY_ID[room.winCurId]?.name || '—')));
    const grid = h('div', { class: 'scenes' });
    for (const w of WINDOW_PICKABLE) {
      if (w.ending && !ending) continue;
      const on = !st.window.auto && st.window.scene === w.id;
      grid.append(h('button', { class: 'btn scene' + (on ? ' on' : ''), 'aria-pressed': String(on), onclick: () => { st.window.auto = false; st.window.scene = w.id; g.requestChange(); g.audio.sfx('toggle'); room._pickWindow(true); render(); } }, w.name));
    }
    content.append(grid);
  };
  render();
  return { refresh: render };
}

// ---------------------------------------------------------------- NOIR
function catPanel(g, params, { content, setTitle, close }) {
  setTitle('NOIR');
  let tab = params.tab || 'play';
  const render = () => {
    clear(content); const st = g.state, n = st.noir;
    content.append(h('p', { class: 'hint' }, `Caresses : ${n.pet} · Jeux : ${n.play} · Repas : ${n.feed} · Humeur : ${Math.round(n.mood)}%`));
    content.append(tabsBar([['play', 'Jouer'], ['feed', 'Nourrir'], ['wear', 'Accessoires']], tab, (t) => { tab = t; render(); }));
    if (tab === 'play') {
      content.append(h('p', {}, 'Choisis un jouet, puis touche le sol de la chambre. NOIR n\'est jamais obligé de jouer.'));
      const toy = (kind, label, ic) => h('button', { class: 'btn big', 'data-focus': '1', onclick: () => { g.room.pendingToy = kind; g.room.toyHint = true; close(); g.ui.toast({ icon: ic, title: label, text: 'Touche le sol pour le lancer.' }); } }, icon(ic), label);
      content.append(h('div', { class: 'row' }, toy('yarn', 'Pelote', 'yarn'), toy('feather', 'Plume', 'feather')));
      content.append(h('button', { class: 'btn', onclick: () => { g.petNoir(); close(); } }, 'Caresser NOIR'));
    } else if (tab === 'feed') {
      content.append(h('p', {}, 'Une gamelle apparaît près de NOIR. Il mange quand il a envie.'));
      const food = (id, label) => h('button', { class: 'btn big', onclick: () => { if (g.room.giveFood(id)) close(); else g.ui.toast({ icon: 'cat', title: 'NOIR', text: 'Pas maintenant : il est en plein saut.' }); } }, icon('fish'), label);
      content.append(h('div', { class: 'row' }, food('tuna', 'Thon'), food('milk', 'Lait'), food('cookie', 'Biscuit')));
    } else {
      const own = ITEMS.filter((i) => i.cat === 'cat' && (st.owned[i.id] || 0) > 0);
      if (!own.length) content.append(h('p', { class: 'empty' }, 'Aucun accessoire. Caresse, nourris et joue avec NOIR pour en gagner.'));
      for (const it of own) {
        const on = (n.equipped || []).includes(it.id);
        content.append(h('div', { class: 'row-item' }, spriteThumb(it.id, 32), h('div', { class: 'ri-main' }, h('div', { class: 'ri-name' }, it.name), h('div', { class: 'ri-desc' }, it.desc)),
          h('button', { class: 'btn' + (on ? ' on' : ''), 'aria-pressed': String(on), onclick: () => {
            n.equipped = (n.equipped || []).filter((id) => id !== it.id && ITEM_BY_ID[id]?.equip !== it.equip);
            if (!on) n.equipped.push(it.id);
            g.requestChange(); g.audio.sfx('pick'); render(); } }, on ? 'Retirer' : 'Mettre')));
      }
    }
  };
  render();
  return { refresh: render };
}

// ---------------------------------------------------------------- réglages
function settings(g, params, { content, setTitle, close }) {
  setTitle('Réglages');
  const render = () => {
    clear(content); const s = g.state.settings;
    const apply = () => { g.audio.applySettings(s); g.applyQuality(); g.requestChange(); };
    const slider = (key, label) => h('label', { class: 'field' }, h('span', {}, `${label} : `, h('b', {}, s[key] + '%')), h('input', { type: 'range', min: '0', max: '100', step: '1', value: s[key], 'aria-label': label, oninput: (e) => { s[key] = +e.target.value; e.target.previousSibling.lastChild.textContent = s[key] + '%'; apply(); }, onchange: () => g.audio.sfx('click') }));
    const select = (key, label, opts, cast = (v) => v) => h('label', { class: 'field' }, h('span', {}, label), h('select', { onchange: (e) => { s[key] = cast(e.target.value); apply(); g.ui.updateHud(); if (key.startsWith('time') || key === 'fixedHour') render(); } }, opts.map(([v, l]) => h('option', { value: v, selected: String(s[key]) === String(v) }, l))));
    const check = (key, label) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!s[key], onchange: (e) => { s[key] = e.target.checked; apply(); g.ui.decoRefresh(); } }), ' ' + label);
    content.append(h('h3', { class: 'sect' }, 'Son'), slider('master', 'Volume général'), slider('music', 'Musique'), slider('sfx', 'Effets et ambiances'), check('muted', 'Tout couper'));
    content.append(h('h3', { class: 'sect' }, 'Affichage'),
      select('quality', 'Qualité', [['high', 'Haute'], ['medium', 'Moyenne'], ['low', 'Basse (économie de batterie)']]), check('reduceMotion', 'Réduire les animations (flash, balancements, transitions)'),
      check('grid', 'Grille de décoration (4 px)'), select('textSpeed', 'Texte des dialogues', [['normal', 'Progressif'], ['instant', 'Instantané']]));
    content.append(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => g.toggleFullscreen() }, icon('full'), 'Plein écran')));
    content.append(h('h3', { class: 'sect' }, 'Horloge du jeu'),
      select('clockFormat', 'Format', [['24', '24 heures'], ['12', '12 heures'], ['dream', 'Rêve (Veille, Minuit, Aube…)']]),
      select('timeMode', 'Écoulement', [['cycle', 'Le temps passe (jour / nuit)'], ['fixed', 'Heure fixe']]),
      s.timeMode === 'fixed' ? select('fixedHour', 'Heure fixée', Array.from({ length: 24 }, (_, i) => [i, String(i).padStart(2, '0') + ' h']), Number) : null,
      select('timeSpeed', 'Vitesse', [[0.5, 'Lente'], [1, 'Normale'], [2, 'Rapide']], Number),
      h('p', { class: 'hint' }, 'L\'heure du jeu ne dépend jamais de l\'heure réelle.'));
    content.append(h('h3', { class: 'sect' }, 'Sauvegarde'),
      h('p', { class: 'note' }, 'La sauvegarde est enregistrée dans ce navigateur, sur cet appareil seulement (localStorage). Elle n\'est ni envoyée ni synchronisée : vider les données du site l\'efface. Exporte un fichier pour la garder ou changer d\'appareil.'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn', onclick: () => { g.saveNow(true); } }, icon('save'), 'Sauvegarder maintenant'),
        h('button', { class: 'btn', onclick: () => g.exportSave() }, 'Exporter (JSON)'),
        h('button', { class: 'btn', onclick: () => g.importSavePrompt() }, 'Importer (JSON)')),
      h('div', { class: 'row wrap' }, h('button', { class: 'btn danger', onclick: async () => { const ok = await g.ui.confirm('Effacer la sauvegarde ?', 'Toute ta progression sur cet appareil sera supprimée. Cette action est définitive. Pense à exporter d\'abord.', { yes: 'Tout effacer', no: 'Garder', danger: true }); if (ok) { close(); g.wipeAndRestart(); } } }, icon('trash'), 'Effacer la sauvegarde')));
    content.append(h('h3', { class: 'sect' }, 'Aide'), h('div', { class: 'row wrap' },
      h('button', { class: 'btn', onclick: () => { close(); g.ui.openPanel('credits'); } }, 'Crédits'),
      h('button', { class: 'btn', onclick: () => g.ui.alert('Raccourcis', 'Tab : parcourir les points d\'intérêt · Entrée : agir · I objets · J journal · C collection · O Dream.OS · N NOIR · W fenêtre · D décorer · P réglages · M muet · F plein écran · Échap fermer. En décoration : flèches / ZQSD pour déplacer, Entrée pour poser, Suppr pour retirer, Z pour défaire, G pour la grille.') }, 'Raccourcis'),
      g.returnToMenu ? h('button', { class: 'btn', onclick: () => { close(); g.returnToMenu(); } }, 'Menu principal') : null));
  };
  render();
  return { refresh: render };
}

function credits(g, params, { content, setTitle }) {
  setTitle('Crédits');
  content.append(h('div', { class: 'credits' }, CREDITS.map((l) => h('p', {}, l || ' '))));
  return {};
}

export const PANELS = { items, journal, collection, window: windowPanel, cat: catPanel, settings, credits, os: openOS };
