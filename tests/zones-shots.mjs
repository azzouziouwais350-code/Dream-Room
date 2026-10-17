import { newPage, sleep, browser, BASE, errors } from './e2e.mjs';
import { clearDlg, waitZone } from './helpers.mjs';
const { page } = await newPage();
await page.goto(BASE); await sleep(500); await page.getByText('Nouvelle partie').click(); await sleep(400); await clearDlg(page);
await page.evaluate(() => { const g = window.__dream; for (const i of ['brass_key', 'lavender_key', 'clock_hand', 'shard_moon', 'shard_star', 'shard_heart']) g.give(i); g.state.flags.hall_secret = true; g.state.flags.new_corridor_open = true; g.state.flags.garden_unlocked = true; g.state.flags.inverted_unlocked = true; });
for (const z of ['hallway', 'library', 'garden', 'inverted', 'between', 'lunar', 'lighthouse', 'white']) {
  await page.evaluate((z) => window.__dream.goto(z), z); await waitZone(page, z); await sleep(900); await clearDlg(page, 10);
  await page.screenshot({ path: `tests/shots/zone-${z}.png` });
}
console.log(errors); await browser.close();
