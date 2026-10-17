import { ok, newPage, G, sleep, browser, BASE, results, errors } from './e2e.mjs';
import { clearDlg, act, clickHot, st, waitZone } from './helpers.mjs';
const { page } = await newPage();
await page.goto(BASE); await sleep(600);
await page.getByText('Nouvelle partie').click(); await sleep(500); await clearDlg(page);

// --- chambre : affiche, coffre, code
ok('clic réel : soulever l\'affiche', (await clickHot(page, 'poster', 'Soulever')) === 'ok'); await sleep(300); await clearDlg(page);
ok('affiche soulevée (flag)', await st(page, 's.flags.poster_lifted === true'));
await clickHot(page, 'safe', 'Ouvrir'); await sleep(300);
ok('clavier du coffre affiché', await page.locator('.kp-pad').isVisible());
await page.keyboard.type('1234'); await sleep(500); await clearDlg(page);
ok('mauvais code : non résolu', await st(page, '!s.puzzles.includes("safe")'));
await clickHot(page, 'safe', 'Ouvrir'); await sleep(300);
await page.keyboard.type('1307'); await sleep(600); await clearDlg(page);
ok('énigme du coffre résolue', await st(page, 's.puzzles.includes("safe") && g.has("brass_key")'));
await act(page, 'door', 'Ouvrir'); await sleep(300); await clearDlg(page); await sleep(300);
ok('porte → couloir', await waitZone(page, 'hallway'));
ok('succès « première porte »', await st(page, '!!s.achievements.first_door'));

// --- couloir : ampoule x3 → passage secret → phare
for (let i = 0; i < 3; i++) { await act(page, 'bulb', 'Toucher'); await sleep(200); await clearDlg(page); }
ok('trois clignements : porte secrète', await st(page, 's.flags.hall_secret === true && s.secrets.includes("hall_bulb")'));
await act(page, 'door_secret', 'Ouvrir'); ok('couloir → phare', await waitZone(page, 'lighthouse'));
await act(page, 'letter'); await sleep(200); await clearDlg(page);
ok('lettre du phare lue (flag + doc + souvenir)', await st(page, 's.flags.lighthouse_letter && s.docs.includes("lettre_phare") && s.memories.includes("m_light")'));
await act(page, 'chest'); await sleep(200); await clearDlg(page);
ok('lentille obtenue', await st(page, 'g.has("lens")'));
await act(page, 'lighthouse', 'Allumer la lampe'); await sleep(200); await clearDlg(page);
ok('lampe du phare allumée', await st(page, 's.flags.lighthouse_lit === true'));
await act(page, 'back'); ok('phare → couloir', await waitZone(page, 'hallway'));

// --- bibliothèque
await act(page, 'door_library', 'Ouvrir'); ok('couloir → bibliothèque', await waitZone(page, 'library'));
await act(page, 'book_cyan', 'Prendre'); await sleep(300); await clearDlg(page);
ok('mauvais livre : pas résolu', await st(page, '!s.puzzles.includes("library")'));
for (const b of ['plum', 'lav', 'pink', 'gold']) { await act(page, 'book_' + b, 'Prendre'); await sleep(350); await clearDlg(page); }
await sleep(500); await clearDlg(page);
ok('énigme de la bibliothèque résolue', await st(page, 's.puzzles.includes("library") && g.has("lavender_key") && g.has("shard_moon")'));
await act(page, 'exit'); await waitZone(page, 'hallway');

// --- jardin
await act(page, 'door_garden', 'Ouvrir'); await sleep(400); await clearDlg(page); ok('couloir → jardin', await waitZone(page, 'garden'));
const seq = await st(page, 'g.scene._sequence()');
ok('séquence du carillon (5 notes)', Array.isArray(seq) && seq.length === 5, JSON.stringify(seq));
await act(page, 'musicbox'); await sleep(300); await clearDlg(page); await sleep(4500);
for (const n of seq) { await act(page, 'bell' + n, 'Faire sonner'); await sleep(450); }
await sleep(600); await clearDlg(page);
ok('énigme du jardin résolue', await st(page, 's.puzzles.includes("garden") && g.has("clock_hand")'));
await act(page, 'exit'); await waitZone(page, 'hallway');

// --- chambre inversée
await act(page, 'door_inverted', 'Ouvrir'); await sleep(400); await clearDlg(page); ok('couloir → chambre inversée', await waitZone(page, 'inverted'));
await act(page, 'curtain', 'Écarter'); await sleep(300); await clearDlg(page);
await act(page, 'lever'); await sleep(300); await clearDlg(page); await sleep(1500);
await act(page, 'vase', 'Prendre l\'éclat'); await sleep(300); await clearDlg(page); await sleep(300); await clearDlg(page);
ok('énigme inversée résolue', await st(page, 's.puzzles.includes("inverted") && g.has("shard_heart")'));
ok('ordre des éclats enregistré', await st(page, 'JSON.stringify(s.shardOrder) === \'["moon","star","heart"]\''));
await act(page, 'exit'); await waitZone(page, 'hallway');

// --- entre les portes → lune → chambre blanche
await act(page, 'door_between', 'Ouvrir'); ok('couloir → entre les portes', await waitZone(page, 'between'));
await act(page, 'door_heart', 'Ouvrir'); await sleep(300); await clearDlg(page);
ok('mauvaise porte : réinitialise', await st(page, '!s.puzzles.includes("between")'));
for (const s of ['moon', 'star', 'heart']) { await act(page, 'door_' + s, 'Ouvrir'); await sleep(300); await clearDlg(page); }
await sleep(300); await clearDlg(page);
ok('énigme entre les portes résolue', await st(page, 's.puzzles.includes("between")'));
await act(page, 'portal', 'Traverser'); ok('portail → salle lunaire', await waitZone(page, 'lunar'));
await act(page, 'pedestal', 'Déposer les éclats'); await sleep(400); await clearDlg(page); await sleep(300); await clearDlg(page);
ok('énigme lunaire résolue', await st(page, 's.puzzles.includes("lunar") && s.flags.lunar_solved'));
await act(page, 'white_door', 'Entrer'); ok('salle lunaire → chambre blanche', await waitZone(page, 'white'));
await sleep(1200); await clearDlg(page, 10);
// choix de fin
await page.locator('.choice', { hasText: 'laisser la lampe allumée' }).click({ timeout: 4000 }).catch(() => {});
await sleep(300); await clearDlg(page, 30); await sleep(500);
ok('fin « lamp » atteinte', await st(page, 's.ending === "lamp"'));
ok('succès de fin', await st(page, 's.achievements.finish && s.achievements.true_end'));
await page.keyboard.press('Escape');
console.log('erreurs console:', errors);
ok('aucune erreur console (parcours complet)', errors.length === 0, JSON.stringify(errors));
await page.screenshot({ path: 'tests/shots/end.png' });
await browser.close();
process.exit(results.some((r) => !r.pass) ? 1 : 0);
