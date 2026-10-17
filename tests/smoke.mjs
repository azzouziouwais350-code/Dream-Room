import { ok, newPage, G, sleep, browser, BASE, results, errors } from './e2e.mjs';
const { page } = await newPage();
await page.goto(BASE); await sleep(800);
ok('menu affiché', await page.locator('.menu-title').isVisible());
await page.screenshot({ path: 'tests/shots/menu.png' });
await page.getByText('Nouvelle partie').click(); await sleep(600);
ok('dialogue d\'intro', await page.locator('.dlg').isVisible());
await page.screenshot({ path: 'tests/shots/intro.png' });
for (let i = 0; i < 8; i++) { await page.keyboard.press('Enter'); await sleep(80); }
await page.keyboard.press('Escape'); await sleep(500);
ok('intro terminée', !(await page.locator('.dlg').count()));
ok('jeu en cours dans la chambre', await G(page, () => window.__dream.running && window.__dream.zoneId === 'room'));
await sleep(1500);
await page.screenshot({ path: 'tests/shots/room.png' });
console.log('erreurs console:', errors);
ok('aucune erreur console', errors.length === 0, JSON.stringify(errors));
await browser.close();
process.exit(results.some((r) => !r.pass) ? 1 : 0);
