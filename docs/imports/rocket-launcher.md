# Rocket Launcher — reprise du15 octobre2026

Statut : **jouable en essais dans le jeu principal ; fidélité native incomplète**.
Item2020010, type45, skin classique `rocket launcher_n.scn`. Menu, inventaire,
touche **K**. Les tirs primaire et secondaire, recharge, projectiles, explosions,
poussée et sons sont raccordés. Aucun statut natif prêt n’est annoncé.

## Sources actuelles et corrections de l’ancien aperçu

`tools/prepare-rocket-launcher-source-contract.mjs` authentifie séparément les
états Normal, Run, Reload, les deux animations d’attaque et six fonctions de
weapon_rocketlauncher.lua : `work/rocket-launcher-recovery/source-contract.json`.
L’ancien aperçu isolé ne prouve ni les tirs ni les ressources actuelles.

- **7500 est une vitesse de lancement**, pas une durée de vie. Le binding57F810
  la stocke àstate+374 ; RocketInit_Normal donne un timeout de5000ms.
- Le catalogue XBN actuel donne capacité1, réserve5, puissance48, déplacement0.8.
  L’ancien `_eu_weapon.x7` donne capacité3 et d’autres paramètres ; cette
  divergence est conservée. Le chargeur1 est directement observé dans S5Runtime.
- Le secondaire prépare pendant2500ms, puis entre en charge3000ms. Il lance
  trois roquettes à4500 avec paramètres de spirale4/300/500 ; **une seule**
  munition est consommée. La récupération native des deux tirs vaut1000ms.
- Les scripts ne déclenchent pas le fichier rocket_flying.ogg : il est récupéré
  mais non raccordé, conformément à la ligne Lua commentée.

`recover-rocket-launcher-resources.mjs` ferme les dépendances à partir des
archives de la copie privée :44 ressources CRC/SHA, aucune manquante. Cela
comprend le modèle4 maillages, les textures,7 Ogg,4 SEQ,2 SCN d’effets et les
porteurs des deux rigs. `restore-rocket-launcher-assets.mjs` produit43 fichiers
publics empreintés, puis le manifeste. L’installation originale reste intacte.

## Animations et maintien

| État | Torse | Jambes |
| --- | --- | --- |
| Repos | RL014 | même clip |
| Course | RL004–RL011 directionnels | 00008–00015 directionnels |
| Charge primaire | RL001, blend RL000 haut/RL003 bas | RL001 arrêt ; E0008–E0015 mobile |
| Tir primaire | RL021, blend RL020 haut/RL023 bas ; fitting1000ms | jambes d’action |
| Préparation secondaire | RL024 | RL024 arrêt ; jambes d’action mobile |
| Charge secondaire | RL031, blend RL030 haut/RL033 bas | RL001 arrêt ; jambes d’action mobile |
| Tir secondaire | RL041, blend RL040 haut/RL043 bas | jambes d’action |
| Recharge | RL002 | RL002 arrêt ; course mobile conservée dans S5 |

23 clips proviennent des porteurs actuels bip_male/female_*0000.scn. Le porteur
de base ne contient pas RL014 : la première préparation a correctement échoué.
Les clips du secondaire sont des copies **déclarées dans le SCN** :249 liens
par sexe sont résolus vers leurs pistes sources exactes, avec chaînes conservées
dans `sourceAliases`. Aucun alias inventé, aucun effacement de provenance.
Le helper reste strict par défaut et n’accepte ces copies qu’avec l’option
explicite ; cycles et cibles absentes sont rejetés.

Les courbes RL/00008 ont handedness−1, les jambes E ont+1 : la conversion des
noms latéraux se fait séparément pour chaque groupe. Les commandes ne changent
pas. Les huit clips de course des rigs de base sont comparés à leur source
actuelle,472 pistes masculines et512 féminines, tolérance0.00002 native ; écarts
maximaux0.00000708/0.00000754. Empreintes et preuves dans `manifest.storage`.

L’attache équipée est R_Hand_Dummy, link0 ; rangement Spine_Dummy. L’ancien
générateur effaçait les courbes du grip dans l’asset. La nouvelle conversion
les conserve : le traitement link0 est explicite à la frontière du rig pour
rocket_gun_Wea_Dummy. Les enfants gardent recul, pliage et recharge animés.
Tests : positions des sommets visibles après mixer, huit directions à trois
orientations, primaire/secondaire/préparation/recharge, haut/centre/bas et fondus.
Le canon est orienté selon le−X de Minegun_Wea_Dummy : le vecteur poignée→canon
est incliné et ne constitue pas son axe de tir.

## Comparaisons S5Runtime et raccordement S5

`capture_rocket_launcher_states.py` utilise la sonde originale et ReadProcessMemory,
sans seconde attache Frida. Les rapports native-states-v1/v2.json sont complets
pour les deux sexes avec gates équipement, démarrage, ammo et réseau natifs.
Le premier vérifie l’annulation après maintien2000ms, avant la préparation2500ms.
Le second vérifie les phases0→1→3, vitesses7500/4500, compte3 et ammo1→0 après
maintien3500ms. La recharge est observée vers1109–1156ms après requête, transport,
traitement d’entrée et polling inclus. Ce n’est pas un chronométrage interne exact.

La limite de maintien souris du labo est portée de2000 à6000ms pour couvrir
2500ms de préparation plus3000ms de charge. Auto-relâchement et plafond restent
actifs ; limite clavier2000ms inchangée. Le nouveau maintien3500ms a été réellement
exécuté et relâché. Les deux sessions privées sont arrêtées avec identité et
nettoyage vérifiés ; tous les résultats réussis sont conservés.

Le nœud SCN natif rocket_gun_n_con_Dummy est comparé relativement à sa main
dans les tests des deux rigs, seuil position0.02 unité native, orientation0.002rad,
échelle0.0001. **C’est une observation de racine au repos**, pas une certification
de tous les sommets natifs, poses, IDs de clips ou sockets de tir. La lecture
est cohérente avant/après, non atomique. Les métriques globales du gate restent nulles.

`rocket-launcher-runtime.js` gère primaire, préparation/annulation du secondaire,
charge, munition unique, réserve finie, recharge et annulation dash/mur/impact.
Le changement d’arme conserve ammo/réserve ; le reset rétablit1+5.
`rocket-launcher-projectiles.js` résout chaque roquette indépendamment, avec
sphère balayée16×0.006, timeout5s, explosion500×0.006, dégâts par bandes,
type de dégâts ennemis+soi et déplacement Push(300,2000,−5000) via collisions.

Les roquettes lancées survivent au changement d’arme et à l’interruption du
tireur. Leur son d’explosion reste lié à l’audio du lanceur. Le reset de partie
les nettoie via resetSerial. Muzzle/charge suivent Minegun_Wea_Dummy ; les têtes
suivent les projectiles ; l’effet d’explosion utilise le même point que les dégâts.

## Limites conservées et vérifications

- La spirale emploie désormais la mise à jour native F61210 : centre mobile,
  phase float32, axe de caméra, décalage initial selon le haut de caméra,
  répartition entière360/3 et expansion avant décrément du délai500ms. Le
  solveur retire également sa marge libre0.015×rayon16. Comparaison ciblée
  ci-dessous ; position de naissance et collisions complètes restent ouvertes.
- Le facteur source de puissance est0.5 pour le primaire,1 pour le secondaire,
  avec bandes0.75/0.5/0.5. Le tirage natif15/20/50/100 et0/20/30/1 est maintenant
  porté et comparé isolément, comme détaillé ci-dessous. Les PV S5 ne certifient
  pas encore la puissance logique initiale, l'équipement, l'armure, les critiques
  ou l'ordre global des tirages natifs.
- Le CCD, volumes d’acteur, sensing100, occlusion centrale, contact terrain,
  direction et gates/cap Push restent à comparer au moteur natif.
- CActGhostTrail est maintenant raccordé à la texture line1, aux champs
  700/10/0/0, à la Shape Line01 et à sa hiérarchie animée. Les constructeurs
  natifs prouvent une pose locale identité et trois paires d’extrémités nulles.
  Le renderer utilise les formules de sampling natives portées ; matrice évaluée,
  reset/contrôleur externe, horloge et rendu GPU restent à comparer dans S5Runtime.
  Preuves : `work/rocket-launcher-recovery/trail-agent/native-initialization/`.
- Les IDs corporels natifs, huit directions, recharge mobile spécifique,
  sauts, transitions/interruptions, dimensions VFX et écoute restent à vérifier.

`tests/rocket-launcher-gameplay.test.mjs` compare les paramètres aux deux rapports
natifs, puis teste le runtime30/60/120Hz, ammo/réserve, huit directions et IDs,
géométrie après mixer, visée, murs minces, timeout, dégâts sur soi, Push réel,
persistance au changement d’arme, audio propriétaire, reset et empreintes.
Les rapports de régression/build et captures du jeu principal sont dans
`work/rocket-launcher-recovery/`. Les scénarios navigateur couvrent repos,
course, projectile avant/après impact, triple tir et recharge sur les deux corps.
Le passage initial réussit123 tests JS et le build. Les16 scénarios navigateur,
l’aller/retour d’inventaire et74 comparaisons de paramètres/outcomes passent
via `tools/compare-rocket-launcher.mjs` : comparison.json. Cette comparaison
sépare paramètres natifs et PV observés seulement dans S5 ; elle ne certifie
pas la correspondance des PV S5Runtime.

Le contrôle historique des rigs a révélé six fins de ligne CRLF là où les
manifeste Breaker/Katana/Air Gun attendent LF. Après preuve SHA exacte des seuls
octets de fin de ligne, les payloads canoniques ont été restaurés. Aucun hash
attendu ni contenu JSON n’est modifié ; les attributs de préservation existants
restent inchangés. Preuve : historical-newline-recovery.json.

Le contrat central contient la famille ; le gate reste fermé, y compris sur
les copies natives que le vérificateur générique exige encore comme pistes
directes. Aucun seuil ni provenance n’est assoupli pour annoncer prêt.

## Spirale native — correction du15 octobre2026

`src/native-rocket-motion.js` remplace le calcul absolu âge→hélice. Les positions
et vitesses restent en unités natives float32, avec conversion0.006 au rendu.
Le temps de déplacement est plafonné à0.1s, mais le délai d'expansion retire
le delta entier original. Le premier tick n'écarte donc pas les roquettes.
Le runtime conserve le reste fractionnaire des ms pour les appels hors16ms.
Le jeu principal transmet la direction et le haut de la caméra au tir ; les
appels QA sans caméra utilisent explicitement leur direction canon→cible.

`tools/s5runtime-local/capture_rocket_trajectories.py` lit seulement les vecteurs
enregistrés par5805F0→AD66F0, avec l'original probe existant et Win32 VM_READ.
Chaque région est relue ; cela rejette les changements observables pendant la
lecture, sans promettre une capture atomique. La versionv5 corrige le pointeur
du collider : projectile+30, pas un collider intégré au projectile. Les versions
antérieures sont conservées et ne servent pas à certifier les rayons/contacts.
La tentativev1 dépassait la borne256octets du lecteur : seules deux petites
régions ont été retenues, sans relâcher cette borne ni attacher un second Frida.

`native-trajectories-v5.json` et `native-motion-comparison.json` contiennent
24 transitions :22 en vol libre et2 avec contacts, sur les deux corps. Centre,
angle et compteur correspondent exactement aux float32 natifs ; les22 positions
libres correspondent également exactement dans ce relevé. Les contacts sont
identifiés par le compteur natif du collider et **ne sont pas certifiés**.
Les deltas sont lus dans la différence du compteur d'expansion source, jamais
déduits de l'horloge Windows. Les séquences observées ne couvrent que le début
du vol, pas l'expansion complète ou un parcours de5s.

La DLL D3DX9_29 copiée et authentifiée est appelée dans un helper32bits isolé,
sans exécuter le jeu ni écrire dans sa mémoire. `d3dx-oracle-v4.json` contient
84 rotations. La normalisation SSE et le réciproque RCPPS de la transformation
expliquent les petits écarts d'une formule trigonométrique idéale. Le port
respecte l'arrondi SSE, le réciproque natif pourw=1 et le cas d'axe unitaire ;
les axes généraux gardent un inverse de racine JS, donc aucune identité binaire
universelle n'est annoncée. La tolérance retenue reste2ULP float32 ou1e-6 unité
native pour les rotations ; elle n'a pas été augmentée pour faire passer le test.
L'oraclev1 avait un format PowerShell de tableaux enveloppés, remplacé par des
tableaux de doubles explicites ; il ne constitue pas une comparaison passée.

Les quatre nouveaux tests couvrent ces observations, le délai avant décrément,
le plafond de pas, le wrapping, la marge, le repère caméra et sa copie au tir.
`trajectory-regressions.tap` :127/127 ; `trajectory-build.log` : build réussi.
La session privéev3 est arrêtée avec identité et shutdown_verified vérifiés.

Les16 nouveaux scénarios principaux et captures sont dans `browser-trajectory/` :
repos, course, recharge mobile, préparation secondaire, vol primaire avant/après
impact et triple tir avant/après impact, pour chaque corps. Le triple tir est
inspecté à3.62s, après le premier tick sans écart natif ; les trois positions
sont distinctes. `comparison-trajectory.json` contient76 contrôles et sépare
les PV observés seulement dans S5 des mesures S5Runtime. L'aller/retour d'inventaire
reste une preuve historique du passage précédent, identifiée comme telle.
La capture d'explosion montre une structure triangulaire/opaque à examiner
avec les matériaux/séquences natifs : sa présence ne valide pas le rendu.
Les FPS affichés immédiatement après chargement ne sont pas un benchmark.
Le gate complet est conservé :0 prêt,13 familles bloquées,109 erreurs et26
avertissements (`trajectory-native-gate.json`). Aucun seuil partagé n'est réduit.

Priorité enregistrée à la fin du passage spirale : porter le calcul Gauss natif
et comparer de vrais PV, puis la naissance/collision, les poses et le rendu.
Le passage ci-dessous actualise cette étape.

## Bonus aléatoire natif —15 octobre2026

`src/native-attack-random.js` porte549E70,5763D0 et le gate573B60. Les
paramètres sont des entiers : minimum, maximum, probabilité en pourcentage,
nombre de tirages. Le gate compare uniform(0,100) <= probabilité. Une probabilité
non positive ou min==max retourne0 sans consommer de hasard. Le chemin Gauss
fait la moyenne de N tirages rand()/32767 en float64, puis transforme l'intervalle
et arrondit en float32. Ce n'est pas une distribution normale Box-Muller.
N=100 pour le primaire ; N=1 pour le secondaire. Sans Gauss activé, le chemin
uniforme utilise ses propres arrondis float32. Les endpoints sont inclus.

56D320 ajoute ce bonus UNE FOIS à la puissance source de l'attaque, puis appelle
574520 pour les modificateurs/critique.601870 applique ensuite les bandes de
distance et601C10 le facteur propriétaire. Le runtime tire donc le bonus à la
naissance de chaque explosion, pas au lancement et pas à chaque cible touchée.
Les trois roquettes secondaires ont leurs propres tirages. Le timeout crée
également son explosion et son tirage. Les PV et effets partagent le contact.

`src/s5runtime-crt-random.js` reproduit rand MSVCR120 : LCG uint32 avec constantes
214013/2531011, retour15bits. Le CRT copié est authentifié. Son seed et les
appels intercalés par le reste du jeu S5Runtime ne sont pas reproduits globalement :
le runtime Rocket possède actuellement son stream initialisé à1, conservé par
clear(). Le paramètre QA randomSeed permet une mesure déterministe explicite.
Cela ne certifie pas la prochaine valeur du stream global de S5Runtime.

`capture_rocket_random.ps1` utilise un helper32bits isolé. Seuls les deux petits
corps source549E70/5763D0, leurs tailles, offsets et SHA approuvés sont exécutés.
Les seules relocalisations permises remplacent les adresses de constantes et
du pointeur rand par des données privées au helper et le CRT copié. Aucun acteur,
processus de jeu, protected getter ou état de S5Runtime n'est exécuté/modifié par
cet oracle. Les capturesv3 comparent48 cas de maths et8 streams de16 nombres,
avec identité des float32, gate, nombre de tirages et valeur rand suivante.
Le gate reste une reconstruction source de573B60, pas un appel à un acteur natif.
Preuve : `native-damage/random-comparison.json`,2 jeux de paramètres Lua vérifiés.

Quatre tests supplémentaires vérifient l'oracle, les endpoints, l'absence de
tirage prématuré et le partage d'un seul bonus entre plusieurs cibles d'une
explosion. `damage-regressions-final.tap` :131/131 ; `damage-build.log` réussi.
Les12 scénarios `browser-damage/` couvrent vol/impact primaire et secondaire,
seeds1/10000, pour chaque corps.52 contrôles passent dans
`damage-browser-comparison.json`. Avec puissance catalogue48 conservée, le
primaire laisse58.51863098144531 PV pourseed1 et76 pourseed10000. **Ce sont des
PV S5**, pas une comparaison à des PV natifs. Les preuves16cas du passage
précédent restent historiques après cette modification du hasard.

## Lecture de puissance native — limite enregistrée

Le module `rocket-power-diagnostic.js` passe uniquement par l'original probe,
sur le point de frame existant49CB0B, avec NativeFunction thiscall4AD540 et
contrôle de l'acteur/état/initialiseur. Aucun second Frida. La vérification des
exports optionnels exige maintenant les deux exports Rocket supplémentaires ;
les3 tests Python passent et les deux lancements privés atteignent le gate prêt.

Les lectures primaires/secondaires précoces réussies donnent40.6779670715332
àstate+268 et20338.984375 àstate+274 sur le personnage masculin. Le champ brut
378 reste40.6779670715332 dans les lectures primaires maintenues/relâchées.
Ces champs génériques ne suffisent pas à conclure que le Rocket applique la
même interpolation que la Cannonade. Le catalogue48 est conservé explicitement
comme hypothèse de S5 ; aucun facteur de compensation n'est inventé.

La mesure de fin de charge secondaire est arrêtée pour ce passage après3
tentatives distinctes : garde d'initialiseur simple corrigée pour le multi,
puis attente cumulative et échéances absolues, les deux dernières voyant le
child Normal à la lecture tardive. Les captures partielles sont conservées.
Reprise : obtenir la timeline source des touches maintenues, phases et horloge
native réinitialisée, avant de refaire une lecture tardive. Détail exact dans
`native-damage/logical-power-blocker.json`. Les deux sessions privées sont
arrêtées avec shutdown_verified. Le labo reste opérationnel.

Le helper Ghidra refuse désormais de créer une fonction inconnue sans prologue
vérifié : un offset interne ne prouve pas une entrée, même avec un en-tête qui
répète cet offset. Le rejet573B6E et l'export du vrai constructeur6012C0 sont
vérifiés dans `damage-export-guard.log`. Les sorties internes invalides ont été
retirées ; les labels historiques du décompilateur restent des hypothèses.

Le gate complet demeure fermé. Suite indépendante : revenir à la validation
de puissance logique de la Cannonade avec un état chargé explicitement actif,
puis reprendre les écarts Rocket selon la condition enregistrée.

### Traînée raccordée — 15 octobre 2026

`src/rocket-launcher-trail.js` consomme la Shape évaluée après animation via
`src/effect-scene.js`, avec historiques et buffers distincts par projectile.
Primaire et triple secondaire :10 scénarios du jeu principal sur les deux corps,
72 contrôles navigateur réussis, captures avant/en vol/après impact dans
`work/rocket-launcher-recovery/trail-browser-v1/`. Le premier relevé précoce
sans data-combat est exclu explicitement par comparison.json.

44 régressions ciblées Rocket/GhostTrail/Chaser/DM passent dans
`work/s5runtime-local/shared-room-recovery/parallel-integration-v2-tests.tap` ;
12 contrôles de contrat passent. Le build partagé Battle Royal passe aussi.
Gate natif inchangé :0/13 familles prêtes,109 erreurs/26 avertissements.
Ces vérifications ne certifient ni les PV natifs ni la géométrie/GPU dans S5Runtime.
