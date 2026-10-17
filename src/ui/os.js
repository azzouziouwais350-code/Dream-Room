// Dream.OS : bureau rétro avec fenêtres déplaçables : musique, journal, galerie, fichiers, horloge, terminal.
import { h, clear, fmtTime } from './dom.js';
import { icon } from '../art/icons.js';
import { DOCS, DOC_BY_ID, GALLERY, MEMORIES } from '../data/story.js';
import { TRACKS, TRACK_BY_ID } from '../data/world.js';
import { docLockStatus } from '../core/progress.js';
import { formatClock, formatDate } from '../core/time.js';
import { caesar } from '../core/util.js';
import { drawGallery } from '../art/gallery.js';

const APPS = [
  { id: 'music', label: 'Musique', ic: 'music', w: 300, h: 330 },
  { id: 'journal', label: 'Journal', ic: 'book', w: 300, h: 260 },
  { id: 'gallery', label: 'Galerie', ic: 'image', w: 320, h: 300 },
  { id: 'files', label: 'Fichiers', ic: 'folder', w: 340, h: 320 },
  { id: 'clock', label: 'Horloge', ic: 'sun', w: 250, h: 190 },
  { id: 'term', label: 'Terminal', ic: 'term', w: 360, h: 280 },
];

function docText(g, d) {
  if (d.dynamic === 'anomalies') {
    const st = g.state, seen = Object.entries(st.anomalies);
    return 'JOURNAL DES ANOMALIES\n----------------------\n' + (seen.length ? seen.map(([k, n]) => `• ${k} ×${n}`).join('\n') : '(vide)') + '\n\nCe journal s\'écrit tout seul.';
  }
  return d.text.replace('{cipher}', d.cipher || '');
}
const listDir = (g, cwd, hidden) => {
  const out = [];
  if (cwd === '/') { out.push({ kind: 'dir', name: 'notes/', to: '/notes/' }, { kind: 'dir', name: 'systeme/', to: '/systeme/' }); if (hidden) out.push({ kind: 'dir', name: 'cache/', to: '/cache/' }); }
  for (const d of DOCS) {
    if (d.path !== cwd) continue;
    if (d.hidden && !hidden) continue;
    if (d.folder) { out.push({ kind: 'dir', name: d.name, to: '/souvenirs/', doc: d }); continue; }
    out.push({ kind: 'file', name: d.name, doc: d });
  }
  return out;
};

export function openOS(g, params, { content, setTitle, close, frame }) {
  setTitle('Dream.OS');
  g.progress.setFlag('pc_opened', true);
  g.audio.sfx('static');
  const st = g.state;
  const desktop = h('div', { class: 'os' });
  const icons = h('div', { class: 'os-icons' });
  const area = h('div', { class: 'os-area' });
  const taskbar = h('div', { class: 'os-task' });
  const clockEl = h('span', { class: 'os-clock' });
  desktop.append(icons, area, taskbar); content.append(desktop);
  const wins = new Map(); let z = 10; const ticks = [];

  const focusWin = (w) => { w.el.style.zIndex = ++z; for (const o of wins.values()) o.el.classList.toggle('active', o === w); };
  const drawTask = () => {
    clear(taskbar);
    taskbar.append(h('span', { class: 'os-logo' }, 'DREAM.OS'));
    for (const w of wins.values()) taskbar.append(h('button', { class: 'btn task' + (w.min ? ' min' : ''), onclick: () => { w.min = !w.min; w.el.style.display = w.min ? 'none' : ''; if (!w.min) focusWin(w); drawTask(); } }, w.app.label));
    taskbar.append(clockEl);
  };
  const closeWin = (id) => { const w = wins.get(id); if (!w) return; w.el.remove(); wins.delete(id); w.onClose && w.onClose(); drawTask(); };

  function openApp(id, arg) {
    const app = APPS.find((a) => a.id === id);
    if (wins.has(id)) { const w = wins.get(id); w.min = false; w.el.style.display = ''; focusWin(w); drawTask(); if (arg && w.open) w.open(arg); return; }
    g.audio.sfx('open');
    const body = h('div', { class: 'win-body' });
    const title = h('div', { class: 'win-title', tabindex: '0', role: 'group', 'aria-label': `Fenêtre ${app.label} — flèches pour déplacer` }, icon(app.ic), h('span', {}, app.label));
    const bMin = h('button', { class: 'btn icon sm', 'aria-label': 'Réduire', onclick: () => { const w = wins.get(id); w.min = true; w.el.style.display = 'none'; drawTask(); } }, icon('min'));
    const bClose = h('button', { class: 'btn icon sm', 'aria-label': 'Fermer la fenêtre', onclick: () => { g.audio.sfx('close'); closeWin(id); } }, icon('close'));
    const el = h('div', { class: 'win', role: 'dialog', 'aria-label': app.label }, h('div', { class: 'win-head' }, title, bMin, bClose), body);
    const n = wins.size;
    el.style.width = app.w + 'px'; el.style.height = app.h + 'px'; el.style.left = 14 + n * 22 + 'px'; el.style.top = 10 + n * 20 + 'px';
    const w = { app, el, body, min: false }; wins.set(id, w); area.append(el);
    const move = (dx, dy) => { const ar = area.getBoundingClientRect(); const nx = Math.max(0, Math.min(ar.width - 60, el.offsetLeft + dx)), ny = Math.max(0, Math.min(ar.height - 30, el.offsetTop + dy)); el.style.left = nx + 'px'; el.style.top = ny + 'px'; };
    let drag = null;
    title.addEventListener('pointerdown', (e) => { focusWin(w); drag = { x: e.clientX, y: e.clientY }; title.setPointerCapture(e.pointerId); });
    title.addEventListener('pointermove', (e) => { if (!drag) return; move(e.clientX - drag.x, e.clientY - drag.y); drag = { x: e.clientX, y: e.clientY }; });
    title.addEventListener('pointerup', () => { drag = null; });
    title.addEventListener('keydown', (e) => { const m = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }[e.key]; if (m) { move(...m); e.preventDefault(); } });
    el.addEventListener('pointerdown', () => focusWin(w));
    APP_BUILD[id](w, arg); focusWin(w); drawTask();
  }

  // -------------------------------------------------------- Musique
  const APP_BUILD = {
    music(w) {
      const now = h('div', { class: 'mp-now' }), err = h('div', { class: 'mp-err', role: 'alert' });
      const bar = h('input', { type: 'range', min: '0', max: '1000', value: '0', 'aria-label': 'Position', class: 'mp-bar' });
      const tcur = h('span', {}, '0:00'), tdur = h('span', {}, '0:00');
      const vol = h('input', { type: 'range', min: '0', max: '100', value: st.settings.music, 'aria-label': 'Volume de la musique', oninput: (e) => { st.settings.music = +e.target.value; g.audio.applySettings(st.settings); g.requestChange(); } });
      const list = h('div', { class: 'mp-list', role: 'listbox', 'aria-label': 'Pistes' });
      const available = () => TRACKS.filter((t) => !t.unlock || st.zones.includes(t.unlock));
      const cur = () => g.audio.getMusicState();
      const play = (id) => {
        err.textContent = '';
        if (!g.audio.available) { err.textContent = 'Audio indisponible sur ce navigateur.'; return; }
        g.audio.unlock();
        if (g.audio.state !== 'running') { err.textContent = 'Le son n\'a pas pu démarrer : touche l\'écran puis réessaie.'; return; }
        g.audio.playerActive = true; if (!g.audio.playTrack(id, { loop: false, onEnd: () => step(1) })) err.textContent = 'Piste introuvable.';
        paint();
      };
      const step = (d) => { const a = available(); const i = Math.max(0, a.findIndex((t) => t.id === cur().id)); play(a[(i + d + a.length) % a.length].id); };
      const toggle = () => { const s = cur(); if (!g.audio.playerActive) { play(s.id && available().some((t) => t.id === s.id) ? s.id : available()[0].id); return; } if (s.playing) g.audio.pauseMusic(); else g.audio.resumeMusic(); paint(); };
      const bPlay = h('button', { class: 'btn icon big', 'aria-label': 'Lecture / pause', onclick: toggle }, icon('play'));
      const paint = () => {
        const s = cur(); const t = TRACK_BY_ID[s.id];
        now.textContent = t ? t.title : 'Aucune piste'; clear(bPlay); bPlay.append(icon(s.playing ? 'pause' : 'play'));
        clear(list);
        for (const tr of TRACKS) { const ok = !tr.unlock || st.zones.includes(tr.unlock);
          list.append(h('button', { class: 'btn track' + (s.id === tr.id ? ' on' : ''), role: 'option', 'aria-selected': String(s.id === tr.id), disabled: !ok, onclick: () => play(tr.id) }, ok ? tr.title : '??? (verrouillée)')); }
      };
      bar.addEventListener('change', () => { const s = cur(); if (s.id) g.audio.seekMusic((bar.value / 1000) * s.dur); });
      w.body.append(now, h('div', { class: 'mp-ctl' }, h('button', { class: 'btn icon', 'aria-label': 'Précédent', onclick: () => step(-1) }, icon('prev')), bPlay, h('button', { class: 'btn icon', 'aria-label': 'Suivant', onclick: () => step(1) }, icon('next')), h('button', { class: 'btn icon', 'aria-label': 'Arrêter', onclick: () => { g.audio.playerActive = false; g.audio.stopMusic(0.4); if (g.audio.zoneTrack) setTimeout(() => g.audio.setZoneTrack(g.audio.zoneTrack), 450); paint(); } }, icon('close'))), bar, h('div', { class: 'mp-time' }, tcur, tdur), h('label', { class: 'field inline' }, icon('vol'), vol), err, list);
      paint();
      const tk = () => { if (!w.el.isConnected) return; const s = cur(); if (s.dur) { if (document.activeElement !== bar) bar.value = Math.round((s.pos / s.dur) * 1000); tcur.textContent = fmtTime(s.pos); tdur.textContent = fmtTime(s.dur); } };
      ticks.push(tk);
      w.onClose = () => { /* la musique continue : on garde le lecteur actif */ };
    },
    journal(w) {
      const ta = h('textarea', { class: 'notes', 'aria-label': 'Notes', maxlength: '20000' }); ta.value = st.notes; let t = 0;
      ta.addEventListener('input', () => { st.notes = ta.value; clearTimeout(t); t = setTimeout(() => g.requestChange(), 500); });
      w.body.append(ta, h('div', { class: 'hint' }, 'Mêmes notes que le journal du jeu. Enregistrées automatiquement.'));
    },
    gallery(w) {
      const big = h('canvas', { class: 'gal-big', role: 'img', 'aria-label': 'Illustration agrandie' }); big.style.display = 'none';
      const grid = h('div', { class: 'gallery sm' });
      for (const e of GALLERY) {
        const has = st.gallery.includes(e.id);
        const cv = h('canvas', { class: 'gal-cv', role: 'img', 'aria-label': has ? e.title : 'Verrouillée' }); cv.width = 160; cv.height = 100;
        if (has) drawGallery(e.id, cv); else { cv.getContext('2d').fillStyle = '#171322'; cv.getContext('2d').fillRect(0, 0, 160, 100); }
        const b = h('button', { class: 'btn fig' + (has ? '' : ' off'), disabled: !has, title: has ? e.title : e.hint, onclick: () => { drawGallery(e.id, big); big.style.display = 'block'; big.title = e.title; } }, cv, h('span', {}, has ? e.title : '???'));
        grid.append(b);
      }
      big.addEventListener('click', () => { big.style.display = 'none'; });
      w.body.append(big, grid, h('div', { class: 'hint' }, `${st.gallery.length} / ${GALLERY.length} illustrations`));
    },
    files(w, arg) {
      let cwd = '/', hidden = false, openDoc = null;
      const render = () => {
        clear(w.body);
        const path = h('div', { class: 'f-path' }, cwd, h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: hidden, onchange: (e) => { hidden = e.target.checked; render(); } }), ' cachés'));
        w.body.append(path);
        if (openDoc) {
          const d = openDoc, lk = docLockStatus(d, st);
          w.body.append(h('button', { class: 'btn', onclick: () => { openDoc = null; render(); } }, '← Retour'), h('h3', {}, d.name));
          if (lk.open) { if (!st.docs.includes(d.id)) g.progress.unlockDoc(d.id, true); if (d.id === 'bonne_nuit') g.progress.setFlag('read_bonne_nuit', true); w.body.append(h('pre', { class: 'doc' }, docText(g, d))); }
          else w.body.append(h('div', { class: 'locked' }, icon('lock', 'big'), h('p', {}, lk.hint)));
          return;
        }
        if (cwd !== '/') w.body.append(h('button', { class: 'btn file', onclick: () => { cwd = '/'; render(); } }, icon('folder'), '..'));
        for (const e of listDir(g, cwd, hidden)) {
          const lk = e.doc ? docLockStatus(e.doc, st) : { open: true };
          w.body.append(h('button', { class: 'btn file' + (lk.open ? '' : ' lockedf'), onclick: async () => {
            g.audio.sfx('click');
            if (e.kind === 'dir') {
              if (e.doc && !lk.open) {
                if (e.doc.lock.type === 'code') { const c = await g.ui.keypad({ title: 'Dossier verrouillé', hint: e.doc.lock.hint, length: 4 }); if (c == null) return; if (c === e.doc.lock.code) { g.progress.setFlag(e.doc.lock.key, true); g.audio.sfx('key'); } else { g.audio.sfx('error'); return; } } else return;
              }
              cwd = e.to; render();
            } else { openDoc = e.doc; render(); }
          } }, icon(e.kind === 'dir' ? 'folder' : lk.open ? 'doc' : 'lock'), e.name));
        }
      };
      render(); w.open = (id) => { const d = DOC_BY_ID[id]; if (d) { cwd = d.path; openDoc = d; render(); } };
      if (arg) w.open(arg);
    },
    clock(w) {
      const a = h('div', { class: 'ck-big' }), b = h('div', { class: 'ck-sm' }), c = h('div', { class: 'ck-sm' }), d = h('div', { class: 'ck-date' });
      w.body.append(a, b, c, d, h('p', { class: 'hint' }, 'Heure du jeu. Elle ne suit jamais l\'heure réelle.'));
      const tk = () => { if (!w.el.isConnected) return; a.textContent = formatClock(st, '24'); b.textContent = formatClock(st, '12'); c.textContent = formatClock(st, 'dream'); d.textContent = formatDate(st); };
      ticks.push(tk); tk();
    },
    term(w) {
      const out = h('div', { class: 'term-out', role: 'log', 'aria-live': 'polite' }), inp = h('input', { class: 'term-in', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Commande' });
      let cwd = '/'; const hist = []; let hi = 0;
      const print = (t) => { out.append(h('div', {}, t)); out.scrollTop = out.scrollHeight; };
      print('Dream.OS terminal v0.13 — tape « help ».');
      const find = (name) => DOCS.find((d) => !d.folder && (d.name === name || d.name === name.replace(/^\.?\//, '')) );
      const cmds = {
        help: () => print('help · ls [-a] · cd <dossier> · cat <fichier> · whoami · date · clear · echo · noir · moon · remember · listen · decode <fichier> <n> · unlock <code>'),
        whoami: () => print('dormeur (en retard)'),
        date: () => print(formatDate(st) + ' — ' + formatClock(st)),
        clear: () => clear(out),
        echo: (a) => print(a.join(' ')),
        ls: (a) => { const all = a.includes('-a'); print(listDir(g, cwd, all).map((e) => e.name).join('  ') || '(vide)'); },
        cd: (a) => { const t = (a[0] || '/').replace(/\/?$/, '/'); if (t === '/' || t === '../') { cwd = '/'; return print('/'); } const p = '/' + t.replace(/^\//, ''); const dir = listDir(g, '/', true).find((e) => e.kind === 'dir' && e.to === p); if (!dir) return print('cd : dossier introuvable'); if (dir.doc && !docLockStatus(dir.doc, st).open) return print('Dossier verrouillé. Essaie « unlock <code> ».'); cwd = p; print(cwd); },
        cat: (a) => { const d = find(a[0] || ''); if (!d) return print('cat : fichier introuvable'); const lk = docLockStatus(d, st); if (!lk.open) return print('Accès refusé. ' + lk.hint); if (!st.docs.includes(d.id)) g.progress.unlockDoc(d.id, true); print(docText(g, d)); },
        noir: () => { g.audio.sfx('meow'); print(' /\\_/\\\n( o.o )  mrrp.\n > ^ <'); },
        moon: () => { const n = st.memories.length; const ph = ['nouvelle lune', 'premier croissant', 'croissant', 'quartier', 'gibbeuse', 'presque pleine', 'pleine lune'][Math.min(6, Math.floor((n / MEMORIES.length) * 6.99))]; print(`Lune : ${ph} (${n}/${MEMORIES.length} souvenirs).`); },
        remember: () => { const m = st.memories.map((id) => MEMORIES.find((x) => x.id === id)).filter(Boolean); print(m.length ? '« ' + m[Math.floor(Math.random() * m.length)].title + ' »' : 'Rien à te rappeler. Encore.'); },
        listen: () => { g.audio.sfx('whisper'); print('…(quelque chose respire, très loin, dans le disque dur)'); },
        decode: (a) => { const d = find(a[0] || ''); if (!d || !d.cipher) return print('decode : usage « decode signal.dat <décalage> »'); if (!docLockStatus(d, st).open) return print('Accès refusé.'); const n = parseInt(a[1], 10); if (n !== d.shift) { g.audio.sfx('error'); return print('Décalage incorrect : le texte reste illisible.'); } g.audio.sfx('solve'); g.progress.setFlag('signal_decoded', true); print(caesar(d.cipher, -n)); },
        unlock: (a) => { if (a[0] === '1307') { if (!g.flag('folder_unlocked')) { g.progress.setFlag('folder_unlocked', true); g.audio.sfx('key'); print('Dossier « souvenirs » déverrouillé.'); } else print('Déjà déverrouillé.'); } else { g.audio.sfx('error'); print('Code refusé.'); } },
      };
      const run = (line) => {
        print('> ' + line); const [c, ...a] = line.trim().split(/\s+/); if (!c) return;
        hist.push(line); hi = hist.length;
        if (cmds[c]) { cmds[c](a); g.progress.incFlag('term_cmds'); g.progress.checkAchievements(); } else print(`${c} : commande inconnue (essaie « help »)`);
      };
      inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { run(inp.value); inp.value = ''; } else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); } else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); } else if (e.key === 'Escape') { inp.blur(); } });
      w.body.append(out, h('div', { class: 'term-line' }, h('span', {}, '>'), inp));
      setTimeout(() => inp.focus({ preventScroll: true }), 30);
    },
  };

  for (const a of APPS) {
    const badge = a.id === 'files' && st.docs.includes('bonne_nuit') && !st.flags.read_bonne_nuit ? h('span', { class: 'badge' }, '1') : null;
    icons.append(h('button', { class: 'btn os-icon', onclick: () => { g.audio.sfx('click'); openApp(a.id); } }, icon(a.ic, 'big'), h('span', {}, a.label), badge));
  }
  drawTask();
  if (st.docs.includes('bonne_nuit') && !st.flags.read_bonne_nuit) setTimeout(() => g.ui.toast({ icon: 'doc', title: 'Dream.OS', text: 'Nouveau message : bonne_nuit.txt' }), 400);
  if (params.app) openApp(params.app);
  let acc = 0;
  return {
    tick(dt) { acc += dt; if (acc < 0.25) return; acc = 0; clockEl.textContent = formatClock(st); for (const t of ticks) t(); },
    escape() { const top = [...wins.values()].sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0]; if (top) { closeWin(top.app.id); return true; } return false; },
  };
}
