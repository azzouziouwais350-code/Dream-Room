// Données narratives : souvenirs, documents, murmures, dialogues, chapitres, fins.
// Tout le texte du jeu est ici ou dans les autres fichiers de src/data/ — facile à modifier.

export const CHAPTERS = [
  { id: 1, title: 'I · Éveil', desc: 'La chambre est à sa place, mais pas la lumière. Une porte reste fermée.' },
  { id: 2, title: 'II · La clé de laiton', desc: 'Quelqu\'un a caché une clé derrière un souvenir.' },
  { id: 3, title: 'III · Le couloir', desc: 'Cinq portes, un couloir sans fin, une ampoule qui hésite.' },
  { id: 4, title: 'IV · Les éclats', desc: 'La lune s\'est brisée en trois. Chaque éclat garde un lieu.' },
  { id: 5, title: 'V · Entre les portes', desc: 'Il faut décider dans quel ordre on a oublié.' },
  { id: 6, title: 'VI · La salle lunaire', desc: 'Quelqu\'un regarde depuis la lune.' },
  { id: 7, title: 'VII · La chambre blanche', desc: 'Ce qu\'on ne dit qu\'une fois.' },
  { id: 8, title: 'Épilogue', desc: 'La chambre reste. Tu peux toujours y revenir.' },
];

export const MEMORIES = [
  { id: 'm_arrival', title: 'Un soir de pluie', text: 'Il est arrivé un soir de pluie, pas plus grand qu\'une main. Il a refusé le lait, accepté la lampe, et s\'est endormi sur ton pied comme s\'il l\'avait toujours fait.', gallery: 'g_arrival', give: 'polaroids' },
  { id: 'm_name', title: 'Pourquoi « Noir »', text: 'Tu cherchais un nom compliqué. Il t\'a regardé avec ses yeux d\'or et tu as compris que le noir suffisait. Que le noir pouvait être doux.', give: 'collar_bell' },
  { id: 'm_date', title: 'Le 13 juillet', text: 'Treize juillet. Tu as entouré la date trois fois, comme pour la retenir. On n\'entoure pas une date qu\'on veut oublier.', give: 'calendar_wall' },
  { id: 'm_lamp', title: 'La lampe allumée', text: 'Chaque soir tu laissais la lampe allumée un peu plus longtemps pour qu\'il rentre sans peur. Même quand il ne sortait plus.', gallery: 'g_lamp', give: 'candles_trio' },
  { id: 'm_library', title: 'Les jours rangés', text: 'Les jours ont des couleurs. Les tiens étaient rangés par ordre de ciel : du plus haut, le violet de la nuit, jusqu\'à l\'or du soir. Tu savais où poser chaque chagrin.', give: 'shelf_wall' },
  { id: 'm_garden', title: 'Le balcon', text: 'Il aimait le balcon la nuit. Il regardait bouger les carillons sans jamais les toucher, comme on respecte une conversation.', gallery: 'g_garden', give: 'cactus_star' },
  { id: 'm_inverted', title: 'Le jour à l\'envers', text: 'Il y a eu un jour où tout est tombé vers le haut. La clinique, la salle blanche, la table froide. Tu as tenu la gravité à deux mains.', give: 'floating_cube' },
  { id: 'm_door', title: 'La porte de trois heures', text: 'À trois heures, il grattait toujours à la porte. Quand tu ouvrais, il ne voulait pas sortir. Il voulait seulement que tu saches qu\'il y avait un dehors.', gallery: 'g_door', give: 'golden_door' },
  { id: 'm_light', title: 'Le phare', text: 'Quelqu\'un avant toi a laissé une lumière dans un phare minuscule. Quelqu\'un qui te ressemble. Quelqu\'un qui est resté trop longtemps, puis qui est parti.', gallery: 'g_light', give: 'lantern_paper' },
  { id: 'm_watcher', title: 'Celle qui regarde', text: 'La silhouette dans les nuages n\'a jamais voulu te faire peur. Elle attend que tu cesses de dormir debout.', gallery: 'g_watcher', give: 'lamp_moon' },
  { id: 'm_white', title: 'Le dernier matin', text: 'Le dernier matin, il s\'est couché sur ta main. Tu as senti le ronronnement s\'éteindre doucement, comme une lampe qu\'on baisse. Tu ne l\'as pas éteinte.', gallery: 'g_white', give: 'crystal_moon' },
];
export const MEMORY_BY_ID = Object.fromEntries(MEMORIES.map((m) => [m.id, m]));

// ---- Illustrations (dessinées en Canvas dans art/gallery.js). Photographies étranges comprises.
export const GALLERY = [
  { id: 'g_arrival', title: 'Un soir de pluie', hint: 'Un souvenir d\'arrivée.' },
  { id: 'g_lamp', title: 'La lampe allumée', hint: 'Un souvenir de veille.' },
  { id: 'g_garden', title: 'Le balcon', hint: 'Un souvenir de jardin.' },
  { id: 'g_door', title: 'La porte de trois heures', hint: 'Une porte qui n\'apparaît que la nuit.' },
  { id: 'g_light', title: 'Le phare', hint: 'Un lieu caché derrière un mur.' },
  { id: 'g_watcher', title: 'Celle qui regarde', hint: 'Un souvenir lunaire.' },
  { id: 'g_white', title: 'Le dernier matin', hint: 'Un souvenir qu\'on ne voit qu\'à la fin.' },
  { id: 'g_odd1', title: 'Photographie : la chambre sans toi', hint: 'Une ombre qui n\'appartient à rien.' },
  { id: 'g_odd2', title: 'Photographie : la fenêtre-chambre', hint: 'Une fenêtre qui montre une pièce.' },
  { id: 'g_odd3', title: 'Photographie : deux lunes', hint: 'Un événement astronomique rare.' },
];

export const SYMBOLS = [
  { id: 'moon', name: 'Croissant ☾', hint: 'Éclat de la bibliothèque.' },
  { id: 'star', name: 'Étoile ✦', hint: 'Éclat du jardin.' },
  { id: 'heart', name: 'Cœur ♥', hint: 'Éclat de la chambre inversée.' },
  { id: 'eye', name: 'Œil', hint: 'Marque de la Veilleuse.' },
  { id: 'door', name: 'Porte', hint: 'Une porte entre toutes les portes.' },
  { id: 'lamp', name: 'Lampe', hint: 'Ce qu\'il faut laisser allumé.' },
];

// ---- Documents Dream.OS. lock : null | {type, ...}. Évaluation dans systems/progress.js
// type : flag(key) | pet(n) | anomalies(n) | memories(n) | code(code, key) | granted (accordé par un événement)
export const DOCS = [
  { id: 'bienvenue', path: '/', name: 'bienvenue.txt', title: 'Bienvenue', lock: null,
    text: 'DREAM.OS v0.13\n----------------\nCe système n\'a pas été éteint depuis longtemps. Il a cessé de compter les jours.\n\nSi tu lis ceci, tu es là.\n\n- La lampe est allumée.\n- NOIR dort sur le lit, ou ailleurs.\n- Regarde par la fenêtre. Écoute la pluie.\n- Ne force aucune porte : elles s\'ouvrent quand elles sont prêtes.\n\nTout ce qui brille un peu mérite d\'être touché.' },
  { id: 'calendrier', path: '/', name: 'calendrier.txt', title: 'Calendrier', lock: null,
    text: 'JUILLET\n\nlu ma me je ve sa di\n 1  2  3  4  5  6  7\n 8  9 10 11 12 [13] 14\n\nLe 13 est entouré trois fois, au stylo rose.\nEn marge : « 13/07 — ne pas oublier. »\n\nLes autres pages sont vides. Le calendrier s\'arrête là.' },
  { id: 'premiere_nuit', path: '/notes/', name: 'premiere_nuit.txt', title: 'Première nuit', lock: { type: 'flag', key: 'pc_opened', hint: 'Ce document s\'ouvre après ta première connexion.' },
    text: 'Première nuit.\n\nJe n\'arrive pas à fermer les yeux, alors je les ouvre dans la chambre.\nElle est exactement comme je l\'avais laissée. Sauf la porte.\nLa porte, je ne m\'en souviens pas.\n\nSi quelqu\'un lit ceci : la clé n\'est pas perdue. Elle est derrière ce qu\'on regarde depuis le lit.' },
  { id: 'chat', path: '/notes/', name: 'chat.txt', title: 'À propos de NOIR', lock: { type: 'pet', n: 3, hint: 'Caresse NOIR quelques fois pour que ce fichier se débloque.' },
    text: 'NOIR.\nUne syllabe, tout le reste du vocabulaire.\n\nIl s\'endort du côté où la lumière est chaude.\nIl fixe parfois un mur vide. Ne l\'interromps pas : il surveille quelque chose de plus grand que lui.\nIl n\'a jamais voulu entrer dans le noir. C\'est drôle pour un chat qui s\'appelle ainsi.' },
  { id: 'signal', path: '/', name: 'signal.dat', title: 'Signal chiffré', lock: { type: 'flag', key: 'hallway_opened', hint: 'Verrouillé : il faut avoir ouvert la porte de la chambre.' },
    cipher: 'LA LENTILLE DORT DANS LE PHARE. POUR ENTRER, IL FAUT TROIS CLIGNEMENTS DE LUMIERE DANS LE COULOIR.', shift: 3,
    text: '// SIGNAL CHIFFRÉ — chiffre de César\n// décalage = le nombre d\'éclats de lune\n// utilise le terminal : decode signal.dat <décalage>\n\n{cipher}' },
  { id: 'anomalies_log', path: '/systeme/', name: 'anomalies.log', title: 'Journal des anomalies', lock: { type: 'anomalies', n: 3, hint: 'Verrouillé : il faut avoir observé quelques anomalies.' }, dynamic: 'anomalies', text: '' },
  { id: 'noir_hidden', path: '/cache/', name: '.noir', title: 'Fichier caché de NOIR', hidden: true, lock: { type: 'pet', n: 3, hint: 'Un fichier que seul NOIR connaît.' },
    text: 'Quand il fixe l\'ampoule du couloir, il ne joue pas.\nIl compte.\nTrois fois, jamais plus.' },
  { id: 'dossier_code', path: '/', name: 'souvenirs/', title: 'Dossier « souvenirs »', folder: true, lock: { type: 'code', code: '1307', key: 'folder_unlocked', hint: 'Dossier verrouillé par quatre chiffres. Une date entourée, quelque part, les contient.' }, text: '' },
  { id: 'jour_13', path: '/souvenirs/', name: '1307.txt', title: '13 juillet', lock: { type: 'flag', key: 'folder_unlocked', hint: 'Dans le dossier verrouillé.' },
    text: '13 juillet.\n\nLa clinique ferme à vingt heures. Je suis rentré seul.\nLa chambre était prête. Je ne l\'avais pas préparée.\nJ\'ai laissé la lampe allumée.\n\nCe n\'est pas NOIR qui m\'attend ici.\nC\'est moi qui n\'arrive pas à sortir de cette nuit.' },
  { id: 'lettre_phare', path: '/souvenirs/', name: 'lettre_phare.txt', title: 'Lettre du phare', lock: { type: 'flag', key: 'lighthouse_letter', hint: 'Dans un lieu que le couloir ne montre pas.' },
    text: 'À celle ou celui qui lira ceci,\n\nJe suis venue ici avant toi, après un autre 13 juillet, après un autre chat, ou le même.\nJ\'ai appris une chose : on ne garde pas quelqu\'un en refusant le matin.\nOn le garde en laissant une lampe allumée dans la chambre où il dormait.\n\nQuand tu te réveilleras, ne l\'éteins pas.\n\n— Celle qui allumait le phare' },
  { id: 'veilleuse_sys', path: '/systeme/', name: 'veilleuse.sys', title: 'veilleuse.sys', lock: { type: 'flag', key: 'lunar_solved', hint: 'Verrouillé : ce fichier appartient à la lune.' },
    text: 'VEILLEUSE.SYS — processus actif depuis la première nuit\nÉtat : éveillée\nObservation : 1 dormeur · 1 chat · 1 lampe\nDernière action : attendre\n\nNote : le dormeur n\'est pas en danger. Le dormeur est en retard.' },
  { id: 'bonne_nuit', path: '/', name: 'bonne_nuit.txt', title: 'bonne_nuit.txt', lock: { type: 'granted' }, text: 'Bonne nuit.\n\nCe message est arrivé tout seul.\nIl a été écrit par quelqu\'un qui connaît ton mot de passe sans l\'avoir jamais demandé.\n\nLaisse la lampe.' },
];
export const DOC_BY_ID = Object.fromEntries(DOCS.map((d) => [d.id, d]));

// ---- Murmures : les objets chuchotent des fragments d'histoire. Clé = identifiant de point d'intérêt.
export const WHISPERS = {
  lamp: ['« Laisse-moi allumée. Juste cette nuit. »', '« Il revient toujours vers la lumière. »'],
  clock: ['« Encore un tour en arrière et il sera là. »', '« Les aiguilles n\'aiment pas qu\'on les regarde. »'],
  bed: ['« Le côté gauche est encore tiède. »', '« Il dormait là. Il dort là. »'],
  window: ['« Dehors, c\'est seulement plus loin. »', '« La lune te regarde plus que tu ne la regardes. »'],
  desk: ['« Tout est écrit. Presque tout. »', '« Le curseur attend. Il sait attendre. »'],
  wardrobe: ['« Rien ici ne s\'ouvre sans bruit. »'],
  door: ['« Derrière, c\'est toujours la même porte. Mais pas la même nuit. »'],
  painting: ['« Je ne bougeais pas. Tu as juste détourné les yeux. »'],
  photos: ['« Un seul visage est net. Devine lequel. »'],
  plant: ['« Elle a soif de quelque chose qui n\'est pas de l\'eau. »'],
  noir: ['« Mrrp. »', '« Il y a un autre chat dans la fenêtre. Non. C\'est juste lui. »'],
};

// ---- Textes « Examiner » pour les éléments fixes de la chambre
export const EXAMINE = {
  bed: 'Une couverture lavande, un oreiller creusé. Le côté gauche est encore tiède.',
  window: 'Le paysage dehors change quand tu ne regardes pas. Ou quand tu regardes trop.',
  bookcase: 'Des livres sans titre, rangés par ciel plutôt que par auteur. Un seul est à l\'envers.',
  wardrobe: 'L\'armoire sent le cèdre et l\'hiver. Le fond semble un peu plus profond que le meuble.',
  desk: 'Un bureau en bois sombre et un ordinateur cathodique qui ronronne comme s\'il dormait.',
  poster: 'Une affiche de pleine lune. Un coin est décollé, comme si quelqu\'un l\'avait déjà soulevée.',
  clock: 'Une horloge murale. Les aiguilles ne mentent pas : elles ne s\'accordent juste pas avec ta montre.',
  door: 'La porte principale. Elle est verrouillée. La serrure est en laiton, pas en rêve.',
  lamp: 'Une lumière chaude, qui sent le thé. Elle ne vacille jamais.',
  chair: 'Une chaise en bois. Elle garde la forme de quelqu\'un qui écrivait.',
  rug: 'Un tapis rond, un peu usé. Les motifs forment presque une lune.',
  plant: 'Une fougère qui se tourne vers la fenêtre, un peu plus chaque soir.',
  painting: 'Une chambre au milieu d\'un champ de nuit. Presque la tienne.',
  photos: 'Deux photographies. L\'une montre une lampe, l\'autre un petit chat noir à moitié endormi.',
  vine: 'Une liane qui pousse vers le bas. Une question qui pend.',
};

export const INTRO_LINES = [
  { who: '', text: 'Tu ouvres les yeux. La chambre est exactement à sa place, et pourtant tu ne reconnais pas la lumière.' },
  { who: '', text: 'La pluie parle doucement contre la vitre. Quelque part, un grelot qui n\'existe pas.' },
  { who: '', text: 'Sur le lit, une forme noire s\'étire. NOIR. Il te regarde comme s\'il t\'attendait depuis longtemps.' },
  { who: '', text: 'L\'ordinateur ronronne. Le calendrier est resté ouvert. La porte est fermée à clé.' },
  { who: '', text: '(Tout ce qui brille un peu mérite d\'être touché.)' },
];

export const ENDINGS = {
  dawn: { title: 'L\'Aube', lines: [
    'La porte blanche s\'ouvre sans bruit. Derrière, il ne fait pas noir. Il fait simplement matin.',
    'NOIR se couche sur le seuil et ferme les yeux. Pas pour dormir. Pour te laisser partir sans qu\'il te voie le faire.',
    'Tu te réveilles. Quelque chose dans ta main est encore tiède.',
    'La chambre, elle, reste. Plus paisible. Elle sera là chaque fois que tu voudras la visiter.' ] },
  stay: { title: 'Le Rêve sans fin', lines: [
    'Tu dis : « Encore un peu. » La Veilleuse ne proteste pas.',
    'La porte blanche s\'efface doucement, pas de force, pas de regret. Dans la fenêtre, le ciel devient silencieux.',
    'NOIR s\'installe sur le lit. La pluie continue. Tout est exactement comme avant — et c\'est le problème, et c\'est le cadeau.',
    'Tu pourras repartir quand tu voudras. La porte blanche attend toujours, au bout de la salle lunaire.' ] },
  lamp: { title: 'La Veilleuse', lines: [
    'Tu lis la lettre une dernière fois. Puis tu dis : « Je vais me réveiller. Mais la lampe reste allumée. »',
    'La Veilleuse sourit — tu ne vois pas son visage, tu l\'entends dans la lumière.',
    'NOIR ronronne, pour de vrai, un tout petit peu. Puis la porte blanche s\'ouvre sur un matin ordinaire.',
    'Ce n\'est pas oublier. Ce n\'est pas rester. C\'est une lumière, quelque part, pour quand on a besoin de se souvenir.' ] },
};

export const CREDITS = [
  'DREAM ROOM — ULTIMATE EDITION',
  'A little room between reality and dreams.',
  '',
  'Conception, code, pixel art procédural, musique et sons synthétisés : projet réalisé avec Claude.',
  'Polices : Press Start 2P (CodeMan38) et VT323 (Peter Hull), sous licence SIL OFL, embarquées via @fontsource.',
  'Tous les visuels sont dessinés par le code. Tous les sons sont générés par Web Audio : aucun fichier externe, aucun droit tiers.',
  '',
  'Pour NOIR, et pour tous les chats qui gardent la lumière.',
];
