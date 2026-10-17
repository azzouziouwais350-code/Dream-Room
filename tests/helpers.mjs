import { sleep } from './e2e.mjs';
export async function clearDlg(page, max = 40) {
  for (let i = 0; i < max; i++) { if (!(await page.locator('.dlg').count())) return; await page.keyboard.press('Escape'); await sleep(60); }
}
/** Lance l'action d'un point d'intérêt (sans passer par le pointeur). */
export function act(page, id, label) {
  return page.evaluate(([id, label]) => {
    const g = window.__dream; const hs = g.scene.hotspots(); const h = hs.find((x) => x.id === id);
    if (!h) return 'absent:' + id + ' parmi ' + hs.map((x) => x.id).join(',');
    const a = label ? h.actions.find((x) => x.label === label) : h.actions[0];
    if (!a) return 'action absente:' + label + ' parmi ' + h.actions.map((x) => x.label).join(',');
    a.run(); return 'ok';
  }, [id, label]);
}
/** Clic réel sur un point d'intérêt, puis choix dans le menu si besoin. */
export async function clickHot(page, id, label) {
  const pos = await page.evaluate((id) => {
    const g = window.__dream; const h = g.scene.hotspots().find((x) => x.id === id); if (!h) return null;
    const r = g.canvas.getBoundingClientRect(), k = r.width / 320;
    return { x: r.left + (h.rect.x + h.rect.w / 2) * k, y: r.top + (h.rect.y + h.rect.h / 2) * k, n: h.actions.length };
  }, id);
  if (!pos) return 'absent:' + id;
  await page.mouse.click(pos.x, pos.y); await sleep(150);
  if (pos.n > 1 && label) { const b = page.locator('.pop-btn', { hasText: label }).first(); if (!(await b.count())) return 'menu sans ' + label; await b.click(); await sleep(150); }
  return 'ok';
}
export const st = (page, expr) => page.evaluate((e) => { const s = window.__dream.state; return new Function('s', 'g', 'return ' + e)(s, window.__dream); }, expr);
export async function waitZone(page, zone, ms = 3000) {
  const t = Date.now(); while (Date.now() - t < ms) { if (await page.evaluate((z) => window.__dream.zoneId === z && !window.__dream.transitionFx.active, zone)) return true; await sleep(100); }
  return false;
}
