# Sprites et pixel art

Aucune image n'est chargée : chaque sprite est **dessiné par le code** (`fillRect`, disques, lignes, dithering) sur un canvas hors écran, puis recopié. Résolution logique : **320×180**, mise à l'échelle entière (`fitCanvas`) avec `image-rendering: pixelated`.

| Fichier | Contenu |
|---|---|
| `src/art/pixel.js` | palette officielle `C` (abîme `#080710`, nuit `#171322`, lavande `#B9A0FF`, lune `#F2DDFB`, rose `#FF6EC7`, cyan `#00E5FF`, or `#FFBE62`, prune `#54406F` + teintes dérivées), primitives (`R`, `disc`, `ring`, `ellipse`, `line`, `dither`, `bm`), police 3×5 (`text3x5`) |
| `src/art/furniture.js` | lit + couverture animée, armoire, bureau, bibliothèque, cadre de fenêtre, porte, affiche, coffre, horloge, 4 variantes de tableau, photos, tapis |
| `src/art/roomBase.js` | fond de la chambre (murs, plinthe, parquet), écran CRT, aiguilles, rideaux animés, halos (`glow` : anneaux concentriques additifs, sans flou) |
| `src/art/windowScenes.js` | 17 paysages animés de la fenêtre (66×46), silhouette dans les nuages |
| `src/art/cat.js` | NOIR : poses `stand/walk/run/sit/groom/pet/loaf/stretch/crouch/leap/alert`, clignement, queue, accessoires, ombre |
| `src/art/items.js` | ~50 objets du catalogue (sprites + icônes d'objets d'histoire) |
| `src/art/gallery.js` | 10 illustrations de la galerie (160×100) |
| `src/art/icons.js` | icônes d'interface 8×8 rendues en masque CSS (prennent la couleur du texte) |
| `src/scenes/zones/common.js` | couloirs en perspective cuits pixel par pixel (`bakeCorridor`), symboles 7×7, lune, étoiles |

Principes : tout sprite est « cuit » une fois (`bake`) puis recopié ; aucune dépendance au DPI ; la banque de couleurs reste dans la famille noir/violet avec le rose, le cyan et l'or en accents.
Pour **ajouter un objet** : déclarer l'objet dans `src/data/items.js` (`I(id, nom, catégorie, slot, w, h, …)`), puis dessiner son sprite dans `src/art/items.js` (`itemSprite`).
