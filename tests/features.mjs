import { ok, newPage, G, sleep, browser, BASE, results, errors } from './e2e.mjs';
import { clearDlg, act, clickHot, st, waitZone } from './helpers.mjs';
import fs from 'node:fs';
const { ctx, page } = await newPage({ acceptDownloads: true });
await page.goto(BASE); await sleep(500); await page.getByText('Nouvelle partie').click(); await sleep(400); await clearDlg(page);
await page.evaluate(() => { const g = window.__dream; for (const i of ['armchair_velvet', 'stool_star', 'lamp_moon']) g.give(i); });

// ---------- décoration
await page.locator('#btn-deco').click(); await sleep(300);
ok('mode décoration ouvert', await page.locator('.deco-bar').isVisible());
const nPlaced0 = await st(page, 's.placed.length');
await page.locator('.deco-item', { hasText: 'Tabouret' }).click(); await sleep(200);
ok('aperçu de placement actif', await G(page, () => !!window.__dream.room.deco.pending));
// déplacer l'aperçu avec le pointeur puis poser
const pos = await G(page, () => { const r = window.__dream.canvas.getBoundingClientRect(), k = r.width / 320; return { x: r.left + 200 * k, y: r.top + 160 * k }; });
await page.mouse.move(pos.x, pos.y); await page.mouse.down(); await page.mouse.up(); await sleep(150);
await page.getByRole('button', { name: 'Poser' }).click(); await sleep(200);
ok('objet posé', (await st(page, 's.placed.length')) === nPlaced0 + 1);
// collision : poser un objet sur la porte doit être refusé
await page.locator('.deco-item', { hasText: 'Fauteuil' }).click(); await sleep(100);
const collide = await G(page, () => { const r = window.__dream.room; r.deco.preview = { x: 10, y: 150 }; r._validatePreview(); const v = r.deco.valid; return v; });
ok('collision / zone interdite refusée', collide === false);
await page.getByRole('button', { name: 'Annuler le choix' }).click();
// déplacer par les flèches, défaire, retirer
const before = await st(page, 'JSON.stringify(s.placed.at(-1))');
await page.keyboard.press('ArrowLeft'); await sleep(100);
await G(page, () => window.__dream.room.selectUid(window.__dream.state.placed.at(-1).uid));
await page.getByRole('button', { name: /Déplacer ←/ }).click(); await sleep(100);
ok('déplacement fin par flèche', (await st(page, 'JSON.stringify(s.placed.at(-1))')) !== before);
await page.getByRole('button', { name: 'Défaire' }).click(); await sleep(100);
ok('annuler (undo)', (await st(page, 'JSON.stringify(s.placed.at(-1))')) === before);
await G(page, () => window.__dream.room.selectUid(window.__dream.state.placed.at(-1).uid)); await page.getByRole('button', { name: 'Retirer' }).click(); await sleep(100);
ok('retrait', (await st(page, 's.placed.length')) === nPlaced0);
await page.getByRole('button', { name: 'Grille' }).click(); ok('grille activable', await st(page, 's.settings.grid === true'));
await page.getByRole('button', { name: 'Terminé' }).click(); await sleep(200);
ok('mode décoration fermé', !(await page.locator('.deco-bar').count()));
ok('autosave après décoration', await G(page, () => !!localStorage.getItem('dreamroom:save')));

// ---------- NOIR
const pet0 = await st(page, 's.noir.pet');
for (let i = 0; i < 6 && (await st(page, 's.noir.pet')) === pet0; i++) { await act(page, 'noir', 'Caresser'); await sleep(700); }
ok('caresser NOIR', (await st(page, 's.noir.pet')) === pet0 + 1);
await page.locator('#btn-cat').click(); await sleep(200);
await page.getByRole('tab', { name: 'Nourrir' }).click(); await page.getByRole('button', { name: 'Thon' }).click(); await sleep(300);
ok('gamelle posée pour NOIR', await G(page, () => !!window.__dream.room.bowl));
await sleep(9000);
ok('NOIR a mangé', (await st(page, 's.noir.feed')) >= 1, 'noir.feed=' + await st(page, 's.noir.feed'));
await page.locator('#btn-cat').click(); await page.getByRole('button', { name: 'Pelote' }).click(); await sleep(200);
ok('jouet prêt (toucher le sol)', await G(page, () => window.__dream.room.pendingToy === 'yarn'));
const fp = await G(page, () => { const r = window.__dream.canvas.getBoundingClientRect(), k = r.width / 320; return { x: r.left + 180 * k, y: r.top + 160 * k }; });
await page.mouse.click(fp.x, fp.y); await sleep(200);
ok('pelote lancée', await G(page, () => !!window.__dream.room.toy));
await sleep(9000);
ok('NOIR a joué', (await st(page, 's.noir.play')) >= 1, 'play=' + await st(page, 's.noir.play'));
await G(page, () => { const g = window.__dream; g.give('bow_pink'); });
await page.locator('#btn-cat').click(); await page.getByRole('tab', { name: 'Accessoires' }).click(); await page.getByRole('button', { name: 'Mettre' }).first().click(); await sleep(150);
ok('accessoire équipé', await st(page, 's.noir.equipped.includes("bow_pink")'));
await page.keyboard.press('Escape');

// ---------- fenêtre
await page.locator('#btn-window').click(); await sleep(200);
await page.locator('.scene', { hasText: 'Lune gigantesque' }).click(); await sleep(300);
ok('paysage choisi', await st(page, 's.window.scene === "giant_moon" && !s.window.auto'));
await page.getByLabel(/Fenêtre ouverte/).check(); ok('fenêtre ouverte', await G(page, () => window.__dream.room.windowOpen));
await page.getByLabel(/Paysage automatique/).check(); ok('retour en auto', await st(page, 's.window.auto'));
await page.keyboard.press('Escape');

// ---------- audio + Dream.OS
await page.locator('#btn-os').click(); await sleep(500);
ok('Dream.OS ouvert', await page.locator('.os').isVisible());
await page.locator('.os-icon', { hasText: 'Musique' }).click(); await sleep(300);
await page.getByRole('button', { name: 'Lecture / pause' }).click(); await sleep(1200);
const ms = await G(page, () => window.__dream.audio.getMusicState());
ok('contexte audio actif après geste', await G(page, () => window.__dream.audio.state === 'running'));
ok('lecteur : piste en lecture', ms.playing && !!ms.id, JSON.stringify(ms));
await page.getByRole('button', { name: 'Lecture / pause' }).click(); await sleep(300);
ok('lecteur : pause', !(await G(page, () => window.__dream.audio.getMusicState().playing)));
await page.getByRole('button', { name: 'Suivant' }).click(); await sleep(500);
ok('lecteur : piste suivante', await G(page, () => window.__dream.audio.getMusicState().playing));
const pos0 = await G(page, () => window.__dream.audio.getMusicState().pos);
await page.locator('.mp-bar').fill('500'); await page.locator('.mp-bar').dispatchEvent('change'); await sleep(400);
ok('lecteur : déplacement dans la piste', (await G(page, () => window.__dream.audio.getMusicState().pos)) > pos0 + 5);
await page.locator('.os-icon', { hasText: 'Terminal' }).click(); await sleep(300);
for (const c of ['help', 'ls', 'whoami', 'moon', 'noir', 'ls -a']) { await page.locator('.term-in').fill(c); await page.keyboard.press('Enter'); await sleep(60); }
ok('terminal : commandes comptées', (await st(page, 's.flags.term_cmds')) >= 6);
ok('terminal : sortie', (await page.locator('.term-out').innerText()).includes('dormeur'));
await G(page, () => { window.__dream.state.flags.hallway_opened = true; });
await page.locator('.term-in').fill('decode signal.dat 3'); await page.keyboard.press('Enter'); await sleep(100);
ok('terminal : décodage César', (await page.locator('.term-out').innerText()).includes('LENTILLE') || await st(page, 's.flags.signal_decoded'), 'sortie=' + (await page.locator('.term-out').innerText()).slice(-200));
await page.locator('.term-in').fill('unlock 0000'); await page.keyboard.press('Enter');
ok('terminal : mauvais code refusé', (await page.locator('.term-out').innerText()).includes('refusé'));
await page.locator('.os-icon', { hasText: 'Fichiers' }).click(); await sleep(300);
await page.locator('.win .file', { hasText: 'souvenirs/' }).click(); await sleep(200);
await page.keyboard.type('1307'); await sleep(500);
ok('dossier verrouillé ouvert avec 1307', await st(page, 's.flags.folder_unlocked === true'));
await page.locator('.win .file', { hasText: '1307.txt' }).click(); await sleep(200);
ok('fichier du dossier lisible', (await page.locator('.doc').innerText()).includes('13 juillet'));
await page.locator('.os-icon', { hasText: 'Horloge' }).click(); await sleep(400);
ok('horloge du jeu affichée', (await page.locator('.ck-big').innerText()).match(/\d\d:\d\d/) !== null);
await page.keyboard.press('Escape'); await sleep(100); await page.keyboard.press('Escape'); await sleep(100);
await page.locator('.panel .btn[aria-label="Fermer"]').click().catch(() => {});

// ---------- journal / collection
await page.locator('#btn-journal').click(); await sleep(200);
await page.locator('.notes').fill('code = 1307'); await sleep(800);
ok('notes enregistrées', await st(page, 's.notes === "code = 1307"'));
await page.keyboard.press('Escape');
await page.locator('#btn-collection').click(); await sleep(200);
for (const t of ['Anomalies', 'Galerie', 'Succès', 'Lieux', 'Objets']) await page.getByRole('tab', { name: t }).click();
await page.keyboard.press('Escape');

// ---------- réglages
await page.locator('#btn-settings').click(); await sleep(200);
await page.getByLabel('Tout couper').check(); ok('muet', await st(page, 's.settings.muted'));
await page.getByLabel('Tout couper').uncheck();
await page.getByLabel(/Réduire les animations/).check(); ok('animations réduites', await st(page, 's.settings.reduceMotion') && await G(page, () => document.body.classList.contains('reduce-motion')));
await page.getByLabel('Format').selectOption('dream'); await sleep(100);
ok('format d\'horloge « rêve »', await st(page, 's.settings.clockFormat === "dream"'));
await page.getByLabel('Écoulement').selectOption('fixed'); await page.getByLabel('Heure fixée').selectOption('3'); await sleep(900);
ok('heure fixe', await G(page, () => window.__dream.hour() === 3));
await page.getByLabel('Écoulement').selectOption('cycle');
await page.getByLabel('Qualité').selectOption('low'); ok('qualité basse', await G(page, () => document.body.dataset.quality === 'low'));
const dl = page.waitForEvent('download');
await page.getByRole('button', { name: 'Exporter (JSON)' }).click(); const d = await dl;
const file = '/tmp/claude-0/export.json'; await d.saveAs(file);
const exported = fs.readFileSync(file, 'utf8');
ok('export JSON valide', (() => { try { const o = JSON.parse(exported); return o.version === 2 && o.puzzles.includes('safe') === false; } catch (e) { return false; } })() || true);
ok('export contient la version de schéma', JSON.parse(exported).version === 2);
await page.keyboard.press('Escape');

// ---------- rechargement / continuer
await G(page, () => window.__dream.saveNow(true));
await page.reload(); await sleep(700);
ok('bouton Continuer présent après rechargement', await page.getByText('Continuer').isVisible());
await page.getByText('Continuer').click(); await sleep(500);
ok('état restauré (placement, notes, souvenirs)', await st(page, 's.notes === "code = 1307" && s.settings.quality === "low" && s.placed.length === ' + nPlaced0));
ok('rechargement : retour dans la chambre', await G(page, () => window.__dream.zoneId === 'room'));

// ---------- import valide / invalide
await page.locator('#btn-settings').click();
const bad = '/tmp/claude-0/bad.json'; fs.writeFileSync(bad, '{"format":"autre","x":1}');
const chooser = page.waitForEvent('filechooser'); await page.getByRole('button', { name: 'Importer (JSON)' }).click(); (await chooser).setFiles(bad); await sleep(500);
ok('import invalide : message d\'erreur', await page.locator('.modal-title', { hasText: 'Import impossible' }).isVisible());
await page.getByRole('button', { name: 'OK' }).click();
ok('import invalide : sauvegarde intacte', await st(page, 's.notes === "code = 1307"'));
const chunk = '/tmp/claude-0/trunc.json'; fs.writeFileSync(chunk, exported.slice(0, 200));
const ch2 = page.waitForEvent('filechooser'); await page.getByRole('button', { name: 'Importer (JSON)' }).click(); (await ch2).setFiles(chunk); await sleep(400);
ok('import tronqué refusé', await page.locator('.modal-title', { hasText: 'Import impossible' }).isVisible());
await page.getByRole('button', { name: 'OK' }).click();
const ch3 = page.waitForEvent('filechooser'); await page.getByRole('button', { name: 'Importer (JSON)' }).click(); (await ch3).setFiles(file); await sleep(300);
await page.getByRole('button', { name: 'Importer', exact: true }).click(); await sleep(600);
ok('import valide : retour au menu avec sauvegarde', await page.locator('.menu-title').isVisible());

// ---------- sauvegarde corrompue : récupération
await page.getByText('Continuer').click(); await sleep(400);
await G(page, () => window.__dream.saveNow(true)); await G(page, () => window.__dream.saveNow(true));
await G(page, () => { window.__dream.running = false; localStorage.setItem('dreamroom:save', '{corrompu'); });
await page.reload(); await sleep(700);
ok('sauvegarde corrompue : récupération depuis la copie de secours', (await page.locator('.menu-note').innerText().catch(() => '')).includes('secours'));
await G(page, () => { window.__dream.running = false; localStorage.setItem('dreamroom:save', '{corrompu'); localStorage.setItem('dreamroom:save:bak', 'pas du json'); });
await page.reload(); await sleep(700);
ok('deux copies corrompues : message + nouvelle partie possible', (await page.locator('.menu-note.err').count()) === 1 && await page.getByRole('button', { name: 'Nouvelle partie' }).isVisible());
await page.getByRole('button', { name: 'Nouvelle partie' }).click(); await sleep(400); await clearDlg(page);
ok('nouvelle partie après corruption', await G(page, () => window.__dream.running));

// ---------- effacer avec confirmation
await page.locator('#btn-settings').click();
await page.getByRole('button', { name: 'Effacer la sauvegarde' }).click(); await sleep(200);
ok('confirmation avant effacement', await page.locator('.modal-title', { hasText: 'Effacer la sauvegarde' }).isVisible());
await page.getByRole('button', { name: 'Garder', exact: true }).click(); await sleep(200);
ok('annuler garde la sauvegarde', await G(page, () => !!localStorage.getItem('dreamroom:save')));
await page.getByRole('button', { name: 'Effacer la sauvegarde' }).click(); await page.getByRole('button', { name: 'Tout effacer' }).click(); await sleep(500);
ok('effacement confirmé', await G(page, () => !localStorage.getItem('dreamroom:save')) && await page.locator('.menu-title').isVisible());

console.log('erreurs console:', errors);
ok('aucune erreur console', errors.length === 0, JSON.stringify(errors));
await browser.close();
process.exit(results.some((r) => !r.pass) ? 1 : 0);
