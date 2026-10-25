# DREAM ROOM — Ultimate Edition

> *A little room between reality and dreams.*

Un jeu **pixel art dreamcore / liminal / gothique / Y2K / OS rétro** qui tourne dans le navigateur : une chambre qui vit, un chat noir (**NOIR**), un ordinateur mystérieux (**Dream.OS**), huit lieux à explorer, des énigmes, des anomalies, une histoire mélancolique et trois fins.
Gratuit, sans serveur, sans compte, sans publicité : **tout est généré par le code** (pixel art, musiques, sons). Aucun fichier image ou audio externe, donc aucun droit tiers.

- Stack : **Vite 6 + modules ES + Canvas 2D (320×180 logiques, mise à l'échelle entière) + DOM** pour l'interface. Aucune bibliothèque lourde (seules dépendances : deux polices libres SIL OFL via `@fontsource`).
- Sauvegarde : `localStorage`, versionnée (schéma v2, migration v1→v2), avec copie de secours, export/import JSON strict.
- Mobile / tablette / Android : interface tactile, boutons ≥ 44 px, barre de décoration adaptée.

## Jouer

Une fois publié : `https://azzouziouwais350-code.github.io/Dream-Room/`.

| Action | Souris / toucher | Clavier |
|---|---|---|
| Interagir | cliquer / toucher un objet (un menu propose les actions) | `Tab` sur la scène pour parcourir les objets, `Entrée` pour agir |
| Objets / Journal / Collection | boutons du bas | `I` / `J` / `C` |
| Dream.OS / NOIR / Fenêtre | boutons du bas | `O` / `N` / `W` |
| Décorer | bouton « Décorer » | `D` ; flèches ou ZQSD pour déplacer, `Entrée` poser, `Suppr` retirer, `Z` défaire, `G` grille |
| Réglages / muet / plein écran | | `P` / `M` / `F` |
| Fermer / passer un dialogue | | `Échap` / `Entrée` |

Le son démarre au premier clic (règle d'autoplay des navigateurs). Toute l'heure du jeu (nuit/jour, fenêtre, anomalies) est **interne** : elle ne dépend jamais de l'heure réelle (réglable : cycle ou heure fixe, vitesse 0,5×/1×/2×).

## Contenu

- **La chambre** : lit à couverture animée, fenêtre à 17 états (nuit étoilée, lune, pluie, brouillard, îles flottantes, bâtiments suspendus, portes dans les nuages, éclipse, comète, seconde lune, pièce vue de dehors, aube…), bureau + écran cathodique, bibliothèque, armoire, lampe, rideaux animés, plantes, affiche, horloge, coffre caché, porte principale.
- **NOIR** : chat autonome (repos, toilette, marche, course, saut, sieste, regard fixe…), déplacements par chemins (A\*), caresses, jouets (pelote, plume), nourriture (thon, lait, biscuit), 5 accessoires. Jamais obligatoire.
- **Anomalies** : 15 (dont 4 événements rares) avec conditions, probabilités, délais minimaux et découverte enregistrée.
- **Dream.OS** : lecteur de musique (7 pistes, barre de position, volume), journal, galerie (10 illustrations), explorateur de fichiers (fichiers verrouillés, dossier à code), horloge (24 h / 12 h / « rêve »), terminal (`help`, `ls`, `cat`, `decode`, `unlock`…). Fenêtres déplaçables (souris, toucher ou flèches), réductibles.
- **Décoration** : ~50 objets par catégories, aperçu, placement, déplacement glisser/flèches, retrait, annulation (40 niveaux), grille optionnelle, collisions et zones interdites, sauvegarde automatique.
- **8 lieux** : couloir liminal, bibliothèque infinie, jardin nocturne, chambre inversée, espace entre les portes, salle lunaire, phare oublié (caché), chambre blanche (finale). Chacun a son retour vers la chambre.
- **Histoire** : 8 chapitres, 11 souvenirs, documents cachés, trois fins (L'Aube, Le Rêve sans fin, La Veilleuse), liberté totale après la fin.
- **Collection** : codex d'objets, anomalies, galerie, 25 succès (qui débloquent des objets), lieux.

<details>
<summary>⚠️ Solutions (spoilers)</summary>

1. Chambre : soulever le coin de l'affiche → coffre. Code **1307** (le 13 juillet entouré sur le calendrier). Clé de laiton → la porte s'ouvre.
2. Couloir : toucher l'ampoule **3 fois** en 8 s → porte secrète → phare (lettre + lentille).
3. Bibliothèque : prendre les livres dans l'ordre des couleurs du ciel du soir, de haut en bas : **prune → lavande → rose → or** (le livre cyan est un leurre).
4. Jardin : écouter la boîte à musique, puis rejouer les 5 cloches (reconnaissables à leur nombre de points).
5. Chambre inversée : écarter le rideau, tirer le levier (la gravité s'inverse, le vase tombe), prendre l'éclat.
6. Entre les portes : ouvrir les trois portes dans **l'ordre où les éclats ont été trouvés** (noté dans le Journal › Indices).
7. Salle lunaire : déposer les trois éclats sur le piédestal → porte blanche. La fin « La Veilleuse » demande d'avoir lu la lettre du phare.
8. Terminal : `decode signal.dat 3` (chiffre de César) ; `unlock 1307` ouvre le dossier « souvenirs ».

</details>

## Développer

Prérequis : Node.js ≥ 20.

```bash
npm install
npm run dev        # serveur de développement : http://localhost:5173
npm run build      # build de production dans dist/
npm run preview    # sert dist/ : http://localhost:4173
npm test           # tests unitaires (logique pure, Node)
```

Tests navigateur (Playwright + Chromium, à installer à part : `npm i -D playwright && npx playwright install chromium`) :

```bash
npm run build && npm run preview &          # puis, dans un autre terminal :
npm run test:e2e                             # smoke, parcours complet, fonctionnalités, mobile, divers
```

### Organisation du code

```
src/core/      logique pure et testable : store (sauvegarde), progress, time, decor, engine, util
src/data/      contenu : objets, histoire, anomalies, succès, monde (fenêtre, zones, énigmes, pistes)
src/art/       pixel art procédural (voir docs/SPRITES.md)
src/systems/   audio (Web Audio synthétisé) et gestionnaire d'anomalies
src/entities/  NOIR (machine à états + pathfinding)
src/scenes/    chambre, menu, zones
src/ui/        interface DOM : HUD, dialogues, panneaux, décoration, Dream.OS
src/game.js    boucle, scènes, entrées, sauvegarde ; src/main.js : point d'entrée
tests/         unitaires (logic.test.mjs) et navigateur (*.mjs)
```

Ajouter du contenu = éditer `src/data/*` (objets, textes, anomalies, pistes) : l'interface et le codex le prennent en compte.

## Publier sur GitHub Pages (gratuit)

1. Crée un dépôt GitHub (public) et pousse le code sur la branche `main` :
   ```bash
   git init && git add . && git commit -m "Dream Room"
   git branch -M main
   git remote add origin https://github.com/<compte>/<depot>.git
   git push -u origin main
   ```
2. Sur GitHub : **Settings › Pages › Build and deployment › Source : GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` se lance à chaque push sur `main` : tests unitaires, build, déploiement. Suis-le dans l'onglet **Actions**.
4. Le jeu est en ligne sur `https://<compte>.github.io/<depot>/`.

`vite.config.js` utilise `base: './'` : **le nom du dépôt n'a aucune importance**, aucun réglage à modifier (aussi valable en domaine personnalisé ou en ouvrant `dist/` via un serveur statique).

### Vérifier la publication

- L'action « Déployer sur GitHub Pages » est verte, l'URL apparaît dans l'étape `deploy`.
- Ouvre l'URL en navigation privée : le menu s'affiche, les polices pixel se chargent.
- Console du navigateur (F12) : aucune erreur, onglet Réseau : aucun 404.
- Lance une partie, ouvre Dream.OS, joue une piste (le son démarre après un clic), recharge la page : « Continuer » apparaît.
- Test mobile : ouvre l'URL sur le téléphone ; rotation et plein écran fonctionnent.

## Sauvegarde

Enregistrée **dans ce navigateur, sur cet appareil** (`localStorage`) : ni envoyée ni synchronisée. Vider les données du site l'efface. Réglages › Sauvegarde : sauvegarder maintenant, **exporter** (JSON), **importer** (validation stricte : un fichier invalide est refusé sans toucher la sauvegarde), **effacer** (avec confirmation). Une sauvegarde corrompue est détectée : le jeu restaure la copie de secours, sinon propose une nouvelle partie (une copie du fichier abîmé est conservée sous `dreamroom:save:corrupt`).

## Accessibilité

Parcours clavier complet (Tab sur la scène + panneaux), focus visible, fenêtres modales avec piège de focus et `Échap`, texte des dialogues instantané en option, **mouvements réduits** (option + préférence système `prefers-reduced-motion` à la première partie : pas de flash, transitions en fondu, particules coupées), qualité réglable (basse = 30 i/s et moins de particules), muet (`M`), plein écran (`F`), aucune information transmise par la seule couleur dans les énigmes.

## Ce qui a été testé — et ce qui ne l'a pas été

Testé automatiquement (Chromium headless via Playwright, lors du développement) : démarrage dev et build de production ; nouvelle partie / continuer ; parcours complet du jeu jusqu'à la fin ; coffre, six énigmes, passages secrets ; décoration (placement, collision, déplacement, annulation, retrait, grille) ; NOIR (caresse, repas, jeu, accessoire) ; fenêtre ; Dream.OS (lecteur : lecture/pause/suivant/position, terminal, fichiers verrouillés) ; 34 effets sonores et 7 pistes (le graphe Web Audio s'exécute sans erreur) ; 14 anomalies déclenchées ; sommeil ; réglages ; rechargement ; export/import valide, invalide et tronqué ; sauvegarde corrompue (copie de secours) ; effacement avec confirmation ; mise en page mobile 412×915 (tactile) ; chemins sous un sous-chemin type GitHub Pages (aucun 404) ; zéro erreur console ; 38 tests unitaires.

**Non vérifié** : la publication réelle sur GitHub Pages (je n'ai pas accès à ton compte) ; Firefox et Safari ; un vrai téléphone Android ; l'écoute réelle du son (un navigateur sans carte son ne permet pas de l'entendre, seul le bon fonctionnement du moteur a été contrôlé) ; la fluidité sur appareil modeste (≈ 63 i/s mesurées en rendu logiciel headless).

## Licences

Code : à ton choix (aucune licence imposée). Polices : Press Start 2P et VT323, SIL OFL 1.1 (embarquées par `@fontsource`). Aucun autre élément externe.
