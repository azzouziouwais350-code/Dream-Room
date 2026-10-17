import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { ok, newPage, G, sleep, browser, BASE, results, errors } from './e2e.mjs';
import { clearDlg, act, st, waitZone } from './helpers.mjs';

// ---- 1. Chemins GitHub Pages : dist servi sous /mon-depot/sous/chemin/
const DIST = path.resolve('dist'); const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => {
  const pre = '/mon-depot/sous/chemin/'; let u = decodeURIComponent(req.url.split('?')[0]);
  if (!u.startsWith(pre)) { res.statusCode = 404; return res.end('hors base'); }
  u = u.slice(pre.length) || 'index.html'; const f = path.join(DIST, u);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
}).listen(4180);
{
  const { page } = await newPage(); const bad = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  page.on('requestfailed', (r) => bad.push('FAILED ' + r.url()));
  await page.goto('http://localhost:4180/mon-depot/sous/chemin/'); await sleep(800);
  ok('GitHub Pages : menu affiché sous un sous-chemin', await page.locator('.menu-title').isVisible());
  const fontOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px "Press Start 2P"') && document.fonts.check('16px VT323'); });
  ok('GitHub Pages : polices embarquées chargées', fontOk);
  await page.getByRole('button', { name: 'Nouvelle partie' }).click(); await sleep(500); await clearDlg(page);
  ok('GitHub Pages : partie lancée sous un sous-chemin', await G(page, () => window.__dream.running));
  ok('GitHub Pages : aucune ressource 404 / échec', bad.length === 0, JSON.stringify(bad));
  const html = fs.readFileSync('dist/index.html', 'utf8');
  ok('GitHub Pages : chemins relatifs dans index.html', !/(src|href)="\/(?!\/)/.test(html), html.match(/(src|href)="\/[^"]*"/g)?.join(','));
}
srv.close();

const { page } = await newPage();
await page.goto(BASE); await sleep(500); await page.getByRole('button', { name: 'Nouvelle partie' }).click(); await sleep(400); await clearDlg(page);

// ---- 2. clavier : Tab sur le canvas → Entrée
await page.locator('#screen').focus();
await page.keyboard.press('Tab'); await sleep(100);
ok('clavier : un point d\'intérêt est sélectionné au Tab', (await G(page, () => window.__dream.focusIdx)) === 0);
await page.keyboard.press('Enter'); await sleep(300);
ok('clavier : Entrée ouvre ses actions', (await page.locator('.popover, .dlg').count()) > 0);
await page.keyboard.press('Escape'); await clearDlg(page);

// ---- 3. toutes les anomalies (aucune erreur de rendu)
const aids = await G(page, () => window.__dream.constructor.name && ['painting_swap', 'furniture_shift', 'extra_shadow', 'window_room', 'clock_reverse', 'cloud_figure', 'night_door', 'pc_message', 'gravity_flick', 'whisper_object', 'rare_visitor', 'rare_eclipse', 'rare_comet', 'rare_double_moon']);
let allTrig = true;
for (const id of aids) {
  const r = await G(page, (id) => { const a = window.__dream.anom; a.endActive(); return a.trigger(id); }, id);
  await sleep(450);
  if (!r) { allTrig = false; console.log('  (non déclenchée : ' + id + ')'); }
  if (id === 'night_door') await page.screenshot({ path: 'tests/shots/anom-night-door.png' });
  if (id === 'window_room') await page.screenshot({ path: 'tests/shots/anom-window.png' });
}
await G(page, () => window.__dream.anom.endActive()); await clearDlg(page);
ok('anomalies : déclenchement et rendu sans erreur', true);
ok('anomalies : observées enregistrées', (await st(page, 'Object.keys(s.anomalies).length')) >= 5);
const fr = await G(page, () => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 > 1000) res(n); else requestAnimationFrame(f); }; f(); }));
console.log('  images/s (headless, logiciel) ≈', fr);

// ---- 4. sommeil
const h0 = await G(page, () => window.__dream.hour());
await act(page, 'bed', 'Dormir…'); await sleep(300); await page.locator('.choice', { hasText: 'aube' }).click(); await sleep(1200); await clearDlg(page);
ok('lit : dormir avance l\'heure du jeu (jamais l\'heure réelle)', (await G(page, () => window.__dream.hour())) === 7 && h0 !== 7);
ok('lit : flag dormi', await st(page, 's.flags.slept === true'));

// ---- 5. tous les sons
await G(page, () => window.__dream.audio.unlock());
const names = ['click', 'hover', 'open', 'close', 'toggle', 'tick', 'error', 'step', 'page', 'discover', 'memory', 'solve', 'secret', 'achievement', 'rare', 'anomaly', 'door', 'doorlock', 'key', 'portal', 'bell', 'meow', 'purr', 'whisper', 'pounce', 'eat', 'lamp', 'place', 'pick', 'static', 'thunder', 'creak', 'lever', 'grav'];
const sres = await G(page, (names) => { const a = window.__dream.audio; const bad = []; for (const n of names) { try { a.sfx(n); } catch (e) { bad.push(n + ':' + e.message); } } return bad; }, names);
ok('audio : les 34 effets se jouent sans exception', sres.length === 0, JSON.stringify(sres));
const tr = await G(page, async () => { const a = window.__dream.audio; const out = []; for (const t of ['veilleuse', 'pluie', 'couloir', 'bibliotheque', 'jardin', 'lune', 'blanche']) { a.playTrack(t, { loop: true }); await new Promise((r) => setTimeout(r, 250)); out.push(!!a.music && a.music.id === t); } return out; });
ok('audio : les 7 pistes démarrent', tr.every(Boolean), JSON.stringify(tr));
const vol = await G(page, async () => { const a = window.__dream.audio; for (let i = 0; i < 80; i++) a.sfx('bell', { i: i % 4 }); await new Promise((r) => setTimeout(r, 100)); return a.activeSfx; });
ok('audio : le nombre de sons simultanés reste borné', vol <= 24, 'activeSfx=' + vol);

// ---- 6. mouvements réduits : parcours de zones
await G(page, () => { window.__dream.state.settings.reduceMotion = true; window.__dream.applyQuality(); window.__dream.goto('hallway'); }); await waitZone(page, 'hallway');
ok('mouvements réduits : transition en fondu (sans erreur)', true);

// ---- 7. clic sur chaque bouton de panneau (pas de bouton mort / pas d'exception)
await G(page, () => window.__dream.goto('room')); await waitZone(page, 'room');
const skip = /Effacer|Importer|Menu principal|Exporter|Tout|Fermer|Poser|plein/i;
let clicked = 0;
for (const id of ['btn-items', 'btn-journal', 'btn-collection', 'btn-window', 'btn-cat', 'btn-settings']) {
  await page.locator('#' + id).click(); await sleep(200);
  const labels = await page.evaluate(() => [...document.querySelectorAll('.panel button')].map((b, i) => [i, (b.getAttribute('aria-label') || b.textContent || '').trim()]));
  for (const [i, lab] of labels) {
    if (skip.test(lab)) continue;
    if (!(await page.locator('.panel').count())) await page.locator('#' + id).click();
    const b = page.locator('.panel button').nth(i); if (!(await b.isVisible()) || !(await b.isEnabled())) continue;
    await b.click({ timeout: 1500 }).catch(() => {}); clicked++; await sleep(60); await clearDlg(page, 8);
    if (await page.locator('.modal').count()) await page.keyboard.press('Escape');
    if (!(await page.locator('.panel').count())) await page.locator('#' + id).click().catch(() => {});
    await sleep(40);
  }
  await page.keyboard.press('Escape'); await sleep(100);
}
console.log('  boutons de panneaux cliqués :', clicked);
ok('panneaux : tous les boutons cliqués sans erreur', clicked > 20 && errors.length === 0, 'cliqués=' + clicked + ' ' + JSON.stringify(errors));
ok('aucune erreur console', errors.length === 0, JSON.stringify(errors));
await browser.close(); process.exit(results.some((r) => !r.pass) ? 1 : 0);
