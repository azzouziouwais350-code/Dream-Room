// Catalogue d'objets. Données seules : facile à modifier.
// slot : 'floor' (posé au sol, y = pieds), 'rug' (tapis au sol), 'wall' (mur, y = haut), 'ceiling' (plafond, y = 0..24)
// w,h : taille en pixels logiques ; fd : profondeur d'emprise au sol (collisions)
// light : {color, r, a} halo chaud/froid ; bob : flotte doucement ; hint : indice de déblocage affiché dans le codex

export const CATEGORIES = [
  { id: 'furniture', label: 'Meubles' },
  { id: 'lighting', label: 'Éclairage' },
  { id: 'plants', label: 'Plantes' },
  { id: 'wall', label: 'Décorations murales' },
  { id: 'strange', label: 'Objets étranges' },
  { id: 'rare', label: 'Objets rares' },
  { id: 'cat', label: 'Accessoires du chat' },
  { id: 'story', label: 'Objets d\'histoire' },
];

const I = (id, name, cat, slot, w, h, fd, desc, hint, extra = {}) => ({ id, name, cat, slot, w, h, fd, desc, hint, placeable: true, ...extra });

export const ITEMS = [
  // --- Meubles
  I('chair_wood', 'Chaise de bois', 'furniture', 'floor', 18, 26, 8, 'Elle grince quand personne ne s\'assoit.', 'Présente dès le début.'),
  I('stool_star', 'Tabouret étoilé', 'furniture', 'floor', 14, 14, 8, 'Une étoile découpée dans l\'assise.', 'Récompense : décorer la chambre.'),
  I('armchair_velvet', 'Fauteuil de velours', 'furniture', 'floor', 28, 26, 12, 'Le velours garde la forme de quelqu\'un.', 'Récompense : une énigme de la bibliothèque.'),
  I('nightstand', 'Table de chevet', 'furniture', 'floor', 16, 18, 8, 'Un tiroir qui ne s\'ouvre jamais deux fois pareil.', 'Récompense : décorer davantage.'),
  I('toybox', 'Coffre à jouets', 'furniture', 'floor', 24, 14, 10, 'Il sent la laine et la lavande.', 'Récompense : jouer avec NOIR.'),
  I('dresser_gothic', 'Commode gothique', 'furniture', 'floor', 30, 30, 9, 'Ses arches ne mènent nulle part. Pour l\'instant.', 'Récompense : explorer tous les lieux.'),
  I('beanbag', 'Pouf des nuages', 'furniture', 'floor', 24, 12, 10, 'NOIR l\'a déjà choisi.', 'Observer NOIR dormir.'),
  I('shelf_wall', 'Étagère flottante', 'furniture', 'wall', 30, 12, 0, 'Quelques livres sans titre.', 'Souvenir de la bibliothèque.'),
  // --- Éclairage
  I('lamp_floor', 'Lampadaire chaleureux', 'lighting', 'floor', 12, 38, 5, 'Sa lumière sent le thé.', 'Présent dès le début.', { light: { color: '#FFBE62', r: 54, a: 0.2 } }),
  I('lamp_moon', 'Lampe lunaire', 'lighting', 'floor', 12, 30, 6, 'Un croissant qui ne s\'éteint pas.', 'Souvenir de la salle lunaire.', { light: { color: '#B9A0FF', r: 40, a: 0.18 } }),
  I('lantern_paper', 'Lanterne de papier', 'lighting', 'floor', 12, 16, 6, 'Une flamme qui n\'a besoin de rien.', 'Souvenir d\'un lieu oublié.', { light: { color: '#FF6EC7', r: 26, a: 0.16 } }),
  I('candles_trio', 'Trois bougies', 'lighting', 'floor', 14, 10, 5, 'Elles ne coulent jamais.', 'Souvenir de la lampe allumée.', { light: { color: '#FFBE62', r: 24, a: 0.16 } }),
  I('neon_dream', 'Néon « DREAM »', 'lighting', 'wall', 36, 10, 0, 'Un mot en cyan. Un seul.', 'Récompense : fréquenter le terminal.', { light: { color: '#00E5FF', r: 34, a: 0.12 } }),
  I('string_lights', 'Guirlande étoilée', 'lighting', 'ceiling', 90, 12, 0, 'Des étoiles minuscules, accrochées au plafond.', 'Récompense : une première nuit de sommeil.', { light: { color: '#FFBE62', r: 18, a: 0.06 } }),
  // --- Plantes
  I('plant_fern', 'Fougère du soir', 'plants', 'floor', 16, 24, 6, 'Ses feuilles se tournent vers la fenêtre.', 'Présente dès le début.'),
  I('cactus_star', 'Cactus-étoile', 'plants', 'floor', 12, 16, 5, 'Il fleurit à minuit, un peu.', 'Souvenir du jardin nocturne.'),
  I('lunar_lily', 'Lys lunaire', 'plants', 'floor', 14, 22, 5, 'Elle éclaire sans chaleur.', 'Récompense : terminer l\'histoire.', { light: { color: '#F2DDFB', r: 26, a: 0.14 } }),
  I('vine_hanging', 'Liane suspendue', 'plants', 'ceiling', 12, 30, 0, 'Elle pousse vers le bas, comme une question.', 'Présente dès le début.'),
  I('terrarium', 'Terrarium', 'plants', 'floor', 18, 16, 7, 'Un monde minuscule, très calme.', 'Énigme du jardin.'),
  // --- Décorations murales
  I('painting_main', 'Tableau de la chambre', 'wall', 'wall', 36, 36, 0, 'Il montre toujours la même chose. Presque.', 'Présent dès le début.'),
  I('photos_pair', 'Deux photographies', 'wall', 'wall', 28, 26, 0, 'Deux cadres. Un seul visage net.', 'Présentes dès le début.'),
  I('poster_castle', 'Affiche du château', 'wall', 'wall', 20, 28, 0, 'Un château qu\'on ne voit que de loin.', 'Passage secret de la bibliothèque.'),
  I('stained_glass', 'Vitrail miniature', 'wall', 'wall', 18, 26, 0, 'Il laisse passer une lumière que la pièce n\'a pas.', 'Récompense : voir des anomalies.'),
  I('mirror_odd', 'Miroir étrange', 'wall', 'wall', 18, 28, 0, 'Le reflet cligne un peu après toi.', 'Énigme de la chambre inversée.'),
  I('calendar_wall', 'Calendrier', 'wall', 'wall', 16, 20, 0, 'Une date entourée, toujours la même.', 'Souvenir d\'une date.'),
  I('polaroids', 'Polaroïds', 'wall', 'wall', 24, 18, 0, 'Trois instants, un seul chat.', 'Souvenir d\'une arrivée.'),
  // --- Objets étranges
  I('orb_chrome', 'Sphère chromée', 'strange', 'floor', 14, 14, 6, 'Elle reflète une pièce plus grande.', 'Énigme entre les portes.', { bob: true }),
  I('ring_iris', 'Anneau irisé', 'strange', 'wall', 22, 22, 0, 'Un anneau Y2K qui ne tient à rien.', 'Énigme entre les portes.', { bob: true }),
  I('doll_old', 'Poupée de chiffon', 'strange', 'floor', 10, 16, 5, 'Elle regarde toujours ailleurs.', 'Récompense : voir des anomalies.'),
  I('music_box', 'Boîte à musique', 'strange', 'floor', 12, 10, 5, 'Elle joue la berceuse du jardin.', 'Énigme du jardin.'),
  I('tv_static', 'Petit écran', 'strange', 'floor', 18, 18, 8, 'Il n\'a que de la neige. Parfois un mot.', 'Un message inhabituel à l\'ordinateur.'),
  I('floating_cube', 'Cube flottant', 'strange', 'floor', 12, 12, 6, 'Ne tombe pas. Ne remonte pas.', 'Souvenir d\'un jour à l\'envers.', { bob: true }),
  // --- Objets rares
  I('crystal_moon', 'Cristal de lune', 'rare', 'floor', 12, 16, 5, 'Une lune qu\'on peut tenir.', 'Souvenir du dernier matin.', { light: { color: '#F2DDFB', r: 22, a: 0.14 } }),
  I('comet_jar', 'Comète en bocal', 'rare', 'floor', 10, 16, 5, 'Elle tourne en rond, patiemment.', 'Événement astronomique rare.', { light: { color: '#00E5FF', r: 20, a: 0.12 } }),
  I('ghost_lamp', 'Lampe fantôme', 'rare', 'floor', 12, 24, 6, 'Allumée quand personne ne la regarde.', 'Résoudre la salle lunaire.', { light: { color: '#B9A0FF', r: 34, a: 0.16 } }),
  I('golden_door', 'Porte miniature dorée', 'rare', 'floor', 16, 24, 5, 'Une porte, seule, au milieu de rien.', 'Une porte apparue à 3 h du matin.'),
  // --- Tapis
  I('rug_round', 'Tapis rond', 'furniture', 'rug', 64, 14, 0, 'Le tapis de départ, un peu usé.', 'Présent dès le début.'),
  I('rug_checker', 'Tapis en damier', 'furniture', 'rug', 56, 14, 0, 'Un couloir plié en carrés.', 'Souvenir du jardin.'),
  I('rug_star', 'Tapis étoilé', 'furniture', 'rug', 60, 14, 0, 'Chaque étoile est à sa place.', 'Résoudre les éclats de lune.'),
  // --- Accessoires du chat
  I('collar_bell', 'Collier à grelot', 'cat', 'floor', 10, 10, 0, 'Un tintement doux. NOIR fait semblant de ne pas l\'aimer.', 'Caresser NOIR plusieurs fois.', { placeable: false, equip: 'collar' }),
  I('bow_pink', 'Nœud rose néon', 'cat', 'floor', 10, 10, 0, 'Le rose n\'est qu\'un accent.', 'Caresser NOIR beaucoup.', { placeable: false, equip: 'bow' }),
  I('hat_star', 'Chapeau étoilé', 'cat', 'floor', 10, 10, 0, 'NOIR le porte avec dignité.', 'Jouer avec NOIR.', { placeable: false, equip: 'hat' }),
  I('scarf_lavender', 'Écharpe lavande', 'cat', 'floor', 10, 10, 0, 'Tricotée dans un rêve.', 'Nourrir NOIR.', { placeable: false, equip: 'scarf' }),
  I('crown_gold', 'Petite couronne d\'or', 'cat', 'floor', 10, 10, 0, 'Pour un gardien.', 'Trouver des passages secrets.', { placeable: false, equip: 'crown' }),
  // --- Objets d'histoire
  I('brass_key', 'Clé de laiton', 'story', 'floor', 8, 8, 0, 'Ouvre la porte de la chambre.', 'Un coffre derrière une affiche.', { placeable: false }),
  I('lavender_key', 'Clé lavande', 'story', 'floor', 8, 8, 0, 'Ouvre la porte du jardin nocturne.', 'Énigme de la bibliothèque.', { placeable: false }),
  I('shard_moon', 'Éclat ☾ (mémoire)', 'story', 'floor', 8, 8, 0, 'Un éclat de lune. Il a la forme d\'un croissant.', 'Énigme de la bibliothèque.', { placeable: false }),
  I('shard_star', 'Éclat ✦ (étoile)', 'story', 'floor', 8, 8, 0, 'Un éclat de lune. Il a la forme d\'une étoile.', 'Énigme du jardin.', { placeable: false }),
  I('shard_heart', 'Éclat ♥ (cœur)', 'story', 'floor', 8, 8, 0, 'Un éclat de lune. Il bat, un peu.', 'Énigme de la chambre inversée.', { placeable: false }),
  I('clock_hand', 'Aiguille d\'horloge', 'story', 'floor', 8, 8, 0, 'Elle tourne à l\'envers dans la main.', 'Énigme du jardin.', { placeable: false }),
  I('lens', 'Lentille du phare', 'story', 'floor', 8, 8, 0, 'Concentre une lumière qu\'on n\'a pas encore.', 'Un lieu caché.', { placeable: false }),
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const isKnownItem = (id) => id in ITEM_BY_ID;

export const NOIR_EQUIP_SLOTS = ['collar', 'bow', 'hat', 'scarf', 'crown'];

// Meubles fixes de la chambre (non catalogués : liés à l'histoire). Empreinte au sol pour les collisions de décoration.
export const FIXED_ROOM = {
  wallBottom: 120,
  door: { x: 6, y: 56, w: 26, h: 68 },
  bed: { x: 40, y: 110, w: 82, h: 42, foot: { x: 40, y: 130, w: 82, h: 22 } },
  window: { x: 132, y: 16, w: 74, h: 62 },
  bookcase: { x: 134, y: 96, w: 70, h: 34, foot: { x: 134, y: 122, w: 70, h: 8 } },
  wardrobe: { x: 212, y: 50, w: 34, h: 80, foot: { x: 212, y: 122, w: 34, h: 8 } },
  desk: { x: 252, y: 88, w: 62, h: 54, foot: { x: 252, y: 128, w: 62, h: 14 } },
  poster: { x: 50, y: 40, w: 22, h: 36 },
  clock: { x: 86, y: 44, w: 20, h: 20 },
};
export const KEEP_CLEAR = [
  { x: 0, y: 124, w: 46, h: 56, why: 'devant la porte' },
  { x: 258, y: 142, w: 56, h: 26, why: 'devant l\'ordinateur' },
];
export const FLOOR_BAND = { top: 130, bottom: 178 }; // pieds des objets au sol / de NOIR
export const WALL_REGION = { x: 0, y: 6, w: 320, h: 108 };
export const CEILING_REGION = { x: 0, y: 0, w: 320, h: 30 };
