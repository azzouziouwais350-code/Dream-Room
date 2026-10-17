import { ok, newPage, G, sleep, browser, BASE, results, errors } from './e2e.mjs';
import { clearDlg, act, st, waitZone } from './helpers.mjs';
const { page } = await newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
await page.goto(BASE); await sleep(700);
const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
ok('mobile : pas de défilement horizontal (menu)', await noScroll());
await page.screenshot({ path: 'tests/shots/m-menu.png' });
await page.getByRole('button', { name: 'Nouvelle partie' }).tap(); await sleep(500);
for (let i = 0; i < 8; i++) { await page.locator('.dlg-wrap').tap({ timeout: 800 }).catch(() => {}); await sleep(80); }
await clearDlg(page);
ok('mobile : jeu lancé au toucher', await G(page, () => window.__dream.running));
const geo = await G(page, () => { const r = window.__dream.canvas.getBoundingClientRect(); return { w: r.width, h: r.height, top: r.top, bottom: r.bottom, iw: innerWidth, ih: innerHeight }; });
ok('mobile : canvas dans l\'écran et assez grand', geo.w >= 300 && geo.w <= geo.iw && geo.bottom <= geo.ih, JSON.stringify(geo));
const tb = await page.evaluate(() => [...document.querySelectorAll('.toolbar .btn')].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height, r.right]; }));
ok('mobile : boutons tactiles ≥ 40 px', tb.every(([w, h]) => w >= 40 && h >= 40), JSON.stringify(tb));
ok('mobile : barre d\'outils dans l\'écran', tb.every(([, , r]) => r <= 412), JSON.stringify(tb));
// toucher un objet
const pos = await G(page, () => { const g = window.__dream, h = g.scene.hotspots().find((x) => x.id === 'clock'), r = g.canvas.getBoundingClientRect(), k = r.width / 320; return { x: r.left + (h.rect.x + 10) * k, y: r.top + (h.rect.y + 10) * k }; });
await page.touchscreen.tap(pos.x, pos.y); await sleep(250);
ok('mobile : toucher un objet ouvre ses actions', await page.locator('.popover').isVisible());
await page.screenshot({ path: 'tests/shots/m-room.png' });
await page.locator('.pop-btn', { hasText: 'Examiner' }).tap(); await sleep(300); await clearDlg(page);
// déco mobile
await page.locator('#btn-deco').tap(); await sleep(400);
ok('mobile : barre de décoration visible', await page.locator('.deco-bar').isVisible());
const g2 = await G(page, () => { const r = window.__dream.canvas.getBoundingClientRect(), b = document.querySelector('.deco-bar').getBoundingClientRect(); return { cb: r.bottom, bt: b.top, cw: r.width }; });
ok('mobile : le canvas reste visible au-dessus de la barre de déco', g2.cb <= g2.bt + 2 && g2.cw >= 300, JSON.stringify(g2));
await page.screenshot({ path: 'tests/shots/m-deco.png' });
await page.getByRole('button', { name: 'Terminé' }).tap(); await sleep(300);
// panneaux
for (const id of ['btn-items', 'btn-journal', 'btn-collection', 'btn-window', 'btn-cat', 'btn-os', 'btn-settings']) {
  await page.locator('#' + id).tap(); await sleep(350);
  const fit = await G(page, () => { const p = document.querySelector('.panel'); if (!p) return null; const r = p.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; });
  ok('mobile : panneau ' + id + ' dans l\'écran', fit === true);
  if (id === 'btn-os') await page.screenshot({ path: 'tests/shots/m-os.png' });
  await page.locator('.panel .btn[aria-label="Fermer"]').tap(); await sleep(200);
}
ok('mobile : pas de défilement horizontal (jeu)', await noScroll());
// zone : couloir sur mobile
await G(page, () => window.__dream.goto('hallway')); await waitZone(page, 'hallway'); await sleep(600);
await page.screenshot({ path: 'tests/shots/m-hall.png' });
ok('mobile : bouton retour à la chambre visible dans une zone', await page.locator('#btn-back').isVisible());
await page.locator('#btn-back').tap(); ok('mobile : retour chambre', await waitZone(page, 'room'));
ok('aucune erreur console', errors.length === 0, JSON.stringify(errors));
await browser.close(); process.exit(results.some((r) => !r.pass) ? 1 : 0);
