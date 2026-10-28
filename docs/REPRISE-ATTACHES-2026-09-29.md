# Reprise du 29 septembre : sauvegarde incomplète et attaches

## Blocage de récupération prioritaire

L'utilisateur confirme avoir eu les nouvelles armes accessibles dans le jeu
principal sur l'autre PC. Ne pas confondre l'état de ce checkout avec son travail
terminé. Le seul head publié, `main`, vaut `a3a26bb` lors de la vérification.
Son `src/loadout.js` ne contient que quatre armes.

`work/arsenal-integration/REPRISE-AFFINAGE-ARMES-2026-09-27.md` décrit pourtant
32 entrées d'inventaire, 10 armes directement équipables et 22 galeries.
La copie `.pending-integration/inventory-exposure/` conserve ce registre.
`work/twin-blade-runtime/` contient des copies partielles de neuf armes.
Les pages `qa-matrix.html` à `qa-matrix-7.html`, et notamment les modules
`src/cannonade-effects.js` et `src/ranged-projectiles.js`, sont absents du
checkout et de son historique Git publié. Ne pas copier aveuglément les
patches : ils importent eux-mêmes des modules manquants.

Prochaine étape : récupérer le dossier actif complet de l'autre PC ou sa
sauvegarde Git complétée. Préserver les modifications locales ci-dessous avant
de fusionner. Aucun commit ni push n'a été effectué ici.

## Méthode des premières armes et captures

- Plasma : mode `attachmentMode: model`, pose locale SWORD directement sous
  R_Hand_Dummy. Ne pas appliquer Sword_Wea_Dummy une seconde fois.
- Dagger : conserver la chaîne du dummy et du modèle, y compris les animations
  locales. Socket type 24 vérifié dans weapon_attach.x7.
- Counter : modèles déjà représentés comme nœuds animés, avec chaîne distincte
  pour l'épée et le gantelet. Ne pas aplatir le gantelet.
- Capture live Plasma du 23 septembre :
  `tests/fixtures/native/plasma-attachment-capture.json` contient les matrices
  monde main/arme et leur transform relatif. Le test numérique compare cette
  mesure au modèle importé.
- Capture live Dagger du 23 septembre : variante bloody, chaîne parentale
  capturée. Elle prouve le socket, pas la géométrie exacte de shortknife.
- Aucune capture dédiée Counter retrouvée dans les fixtures inspectées.
- La note d'affinage rapporte une capture Katana du 27 septembre : position
  échouée 64/64, aucune sonde main/arme. Ce n'est PAS une mesure de sa prise.

## Correction locale en cours

Cause reproductible : les exports récents séparent Bone et ModelData. Le
runtime ne matérialisait pas tous les ModelData ; leurs animations et la
parenté de leurs sockets étaient perdues en les rattachant à un ancêtre.

`equipment-hierarchy.js` conserve ces deux types de nœuds, toutes les pistes
locales et la chaîne parentale. Un parent statique séparé porte l'alignement ;
il ne peut plus être annulé par BASE ou mélangé dans les clés d'animation.
Les anciens exports déjà complets restent sur leur chemin existant.
Les animations/sources ne sont pas réécrites.

Cette correction structurelle ne prouve pas que les alignements historiques
choisis pour chaque arme sont conformes au client. Notamment la correction
quaternion du Revolver et la conservation de rotation du Smash Rifle restent
des adaptations historiques à vérifier contre des références indépendantes.
Aucune nouvelle arme n'a été exposée ni déclarée visuellement validée.

## Axes : ne pas confondre rotation et réflexion

- Les tableaux de matrices SCN passent dans Matrix4.fromArray sans nouvelle
  transposition. La convention vecteur-ligne/vecteur-colonne est déjà adaptée
  par leur représentation mémoire.
- Le personnage source regarde -Z ; le contrôleur regarde +Z au cap zéro.
  La rotation Y de 180 degrés a un déterminant +1 : elle ne reflète pas le
  squelette et ne justifie jamais de permuter L_Hand et R_Hand.
- Station 2 a une présentation historique avec Z réfléchi, contrairement à
  certaines autres cartes. Cette conversion est distincte de l'attache locale.
- Une transformation monde commune C s'annule dans le rapport main/arme :
  inverse(C * Main) * (C * Arme) = inverse(Main) * Arme. Changer les axes du
  monde ne peut donc pas réparer à lui seul une mauvaise prise.

`s5runtime-coordinates.js` centralise l'échelle, la rotation du personnage et la
conversion réversible des coordonnées de carte. La présentation historique
est conservée pour éviter de casser les collisions, les scènes Blender et
les fixtures existantes. La migration de tout le monde au repère natif n'est
pas faite ; sa nécessité dépend aussi du symptôme exact signalé par l'utilisateur.

## Vérifications réalisées

- Build Vite réussi.
- 17 nouveaux tests : sept familles × deux rigs, pistes des ModelData,
  parenté, plusieurs temps, alignement animé et mélange, cohérence des axes.
  Ils vérifient le respect des sources, pas une identité visuelle avec S5Runtime.
- Suite complète : 1297 tests, 1288 réussis, 9 échecs : trois écarts de taille
  aux manifestes Breaker et six tests Revolver avec ressources manquantes.
- Les tests de capture Plasma/Dagger et d'attache Breaker passent.
- Inspection visuelle exhaustive des deux rigs/armes/attaques encore à faire
  après récupération de la version complète. Ne pas annoncer le souci global
  définitivement résolu sur la seule base des tests.
